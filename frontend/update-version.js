const fs = require('fs');
const path = require('path');

const envFile = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envFile, 'utf8');

const versionRegex = /NEXT_PUBLIC_APP_VERSION=V(\d+)\.(\d+)\.(\d+)/;
const match = envContent.match(versionRegex);

if (match) {
  const [, major, minor, patch] = match;
  const newPatch = parseInt(patch) + 1;
  const newVersion = `NEXT_PUBLIC_APP_VERSION=V${major}.${minor}.${newPatch}`;
  const newContent = envContent.replace(versionRegex, newVersion);
  fs.writeFileSync(envFile, newContent);
  console.log(`Version updated to ${newVersion}`);
} else {
  console.error('Version not found in .env file');
  process.exit(1);
}
