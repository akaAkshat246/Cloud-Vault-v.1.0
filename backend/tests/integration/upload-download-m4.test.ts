import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { AppDataSource } from '../../src/database/data-source.js';
import { seedPlans } from '../../src/database/seeds/plan.seed.js';
import { User, FileEntity, Folder, UploadSession } from '../../src/database/entities/index.js';
import { uploadService } from '../../src/services/upload.service.js';
import { fileService } from '../../src/services/file.service.js';
import {
  deriveMasterKeys,
  wrapKey,
  unwrapKey,
  encryptAesGcm,
  decryptAesGcm,
  buildChunkAAD
} from '@cloudvault/crypto-spec';
import crypto from 'crypto';
import http from 'http';

describe('Milestone M4: Chunked Direct-to-S3 Upload, Range Download & Metadata Suite', () => {
  const app = createApp();
  let userRepo: any;
  let fileRepo: any;
  let folderRepo: any;
  let sessionRepo: any;

  const email = 'bob.uploader.m4@cloudvault.internal';
  const password = 'BobUploadMasterPassword2026!';
  const userSalt = crypto.randomBytes(16);

  let authToken: string;
  let userId: string;
  let masterKey: Buffer;
  let kek: Uint8Array;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    await seedPlans(AppDataSource);
    userRepo = AppDataSource.getRepository(User);
    fileRepo = AppDataSource.getRepository(FileEntity);
    folderRepo = AppDataSource.getRepository(Folder);
    sessionRepo = AppDataSource.getRepository(UploadSession);

    await userRepo.delete({ email });

    // Derive user keys
    const keys = await deriveMasterKeys(password, userSalt, { iterations: 3, memoryBytes: 67108864 });
    kek = keys.kek;
    masterKey = crypto.randomBytes(32);
    const wrappedMaster = wrapKey(kek, masterKey, 'cloudvault-master-key-wrap-v1');
    const wrappedRec = wrapKey(crypto.randomBytes(32), masterKey, 'cloudvault-recovery-wrap-v1');

    // Register user
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email,
        authKey: Buffer.from(keys.authKey).toString('hex'),
        salt: userSalt.toString('hex'),
        kdf_version: '1.0',
        kdf_params: { m: 65536, t: 3, p: 1 },
        encrypted_master_key: JSON.stringify(wrappedMaster),
        master_key_nonce: wrappedMaster.iv,
        encrypted_recovery_master_key: JSON.stringify(wrappedRec),
        recovery_master_key_nonce: wrappedRec.iv
      });
    expect(regRes.status).toBe(201);
    userId = regRes.body.user.id;

    // Login user to get JWT
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, authKey: Buffer.from(keys.authKey).toString('hex') });
    expect(loginRes.status).toBe(200);
    authToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    if (userRepo) {
      await userRepo.delete({ email });
    }
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  it('1. Mandatory Recovery Gate: Blocks upload until recovery phrase is confirmed', async () => {
    // Attempt upload before confirming recovery phrase
    const res = await request(app)
      .post('/api/v1/files/uploads')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        expected_bytes: 1048576,
        total_chunks: 1,
        encrypted_name: 'enc-name',
        name_nonce: 'nonce-12345678',
        encrypted_fek: 'enc-fek',
        fek_nonce: 'nonce-fek12345'
      });

    expect(res.status).toBe(403);
    expect(res.body.error.message).toContain('Emergency Recovery Kit confirmation required');

    // Confirm recovery kit
    const confRes = await request(app)
      .post('/api/v1/auth/recovery/confirm')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ word_indices: [1, 2, 3, 4], entered_words: ['a', 'b', 'c', 'd'] });
    expect(confRes.status).toBe(200);
  });

  it('2. Quota Reservation: Enforces quota limit atomically (413 on exceed)', async () => {
    // Free plan is 5 GiB (5,368,709,120 bytes)
    // Requesting 6 GiB should fail
    const exceedRes = await request(app)
      .post('/api/v1/files/uploads')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        expected_bytes: 6 * 1024 * 1024 * 1024,
        total_chunks: 1200,
        encrypted_name: 'enc-huge-file',
        name_nonce: 'nonce-huge1234',
        encrypted_fek: 'enc-fek-huge',
        fek_nonce: 'nonce-fek-huge'
      });

    expect(exceedRes.status).toBe(413);
    expect(exceedRes.body.error.code).toBe('QUOTA_EXCEEDED');

    // Verify user reserved bytes remain 0
    const user = await userRepo.findOne({ where: { id: userId } });
    expect(Number(user.storage_reserved_bytes)).toBe(0);
  });

  let sessionId: string;
  let fileId: string;
  let fek: Buffer;
  let chunk0Ciphertext: Buffer;
  let chunk1Ciphertext: Buffer;
  let chunk0Data: Buffer;
  let chunk1Data: Buffer;
  const part1Size = 5 * 1024 * 1024; // 5 MiB
  const part2Size = 1024 * 1024; // 1 MiB

  it('3. Upload Initiation & Quota Reservation: Atomically reserves expected bytes', async () => {
    fek = crypto.randomBytes(32);
    const wrappedFek = wrapKey(masterKey, fek, 'cloudvault-fek-wrap-v1');
    const totalExpectedBytes = part1Size + 28 + part2Size + 28; // 2 chunks with 28B framing overhead (12B IV + 16B tag)

    const initRes = await request(app)
      .post('/api/v1/files/uploads')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        expected_bytes: totalExpectedBytes,
        total_chunks: 2,
        chunk_size: part1Size,
        encrypted_name: 'enc-report.pdf',
        name_nonce: 'nonce-name1234',
        encrypted_fek: JSON.stringify(wrappedFek),
        fek_nonce: wrappedFek.iv,
        format_version: 1
      });

    expect(initRes.status).toBe(201);
    expect(initRes.body.session_id).toBeDefined();
    expect(initRes.body.file_id).toBeDefined();
    expect(initRes.body.total_chunks).toBe(2);

    sessionId = initRes.body.session_id;
    fileId = initRes.body.file_id;

    // Verify User storage_reserved_bytes in DB
    const user = await userRepo.findOne({ where: { id: userId } });
    expect(Number(user.storage_reserved_bytes)).toBe(totalExpectedBytes);
  });

  let presignedPartUrls: any[];

  it('4. Presigned Part URLs Generation: Returns presigned URLs for batch chunk indices', async () => {
    // Out of bounds chunk index must fail
    const badRes = await request(app)
      .post(`/api/v1/files/uploads/${sessionId}/parts`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ chunk_indices: [0, 5] });
    expect(badRes.status).toBe(400);

    // Valid indices [0, 1]
    const partsRes = await request(app)
      .post(`/api/v1/files/uploads/${sessionId}/parts`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ chunk_indices: [0, 1] });

    expect(partsRes.status).toBe(200);
    expect(partsRes.body.parts.length).toBe(2);
    expect(partsRes.body.parts[0].chunk_index).toBe(0);
    expect(partsRes.body.parts[0].part_number).toBe(1);
    expect(partsRes.body.parts[0].presigned_url).toContain('http://');

    presignedPartUrls = partsRes.body.parts;
  });

  let etag1: string;
  let etag2: string;

  it('5. Direct-to-S3 Upload Execution: Client encrypts chunks with AAD and PUTs to S3', async () => {
    // Generate real payloads
    chunk0Data = crypto.randomBytes(part1Size);
    chunk1Data = crypto.randomBytes(part2Size);

    // Encrypt Chunk 0 with AAD: fileId, chunk_index(0), total_chunks(2), is_final(false), format_version(1)
    const aad0 = buildChunkAAD(fileId, 0, 2, false, 1);
    const enc0 = encryptAesGcm(fek, chunk0Data, aad0);
    chunk0Ciphertext = Buffer.concat([Buffer.from(enc0.iv), Buffer.from(enc0.ciphertext), Buffer.from(enc0.tag)]);

    // Encrypt Chunk 1 with AAD: fileId, chunk_index(1), total_chunks(2), is_final(true), format_version(1)
    const aad1 = buildChunkAAD(fileId, 1, 2, true, 1);
    const enc1 = encryptAesGcm(fek, chunk1Data, aad1);
    chunk1Ciphertext = Buffer.concat([Buffer.from(enc1.iv), Buffer.from(enc1.ciphertext), Buffer.from(enc1.tag)]);

    // Upload helper using Node.js http
    const uploadChunkToS3 = (urlStr: string, body: Buffer): Promise<string> => {
      return new Promise((resolve, reject) => {
        const u = new URL(urlStr);
        const req = http.request(
          {
            hostname: u.hostname,
            port: u.port,
            path: u.pathname + u.search,
            method: 'PUT',
            headers: {
              'Content-Length': body.length
            }
          },
          (res) => {
            expect(res.statusCode).toBe(200);
            const etag = res.headers['etag'];
            expect(etag).toBeDefined();
            resolve((etag as string).replace(/"/g, ''));
          }
        );
        req.on('error', reject);
        req.write(body);
        req.end();
      });
    };

    etag1 = await uploadChunkToS3(presignedPartUrls[0].presigned_url, chunk0Ciphertext);
    etag2 = await uploadChunkToS3(presignedPartUrls[1].presigned_url, chunk1Ciphertext);

    expect(etag1).toBeTruthy();
    expect(etag2).toBeTruthy();
  });

  it('6. Resumable Upload Status: Queries S3 ListParts directly for ground truth', async () => {
    const statusRes = await request(app)
      .get(`/api/v1/files/uploads/${sessionId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(statusRes.status).toBe(200);
    expect(statusRes.body.uploaded_parts.length).toBe(2);
    expect(statusRes.body.uploaded_parts[0].part_number).toBe(1);
    expect(statusRes.body.uploaded_parts[1].part_number).toBe(2);
  });

  it('7. Complete Upload: Verifies object size via S3 HeadObject and finalizes quota', async () => {
    const compRes = await request(app)
      .post(`/api/v1/files/uploads/${sessionId}/complete`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        parts: [
          { part_number: 1, etag: etag1 },
          { part_number: 2, etag: etag2 }
        ]
      });

    expect(compRes.status).toBe(200);
    expect(compRes.body.status).toBe('COMPLETE');

    const totalCiphertextSize = chunk0Ciphertext.length + chunk1Ciphertext.length;
    expect(Number(compRes.body.size_bytes)).toBe(totalCiphertextSize);

    // Verify Quota Transition in Database:
    // Reserved quota decremented to 0, Used quota incremented by actual size
    const user = await userRepo.findOne({ where: { id: userId } });
    expect(Number(user.storage_reserved_bytes)).toBe(0);
    expect(Number(user.storage_used_bytes)).toBe(totalCiphertextSize);

    // Verify FileEntity status in Database
    const file = await fileRepo.findOne({ where: { id: fileId } });
    expect(file.status).toBe('COMPLETE');
  });

  it('8. S3 Range Download & Client-Side Decryption with AAD Verification', async () => {
    // 1. Get download info
    const infoRes = await request(app)
      .get(`/api/v1/files/${fileId}/download-info`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(infoRes.status).toBe(200);
    expect(infoRes.body.download_url).toBeDefined();
    expect(infoRes.body.chunk_count).toBe(2);

    const downloadUrl = infoRes.body.download_url;
    const chunk0ByteLen = chunk0Ciphertext.length;

    // Helper to fetch byte range via HTTP
    const fetchRange = (urlStr: string, start: number, end: number): Promise<Buffer> => {
      return new Promise((resolve, reject) => {
        const u = new URL(urlStr);
        const req = http.request(
          {
            hostname: u.hostname,
            port: u.port,
            path: u.pathname + u.search,
            method: 'GET',
            headers: {
              Range: `bytes=${start}-${end}`
            }
          },
          (res) => {
            expect(res.statusCode).toBe(206);
            const chunks: Buffer[] = [];
            res.on('data', (c) => chunks.push(c));
            res.on('end', () => resolve(Buffer.concat(chunks)));
          }
        );
        req.on('error', reject);
        req.end();
      });
    };

    // 2. Fetch Chunk 0 using Range: bytes=0-(chunk0ByteLen - 1)
    const downloadedChunk0 = await fetchRange(downloadUrl, 0, chunk0ByteLen - 1);
    expect(downloadedChunk0.length).toBe(chunk0ByteLen);

    // Unpack Chunk 0: IV (12B) || Ciphertext || Tag (16B)
    const iv0 = downloadedChunk0.subarray(0, 12);
    const tag0 = downloadedChunk0.subarray(downloadedChunk0.length - 16);
    const ct0 = downloadedChunk0.subarray(12, downloadedChunk0.length - 16);

    const aad0 = buildChunkAAD(fileId, 0, 2, false, 1);
    const decryptedChunk0 = decryptAesGcm(fek, iv0, ct0, tag0, aad0);
    expect(Buffer.from(decryptedChunk0).toString('hex')).toBe(chunk0Data.toString('hex'));

    // 3. Fetch Chunk 1 using Range: bytes=chunk0ByteLen-(total - 1)
    const downloadedChunk1 = await fetchRange(downloadUrl, chunk0ByteLen, chunk0ByteLen + chunk1Ciphertext.length - 1);
    expect(downloadedChunk1.length).toBe(chunk1Ciphertext.length);

    const iv1 = downloadedChunk1.subarray(0, 12);
    const tag1 = downloadedChunk1.subarray(downloadedChunk1.length - 16);
    const ct1 = downloadedChunk1.subarray(12, downloadedChunk1.length - 16);

    const aad1 = buildChunkAAD(fileId, 1, 2, true, 1);
    const decryptedChunk1 = decryptAesGcm(fek, iv1, ct1, tag1, aad1);
    expect(Buffer.from(decryptedChunk1).toString('hex')).toBe(chunk1Data.toString('hex'));
  });

  it('9. Abort Upload & Reserved Quota Release', async () => {
    // Initiate another 5 MiB upload
    const initRes = await request(app)
      .post('/api/v1/files/uploads')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        expected_bytes: 5242880,
        total_chunks: 1,
        encrypted_name: 'enc-aborted-file.zip',
        name_nonce: 'nonce-abort1234',
        encrypted_fek: 'enc-fek-abort',
        fek_nonce: 'nonce-fek-abort'
      });
    expect(initRes.status).toBe(201);
    const abortSessionId = initRes.body.session_id;

    // Verify 5 MiB reserved
    let user = await userRepo.findOne({ where: { id: userId } });
    expect(Number(user.storage_reserved_bytes)).toBe(5242880);

    // Abort the upload session
    const abortRes = await request(app)
      .post(`/api/v1/files/uploads/${abortSessionId}/abort`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(abortRes.status).toBe(200);

    // Verify reserved quota is immediately released back to 0
    user = await userRepo.findOne({ where: { id: userId } });
    expect(Number(user.storage_reserved_bytes)).toBe(0);
  });

  it('10. Folder Hierarchy & Cycle Prevention', async () => {
    // Create Folder A
    const folderARes = await request(app)
      .post('/api/v1/folders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ encrypted_name: 'enc-FolderA', name_nonce: 'nonceA1234567' });
    expect(folderARes.status).toBe(201);
    const folderAId = folderARes.body.id;

    // Create Folder B inside Folder A
    const folderBRes = await request(app)
      .post('/api/v1/folders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ encrypted_name: 'enc-FolderB', name_nonce: 'nonceB1234567', parent_id: folderAId });
    expect(folderBRes.status).toBe(201);
    const folderBId = folderBRes.body.id;

    // Attempt to move Folder A inside Folder B (Cycle!)
    const cycleRes = await request(app)
      .patch(`/api/v1/folders/${folderAId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ parent_id: folderBId });

    expect(cycleRes.status).toBe(400);
    expect(cycleRes.body.error.message).toContain('Cycle detected');

    // Attempt to move Folder A inside itself
    const selfCycleRes = await request(app)
      .patch(`/api/v1/folders/${folderAId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ parent_id: folderAId });

    expect(selfCycleRes.status).toBe(400);
    expect(selfCycleRes.body.error.message).toContain('Cannot move folder inside itself');
  });

  it('11. File Soft-Delete, Restore & Permanent Delete with Quota Release', async () => {
    // 1. Move file to trash
    const trashRes = await request(app)
      .delete(`/api/v1/files/${fileId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(trashRes.status).toBe(200);

    let file = await fileRepo.findOne({ where: { id: fileId } });
    expect(file.is_trashed).toBe(true);

    // 2. Restore file
    const restoreRes = await request(app)
      .post(`/api/v1/files/${fileId}/restore`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(restoreRes.status).toBe(200);

    file = await fileRepo.findOne({ where: { id: fileId } });
    expect(file.is_trashed).toBe(false);

    // 3. Permanent delete
    const permRes = await request(app)
      .delete(`/api/v1/files/${fileId}/permanent`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(permRes.status).toBe(200);

    const deletedFile = await fileRepo.findOne({ where: { id: fileId } });
    expect(deletedFile).toBeNull();

    // Verify storage_used_bytes decremented back to 0
    const user = await userRepo.findOne({ where: { id: userId } });
    expect(Number(user.storage_used_bytes)).toBe(0);
  });

  it('12. Complete Upload Quota Protection: Rejects upload if actual object size exceeds reserved size', async () => {
    // Initiate upload claiming expected_bytes = 100 bytes (1 chunk)
    const initRes = await request(app)
      .post('/api/v1/files/uploads')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        expected_bytes: 100,
        total_chunks: 1,
        encrypted_name: 'enc-oversize.bin',
        name_nonce: 'nonce-oversize12',
        encrypted_fek: 'enc-fek-oversize',
        fek_nonce: 'nonce-fek-oversize'
      });

    expect(initRes.status).toBe(201);
    const oversizeSessionId = initRes.body.session_id;
    const oversizeFileId = initRes.body.file_id;

    // Get presigned URL for part 1
    const partsRes = await request(app)
      .post(`/api/v1/files/uploads/${oversizeSessionId}/parts`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ chunk_indices: [0] });
    expect(partsRes.status).toBe(200);

    // Upload a 500-byte payload (which exceeds the 100 reserved bytes)
    const oversizePayload = crypto.randomBytes(500);
    const putRes = await request(partsRes.body.parts[0].presigned_url)
      .put('')
      .set('Content-Type', 'application/octet-stream')
      .send(oversizePayload);
    expect(putRes.status).toBe(200);
    const etag = putRes.headers.etag;

    // Call complete upload
    const compRes = await request(app)
      .post(`/api/v1/files/uploads/${oversizeSessionId}/complete`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        parts: [{ part_number: 1, etag }]
      });

    expect(compRes.status).toBe(400);
    expect(compRes.body.error.message).toContain('exceeds reserved size');

    // Verify file is marked FAILED in DB
    const failedFile = await fileRepo.findOne({ where: { id: oversizeFileId } });
    expect(failedFile.status).toBe('FAILED');

    // Verify session is marked ABORTED
    const abortedSession = await sessionRepo.findOne({ where: { id: oversizeSessionId } });
    expect(abortedSession.status).toBe('ABORTED');

    // Verify reserved quota was refunded/released back to 0
    const user = await userRepo.findOne({ where: { id: userId } });
    expect(Number(user.storage_reserved_bytes)).toBe(0);
  });
});
