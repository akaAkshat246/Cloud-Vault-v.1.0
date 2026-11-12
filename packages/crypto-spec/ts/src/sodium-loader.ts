/**
 * Cross-environment Libsodium Loader
 * Supports ESM, CommonJS, and Vite bundling
 */

import { createRequire } from "node:module";

let sodiumInstance: any = null;

export async function getSodium(): Promise<any> {
  if (sodiumInstance && sodiumInstance.ready) {
    await sodiumInstance.ready;
    return sodiumInstance;
  }

  try {
    // 1. Try CommonJS require (bulletproof in Node/Vitest)
    const req = createRequire(import.meta.url);
    sodiumInstance = req("libsodium-wrappers-sumo");
    await sodiumInstance.ready;
    return sodiumInstance;
  } catch (e1) {
    // 2. Fallback to standard dynamic import (browser/vite)
    const mod = await import("libsodium-wrappers-sumo");
    sodiumInstance = mod.default || mod;
    await sodiumInstance.ready;
    return sodiumInstance;
  }
}

