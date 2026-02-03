const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'src', 'components');
const OUT_DIR = path.join(__dirname, '..', 'src', 'data', 'design-system');
const OUT_FILE = path.join(OUT_DIR, 'component-registry.generated.json');

const SKIP_DIRS = new Set([
    '__tests__',
    '__mocks__',
    'examples',
    'dev',
    '.DS_Store',
]);

const SKIP_FILES = new Set([
    'index.ts',
    'index.tsx',
]);

const toLabel = (name) => {
    const withSpaces = name
        .replace(/[-_]/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\s+/g, ' ')
        .trim();
    return withSpaces
        .split(' ')
        .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
        .join(' ');
};

const walk = (dir, results = []) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        if (SKIP_DIRS.has(entry.name)) continue;
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walk(fullPath, results);
            continue;
        }
        if (!entry.isFile()) continue;
        if (!entry.name.endsWith('.tsx') && !entry.name.endsWith('.ts')) continue;
        if (entry.name.endsWith('.d.ts')) continue;
        if (SKIP_FILES.has(entry.name)) continue;
        results.push(fullPath);
    }
    return results;
};

const files = walk(ROOT);
const items = files.map((filePath) => {
    const relative = path.relative(path.join(__dirname, '..', 'src'), filePath).replace(/\\/g, '/');
    const parts = relative.split('/');
    const group = parts[1] || 'root';
    const fileName = path.basename(filePath).replace(/\.(tsx|ts)$/, '');
    return {
        id: fileName,
        label: toLabel(fileName),
        group,
        path: relative,
    };
});

items.sort((a, b) => {
    if (a.group !== b.group) return a.group.localeCompare(b.group);
    return a.label.localeCompare(b.label);
});

const groups = items.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
}, {});

const payload = {
    generatedAt: new Date().toISOString(),
    total: items.length,
    groups: Object.fromEntries(
        Object.entries(groups).map(([group, groupItems]) => [
            group,
            {
                count: groupItems.length,
                items: groupItems,
            },
        ])
    ),
};

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2));
console.log(`Design registry generated: ${OUT_FILE}`);
