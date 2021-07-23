import { join } from 'path';
import { readFile, writeFile } from 'fs/promises';

const __dirname = process.env.PWD;
let jpackage = {};
try {
  jpackage = JSON.parse(
    await readFile(join(__dirname, 'package.json'))
  );
} catch (rerr) {
  console.error(rerr);
  process.exit(1);
}
const appVersion = jpackage.version;
const versionPath = join(__dirname, 'src', 'environments', 'version.ts');
const src = `export const version = '${appVersion}';\n`;
try {
  await writeFile(versionPath, src, { flag: 'w' });
} catch (err) {
  console.error(err);
  process.exit(1);
}
console.log(`Wrote ${appVersion} to ${versionPath}`);
