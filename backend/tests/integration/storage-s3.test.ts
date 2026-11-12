import { describe, it, expect, beforeAll } from 'vitest';
import { S3StorageService } from '../../src/services/storage.service.js';
import { env } from '../../src/config/env.js';
import http from 'http';

describe('Real MinIO (S3) Integration - Upload, Range Download & Multipart', () => {
  let storageService: S3StorageService;
  const testKey = 'test-files/integration-test-object.bin';
  const testData = Buffer.from('CloudVault S3 Integration Test Payload with AES-GCM simulation data.');

  beforeAll(async () => {
    storageService = new S3StorageService();
    const isHealthy = await storageService.checkHealth();
    expect(isHealthy).toBe(true);
  });

  it('should verify MinIO bucket is healthy and accessible', async () => {
    const healthy = await storageService.checkHealth();
    expect(healthy).toBe(true);
  });

  it('should upload a direct object and retrieve it via getObjectStream', async () => {
    await storageService.uploadObject(testKey, testData, 'application/octet-stream');

    const stream = await storageService.getObjectStream(testKey);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    const downloaded = Buffer.concat(chunks);
    expect(downloaded.toString()).toBe(testData.toString());
  });

  it('should generate presigned download URL and support HTTP Range request', async () => {
    const downloadUrl = await storageService.getPresignedDownloadUrl(testKey);
    expect(downloadUrl).toContain('http://');

    // Make an HTTP GET request with Range: bytes=0-10
    const url = new URL(downloadUrl);
    const rangeData = await new Promise<Buffer>((resolve, reject) => {
      const req = http.request(
        {
          hostname: url.hostname,
          port: url.port,
          path: url.pathname + url.search,
          method: 'GET',
          headers: {
            Range: 'bytes=0-10'
          }
        },
        (res) => {
          expect(res.statusCode).toBe(206); // Partial Content
          expect(res.headers['content-range']).toBeDefined();
          const chunks: Buffer[] = [];
          res.on('data', (c) => chunks.push(c));
          res.on('end', () => resolve(Buffer.concat(chunks)));
        }
      );
      req.on('error', reject);
      req.end();
    });

    expect(rangeData.length).toBe(11);
    expect(rangeData.toString()).toBe(testData.subarray(0, 11).toString());
  });

  it('should complete a full multipart upload cycle with real presigned PUTs and ETag retrieval', async () => {
    const multipartKey = 'test-files/multipart-file.dat';
    // Part 1: 5 MiB (MinIO / S3 min part size), Part 2: 1 MiB
    const part1Size = 5 * 1024 * 1024;
    const part2Size = 1024 * 1024;
    const part1Data = Buffer.alloc(part1Size, 0x41); // 'A'
    const part2Data = Buffer.alloc(part2Size, 0x42); // 'B'

    // 1. Create Multipart Upload
    const uploadId = await storageService.createMultipartUpload(multipartKey);
    expect(uploadId).toBeDefined();

    // 2. Generate Presigned URLs for Parts 1 and 2
    const url1 = await storageService.getPresignedPartUrl(multipartKey, uploadId, 1);
    const url2 = await storageService.getPresignedPartUrl(multipartKey, uploadId, 2);
    expect(url1).toBeDefined();
    expect(url2).toBeDefined();

    // 3. Upload Part 1 & 2 via HTTP PUT and retrieve ETag
    const uploadPart = (urlStr: string, data: Buffer): Promise<string> => {
      return new Promise((resolve, reject) => {
        const u = new URL(urlStr);
        const req = http.request(
          {
            hostname: u.hostname,
            port: u.port,
            path: u.pathname + u.search,
            method: 'PUT',
            headers: {
              'Content-Length': data.length
            }
          },
          (res) => {
            expect(res.statusCode).toBe(200);
            const etag = res.headers['etag'];
            expect(etag).toBeDefined();
            resolve(etag as string);
          }
        );
        req.on('error', reject);
        req.write(data);
        req.end();
      });
    };

    const etag1 = await uploadPart(url1, part1Data);
    const etag2 = await uploadPart(url2, part2Data);

    expect(etag1).toBeTruthy();
    expect(etag2).toBeTruthy();

    // 4. Complete Multipart Upload
    const completeResult = await storageService.completeMultipartUpload(multipartKey, uploadId, [
      { partNumber: 1, etag: etag1 },
      { partNumber: 2, etag: etag2 }
    ]);
    expect(completeResult.key).toBe(multipartKey);

    // 5. Verify Total Object Size via HeadObject
    const metadata = await storageService.getObjectMetadata(multipartKey);
    expect(metadata.size).toBe(part1Size + part2Size);

    // Clean up
    await storageService.deleteObject(multipartKey);
  });

  it('should delete object cleanly', async () => {
    await storageService.deleteObject(testKey);
    await expect(storageService.getObjectMetadata(testKey)).rejects.toThrow();
  });

  it('should verify that unauthenticated anonymous access to bucket is denied (403 Forbidden)', async () => {
    const rawUrl = new URL(`${env.S3_ENDPOINT}/${env.S3_BUCKET_NAME}/`);
    const statusCode = await new Promise<number>((resolve, reject) => {
      const req = http.request(
        {
          hostname: rawUrl.hostname,
          port: rawUrl.port,
          path: rawUrl.pathname,
          method: 'GET'
        },
        (res) => {
          resolve(res.statusCode || 0);
        }
      );
      req.on('error', reject);
      req.end();
    });

    expect(statusCode).toBe(403);
  });
});
