const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, 'messages');
const enPath = path.join(messagesDir, 'en.json');

if (!fs.existsSync(enPath)) {
    console.error(`Error: ${enPath} not found.`);
    process.exit(1);
}

function readJsonFile(p) {
    try {
        const raw = fs.readFileSync(p, 'utf8');
        const clean = raw.replace(/^\uFEFF/, '');
        return JSON.parse(clean);
    } catch (e) {
        throw e;
    }
}

let enContent;
try {
    enContent = readJsonFile(enPath);
} catch (e) {
    console.error(`Error parsing ${enPath}:`, e.message);
    process.exit(1);
}

function traverse(enObj, targetObj, pathStr, issues) {
    for (const key in enObj) {
        const currentPath = pathStr ? `${pathStr}.${key}` : key;
        
        if (!targetObj || !Object.prototype.hasOwnProperty.call(targetObj, key)) {
            issues.missing.push(currentPath);
            continue;
        }

        const enValue = enObj[key];
        const targetValue = targetObj[key];

        if (typeof enValue === 'object' && enValue !== null) {
            if (typeof targetValue !== 'object' || targetValue !== null && Array.isArray(targetValue) !== Array.isArray(enValue)) {
                 if (Array.isArray(enValue) && !Array.isArray(targetValue)) {
                    issues.typeMismatch.push(`${currentPath} (Expected Array, got ${typeof targetValue})`);
                 } else if (!Array.isArray(enValue) && typeof targetValue !== 'object') {
                    issues.typeMismatch.push(`${currentPath} (Expected Object, got ${typeof targetValue})`);
                 } else {
                    traverse(enValue, targetValue, currentPath, issues);
                 }
            } else {
                traverse(enValue, targetValue, currentPath, issues);
            }
        } else {
            if (typeof targetValue === 'object' && targetValue !== null) {
                issues.typeMismatch.push(`${currentPath} (Expected string/value, got object)`);
            } else if (String(enValue).trim() === String(targetValue).trim()) {
                issues.identical.push(currentPath);
            }
        }
    }
}

function fillMissing(enObj, targetObj) {
    if (!targetObj || typeof targetObj !== 'object') return Array.isArray(enObj) ? [...enObj] : { ...enObj };
    const out = Array.isArray(enObj) ? (Array.isArray(targetObj) ? [...targetObj] : [...enObj]) : { ...targetObj };
    for (const key in enObj) {
        const enVal = enObj[key];
        const hasKey = Object.prototype.hasOwnProperty.call(out, key);
        if (!hasKey) {
            out[key] = enVal;
        } else {
            const tVal = out[key];
            if (enVal && typeof enVal === 'object') {
                if (tVal && typeof tVal === 'object' && Array.isArray(tVal) === Array.isArray(enVal)) {
                    out[key] = fillMissing(enVal, tVal);
                }
            }
        }
    }
    return out;
}

if (!fs.existsSync(messagesDir)) {
    console.error(`Error: Directory ${messagesDir} not found.`);
    process.exit(1);
}

// Clear report file
fs.writeFileSync('translation_report.txt', 'Translation Check Report\n========================\n');

fs.readdirSync(messagesDir).forEach(file => {
    if (file === 'en.json' || !file.endsWith('.json')) return;

    const filePath = path.join(messagesDir, file);
    console.log(`\nChecking ${file}...`);
    
    try {
        const targetContent = readJsonFile(filePath);
        const issues = {
            missing: [],
            typeMismatch: [],
            identical: []
        };

        let enKeyCount = 0;
        let targetKeyCount = 0;

        function countKeys(obj) {
            let count = 0;
            for (const k in obj) {
                if (typeof obj[k] === 'object' && obj[k] !== null) {
                    count += countKeys(obj[k]);
                } else {
                    count++;
                }
            }
            return count;
        }

        enKeyCount = countKeys(enContent);
        targetKeyCount = countKeys(targetContent);

        console.log(`  Key Count: English (${enKeyCount}) vs ${file} (${targetKeyCount})`);

        traverse(enContent, targetContent, '', issues);

        const writeMode = process.argv.includes('--write');
        if (issues.missing.length > 0) {
            const msg = `  [MISSING KEYS] (${issues.missing.length}):\n    - ${issues.missing.join('\n    - ')}`;
            console.error(msg);
            fs.appendFileSync('translation_report.txt', `\n[${file}] MISSING KEYS (${issues.missing.length}):\n` + issues.missing.join('\n') + '\n');
            
            if (writeMode) {
                const merged = fillMissing(enContent, targetContent);
                fs.writeFileSync(filePath, JSON.stringify(merged, null, 2) + '\n', 'utf8');
                console.log('  Filled missing keys with English placeholders.');
            }
        }
        if (issues.typeMismatch.length > 0) {
            const msg = `  [TYPE MISMATCHES] (${issues.typeMismatch.length}):\n    - ${issues.typeMismatch.join('\n    - ')}`;
            console.error(msg);
            fs.appendFileSync('translation_report.txt', `\n[${file}] TYPE MISMATCHES (${issues.typeMismatch.length}):\n` + issues.typeMismatch.join('\n') + '\n');
        }
        if (issues.identical.length > 0) {
            console.warn(`  [IDENTICAL TO ENGLISH] (${issues.identical.length}) - might be untranslated`);
            fs.appendFileSync('translation_report.txt', `\n[${file}] IDENTICAL TO ENGLISH (${issues.identical.length}):\n` + issues.identical.join('\n') + '\n');
            
            // console.log first 10
            issues.identical.slice(0, 10).forEach(k => console.log(`    - ${k}`));
            if (issues.identical.length > 10) console.log(`    ... and ${issues.identical.length - 10} more.`);
        }
        if (issues.missing.length === 0 && issues.typeMismatch.length === 0) console.log('  Structure looks good.');

    } catch (e) {
        console.error(`  Error parsing ${file}:`, e.message);
    }
});
