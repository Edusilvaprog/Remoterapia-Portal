const fs = require('fs');
const html = fs.readFileSync('C:/Users/Admin/.gemini/antigravity/brain/57c4a6e6-5559-463c-8759-a1e60ef2472f/prototipo_desktop_v4.html', 'utf8');
const ids = html.match(/id="([^"]+)"/g);
console.log(ids ? ids.join(', ') : 'No IDs found');
