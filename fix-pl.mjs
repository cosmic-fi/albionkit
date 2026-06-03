import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.resolve(__dirname, 'messages/pl.json');

// Read the file content
let content = fs.readFileSync(filePath, 'utf8');

// The corruption starts after gold closes (with \n only) through the broken section.
// Old pattern: from ",\n      \"flip\":" through the broken markAllRead to just before the valid one
const oldText = ',\n      "flip": {\n        "subject": "Top Flip Opportunities 📊",\n        "body": "Here are today\'s best flip opportunities:",\n        "button": "Open Market Flipper",\n        "footer": "Profit calculations exclude transport costs and taxes.",\n        "noResults": "No flip opportunities found right now. Check back later!",\n        "baseTitle": "AlbionKit Flip Digest",\n        "preview": "Top {itemName} and more flip opportunities — see what\'s profitable today!"\n      }\n    },\n    "markAllRead":\n      }\r\n    },\r\n    "markAllRead": "Oznacz wszystkie jako przeczytane"';

const newText = '\r\n    },\r\n    "markAllRead": "Oznacz wszystkie jako przeczytane"';

const index = content.indexOf(oldText);
if (index === -1) {
  console.error('ERROR: Could not find the corrupted pattern in the file.');
  // Try partial search
  const flipIdx = content.indexOf('"flip": {');
  console.log('First "flip": { at byte offset:', flipIdx);
  if (flipIdx > 0) {
    console.log('Context around "flip":');
    console.log(JSON.stringify(content.substring(flipIdx - 30, flipIdx + 150)));
  }
  process.exit(1);
}

console.log('Found corruption at byte offset:', index, 'length:', oldText.length);

// Replace
let fixedContent = content.replace(oldText, newText);

// Normalize any remaining \n (not preceded by \r) to \r\n
fixedContent = fixedContent.replace(/(?<!\r)\n/g, '\r\n');

// Write back
fs.writeFileSync(filePath, fixedContent, 'utf8');
console.log('File written successfully.');

// Validate JSON
try {
  const parsed = JSON.parse(fixedContent);
  console.log('✅ JSON is valid!');
  console.log('Top-level keys:', Object.keys(parsed).join(', '));
} catch (e) {
  console.error('❌ JSON validation failed:', e.message);
  const errMatch = e.message.match(/position\s+(\d+)/);
  if (errMatch) {
    const pos = parseInt(errMatch[1]);
    console.log('Error context:', JSON.stringify(fixedContent.substring(Math.max(0, pos - 60), Math.min(fixedContent.length, pos + 60))));
  }
  process.exit(1);
}

console.log('✅ Done!');
