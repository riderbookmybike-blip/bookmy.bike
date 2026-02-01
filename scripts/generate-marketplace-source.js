const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'src');
const OUTPUT = path.join(ROOT, 'src', 'i18n', 'marketplaceSource.ts');

const STRING_REGEX = /t\(\s*(['"])((?:\\.|(?!\1).)*)\1\s*\)/gs;

const isCodeFile = file => file.endsWith('.ts') || file.endsWith('.tsx');

const walk = dir => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      files.push(...walk(full));
    } else if (entry.isFile() && isCodeFile(full)) {
      files.push(full);
    }
  }
  return files;
};

const unescapeLiteral = (value, quote) => {
  try {
    return Function(`"use strict"; return ${quote}${value}${quote};`)();
  } catch {
    return value;
  }
};

const collectStrings = () => {
  const files = walk(SRC_DIR);
  const set = new Set();
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = STRING_REGEX.exec(content)) !== null) {
      const quote = match[1];
      const raw = match[2];
      const text = unescapeLiteral(raw, quote);
      if (text && typeof text === 'string') {
        set.add(text);
      }
    }
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b));
};

const toTsArray = items => items.map(item => `    ${JSON.stringify(item)},`).join('\n');

const writeOutput = items => {
  const today = new Date().toISOString().slice(0, 10);
  const body = `// Auto-generated marketplace UI source strings
// Generated: ${today}

export const MARKETPLACE_SOURCE_VERSION = '${today}';

export const MARKETPLACE_SOURCE_STRINGS = [
${toTsArray(items)}
];
`;
  fs.writeFileSync(OUTPUT, body, 'utf8');
};

const main = () => {
  const items = collectStrings();
  writeOutput(items);
  console.log(`[i18n] Wrote ${items.length} strings to ${path.relative(ROOT, OUTPUT)}`);
};

main();
