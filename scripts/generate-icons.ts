// Script to generate PWA icons from source image
// Run with: npx tsx scripts/generate-icons.ts

import * as fs from 'fs';
import * as path from 'path';

const sizes = [72, 96, 128, 144, 152, 180, 192, 384, 512];
const iconDir = path.join(process.cwd(), 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

// Check if sharp is available, if not create placeholder PNGs
async function generateIcons() {
  try {
    // Try to use sharp for high-quality icon generation
    const sharp = await import('sharp');
    
    // Use JPG as source (fallback to SVG if JPG not found)
    const jpgPath = path.join(iconDir, 'icon.jpg');
    const svgPath = path.join(iconDir, 'icon.svg');
    const sourcePath = fs.existsSync(jpgPath) ? jpgPath : svgPath;
    const sourceBuffer = fs.readFileSync(sourcePath);
    
    console.log(`Using source: ${path.basename(sourcePath)}`);

    for (const size of sizes) {
      const outputPath = path.join(iconDir, `icon-${size}x${size}.png`);
      await sharp.default(sourceBuffer)
        .resize(size, size, {
          fit: 'cover',
          position: 'center'
        })
        .png()
        .toFile(outputPath);
      console.log(`Generated: icon-${size}x${size}.png`);
    }

    // Generate apple touch icon (180x180)
    const appleTouchPath = path.join(iconDir, 'apple-touch-icon.png');
    await sharp.default(sourceBuffer)
      .resize(180, 180, {
        fit: 'cover',
        position: 'center'
      })
      .png()
      .toFile(appleTouchPath);
    console.log('Generated: apple-touch-icon.png');

    // Generate favicon
    await sharp.default(sourceBuffer)
      .resize(32, 32, {
        fit: 'cover',
        position: 'center'
      })
      .png()
      .toFile(path.join(iconDir, 'favicon-32x32.png'));
    console.log('Generated: favicon-32x32.png');

    console.log('\n✅ All icons generated successfully!');
  } catch (error) {
    console.log('Sharp not available, creating placeholder icons...');
    console.log('Install sharp with: npm install sharp');
    console.log('\nFor now, please manually create PNG icons from the SVG at:');
    console.log(path.join(iconDir, 'icon.svg'));
    console.log('\nRequired sizes:', sizes.join(', '));
    
    // Create a simple placeholder notice
    const readmePath = path.join(iconDir, 'README.md');
    fs.writeFileSync(readmePath, `# PWA Icons

Please generate PNG icons from \`icon.svg\` in the following sizes:
${sizes.map(s => `- icon-${s}x${s}.png`).join('\n')}
- apple-touch-icon.png (180x180)
- favicon-32x32.png (32x32)

You can use online tools like:
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator

Or install sharp locally:
\`\`\`
npm install sharp
npx tsx scripts/generate-icons.ts
\`\`\`
`);
    console.log('\nCreated README.md with instructions');
  }
}

generateIcons();
