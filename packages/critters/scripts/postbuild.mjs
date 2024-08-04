// @ts-check

import * as fs from 'node:fs';
import * as path from 'node:path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const rootDir = path.resolve(__dirname, '../');

const mtsContent = fs.readFileSync(path.resolve(rootDir, './src/index.d.ts'), {
  encoding: 'utf-8'
});

const ctsContent = mtsContent
  .replace(
    'export default class Critters',
    'export = Critters;\nclass Critters'
  )
  .replace(/export interface/g, 'interface');

fs.writeFileSync(path.resolve(rootDir, './dist/critters.d.ts'), ctsContent, {
  encoding: 'utf-8'
});
fs.writeFileSync(path.resolve(rootDir, './dist/critters.d.mts'), mtsContent, {
  encoding: 'utf-8'
});
