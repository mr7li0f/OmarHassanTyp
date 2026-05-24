#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const inFile = path.join(process.cwd(), 'public', 'style.css');
const outFile = path.join(process.cwd(), 'public', 'style.min.css');

if (!fs.existsSync(inFile)) {
  console.error('Missing input:', inFile);
  process.exit(1);
}

let css = fs.readFileSync(inFile, 'utf8');
// remove /* comments */
css = css.replace(/\/\*[\s\S]*?\*\//g, '');
// collapse whitespace
css = css.replace(/\s+/g, ' ');
// tighten common patterns
css = css.replace(/\s*{\s*/g, '{').replace(/\s*}\s*/g, '}').replace(/;\s*/g, ';').replace(/:\s*/g, ':').trim();
fs.writeFileSync(outFile, css + '\n', 'utf8');
console.log('Wrote', outFile);
