import { Repository, DataSource } from 'typeorm';
import { AppDataSource } from '../database/data-source.js';
import { User, FileEntity, UploadSession, Folder, FileStatus, UploadStatus } from '../database/entities/index.js';
import { S3StorageService, storageService } from './storage.service.js';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  QuotaExceededError
} from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import crypto from 'crypto';

export interface InitiateUploadDTO {
  expected_bytes: number;
  total_chunks: number;
  chunk_size?: number;
  encrypted_name: string;
  name_nonce: string;
  encrypted_fek: string;
  fek_nonce: string;
  folder_id?: string | null;
  mime_type_encrypted?: string | null;
  format_version?: number;
}

export interface PartUploadRequest {
  chunk_indices: number[];
}

export interface CompleteUploadDTO {
  parts: Array<{
    part_number?: number;
    partNumber?: number;
    etag: string;
  }>;
}

export class UploadService {
  private userRepo: Repository<User>;
  private fileRepo: Repository<FileEntity>;
  private sessionRepo: Repository<UploadSession>;
  private folderRepo: Repository<Folder>;
  private storage: S3StorageService;

  constructor(
    dataSource: DataSource = AppDataSource,
    storageClient: S3StorageService = storageService
  ) {
    this.userRepo = dataSource.getRepository(User);
    this.fileRepo = dataSource.getRepository(FileEntity);
    this.sessionRepo = dataSource.getRepository(UploadSession);
    this.folderRepo = dataSource.getRepository(Folder);
    this.storage = storageClient;
  }

  /**
   * Phase 1: Two-Phase Quota Reservation & Multipart Upload Initiation
   */
  async initiateUpload(
    userId: string,
    dto: InitiateUploadDTO
  ): Promise<{
    session_id: string;
    file_id: string;
    s3_key: string;
    chunk_size: number;
    total_chunks: number;
    expires_at: Date;
  }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');

    // 1. Mandatory Recovery Gate Check
    if (!user.recovery_confirmed_at) {
      throw new ForbiddenError(
        'Emergency Recovery Kit confirmation required before uploading files'
      );
    }

    // 2. Validate input parameters
    const expectedBytes = Math.max(0, Math.floor(dto.expected_bytes));
    const totalChunks = Math.max(1, Math.floor(dto.total_chunks));
    const chunkSize = dto.chunk_size ? Math.max(1, Math.floor(dto.chunk_size)) : 5242880; // 5 MiB default

    if (dto.folder_id) {
      const folder = await this.folderRepo.findOne({
        where: { id: dto.folder_id, user: { id: userId }, is_trashed: false }
      });
      if (!folder) throw new NotFoundError('Target folder not found');
    }

    // 3. Atomic Two-Phase Quota Reservation
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let fileId: string;
    let s3Key: string;
    let s3UploadId: string;
    let session: UploadSession;

    try {
      const reservationResult = await queryRunner.query(
        `UPDATE users
         SET storage_reserved_bytes = CAST(storage_reserved_bytes AS BIGINT) + $1
         WHERE id = $2 AND (CAST(storage_used_bytes AS BIGINT) + CAST(storage_reserved_bytes AS BIGINT) + $1) <= CAST(storage_quota_bytes AS BIGINT)
         RETURNING id`,
        [expectedBytes, userId]
      );

      const updatedCount =
        Array.isArray(reservationResult) && typeof reservationResult[1] === 'number'
          ? reservationResult[1]
          : (Array.isArray(reservationResult) && Array.isArray(reservationResult[0])
              ? reservationResult[0].length
              : (Array.isArray(reservationResult) ? reservationResult.length : 0));

      if (updatedCount === 0) {
        throw new QuotaExceededError('Storage quota exceeded. Please upgrade your plan or free up storage.');
      }

      fileId = crypto.randomUUID();
      s3Key = `u/${userId}/${fileId}`;

      // 4. Create S3 Multipart Upload
      s3UploadId = await this.storage.createMultipartUpload(s3Key);

      // 5. Persist File Record in PENDING status
      const file = queryRunner.manager.create(FileEntity, {
        id: fileId,
        user: { id: userId },
        user_id: userId,
        folder: dto.folder_id ? { id: dto.folder_id } : null,
        folder_id: dto.folder_id || null,
        format_version: dto.format_version || 1,
        encrypted_name: dto.encrypted_name,
        name_nonce: dto.name_nonce,
        encrypted_fek: dto.encrypted_fek,
        fek_nonce: dto.fek_nonce,
        size_bytes: expectedBytes.toString(),
        chunk_count: totalChunks,
        mime_type_encrypted: dto.mime_type_encrypted || null,
        s3_key: s3Key,
        status: FileStatus.PENDING
      });
      await queryRunner.manager.save(file);

      // 6. Persist Upload Session
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      session = queryRunner.manager.create(UploadSession, {
        file: { id: fileId },
        file_id: fileId,
        user: { id: userId },
        user_id: userId,
        s3_upload_id: s3UploadId,
        total_chunks: totalChunks,
        chunk_size: chunkSize,
        status: UploadStatus.UPLOADING,
        expires_at: expiresAt
      });
      await queryRunner.manager.save(session);

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    logger.info({ userId, fileId, s3Key, totalChunks, expectedBytes }, 'Upload initiated and quota reserved');

    return {
      session_id: session.id,
      file_id: fileId,
      s3_key: s3Key,
      chunk_size: chunkSize,
      total_chunks: totalChunks,
      expires_at: session.expires_at
    };
  }

