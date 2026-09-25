const fs = require('fs');
const html = fs.readFileSync('C:/Users/Admin/.gemini/antigravity/brain/57c4a6e6-5559-463c-8759-a1e60ef2472f/prototipo_desktop_v4.html', 'utf8');
const tabs = ['v-inicio', 'v-agendar', 'v-eventos', 'v-historico', 'v-perfil'];
for (const tab of tabs) {
  const startStr = `<div id="${tab}"`;
  const startIndex = html.indexOf(startStr);
  if (startIndex !== -1) {
    let nextTabIndex = -1;
    for (const t of tabs) {
        if (t === tab) continue;
        const i = html.indexOf(`<div id="${t}"`, startIndex + 10);
        if (i !== -1 && (nextTabIndex === -1 || i < nextTabIndex)) nextTabIndex = i;
    }
    if (nextTabIndex === -1) nextTabIndex = html.indexOf('</main>');
    if (nextTabIndex === -1) nextTabIndex = html.indexOf('<div id="ml"'); // Modal wrapper usually at the bottom
    if (nextTabIndex === -1) nextTabIndex = html.length;
    fs.writeFileSync(tab + '-v4.html', html.substring(startIndex, nextTabIndex));
  }
}
