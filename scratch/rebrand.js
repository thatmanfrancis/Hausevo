const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const filesListPath = path.join(__dirname, 'shack_files.json');

if (!fs.existsSync(filesListPath)) {
  console.error('Error: shack_files.json not found in scratch directory!');
  process.exit(1);
}

const filesToUpdate = JSON.parse(fs.readFileSync(filesListPath, 'utf8'));
console.log(`Starting rebranding for ${filesToUpdate.length} files...`);

let updatedCount = 0;

for (const relPath of filesToUpdate) {
  const fullPath = path.join(rootDir, relPath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`File not found, skipping: ${relPath}`);
    continue;
  }

  // We skip assets.ts and next.config.ts since we handled them manually/very specifically
  if (relPath.includes('assets.ts') || relPath.includes('next.config.ts') || relPath.includes('package.json') || relPath.includes('manifest.json')) {
    console.log(`Skipping already-handled file: ${relPath}`);
    continue;
  }

  // Also skip the deleted tenant/shack-score folder
  if (relPath.includes('tenant\\shack-score') || relPath.includes('tenant/shack-score')) {
    console.log(`Skipping deleted shack-score file: ${relPath}`);
    continue;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;

  // 1. Social media & domains
  content = content.replace(/shack\.ng/g, 'hausevo.com.ng');
  content = content.replace(/shackng/g, 'hausevong');

  // 2. Email logo base64 & CID
  content = content.replace(/SHACK_LOGO_BASE64/g, 'HAUSEVO_LOGO_BASE64');
  content = content.replace(/shack_logo/g, 'hausevo_logo');

  // 3. Routing paths
  content = content.replace(/\/tenant\/shack-score/g, '/tenant/hausevo-score');

  // 4. Rebrand ShackScore to Hausevo Score (JSX/HTML/Texts)
  content = content.replace(/ShackScore/g, 'Hausevo Score');

  // 5. Standalone words
  content = content.replace(/\bShack\b/g, 'Hausevo');
  content = content.replace(/\bSHACK\b/g, 'HAUSEVO');

  // 6. CSS classes & keyframes
  content = content.replace(/shack-glass/g, 'hausevo-glass');
  content = content.replace(/shack-gradient/g, 'hausevo-gradient');

  // 7. LocalStorage & cookies
  content = content.replace(/shack_geolocation/g, 'hausevo_geolocation');
  content = content.replace(/shack_cookie_consent/g, 'hausevo_cookie_consent');
  content = content.replace(/shack_waitlist_banner/g, 'hausevo_waitlist_banner');

  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated: ${relPath}`);
    updatedCount++;
  }
}

console.log(`Rebranding completed! Updated ${updatedCount} files.`);
