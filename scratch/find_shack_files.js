const fs = require('fs');
const path = require('path');

function scanDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== 'generated') {
        scanDir(fullPath, fileList);
      }
    } else {
      if (/\.(ts|tsx|js|jsx|json|md)$/.test(file)) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

const rootDir = path.join(__dirname, '..');
const srcDir = path.join(rootDir, 'src');
const files = scanDir(srcDir);

const results = [];
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  if (/shack/i.test(content)) {
    const relativePath = path.relative(rootDir, file);
    results.push(relativePath);
  }
}

// Add root files to check
const rootFiles = ['package.json', 'next.config.ts', 'public/manifest.json'];
for (const rf of rootFiles) {
  const fullPath = path.join(rootDir, rf);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    if (/shack/i.test(content)) {
      results.push(rf);
    }
  }
}

fs.writeFileSync(path.join(__dirname, 'shack_files.json'), JSON.stringify(results, null, 2));
console.log('Scanned and found', results.length, 'files containing the word "shack". Saved to scratch/shack_files.json.');
