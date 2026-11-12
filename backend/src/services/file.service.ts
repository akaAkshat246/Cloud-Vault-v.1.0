import { Repository, DataSource, IsNull } from 'typeorm';
import { AppDataSource } from '../database/data-source.js';
import { FileEntity, Folder, User, FileStatus } from '../database/entities/index.js';
import { S3StorageService, storageService } from './storage.service.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export interface FileDownloadInfo {
  file_id: string;
  format_version: number;
  ciphertext_size_bytes: string;
  chunk_count: number;
  encrypted_fek: string;
  fek_nonce: string;
  encrypted_name: string;
  name_nonce: string;
  mime_type_encrypted: string | null;
  download_url: string;
}

export interface CreateFolderDTO {
  encrypted_name: string;
  name_nonce: string;
  parent_id?: string | null;
}

export interface UpdateFileDTO {
  encrypted_name?: string;
  name_nonce?: string;
  folder_id?: string | null;
  mime_type_encrypted?: string | null;
}

export interface UpdateFolderDTO {
  encrypted_name?: string;
  name_nonce?: string;
  parent_id?: string | null;
}

export class FileService {
  private fileRepo: Repository<FileEntity>;
  private folderRepo: Repository<Folder>;
  private userRepo: Repository<User>;
  private storage: S3StorageService;

  constructor(
    dataSource: DataSource = AppDataSource,
    storageClient: S3StorageService = storageService
  ) {
    this.fileRepo = dataSource.getRepository(FileEntity);
    this.folderRepo = dataSource.getRepository(Folder);
    this.userRepo = dataSource.getRepository(User);
    this.storage = storageClient;
  }

  /**
   * Generates Presigned Download URL with Zero-Knowledge Ciphertext Metadata
   */
  async getDownloadInfo(userId: string, fileId: string): Promise<FileDownloadInfo> {
    const file = await this.fileRepo.findOne({
      where: { id: fileId, user: { id: userId }, is_trashed: false }
    });

    if (!file) throw new NotFoundError('File not found or trashed');
    if (file.status !== FileStatus.COMPLETE) {
      throw new BadRequestError(`File upload is incomplete (status: ${file.status})`);
    }

    // Presigned S3 GET URL supporting HTTP Range headers
    const downloadUrl = await this.storage.getPresignedDownloadUrl(file.s3_key);

    return {
      file_id: file.id,
      format_version: file.format_version,
      ciphertext_size_bytes: file.size_bytes,
      chunk_count: file.chunk_count,
      encrypted_fek: file.encrypted_fek,
      fek_nonce: file.fek_nonce,
      encrypted_name: file.encrypted_name,
      name_nonce: file.name_nonce,
      mime_type_encrypted: file.mime_type_encrypted,
      download_url: downloadUrl
    };
  }

  /**
   * List files in a folder (or root)
   */
  async listFiles(userId: string, folderId: string | null = null): Promise<FileEntity[]> {
    return await this.fileRepo.find({
      where: {
        user: { id: userId },
        folder_id: folderId ? folderId : IsNull(),
        is_trashed: false,
        status: FileStatus.COMPLETE
      },
      order: { created_at: 'DESC' }
    });
  }

  /**
   * Get single file metadata
   */
  async getFile(userId: string, fileId: string): Promise<FileEntity> {
    const file = await this.fileRepo.findOne({
      where: { id: fileId, user: { id: userId } }
    });
    if (!file) throw new NotFoundError('File not found');
    return file;
  }

  /**
   * Rename or Move File
   */
  async updateFile(userId: string, fileId: string, dto: UpdateFileDTO): Promise<FileEntity> {
    const file = await this.fileRepo.findOne({
      where: { id: fileId, user: { id: userId }, is_trashed: false }
    });
    if (!file) throw new NotFoundError('File not found');

    if (dto.folder_id !== undefined) {
      if (dto.folder_id !== null) {
        const folder = await this.folderRepo.findOne({
          where: { id: dto.folder_id, user: { id: userId }, is_trashed: false }
        });
        if (!folder) throw new NotFoundError('Target folder not found');
        file.folder_id = dto.folder_id;
      } else {
        file.folder_id = null;
      }
    }

    if (dto.encrypted_name && dto.name_nonce) {
      file.encrypted_name = dto.encrypted_name;
      file.name_nonce = dto.name_nonce;
    }

    if (dto.mime_type_encrypted !== undefined) {
      file.mime_type_encrypted = dto.mime_type_encrypted;
    }

    return await this.fileRepo.save(file);
  }

  /**
   * Soft-Delete (Move to Trash)
   */
  async trashFile(userId: string, fileId: string): Promise<void> {
    const file = await this.fileRepo.findOne({
      where: { id: fileId, user: { id: userId }, is_trashed: false }
    });
    if (!file) throw new NotFoundError('File not found');

    file.is_trashed = true;
    file.trashed_at = new Date();
    await this.fileRepo.save(file);
  }

