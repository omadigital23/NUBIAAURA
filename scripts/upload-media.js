/*
  Upload local media (public/images, public/videos) to Supabase Storage bucket `media`.
  Requirements:
  - env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
  - npm: @supabase/supabase-js already installed

  Run:
    npm run upload:media
*/

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_MEDIA_BUCKET || 'media';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing env: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const projectRoot = process.cwd();
const sources = [
  { abs: path.join(projectRoot, 'public', 'images'), relBase: 'images' },
  { abs: path.join(projectRoot, 'public', 'videos'), relBase: 'videos' },
];

const mimeByExt = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.webp': return 'image/webp';
    case '.gif': return 'image/gif';
    case '.svg': return 'image/svg+xml';
    case '.mp4': return 'video/mp4';
    case '.webm': return 'video/webm';
    case '.mov': return 'video/quicktime';
    default: return 'application/octet-stream';
  }
};

async function ensureBucket() {
  const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
  if (listErr) throw listErr;
  const exists = buckets?.some((b) => b.name === BUCKET);
  if (!exists) {
    const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: null,
    });
    if (createErr) throw createErr;
    console.log(`Created bucket: ${BUCKET}`);
  } else {
    console.log(`Bucket exists: ${BUCKET}`);
  }
}

async function* walk(dir) {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  for (const d of entries) {
    const full = path.join(dir, d.name);
    if (d.isDirectory()) {
      yield* walk(full);
    } else if (d.isFile()) {
      yield full;
    }
  }
}

async function uploadDir(absBase, relBase) {
  if (!fs.existsSync(absBase)) {
    console.log(`Skip (not found): ${absBase}`);
    return;
  }
  let count = 0;
  for await (const filePath of walk(absBase)) {
    const relPath = path.relative(absBase, filePath).replace(/\\/g, '/');
    const storagePath = `${relBase}/${relPath}`;
    const contentType = mimeByExt(filePath);
    const fileBuf = await fsp.readFile(filePath);
    const { error } = await supabase.storage.from(BUCKET).upload(storagePath, fileBuf, {
      contentType,
      upsert: true,
    });
    if (error) {
      console.error(`Failed: ${storagePath}`, error.message);
    } else {
      count++;
      if (count % 10 === 0) console.log(`Uploaded ${count} files...`);
    }
  }
  console.log(`Uploaded ${count} files from ${relBase}`);
}

(async () => {
  try {
    console.log('Ensuring bucket...');
    await ensureBucket();
    for (const src of sources) {
      await uploadDir(src.abs, src.relBase);
    }
    console.log('Done.');
  } catch (e) {
    console.error('Upload failed:', e);
    process.exit(1);
  }
})();
