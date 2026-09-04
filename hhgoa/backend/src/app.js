const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { nanoid } = require('nanoid');
const pool = require('./db');
const { composeFrame } = require('./frameComposer');

const app = express();

app.use(cors());
app.use(express.json());

// Vercel's serverless functions have no writable persistent disk, so we
// only use local-disk storage when actually running locally. On Vercel
// (process.env.VERCEL is set automatically) we upload to Vercel Blob
// instead, which is real persistent storage with a public URL.
const isServerless = !!process.env.VERCEL;

const framesDir = path.join(__dirname, '..', 'public', 'frames');
if (!isServerless) {
  fs.mkdirSync(framesDir, { recursive: true });
  app.use('/frames', express.static(framesDir));
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 }, // 12MB cap
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'hhgoa-backend' });
});

app.get('/api/db-check', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ connected: true, time: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ connected: false, error: err.message });
  }
});

app.post('/api/frame', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No photo uploaded. Send it under the field name "photo".' });
    }

    const caption = (req.body.caption || '').slice(0, 500);
    const outputBuffer = await composeFrame(req.file.buffer);
    const slug = nanoid(8);
    const fileName = `${slug}.png`;

    let imageUrl;

    if (isServerless) {
      const { put } = require('@vercel/blob');
      const blob = await put(`frames/${fileName}`, outputBuffer, {
        access: 'public',
        contentType: 'image/png',
      });
      imageUrl = blob.url; // already a full, permanent public URL
    } else {
      fs.writeFileSync(path.join(framesDir, fileName), outputBuffer);
      imageUrl = `/frames/${fileName}`; // relative — frontend prefixes with API_URL
    }

    await pool.query(
      'INSERT INTO frames (slug, image_path, caption) VALUES ($1, $2, $3)',
      [slug, imageUrl, caption]
    );

    res.json({ slug, imageUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong generating the frame.' });
  }
});

module.exports = app;