  /**
   * Restore from Trash
   */
  async restoreFile(userId: string, fileId: string): Promise<void> {
    const file = await this.fileRepo.findOne({
      where: { id: fileId, user: { id: userId }, is_trashed: true }
    });
    if (!file) throw new NotFoundError('File not found in trash');

    file.is_trashed = false;
    file.trashed_at = null;
    await this.fileRepo.save(file);
  }

  /**
   * Permanent Delete File (S3 Object + Quota Release + DB Deletion)
   */
  async permanentDeleteFile(userId: string, fileId: string): Promise<void> {
    const file = await this.fileRepo.findOne({
      where: { id: fileId, user: { id: userId } }
    });
    if (!file) throw new NotFoundError('File not found');

    const sizeBytes = Number(file.size_bytes);

    // 1. Delete object from S3
    try {
      await this.storage.deleteObject(file.s3_key);
    } catch (err) {
      logger.warn({ err, fileId, key: file.s3_key }, 'S3 object deletion warning');
    }

    // 2. Adjust quota and remove DB row
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.query(
        `UPDATE users
         SET storage_used_bytes = GREATEST(0, CAST(storage_used_bytes AS BIGINT) - $1)
         WHERE id = $2`,
        [sizeBytes, userId]
      );

      await queryRunner.manager.delete(FileEntity, file.id);
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Folder CRUD with Cycle Prevention
   */
  async createFolder(userId: string, dto: CreateFolderDTO): Promise<Folder> {
    if (dto.parent_id) {
      const parent = await this.folderRepo.findOne({
        where: { id: dto.parent_id, user: { id: userId }, is_trashed: false }
      });
      if (!parent) throw new NotFoundError('Parent folder not found');
    }

    const folder = this.folderRepo.create({
      user: { id: userId },
      user_id: userId,
      parent: dto.parent_id ? { id: dto.parent_id } : null,
      parent_id: dto.parent_id || null,
      encrypted_name: dto.encrypted_name,
      name_nonce: dto.name_nonce
    });

    return await this.folderRepo.save(folder);
  }

  async listFolders(userId: string, parentId: string | null = null): Promise<Folder[]> {
    return await this.folderRepo.find({
      where: {
        user: { id: userId },
        parent_id: parentId ? parentId : IsNull(),
        is_trashed: false
      },
      order: { created_at: 'ASC' }
    });
  }

  async updateFolder(userId: string, folderId: string, dto: UpdateFolderDTO): Promise<Folder> {
    const folder = await this.folderRepo.findOne({
      where: { id: folderId, user: { id: userId }, is_trashed: false }
    });
    if (!folder) throw new NotFoundError('Folder not found');

    if (dto.parent_id !== undefined) {
      if (dto.parent_id !== null) {
        if (dto.parent_id === folderId) {
          throw new BadRequestError('Cannot move folder inside itself');
        }

        // Cycle Check: Ensure target parent is not a descendant
        let currentParentId: string | null = dto.parent_id;
        while (currentParentId) {
          if (currentParentId === folderId) {
            throw new BadRequestError('Cycle detected: cannot move a folder into its own subfolder');
          }
          const ancestor: Folder | null = await this.folderRepo.findOne({
            where: { id: currentParentId, user: { id: userId } }
          });
          if (!ancestor) break;
          currentParentId = ancestor.parent_id;
        }

        folder.parent_id = dto.parent_id;
      } else {
        folder.parent_id = null;
      }
    }

    if (dto.encrypted_name && dto.name_nonce) {
      folder.encrypted_name = dto.encrypted_name;
      folder.name_nonce = dto.name_nonce;
    }

    return await this.folderRepo.save(folder);
  }

  async trashFolder(userId: string, folderId: string): Promise<void> {
    const folder = await this.folderRepo.findOne({
      where: { id: folderId, user: { id: userId }, is_trashed: false }
    });
    if (!folder) throw new NotFoundError('Folder not found');

    folder.is_trashed = true;
    folder.trashed_at = new Date();
    await this.folderRepo.save(folder);
  }

  /**
   * Background Sweeper: Purge files trashed > 30 days
   */
  async sweepTrash(retentionDays = 30): Promise<number> {
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    const expiredFiles = await this.fileRepo
      .createQueryBuilder('file')
      .where('file.is_trashed = true')
      .andWhere('file.trashed_at <= :cutoff', { cutoff })
      .getMany();

    let purgedCount = 0;
    for (const f of expiredFiles) {
      try {
        await this.permanentDeleteFile(f.user_id, f.id);
        purgedCount++;
      } catch (err) {
        logger.error({ err, fileId: f.id }, 'Failed to purge trashed file');
      }
    }

    return purgedCount;
  }
}

export const fileService = new FileService();

