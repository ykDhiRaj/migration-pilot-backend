#!/usr/bin/env node
/**
 * First-time project setup helper.
 * Copies .env.example → .env if it doesn't exist yet.
 *
 * Run: node scripts/setup.js
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const example = path.join(root, '.env.example');
const target = path.join(root, '.env');

if (fs.existsSync(target)) {
  console.log('✓ .env already exists — skipping copy.');
} else {
  fs.copyFileSync(example, target);
  console.log('✓ .env created from .env.example');
  console.log('  → Fill in your DATABASE_URL and JWT_SECRET before starting.');
}

console.log('\nNext steps:');
console.log('  1. Edit .env with your values');
console.log('  2. npm run docker:up   (start Postgres)');
console.log('  3. npm run migrate:up  (apply migrations)');
console.log('  4. npm run seed        (optional: load sample data)');
console.log('  5. npm run dev         (start dev server)\n');
