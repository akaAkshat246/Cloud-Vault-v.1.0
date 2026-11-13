/**
 * Patch libsodium-wrappers-sumo for ESM compatibility with libsodium-sumo
 * Fixes: "Cannot read properties of undefined (reading 'then')"
 */

const fs = require('fs');
const path = require('path');

const targetDir = path.resolve(__dirname, '../node_modules/libsodium-wrappers-sumo/dist/modules-sumo-esm');
const sourceFile = path.resolve(__dirname, '../node_modules/libsodium-sumo/dist/modules-sumo-esm/libsodium-sumo.mjs');

if (fs.existsSync(targetDir) && fs.existsSync(sourceFile)) {
  const rawTarget = path.join(targetDir, 'libsodium-sumo-raw.mjs');
  const wrapperTarget = path.join(targetDir, 'libsodium-sumo.mjs');

  fs.copyFileSync(sourceFile, rawTarget);

  const adapter = `import A from './libsodium-sumo-raw.mjs';

const instance = {};
instance.ready = A(instance).then((mod) => {
  Object.assign(instance, mod);
  return instance;
});

export default instance;
`;

  fs.writeFileSync(wrapperTarget, adapter, 'utf8');
  console.log('[patch-libsodium] Successfully patched libsodium-wrappers-sumo ESM adapter.');
}