  /**
   * Phase 2: Batch Presigned Part URLs Generation
   */
  async getPresignedPartUrls(
    userId: string,
    sessionId: string,
    chunkIndices: number[]
  ): Promise<Array<{ chunk_index: number; part_number: number; presigned_url: string }>> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, user: { id: userId } },
      relations: ['file']
    });

    if (!session) throw new NotFoundError('Upload session not found');
    if (session.status !== UploadStatus.UPLOADING) {
      throw new BadRequestError(`Cannot generate upload URLs for session in ${session.status} status`);
    }
    if (session.expires_at < new Date()) {
      throw new BadRequestError('Upload session has expired');
    }

    const results: Array<{ chunk_index: number; part_number: number; presigned_url: string }> = [];

    for (const chunkIndex of chunkIndices) {
      if (chunkIndex < 0 || chunkIndex >= session.total_chunks) {
        throw new BadRequestError(
          `Chunk index ${chunkIndex} is out of bounds [0, ${session.total_chunks - 1}]`
        );
      }
      const partNumber = chunkIndex + 1; // S3 part numbers are 1-indexed
      const presignedUrl = await this.storage.getPresignedPartUrl(
        session.file.s3_key,
        session.s3_upload_id,
        partNumber
      );
      results.push({
        chunk_index: chunkIndex,
        part_number: partNumber,
        presigned_url: presignedUrl
      });
    }

    return results;
  }

  /**
   * Resumable Upload Status: Queries S3 ListParts for Real Ground Truth
   */
  async getUploadStatus(
    userId: string,
    sessionId: string
  ): Promise<{
    session_id: string;
    file_id: string;
    status: UploadStatus;
    total_chunks: number;
    chunk_size: number;
    uploaded_parts: Array<{ part_number: number; chunk_index: number; etag: string; size: number }>;
    expires_at: Date;
  }> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, user: { id: userId } },
      relations: ['file']
    });

    if (!session) throw new NotFoundError('Upload session not found');

    let uploadedParts: Array<{ partNumber: number; etag: string; size: number }> = [];
    if (session.status === UploadStatus.UPLOADING) {
      try {
        uploadedParts = await this.storage.listParts(session.file.s3_key, session.s3_upload_id);
      } catch (err) {
        logger.warn({ err, sessionId }, 'Could not fetch S3 parts; upload may be completed or aborted');
      }
    }

    return {
      session_id: session.id,
      file_id: session.file_id,
      status: session.status,
      total_chunks: session.total_chunks,
      chunk_size: session.chunk_size,
      uploaded_parts: uploadedParts.map((p) => ({
        part_number: p.partNumber,
        chunk_index: p.partNumber - 1,
        etag: p.etag,
        size: p.size
      })),
      expires_at: session.expires_at
    };
  }

  /**
   * Phase 3: Finalize Upload, Verify Size via S3 HeadObject, and Convert Reserved Quota to Used
   */
  async completeUpload(
    userId: string,
    sessionId: string,
    dto: CompleteUploadDTO
  ): Promise<{
    file_id: string;
    status: FileStatus;
    size_bytes: string;
  }> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, user: { id: userId } },
      relations: ['file']
    });

    if (!session) throw new NotFoundError('Upload session not found');
    if (session.status !== UploadStatus.UPLOADING) {
      throw new BadRequestError(`Cannot complete session in ${session.status} status`);
    }

    const normalizedParts = (dto.parts || []).map((p) => ({
      partNumber: p.part_number !== undefined ? p.part_number : (p.partNumber as number),
      etag: p.etag
    }));

    if (normalizedParts.length !== session.total_chunks) {
      throw new BadRequestError(
        `Uploaded part count mismatch: expected ${session.total_chunks}, provided ${normalizedParts.length}`
      );
    }

    // 1. Complete S3 Multipart Upload
    await this.storage.completeMultipartUpload(session.file.s3_key, session.s3_upload_id, normalizedParts);

    // 2. Fetch actual S3 object metadata to verify size
    const metadata = await this.storage.getObjectMetadata(session.file.s3_key);
    const actualBytes = metadata.size;
    const expectedBytes = Number(session.file.size_bytes);

    // Enforce size limit against reservation: uploaded ciphertext must not exceed reserved size
    if (actualBytes > expectedBytes) {
      try {
        await this.storage.deleteObject(session.file.s3_key);
      } catch (delErr) {
        logger.warn({ delErr, key: session.file.s3_key }, 'Failed to delete oversize S3 object');
      }

      const queryRunner = AppDataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        await queryRunner.query(
          `UPDATE users
           SET storage_reserved_bytes = GREATEST(0, CAST(storage_reserved_bytes AS BIGINT) - $1)
           WHERE id = $2`,
          [expectedBytes, userId]
        );
        await queryRunner.manager.update(FileEntity, session.file_id, {
          status: FileStatus.FAILED
        });
        await queryRunner.manager.update(UploadSession, session.id, {
          status: UploadStatus.ABORTED
        });
        await queryRunner.commitTransaction();
      } catch (err) {
        await queryRunner.rollbackTransaction();
        throw err;
      } finally {
        await queryRunner.release();
      }

      logger.warn(
        { userId, fileId: session.file_id, actualBytes, expectedBytes },
        'Upload rejected: actual size exceeds reserved size'
      );
      throw new BadRequestError(
        `Uploaded file size (${actualBytes} bytes) exceeds reserved size (${expectedBytes} bytes)`
      );
    }

    // 3. Atomic Database Update: Transfer reserved quota to used quota
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.query(
        `UPDATE users
         SET storage_reserved_bytes = GREATEST(0, CAST(storage_reserved_bytes AS BIGINT) - $1),
             storage_used_bytes = CAST(storage_used_bytes AS BIGINT) + $2
         WHERE id = $3`,
        [expectedBytes, actualBytes, userId]
      );

      await queryRunner.manager.update(FileEntity, session.file_id, {
        status: FileStatus.COMPLETE,
        size_bytes: actualBytes.toString()
      });

      await queryRunner.manager.update(UploadSession, session.id, {
        status: UploadStatus.COMPLETED
      });

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    logger.info({ userId, fileId: session.file_id, actualBytes }, 'Upload completed and quota finalized');

    return {
      file_id: session.file_id,
      status: FileStatus.COMPLETE,
      size_bytes: actualBytes.toString()
    };
  }

  /**
   * Phase 4: Abort Upload & Release Reserved Quota
   */
  async abortUpload(
    userId: string,
    sessionId: string
  ): Promise<{ message: string }> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, user: { id: userId } },
      relations: ['file']
    });

    if (!session) throw new NotFoundError('Upload session not found');
    if (session.status !== UploadStatus.UPLOADING) {
      return { message: `Session is already in ${session.status} status` };
    }

    const expectedBytes = Number(session.file.size_bytes);

    // 1. Abort S3 Multipart Upload
    try {
      await this.storage.abortMultipartUpload(session.file.s3_key, session.s3_upload_id);
    } catch (err) {
      logger.warn({ err, sessionId }, 'S3 abort multipart error (upload might be already absent)');
    }

    // 2. Release reserved quota and update statuses
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.query(
        `UPDATE users
         SET storage_reserved_bytes = GREATEST(0, CAST(storage_reserved_bytes AS BIGINT) - $1)
         WHERE id = $2`,
        [expectedBytes, userId]
      );

      await queryRunner.manager.update(FileEntity, session.file_id, {
        status: FileStatus.FAILED
      });

      await queryRunner.manager.update(UploadSession, session.id, {
        status: UploadStatus.ABORTED
      });

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    logger.info({ userId, sessionId, releasedBytes: expectedBytes }, 'Upload aborted and reserved quota released');

    return { message: 'Upload session aborted and reserved quota released' };
  }

  /**
   * Background Sweeper: Abort expired upload sessions (> 24 hours) and release reserved quota
   */
  async sweepExpiredSessions(): Promise<number> {
    const now = new Date();
    const expiredSessions = await this.sessionRepo
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.file', 'file')
      .where('session.status = :status', { status: UploadStatus.UPLOADING })
      .andWhere('session.expires_at <= :now', { now })
      .getMany();

    let sweptCount = 0;
    for (const session of expiredSessions) {
      try {
        await this.abortUpload(session.user_id, session.id);
        sweptCount++;
      } catch (err) {
        logger.error({ err, sessionId: session.id }, 'Failed to sweep expired upload session');
      }
    }

    return sweptCount;
  }
}

export const uploadService = new UploadService();
