import sharp from 'sharp';

const input = 'assets/src/reflow-workbench.png';
await Promise.all([
  sharp(input).resize({ width: 768 }).webp({ quality: 76 }).toFile('site/public/assets/reflow-workbench-768.webp'),
  sharp(input).resize({ width: 1280 }).webp({ quality: 78 }).toFile('site/public/assets/reflow-workbench-1280.webp'),
  sharp(input).resize({ width: 768 }).avif({ quality: 50, effort: 4 }).toFile('site/public/assets/reflow-workbench-768.avif'),
  sharp(input).resize({ width: 1280 }).avif({ quality: 54, effort: 4 }).toFile('site/public/assets/reflow-workbench-1280.avif'),
  sharp(input).resize({ width: 1280 }).jpeg({ quality: 82, mozjpeg: true }).toFile('site/public/assets/reflow-workbench-1280.jpg')
]);
