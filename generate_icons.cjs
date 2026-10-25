const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generate() {
  const iconSvg = fs.readFileSync(path.join(__dirname, 'public/icon.svg'));
  const maskableSvg = fs.readFileSync(path.join(__dirname, 'public/icon-maskable.svg'));

  await sharp(iconSvg)
    .resize(192, 192)
    .png()
    .toFile(path.join(__dirname, 'public/pwa-192x192.png'));
  console.log('Generated pwa-192x192.png');

  await sharp(iconSvg)
    .resize(512, 512)
    .png()
    .toFile(path.join(__dirname, 'public/pwa-512x512.png'));
  console.log('Generated pwa-512x512.png');

  await sharp(maskableSvg)
    .resize(512, 512)
    .png()
    .toFile(path.join(__dirname, 'public/pwa-maskable-512x512.png'));
  console.log('Generated pwa-maskable-512x512.png');

  await sharp(iconSvg)
    .resize(180, 180)
    .png()
    .toFile(path.join(__dirname, 'public/apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');

  await sharp(iconSvg)
    .resize(64, 64)
    .png()
    .toFile(path.join(__dirname, 'public/favicon.png'));
  console.log('Generated favicon.png');
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
