const axios = require('axios');
const sodium = require('libsodium-wrappers-sumo');
const crypto = require('crypto');

const API_BASE = 'http://localhost:4000/api';

async function main() {
  await sodium.ready;
  console.log('[Test] Libsodium ready');

  const timestamp = Date.now();
  const email = `upload_verifier_${timestamp}@cloudvault.internal`;
  const password = 'StrongPassword123!';

  // Step 1: Generate Salt & Derive Keys
  const salt = crypto.randomBytes(16);
  const rawKey = sodium.crypto_pwhash(
    64,
    password,
    salt,
    3,
    65536 * 1024,
    sodium.crypto_pwhash_ALG_ARGON2ID13
  );
  const authKeyHex = Buffer.from(rawKey.slice(0, 32)).toString('hex');
  const kek = rawKey.slice(32, 64);

  // Generate MasterKey
  const masterKey = crypto.randomBytes(32);
  const mkIv = crypto.randomBytes(12);
  const mkCipher = crypto.createCipheriv('aes-256-gcm', kek, mkIv);
  mkCipher.setAAD(Buffer.from('cloudvault-master-key-wrap-v1', 'utf8'));
  const mkCt = Buffer.concat([mkCipher.update(masterKey), mkCipher.final()]);
  const mkTag = mkCipher.getAuthTag();

  const wrappedWithKek = {
    v: 1,
    iv: mkIv.toString('hex'),
    tag: mkTag.toString('hex'),
    ct: mkCt.toString('hex')
  };

  // Mock recovery wrap
  const wrappedWithRecovery = {
    v: 1,
    iv: mkIv.toString('hex'),
    tag: mkTag.toString('hex'),
    ct: mkCt.toString('hex')
  };

  // Register
  const regRes = await axios.post(`${API_BASE}/v1/auth/register`, {
    email,
    authKey: authKeyHex,
    salt: salt.toString('hex'),
    kdf_version: '1.0',
    kdf_params: { m: 65536, t: 3, p: 1 },
    encrypted_master_key: JSON.stringify(wrappedWithKek),
    master_key_nonce: wrappedWithKek.iv,
    encrypted_recovery_master_key: JSON.stringify(wrappedWithRecovery),
    recovery_master_key_nonce: wrappedWithRecovery.iv
  });

  console.log('[Test] Registered new user:', email);

  // Login
  const loginRes = await axios.post(`${API_BASE}/v1/auth/login`, {
    email,
    authKey: authKeyHex
  });
  const token = loginRes.data.accessToken;
  console.log('[Test] Logged in successfully. Token acquired.');

  // Confirm Recovery Kit
  const confirmRes = await axios.post(`${API_BASE}/v1/auth/recovery/confirm`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('[Test] Recovery confirmed successfully:', confirmRes.data.recovery_confirmed_at);

  // Step 2: Prepare a test file
  const testPlaintext = Buffer.from('CloudVault zero-knowledge storage verification test payload ' + Date.now());
  const fek = crypto.randomBytes(32);

  // Wrap FEK with MasterKey
  const fekIv = crypto.randomBytes(12);
  const fekCipher = crypto.createCipheriv('aes-256-gcm', masterKey, fekIv);
  fekCipher.setAAD(Buffer.from('cloudvault-fek-v1', 'utf8'));
  const fekCt = Buffer.concat([fekCipher.update(fek), fekCipher.final()]);
  const fekTag = fekCipher.getAuthTag();

  const encryptedFekHex = fekCt.toString('hex') + fekTag.toString('hex');
  const fekNonceHex = fekIv.toString('hex');

  // Encrypt Filename with MasterKey
  const testFileName = `test-vault-upload-${Date.now()}.txt`;
  const nameIv = crypto.randomBytes(12);
  const nameCipher = crypto.createCipheriv('aes-256-gcm', masterKey, nameIv);
  nameCipher.setAAD(Buffer.from('cloudvault-metadata-v1', 'utf8'));
  const nameCt = Buffer.concat([nameCipher.update(Buffer.from(testFileName, 'utf8')), nameCipher.final()]);
  const nameTag = nameCipher.getAuthTag();
  const packedName = Buffer.concat([nameCt, nameTag]);

  // Step 3: Initiate Upload
  const expectedBytes = testPlaintext.length + 28;
  const initRes = await axios.post(`${API_BASE}/v1/files/uploads`, {
    expected_bytes: expectedBytes,
    total_chunks: 1,
    chunk_size: 5242880,
    encrypted_name: packedName.toString('base64'),
    name_nonce: nameIv.toString('base64'),
    encrypted_fek: encryptedFekHex,
    fek_nonce: fekNonceHex,
    format_version: 1
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });

  console.log('[Test] Initiate upload succeeded:', initRes.data.session_id);
  const sessionId = initRes.data.session_id;
  const fileId = initRes.data.file_id;
  const parts = initRes.data.parts;
  console.log('[Test] Received parts count from initiateUpload:', parts?.length);

  // Construct AAD
  const aad = Buffer.alloc(27);
  aad.writeUInt16BE(1, 0); // format_version = 1
  const fileIdClean = fileId.replace(/-/g, '');
  Buffer.from(fileIdClean, 'hex').copy(aad, 2);
  aad.writeUInt32BE(0, 18); // chunkIndex = 0
  aad.writeUInt32BE(1, 22); // totalChunks = 1
  aad.writeUInt8(1, 26);    // isFinal = 1

  const chunkIv = crypto.randomBytes(12);
  const chunkCipher = crypto.createCipheriv('aes-256-gcm', fek, chunkIv);
  chunkCipher.setAAD(aad);
  const chunkCt = Buffer.concat([chunkCipher.update(testPlaintext), chunkCipher.final()]);
  const chunkTag = chunkCipher.getAuthTag();

  const wireChunk = Buffer.concat([chunkIv, chunkCt, chunkTag]);
  console.log('[Test] Wire chunk constructed. Size:', wireChunk.length);

  // Direct PUT to S3
  const presignedUrl = parts[0].presigned_url;
  const putRes = await axios.put(presignedUrl, wireChunk, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Origin': 'http://localhost:3000'
    }
  });

  console.log('[Test] S3 PUT Status:', putRes.status);
  const rawEtag = putRes.headers['etag'] || putRes.headers['ETag'];
  console.log('[Test] S3 ETag:', rawEtag);
  const cleanEtag = rawEtag.replace(/"/g, '');

  // Complete Upload
  const completeRes = await axios.post(`${API_BASE}/v1/files/uploads/${sessionId}/complete`, {
    parts: [{ part_number: 1, etag: cleanEtag }]
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });

  console.log('[Test] Complete upload succeeded:', completeRes.data);

  // List Files and verify
  const listRes = await axios.get(`${API_BASE}/v1/files`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const fileList = listRes.data.files || listRes.data;
  const foundFile = fileList.find(f => f.id === fileId);
  console.log('[Test] File listed in vault:', !!foundFile, 'Status:', foundFile?.status);

  // Decrypt Filename
  const packedDec = Buffer.from(foundFile.encrypted_name, 'base64');
  const dNameIv = Buffer.from(foundFile.name_nonce, 'base64');
  const dNameTag = packedDec.slice(packedDec.length - 16);
  const dNameCt = packedDec.slice(0, packedDec.length - 16);
  const nameDecipher = crypto.createDecipheriv('aes-256-gcm', masterKey, dNameIv);
  nameDecipher.setAAD(Buffer.from('cloudvault-metadata-v1', 'utf8'));
  nameDecipher.setAuthTag(dNameTag);
  const decryptedName = Buffer.concat([nameDecipher.update(dNameCt), nameDecipher.final()]).toString('utf8');
  console.log('[Test] Decrypted filename:', decryptedName);

  // Download Info and Decrypt File Payload
  const downloadInfoRes = await axios.get(`${API_BASE}/v1/files/${fileId}/download-info`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('[Test] Download URL acquired.');
  const dlRes = await axios.get(downloadInfoRes.data.download_url, { responseType: 'arraybuffer' });
  const downloadedWire = Buffer.from(dlRes.data);

  const dlChunkIv = downloadedWire.slice(0, 12);
  const dlChunkTag = downloadedWire.slice(downloadedWire.length - 16);
  const dlChunkCt = downloadedWire.slice(12, downloadedWire.length - 16);

  const dlDecipher = crypto.createDecipheriv('aes-256-gcm', fek, dlChunkIv);
  dlDecipher.setAAD(aad);
  dlDecipher.setAuthTag(dlChunkTag);
  const decryptedContent = Buffer.concat([dlDecipher.update(dlChunkCt), dlDecipher.final()]).toString('utf8');
  console.log('[Test] Decrypted file content:', decryptedContent);

  if (decryptedContent === testPlaintext.toString('utf8')) {
    console.log('\n=============================================================');
    console.log('🎉 SUCCESS: Full Zero-Knowledge Registration, Upload, Direct S3 Multipart Streaming, ETag verification, and Decryption verified end-to-end!');
    console.log('=============================================================');
  } else {
    throw new Error('Plaintext mismatch!');
  }
}

main().catch(err => {
  console.error('[Test Failed]:', err?.response?.data || err.message);
  process.exit(1);
});
