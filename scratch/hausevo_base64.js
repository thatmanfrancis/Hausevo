const fs = require('fs');
const path = require('path');

const imgPath = path.join(__dirname, '..', 'public', 'hausevo.png');
const imgBuffer = fs.readFileSync(imgPath);
const base64Str = imgBuffer.toString('base64');

fs.writeFileSync(path.join(__dirname, 'base64.txt'), base64Str);
console.log('Base64 generated successfully! Length:', base64Str.length);
