import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const versionFilePath = path.join(__dirname, 'src', 'version.json');

try {
  const fileContent = fs.readFileSync(versionFilePath, 'utf8');
  const data = JSON.parse(fileContent);

  const versionParts = data.version.split('.');
  if (versionParts.length === 3) {
    const patch = parseInt(versionParts[2]) + 1;
    data.version = `${versionParts[0]}.${versionParts[1]}.${patch}`;

    fs.writeFileSync(versionFilePath, JSON.stringify(data, null, 2));
    console.log(`Version updated to ${data.version} in version.json`);
  }
} catch (error) {
  console.error('Error updating version.json:', error);
  process.exit(1);
}
