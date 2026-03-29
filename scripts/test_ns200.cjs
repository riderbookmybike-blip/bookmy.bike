const fs = require('fs');
const html = fs.readFileSync('ns200.html', 'utf-8');

// Find all 360 viewer instances
const regex = /bajajauto\.com\/-\/media\/assets\/bajajauto\/bikes\/pulsarns200\/newns200-360-degree\/([^'"]+)/g;
let match;
const matches = new Set();
while ((match = regex.exec(html)) !== null) {
  matches.add(match[0]);
}

console.log([...matches]);
