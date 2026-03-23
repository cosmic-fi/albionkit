#!/usr/bin/env node

/**
 * Cache Cleanup Script
 * Clears Next.js, localStorage, and Firebase caches
 * Run: node scripts/clear-caches.js
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Starting cache cleanup...\n');

// 1. Clear Next.js cache
const nextCacheDirs = [
  '.next',
  'node_modules/.cache',
  '.turbo'
];

console.log('1. Clearing Next.js build caches...');
nextCacheDirs.forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  if (fs.existsSync(dirPath)) {
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`   ✅ Removed ${dir}`);
    } catch (error) {
      console.log(`   ⚠️  Could not remove ${dir}: ${error.message}`);
    }
  } else {
    console.log(`   ⏭️  ${dir} not found`);
  }
});

// 2. Clear item cache files
const itemCachePath = path.join(__dirname, '..', '.item-cache.json');
if (fs.existsSync(itemCachePath)) {
  try {
    fs.unlinkSync(itemCachePath);
    console.log('   ✅ Removed .item-cache.json');
  } catch (error) {
    console.log(`   ⚠️  Could not remove .item-cache.json: ${error.message}`);
  }
} else {
  console.log('   ⏭️  .item-cache.json not found');
}

console.log('\n2. Browser caches (manual step):');
console.log('   To clear browser caches:');
console.log('   - DevTools → Application → Storage → Clear site data');
console.log('   - Or run in console: localStorage.clear()');

console.log('\n3. Firebase cache (if using Admin SDK):');
console.log('   - Run: firebase firestore:delete --all-collections --yes');
console.log('   ⚠️  WARNING: This deletes ALL Firestore data!');

console.log('\n✅ Cache cleanup complete!');
console.log('\n📝 Next steps:');
console.log('   1. Run: npm run build (to rebuild Next.js)');
console.log('   2. Run: npm start (to start production server)');
console.log('   3. Clear browser cache (Ctrl+Shift+Delete)');
