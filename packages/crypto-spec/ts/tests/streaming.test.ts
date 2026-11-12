/**
 * Streaming & Large File Chunking Tests
 */

import { describe, it, expect } from "vitest";
import {
  calculateTotalChunks,
  encryptBufferToChunks,
  decryptChunksToBuffer,
  streamEncryptFile,
  bytesToString,
  stringToBytes,
  randomBytes
} from "../src/index.js";

describe("Streaming Chunk Pipeline", () => {
  const fek = randomBytes(32);
  const fileId = "7b2e8477-94a5-48fa-95ce-615c13e433db";

  it("should calculate correct total chunks for small, exact, and large boundaries", () => {
    expect(calculateTotalChunks(0)).toBe(1);
    expect(calculateTotalChunks(100)).toBe(1);
    expect(calculateTotalChunks(5 * 1024 * 1024)).toBe(1);
    expect(calculateTotalChunks(5 * 1024 * 1024 + 1)).toBe(2);
    expect(calculateTotalChunks(12 * 1024 * 1024)).toBe(3);
  });

  it("should round-trip encrypt and decrypt a synthetic multi-chunk buffer", () => {
    // 5.5 MB payload (spans 2 chunks)
    const part1 = "A".repeat(5 * 1024 * 1024);
    const part2 = "B".repeat(500 * 1024);
    const fullText = part1 + part2;
    const plaintext = stringToBytes(fullText);

    const chunks = encryptBufferToChunks(plaintext, fek, fileId);
    expect(chunks.length).toBe(2);
    expect(chunks[0].chunkIndex).toBe(0);
    expect(chunks[0].isFinal).toBe(false);
    expect(chunks[0].wireChunk.length).toBe(5 * 1024 * 1024 + 28);

    expect(chunks[1].chunkIndex).toBe(1);
    expect(chunks[1].isFinal).toBe(true);
    expect(chunks[1].wireChunk.length).toBe(500 * 1024 + 28);

    const decrypted = decryptChunksToBuffer(
      chunks.map(c => c.wireChunk),
      fek,
      fileId
    );
    expect(bytesToString(decrypted)).toBe(fullText);
  });

  it("should stream encrypt via async iterator without buffering entire payload", async () => {
    async function* makeChunks() {
      yield stringToBytes("Part 1: stream chunk alpha. ");
      yield stringToBytes("Part 2: stream chunk beta. ");
      yield stringToBytes("Part 3: stream chunk gamma.");
    }

    const collected: Uint8Array[] = [];
    for await (const out of streamEncryptFile(makeChunks(), fek, fileId, 3)) {
      collected.push(out.wireChunk);
    }
    expect(collected.length).toBe(3);

    const decrypted = decryptChunksToBuffer(collected, fek, fileId);
    expect(bytesToString(decrypted)).toBe(
      "Part 1: stream chunk alpha. Part 2: stream chunk beta. Part 3: stream chunk gamma."
    );
  });
});

