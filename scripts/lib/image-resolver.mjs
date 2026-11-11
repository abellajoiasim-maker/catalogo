// scripts/lib/image-resolver.mjs
// Carrega o MESMO js/utils/image-helper.js usado no navegador, para que feed,
// auditoria e site resolvam imagens exatamente do mesmo jeito (fonte única).
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

export function carregarImageHelper() {
  const origem = new URL('../../js/utils/image-helper.js', import.meta.url);
  const ctx = { window: {}, console: { info() {}, warn() {}, error() {} } };
  vm.createContext(ctx);
  vm.runInContext(readFileSync(origem, 'utf8'), ctx, { filename: 'image-helper.js' });
  return ctx.window.ImageHelper;
}
