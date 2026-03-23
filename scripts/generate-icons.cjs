// Generate valid PNG icons for PWA
// Uses Node.js built-in modules only

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Generate minimal valid PNGs using only Node.js built-in modules
function generateMinimalPNG(width, height, r, g, b) {
  // PNG file structure:
  // Signature + IHDR + IDAT + IEND
  
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);   // width
  ihdrData.writeUInt32BE(height, 4);  // height
  ihdrData.writeUInt8(8, 8);          // bit depth
  ihdrData.writeUInt8(2, 9);          // color type (RGB)
  ihdrData.writeUInt8(0, 10);         // compression
  ihdrData.writeUInt8(0, 11);         // filter
  ihdrData.writeUInt8(0, 12);         // interlace
  
  const ihdrChunk = createChunk('IHDR', ihdrData);
  
  // IDAT chunk - raw image data
  // Each row: filter byte (0) + RGB pixels
  const rawRowSize = 1 + width * 3;
  const rawData = Buffer.alloc(rawRowSize * height);
  
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rawRowSize;
    rawData[rowOffset] = 0; // no filter
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 3;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
    }
  }
  
  // Compress with zlib
  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);
  
  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  
  const typeBuffer = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuffer, data]);
  
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData), 0);
  
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  const table = new Uint32Array(256);
  
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      if (c & 1) {
        c = 0xEDB88320 ^ (c >>> 1);
      } else {
        c = c >>> 1;
      }
    }
    table[i] = c;
  }
  
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// Generate icons with blue background (#3b82f6)
const publicDir = path.join(__dirname, '..', 'public');

// Blue color: #3b82f6
const icon192 = generateMinimalPNG(192, 192, 59, 130, 246);
const icon512 = generateMinimalPNG(512, 512, 59, 130, 246);
const appleTouchIcon = generateMinimalPNG(180, 180, 59, 130, 246);

fs.writeFileSync(path.join(publicDir, 'pwa-icon-192.png'), icon192);
fs.writeFileSync(path.join(publicDir, 'pwa-icon-512.png'), icon512);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouchIcon);

console.log('Icons generated:');
console.log(`  pwa-icon-192.png: ${icon192.length} bytes`);
console.log(`  pwa-icon-512.png: ${icon512.length} bytes`);
console.log(`  apple-touch-icon.png: ${appleTouchIcon.length} bytes`);
