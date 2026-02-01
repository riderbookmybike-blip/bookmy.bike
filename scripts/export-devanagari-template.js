const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fetchAll(table, select, pageSize = 1000) {
  let from = 0;
  const all = [];
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .range(from, from + pageSize - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    all.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

function normalizeText(value) {
  if (!value) return '';
  return String(value).trim();
}

function getSpecColor(specs) {
  if (!specs || typeof specs !== 'object') return '';
  return (
    specs.Color ||
    specs.color ||
    specs.COLOUR ||
    specs.colour ||
    specs.color_name ||
    specs.ColorName ||
    specs.colorName ||
    specs.color_name_en ||
    ''
  );
}

function uniqueSorted(values) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, 'en', { sensitivity: 'base' })
  );
}

async function exportTemplate() {
  const [brands, items] = await Promise.all([
    fetchAll('cat_brands', 'name'),
    fetchAll('cat_items', 'name,type,specs')
  ]);

  const brandNames = uniqueSorted(brands.map((b) => normalizeText(b.name)));

  const models = [];
  const variants = [];
  const colors = [];

  for (const item of items) {
    const name = normalizeText(item.name);
    const type = normalizeText(item.type).toUpperCase();

    if (type === 'FAMILY') {
      if (name) models.push(name);
    } else if (type === 'VARIANT') {
      if (name) variants.push(name);
    } else if (type === 'SKU') {
      const specColor = normalizeText(getSpecColor(item.specs));
      const fallback = normalizeText(item.name);
      const colorName = specColor || fallback;
      if (colorName) colors.push(colorName);
    }
  }

  const modelNames = uniqueSorted(models);
  const variantNames = uniqueSorted(variants);
  const colorNames = uniqueSorted(colors);

  const rows = [
    ['type', 'english', 'devanagari'],
    ...brandNames.map((name) => ['brand', name, '']),
    ...modelNames.map((name) => ['model', name, '']),
    ...variantNames.map((name) => ['variant', name, '']),
    ...colorNames.map((name) => ['color', name, ''])
  ];

  const outputDir = path.resolve(process.cwd(), 'tmp');
  const outputPath = path.join(outputDir, 'devanagari_overrides_template.csv');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const text = String(cell ?? '');
          if (text.includes('"') || text.includes(',') || text.includes('\n')) {
            return `"${text.replace(/"/g, '""')}"`;
          }
          return text;
        })
        .join(',')
    )
    .join('\n');

  fs.writeFileSync(outputPath, csv, 'utf8');

  console.log('Template exported:', outputPath);
  console.log('Counts:', {
    brands: brandNames.length,
    models: modelNames.length,
    variants: variantNames.length,
    colors: colorNames.length
  });
}

exportTemplate().catch((err) => {
  console.error('Failed to export template:', err);
  process.exit(1);
});
