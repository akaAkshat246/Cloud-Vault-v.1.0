/**
 * Patch libsodium-wrappers-sumo and libsodium-sumo for ESM compatibility
 * Fixes: "Cannot read properties of undefined (reading 'then')"
 */

const fs = require('fs');
const path = require('path');

const adapterContent = `import A from './libsodium-sumo-raw.mjs';

const instance = {};
const readyPromise = Promise.resolve(A(instance)).then((mod) => {
  if (mod && mod !== instance) {
    Object.assign(instance, mod);
  }
  return instance;
});
instance.ready = readyPromise;

export default instance;
`;

// 1. Patch libsodium-wrappers-sumo/dist/modules-sumo-esm
const wrappersTargetDir = path.resolve(__dirname, '../node_modules/libsodium-wrappers-sumo/dist/modules-sumo-esm');
const sumoSourceFile = path.resolve(__dirname, '../node_modules/libsodium-sumo/dist/modules-sumo-esm/libsodium-sumo.mjs');

if (fs.existsSync(wrappersTargetDir)) {
  const rawTarget = path.join(wrappersTargetDir, 'libsodium-sumo-raw.mjs');
  const wrapperTarget = path.join(wrappersTargetDir, 'libsodium-sumo.mjs');

  if (!fs.existsSync(rawTarget) && fs.existsSync(sumoSourceFile)) {
    fs.copyFileSync(sumoSourceFile, rawTarget);
  }

  fs.writeFileSync(wrapperTarget, adapterContent, 'utf8');
  console.log('[patch-libsodium] Successfully patched libsodium-wrappers-sumo ESM adapter.');
}

// 2. Patch libsodium-sumo/dist/modules-sumo-esm
const sumoTargetDir = path.resolve(__dirname, '../node_modules/libsodium-sumo/dist/modules-sumo-esm');
if (fs.existsSync(sumoTargetDir)) {
  const rawSumoTarget = path.join(sumoTargetDir, 'libsodium-sumo-raw.mjs');
  const sumoTarget = path.join(sumoTargetDir, 'libsodium-sumo.mjs');

  if (!fs.existsSync(rawSumoTarget)) {
    fs.copyFileSync(sumoTarget, rawSumoTarget);
  }

  fs.writeFileSync(sumoTarget, adapterContent, 'utf8');
  console.log('[patch-libsodium] Successfully patched libsodium-sumo ESM adapter.');
}


