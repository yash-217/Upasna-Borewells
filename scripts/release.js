import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packagePath = path.join(__dirname, '../package.json');
const changelogPath = path.join(__dirname, '../CHANGELOG.md');

const args = process.argv.slice(2);
const newVersion = args[0];

if (!newVersion) {
  console.error('Usage: node scripts/release.js <new_version>');
  process.exit(1);
}

// 1. Update package.json
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
const oldVersion = pkg.version;
pkg.version = newVersion;
fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
console.log(`Updated package.json version from ${oldVersion} to ${newVersion}`);

// 2. Update CHANGELOG.md
let changelog = fs.readFileSync(changelogPath, 'utf-8');
const date = new Date().toISOString().split('T')[0];

const unreleasedHeader = '## [Unreleased]';
const newSection = `## [Unreleased]

## [${newVersion}] - ${date}`;

if (changelog.includes(unreleasedHeader)) {
  changelog = changelog.replace(unreleasedHeader, newSection);
  fs.writeFileSync(changelogPath, changelog);
  console.log(`Updated CHANGELOG.md for version ${newVersion}`);
} else {
  console.warn('Could not find "## [Unreleased]" header in CHANGELOG.md');
}
