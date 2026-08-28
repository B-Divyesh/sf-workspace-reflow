import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { access, readFile } from 'node:fs/promises';

const execFileAsync = promisify(execFile);
const archive = 'dist/site/downloads/workspace-reflow-chrome.zip';

await access(archive);
const bytes = await readFile(archive);
if (bytes.subarray(0, 4).toString('binary') !== 'PK\x03\x04') {
  throw new Error(`${archive} is not a ZIP archive.`);
}

const { stdout } = await execFileAsync('unzip', ['-Z1', archive]);
if (!stdout.split('\n').includes('manifest.json')) {
  throw new Error(`${archive} does not contain an extension manifest.`);
}
await execFileAsync('unzip', ['-t', archive]);
