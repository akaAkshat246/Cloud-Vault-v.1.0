import {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  ListPartsCommand,
  GetObjectCommand,
  PutObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export interface PartETag {
  partNumber: number;
  etag: string;
}

export interface ObjectMetadata {
  size: number;
  lastModified?: Date;
  etag?: string;
}

export interface IStorageService {
  createMultipartUpload(key: string, metadata?: Record<string, string>): Promise<string>;
  getPresignedPartUrl(key: string, uploadId: string, partNumber: number, expiresIn?: number): Promise<string>;
  completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: PartETag[]
  ): Promise<{ bucket: string; key: string; etag?: string }>;
  abortMultipartUpload(key: string, uploadId: string): Promise<void>;
  getPresignedDownloadUrl(key: string, expiresIn?: number): Promise<string>;
  getObjectMetadata(key: string): Promise<ObjectMetadata>;
  listParts(key: string, uploadId: string): Promise<Array<{ partNumber: number; etag: string; size: number }>>;
  deleteObject(key: string): Promise<void>;
  checkHealth(): Promise<boolean>;
  uploadObject(key: string, body: Buffer | Uint8Array, contentType?: string): Promise<void>;
  getObjectStream(key: string): Promise<any>;
}

export class S3StorageService implements IStorageService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly defaultExpiry: number;

  constructor(customClient?: S3Client) {
    this.bucket = env.S3_BUCKET_NAME;
    this.defaultExpiry = env.S3_PRESIGNED_EXPIRATION_SECONDS;

    if (customClient) {
      this.client = customClient;
    } else {
      this.client = new S3Client({
        region: env.S3_REGION,
        endpoint: env.S3_ENDPOINT || undefined,
        forcePathStyle: env.S3_FORCE_PATH_STYLE,
        credentials: {
          accessKeyId: env.S3_ACCESS_KEY_ID,
          secretAccessKey: env.S3_SECRET_ACCESS_KEY
        }
      });
    }
  }

  async createMultipartUpload(key: string, metadata?: Record<string, string>): Promise<string> {
    const command = new CreateMultipartUploadCommand({
      Bucket: this.bucket,
      Key: key,
      Metadata: metadata,
      ContentType: 'application/octet-stream' // Invariant: Zero-Knowledge ciphertext
    });

    const response = await this.client.send(command);
    if (!response.UploadId) {
      throw new Error(`Failed to initiate multipart upload for S3 key: ${key}`);
    }

    logger.debug({ key, uploadId: response.UploadId }, 'Multipart upload initiated');
    return response.UploadId;
  }

  async getPresignedPartUrl(
    key: string,
    uploadId: string,
    partNumber: number,
    expiresIn = this.defaultExpiry
  ): Promise<string> {
    const command = new UploadPartCommand({
      Bucket: this.bucket,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber
    });

    return await getSignedUrl(this.client, command, { expiresIn });
  }

  async completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: PartETag[]
  ): Promise<{ bucket: string; key: string; etag?: string }> {
    // S3 requires parts sorted by PartNumber ascending
    const sortedParts = [...parts]
      .sort((a, b) => a.partNumber - b.partNumber)
      .map((p) => ({
        PartNumber: p.partNumber,
        ETag: p.etag.startsWith('"') ? p.etag : `"${p.etag}"`
      }));

    const command = new CompleteMultipartUploadCommand({
      Bucket: this.bucket,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: sortedParts
      }
    });

    const response = await this.client.send(command);
    logger.info({ key, uploadId, etag: response.ETag }, 'Multipart upload completed');

    return {
      bucket: this.bucket,
      key,
      etag: response.ETag
    };
  }

  async abortMultipartUpload(key: string, uploadId: string): Promise<void> {
    const command = new AbortMultipartUploadCommand({
      Bucket: this.bucket,
      Key: key,
      UploadId: uploadId
    });

    await this.client.send(command);
    logger.info({ key, uploadId }, 'Multipart upload aborted');
  }

  async listParts(
    key: string,
    uploadId: string
  ): Promise<Array<{ partNumber: number; etag: string; size: number }>> {
    const command = new ListPartsCommand({
      Bucket: this.bucket,
      Key: key,
      UploadId: uploadId
    });

    const response = await this.client.send(command);
    return (response.Parts || []).map((p) => ({
      partNumber: p.PartNumber || 0,
      etag: (p.ETag || '').replace(/"/g, ''),
      size: p.Size || 0
    }));
  }

  async getPresignedDownloadUrl(
    key: string,
    expiresIn = this.defaultExpiry
  ): Promise<string> {
    // Invariant: Server never knows plaintext filename; no ResponseContentDisposition
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key
    });

    return await getSignedUrl(this.client, command, { expiresIn });
  }

  async uploadObject(
    key: string,
    body: Buffer | Uint8Array,
    contentType = 'application/octet-stream'
  ): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: body,
      ContentType: contentType
    });

    await this.client.send(command);
    logger.debug({ key, size: body.length }, 'Direct object uploaded to S3');
  }

  async getObjectStream(key: string): Promise<any> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key
    });

    const response = await this.client.send(command);
    return response.Body;
  }

  async getObjectMetadata(key: string): Promise<ObjectMetadata> {
    const command = new HeadObjectCommand({
      Bucket: this.bucket,
      Key: key
    });

    const response = await this.client.send(command);
    return {
      size: response.ContentLength || 0,
      lastModified: response.LastModified,
      etag: response.ETag
    };
  }

  async deleteObject(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key
    });

    await this.client.send(command);
    logger.info({ key }, 'S3 object deleted');
  }

  async checkHealth(): Promise<boolean> {
    try {
      const command = new HeadBucketCommand({
        Bucket: this.bucket
      });
      await this.client.send(command);
      return true;
    } catch (error) {
      logger.error({ error }, 'S3 health check failed');
      return false;
    }
  }
}

export const storageService = new S3StorageService();

