import { describe, it, expect, vi } from 'vitest';
import { S3StorageService } from '../../src/services/storage.service.js';
import { S3Client } from '@aws-sdk/client-s3';

describe('S3 / MinIO Storage Service Abstraction', () => {
  it('should initialize S3StorageService properly', () => {
    const service = new S3StorageService();
    expect(service).toBeDefined();
    expect(typeof service.createMultipartUpload).toBe('function');
    expect(typeof service.getPresignedPartUrl).toBe('function');
    expect(typeof service.completeMultipartUpload).toBe('function');
    expect(typeof service.abortMultipartUpload).toBe('function');
    expect(typeof service.getPresignedDownloadUrl).toBe('function');
    expect(typeof service.getObjectMetadata).toBe('function');
    expect(typeof service.deleteObject).toBe('function');
  });

  it('should execute createMultipartUpload against S3 client', async () => {
    const mockSend = vi.fn().mockResolvedValue({ UploadId: 'mock-upload-id-12345' });
    const mockClient = {
      send: mockSend
    } as unknown as S3Client;

    const service = new S3StorageService(mockClient);
    const uploadId = await service.createMultipartUpload('users/123/files/abc');

    expect(uploadId).toBe('mock-upload-id-12345');
    expect(mockSend).toHaveBeenCalledTimes(1);
    const callArg = mockSend.mock.calls[0][0];
    expect(callArg.input.Key).toBe('users/123/files/abc');
    expect(callArg.input.ContentType).toBe('application/octet-stream');
  });

  it('should format sorted parts in completeMultipartUpload', async () => {
    const mockSend = vi.fn().mockResolvedValue({ ETag: '"final-composite-etag"' });
    const mockClient = {
      send: mockSend
    } as unknown as S3Client;

    const service = new S3StorageService(mockClient);
    const result = await service.completeMultipartUpload('test-key', 'mock-upload-id', [
      { partNumber: 2, etag: 'etag-2' },
      { partNumber: 1, etag: 'etag-1' }
    ]);

    expect(result.etag).toBe('"final-composite-etag"');
    expect(result.key).toBe('test-key');
    const callArg = mockSend.mock.calls[0][0];
    expect(callArg.input.MultipartUpload.Parts).toEqual([
      { PartNumber: 1, ETag: '"etag-1"' },
      { PartNumber: 2, ETag: '"etag-2"' }
    ]);
  });

  it('should execute abortMultipartUpload', async () => {
    const mockSend = vi.fn().mockResolvedValue({});
    const mockClient = {
      send: mockSend
    } as unknown as S3Client;

    const service = new S3StorageService(mockClient);
    await service.abortMultipartUpload('test-key', 'mock-upload-id');

    expect(mockSend).toHaveBeenCalledTimes(1);
    const callArg = mockSend.mock.calls[0][0];
    expect(callArg.input.UploadId).toBe('mock-upload-id');
  });

  it('should execute deleteObject', async () => {
    const mockSend = vi.fn().mockResolvedValue({});
    const mockClient = {
      send: mockSend
    } as unknown as S3Client;

    const service = new S3StorageService(mockClient);
    await service.deleteObject('test-key');

    expect(mockSend).toHaveBeenCalledTimes(1);
    const callArg = mockSend.mock.calls[0][0];
    expect(callArg.input.Key).toBe('test-key');
  });
});

