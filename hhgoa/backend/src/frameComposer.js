const sharp = require('sharp');
const path = require('path');

const FRAME_PATH = path.join(__dirname, '..', 'assets', 'hhgoa-frame (1).png');
const FRAME_W = 1040;
const FRAME_H = 1017;
// Used only to SIZE and ROUGHLY POSITION the uploaded photo before it gets
// clipped — doesn't need to be pixel-perfect, because the actual clipping
// uses the frame's real transparency below, not this circle.
const HOLE_CX = 520;
const HOLE_CY = 508;
const HOLE_R = 330;

let holeMaskPromise = null;

/**
 * Builds a mask from the frame's OWN alpha channel, inverted, so it's
 * transparent everywhere the frame art is opaque and opaque everywhere the
 * frame is transparent (the hole). Compositing the photo through this with
 * "dest-in" clips it to the hole's true shape exactly — no assumptions
 * about the hole being a perfect circle, so no gaps or peek-through no
 * matter how the hand-illustrated edge actually looks pixel by pixel.
 */
async function getHoleMask() {
  if (!holeMaskPromise) {
    holeMaskPromise = (async () => {
      const { data, info } = await sharp(FRAME_PATH)
        .ensureAlpha()
        .extractChannel(3)
        .raw()
        .toBuffer({ resolveWithObject: true });

      const rgba = Buffer.alloc(info.width * info.height * 4);
      for (let i = 0; i < info.width * info.height; i++) {
        const inverted = 255 - data[i];
        rgba[i * 4] = 255;
        rgba[i * 4 + 1] = 255;
        rgba[i * 4 + 2] = 255;
        rgba[i * 4 + 3] = inverted;
      }

      return sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
        .png()
        .toBuffer();
    })();
  }
  return holeMaskPromise;
}

/**
 * Takes the raw uploaded photo bytes, returns a PNG buffer: the photo
 * clipped to the frame's real hole shape, with the frame artwork on top.
 */
async function composeFrame(inputBuffer) {
  const diameter = HOLE_R * 2;

  const circleMask = Buffer.from(
    `<svg width="${diameter}" height="${diameter}"><circle cx="${diameter / 2}" cy="${diameter / 2}" r="${diameter / 2}" fill="#fff"/></svg>`
  );

  const roughCircularPhoto = await sharp(inputBuffer)
    .resize(diameter, diameter, { fit: 'cover' })
    .composite([{ input: circleMask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  const photoLeft = HOLE_CX - HOLE_R;
  const photoTop = HOLE_CY - HOLE_R;

  const transparentCanvas = () => ({
    create: { width: FRAME_W, height: FRAME_H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  });

  const photoLayer = await sharp(transparentCanvas())
    .composite([{ input: roughCircularPhoto, left: photoLeft, top: photoTop }])
    .png()
    .toBuffer();

  const holeMask = await getHoleMask();

  const clippedPhoto = await sharp(photoLayer)
    .composite([{ input: holeMask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  const result = await sharp(transparentCanvas())
    .composite([
      { input: clippedPhoto, left: 0, top: 0 },
      { input: FRAME_PATH, left: 0, top: 0 },
    ])
    .png()
    .toBuffer();

  return result;
}

module.exports = { composeFrame };