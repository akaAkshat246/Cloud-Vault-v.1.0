package app.cloudvault.crypto;

import javax.crypto.Cipher;
import javax.crypto.Mac;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * JVM Direct Cryptographic Verification Runner
 * Validates NIST SP 800-38D AES-GCM and RFC 5869 HKDF on JVM against official test vectors
 */
public class JvmCryptoVectorTest {

    public static void main(String[] args) throws Exception {
        System.out.println("=== JVM Direct Cryptographic Verification Runner ===");

        String jsonPath = "packages/crypto-spec/test-vectors/v1.json";
        if (!Files.exists(Paths.get(jsonPath))) {
            jsonPath = "../test-vectors/v1.json";
        }
        String json = new String(Files.readAllBytes(Paths.get(jsonPath)), StandardCharsets.UTF_8);

        int passed = 0;
        int failed = 0;

        // 1. HKDF-SHA256 Test
        try {
            String rawPrkHex = extractJsonValue(json, "raw_prk_hex");
            String expectedAuthKey = extractJsonValue(json, "auth_key_hex");
            String expectedKek = extractJsonValue(json, "kek_hex");

            byte[] rawIkm = hexToBytes(rawPrkHex);
            byte[] derivedAuthKey = hkdf(rawIkm, "cloudvault-auth-key-v1", 32);
            byte[] derivedKek = hkdf(rawIkm, "cloudvault-kek-v1", 32);

            assertEqual("HKDF AuthKey", expectedAuthKey, bytesToHex(derivedAuthKey));
            assertEqual("HKDF KEK", expectedKek, bytesToHex(derivedKek));
            System.out.println("  [PASS] 1. HKDF-SHA256 Dual-Key Derivation (AuthKey & KEK)");
            passed++;
        } catch (Exception e) {
            System.err.println("  [FAIL] 1. HKDF: " + e.getMessage());
            failed++;
        }

        // 2. Master Key Envelope Unwrapping
        try {
            String kekHex = extractJsonValue(json, "kek_hex");
            String expectedMasterKey = extractJsonValue(json, "master_key_hex");
            String wrapIvB64 = extractNestedJsonValue(json, "master_key_wrap", "iv");
            String wrapTagB64 = extractNestedJsonValue(json, "master_key_wrap", "tag");
            String wrapCtB64 = extractNestedJsonValue(json, "master_key_wrap", "ct");

            byte[] kek = hexToBytes(kekHex);
            byte[] iv = Base64.getDecoder().decode(wrapIvB64);
            byte[] tag = Base64.getDecoder().decode(wrapTagB64);
            byte[] ct = Base64.getDecoder().decode(wrapCtB64);
            byte[] aad = "cloudvault-master-key-wrap-v1".getBytes(StandardCharsets.UTF_8);

            byte[] unwrapped = decryptAesGcm(kek, iv, ct, tag, aad);
            assertEqual("MasterKey Unwrap", expectedMasterKey, bytesToHex(unwrapped));
            System.out.println("  [PASS] 2. Master Key Envelope Unwrapping (AES-256-GCM)");
            passed++;
        } catch (Exception e) {
            System.err.println("  [FAIL] 2. MasterKey Unwrap: " + e.getMessage());
            failed++;
        }

        // 3. Chunk 0 Decryption with 27-byte AAD
        try {
            String fekHex = extractJsonValue(json, "fek_hex");
            byte[] fek = hexToBytes(fekHex);

            String fileId = "c9bf9e57-1685-4c89-bafb-ff5af830be8a";
            byte[] aad = buildChunkAAD(UUID.fromString(fileId), 0, 2, false, (short) 1);

            String ivHex = "102030405060708090a0b0c0";
            String ctHex = extractFirstMatch(json, "\"ciphertext_hex\": \"([0-9a-fA-F]+)\"");
            String tagHex = extractFirstMatch(json, "\"tag_hex\": \"([0-9a-fA-F]+)\"");
            String expectedAscii = "CloudVault Chunk 0 Plaintext Payload - Zero Knowledge Cloud Storage 2026! Multi-chunk block 0.";

            byte[] iv = hexToBytes(ivHex);
            byte[] ct = hexToBytes(ctHex);
            byte[] tag = hexToBytes(tagHex);

            byte[] decrypted = decryptAesGcm(fek, iv, ct, tag, aad);
            String decStr = new String(decrypted, StandardCharsets.UTF_8);
            assertEqual("Chunk 0 Plaintext", expectedAscii, decStr);
            System.out.println("  [PASS] 3. Chunk 0 Decryption & 27-byte AAD Authentication");
            passed++;
        } catch (Exception e) {
            System.err.println("  [FAIL] 3. Chunk 0: " + e.getMessage());
            failed++;
        }

        // 4. Negative Tests (Tampering & Swapping Defenses)
        try {
            String fekHex = extractJsonValue(json, "fek_hex");
            byte[] fek = hexToBytes(fekHex);
            String fileId = "c9bf9e57-1685-4c89-bafb-ff5af830be8a";
            byte[] aad = buildChunkAAD(UUID.fromString(fileId), 0, 2, false, (short) 1);

            String ivHex = "102030405060708090a0b0c0";
            String ctHex = extractFirstMatch(json, "\"ciphertext_hex\": \"([0-9a-fA-F]+)\"");
            String tagHex = extractFirstMatch(json, "\"tag_hex\": \"([0-9a-fA-F]+)\"");

            byte[] iv = hexToBytes(ivHex);
            byte[] ct = hexToBytes(ctHex);
            byte[] tag = hexToBytes(tagHex);

            // A: Tampered Tag (flip 1 byte)
            byte[] badTag = tag.clone();
            badTag[15] ^= 0x01;
            boolean failedTag = false;
            try {
                decryptAesGcm(fek, iv, ct, badTag, aad);
            } catch (Exception ex) {
                failedTag = true;
            }
            if (!failedTag) throw new AssertionError("Tampered tag did not throw exception!");

            // B: Wrong AAD chunk_index (reordering attack)
            byte[] wrongAad = buildChunkAAD(UUID.fromString(fileId), 1, 2, false, (short) 1);
            boolean failedAad = false;
            try {
                decryptAesGcm(fek, iv, ct, tag, wrongAad);
            } catch (Exception ex) {
                failedAad = true;
            }
            if (!failedAad) throw new AssertionError("Wrong chunk_index in AAD did not throw exception!");

            // C: Wrong File ID in AAD (cross-file chunk swapping attack)
            byte[] wrongFileAad = buildChunkAAD(UUID.fromString("00000000-0000-0000-0000-000000000000"), 0, 2, false, (short) 1);
            boolean failedFileAad = false;
            try {
                decryptAesGcm(fek, iv, ct, tag, wrongFileAad);
            } catch (Exception ex) {
                failedFileAad = true;
            }
            if (!failedFileAad) throw new AssertionError("Wrong file_id in AAD did not throw exception!");

            System.out.println("  [PASS] 4. Negative Test Vectors (Tampered Tag, Wrong Index AAD, Wrong File ID AAD)");
            passed++;
        } catch (Exception e) {
            System.err.println("  [FAIL] 4. Negative tests: " + e.getMessage());
            failed++;
        }

        System.out.println("\nJVM Execution Results: " + passed + " passed, " + failed + " failed.");
        if (failed > 0) {
            System.exit(1);
        }
    }

