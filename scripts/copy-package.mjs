import { cp, mkdir, readdir, copyFile } from 'node:fs/promises';
import { join } from 'node:path';

const outputRoot = '.output';
const entries = await readdir(outputRoot, { withFileTypes: true });
const archive = entries.find((entry) => entry.isFile() && entry.name.endsWith('.zip') && entry.name.includes('chrome'));
const unpacked = entries.find((entry) => entry.isDirectory() && entry.name.includes('chrome-mv3'));

if (!archive || !unpacked) throw new Error('WXT did not produce the expected Chrome MV3 package.');

await mkdir('dist/site/downloads', { recursive: true });
await copyFile(join(outputRoot, archive.name), 'dist/site/downloads/workspace-reflow-chrome.zip');
await cp(join(outputRoot, unpacked.name), 'dist/extension', { recursive: true });
