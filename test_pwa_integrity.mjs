import fs from 'fs';
import path from 'path';

async function verifyPWA() {
  console.log('==================================================');
  console.log('📱 RUNNING PROGRESSIVE WEB APP (PWA) INTEGRITY TESTS');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      process.stdout.write(`⏳ Testing: ${name}... `);
      fn();
      console.log('✅ PASSED');
      passed++;
    } catch (err) {
      console.log(`❌ FAILED: ${err.message}`);
      failed++;
    }
  }

  const frontendDir = path.resolve('frontend');
  const distDir = path.resolve('frontend/dist');

  // 1. Web App Manifest
  test('Web App Manifest is valid and properly structured', () => {
    const manifestPath = path.join(frontendDir, 'public/manifest.json');
    if (!fs.existsSync(manifestPath)) throw new Error('manifest.json missing in public/');

    const content = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (!content.name || !content.short_name) throw new Error('Manifest missing name or short_name');
    if (content.display !== 'standalone') throw new Error('Manifest display should be standalone');
    if (!Array.isArray(content.icons) || content.icons.length < 2) throw new Error('Manifest icons missing or incomplete');
    if (!content.shortcuts || content.shortcuts.length === 0) throw new Error('Manifest missing shortcuts');
  });

  // 2. Application Icons
  test('PWA Application Icons exist in 192x192 and 512x512 formats', () => {
    const icon192 = path.join(frontendDir, 'public/icons/icon-192x192.svg');
    const icon512 = path.join(frontendDir, 'public/icons/icon-512x512.svg');

    if (!fs.existsSync(icon192) || fs.statSync(icon192).size === 0) throw new Error('192x192 icon missing or empty');
    if (!fs.existsSync(icon512) || fs.statSync(icon512).size === 0) throw new Error('512x512 icon missing or empty');
  });

  // 3. Service Worker & Security Guardrails
  test('Service Worker implements cache strategy and API security bypass', () => {
    const swPath = path.join(frontendDir, 'public/sw.js');
    if (!fs.existsSync(swPath)) throw new Error('sw.js missing in public/');

    const content = fs.readFileSync(swPath, 'utf8');
    if (!content.includes('/api/')) throw new Error('Service worker missing /api/ bypass');
    if (!content.includes('/socket.io/')) throw new Error('Service worker missing socket.io bypass');
    if (!content.includes('offline.html')) throw new Error('Service worker missing offline fallback');
    if (!content.includes('caches.delete')) throw new Error('Service worker missing cache cleanup on activate');
  });

  // 4. Offline Fallback Page
  test('Offline fallback page exists and is properly styled', () => {
    const offlinePath = path.join(frontendDir, 'public/offline.html');
    if (!fs.existsSync(offlinePath)) throw new Error('offline.html missing in public/');

    const content = fs.readFileSync(offlinePath, 'utf8');
    if (!content.includes('Offline Mode') || !content.includes('#09090B')) {
      throw new Error('offline.html missing dark theme styling or offline indicator');
    }
  });

  // 5. Index.html PWA tags
  test('index.html includes manifest link, theme-color, and apple touch icon', () => {
    const indexPath = path.join(frontendDir, 'index.html');
    const content = fs.readFileSync(indexPath, 'utf8');

    if (!content.includes('rel="manifest"')) throw new Error('index.html missing manifest link');
    if (!content.includes('name="theme-color"')) throw new Error('index.html missing theme-color');
    if (!content.includes('rel="apple-touch-icon"')) throw new Error('index.html missing apple-touch-icon');
  });

  // 6. Production Bundle Output
  test('Production build output contains all PWA assets in dist/', () => {
    const required = [
      'manifest.json',
      'sw.js',
      'offline.html',
      'icons/icon-192x192.svg',
      'icons/icon-512x512.svg',
      'index.html'
    ];

    for (const file of required) {
      const p = path.join(distDir, file);
      if (!fs.existsSync(p)) throw new Error(`Missing ${file} in dist output`);
    }
  });

  console.log('\n==================================================');
  console.log(`🎉 PWA INTEGRITY TESTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

verifyPWA();