    private static byte[] buildChunkAAD(UUID fileId, int chunkIndex, int totalChunks, boolean isFinal, short formatVersion) {
        ByteBuffer buf = ByteBuffer.allocate(27).order(ByteOrder.BIG_ENDIAN);
        buf.putShort(formatVersion);
        buf.putLong(fileId.getMostSignificantBits());
        buf.putLong(fileId.getLeastSignificantBits());
        buf.putInt(chunkIndex);
        buf.putInt(totalChunks);
        buf.put((byte) (isFinal ? 1 : 0));
        return buf.array();
    }

    private static byte[] decryptAesGcm(byte[] key, byte[] iv, byte[] ct, byte[] tag, byte[] aad) throws Exception {
        byte[] combined = new byte[ct.length + tag.length];
        System.arraycopy(ct, 0, combined, 0, ct.length);
        System.arraycopy(tag, 0, combined, ct.length, tag.length);

        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE, new SecretKeySpec(key, "AES"), new GCMParameterSpec(128, iv));
        if (aad != null && aad.length > 0) {
            cipher.updateAAD(aad);
        }
        return cipher.doFinal(combined);
    }

    /**
     * RFC 5869 HKDF: Extract + Expand
     */
    private static byte[] hkdf(byte[] ikm, String info, int length) throws Exception {
        // Step 1: Extract (with zero salt if not provided)
        Mac macExtract = Mac.getInstance("HmacSHA256");
        macExtract.init(new SecretKeySpec(new byte[32], "HmacSHA256"));
        byte[] prk = macExtract.doFinal(ikm);

        // Step 2: Expand
        Mac macExpand = Mac.getInstance("HmacSHA256");
        macExpand.init(new SecretKeySpec(prk, "HmacSHA256"));
        macExpand.update(info.getBytes(StandardCharsets.UTF_8));
        macExpand.update((byte) 0x01);
        byte[] t1 = macExpand.doFinal();
        if (length == 32) return t1;
        byte[] out = new byte[length];
        System.arraycopy(t1, 0, out, 0, length);
        return out;
    }

    private static void assertEqual(String desc, String expected, String actual) {
        if (!expected.equalsIgnoreCase(actual)) {
            throw new AssertionError(desc + " mismatch! Expected: " + expected + ", Got: " + actual);
        }
    }

    private static String extractJsonValue(String json, String key) {
        Pattern p = Pattern.compile("\"" + key + "\"\\s*:\\s*\"([^\"]+)\"");
        Matcher m = p.matcher(json);
        if (m.find()) return m.group(1);
        throw new IllegalArgumentException("Key not found in json: " + key);
    }

    private static String extractNestedJsonValue(String json, String parentKey, String childKey) {
        Pattern p = Pattern.compile("\"" + parentKey + "\"\\s*:\\s*\\{[^}]*\"" + childKey + "\"\\s*:\\s*\"([^\"]+)\"", Pattern.DOTALL);
        Matcher m = p.matcher(json);
        if (m.find()) return m.group(1);
        throw new IllegalArgumentException("Nested key not found: " + parentKey + "." + childKey);
    }

    private static String extractFirstMatch(String json, String regex) {
        Pattern p = Pattern.compile(regex);
        Matcher m = p.matcher(json);
        if (m.find()) return m.group(1);
        throw new IllegalArgumentException("Pattern not found: " + regex);
    }

    private static byte[] hexToBytes(String hex) {
        int len = hex.length();
        byte[] data = new byte[len / 2];
        for (int i = 0; i < len; i += 2) {
            data[i / 2] = (byte) ((Character.digit(hex.charAt(i), 16) << 4)
                    + Character.digit(hex.charAt(i + 1), 16));
        }
        return data;
    }

    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
