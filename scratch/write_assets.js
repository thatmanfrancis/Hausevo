const fs = require('fs');
const path = require('path');

const base64Path = path.join(__dirname, 'base64.txt');
const assetsPath = path.join(__dirname, '..', 'src', 'lib', 'assets.ts');

const base64 = fs.readFileSync(base64Path, 'utf8').trim();

const fileContent = `/**
 * Base64 encoded assets for emails.
 * Using CID (Content-ID) is more reliable than raw base64 src for email clients.
 */

export const HAUSEVO_LOGO_BASE64 = "${base64}";
export const SHACK_LOGO_BASE64 = HAUSEVO_LOGO_BASE64;
`;

fs.writeFileSync(assetsPath, fileContent, 'utf8');
console.log('Successfully wrote assets.ts!');
