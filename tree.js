#!/usr/bin/env node
// node tree.js [path=. ] [--depth=3]
// Prints a directory tree, skipping common noise.

const fs = require("fs");
const fsp = fs.promises;
const path = require("path");

const args = process.argv.slice(2);
let root = ".";
let maxDepth = Infinity;
for (const a of args) {
  if (a.startsWith("--depth=")) maxDepth = Number(a.split("=")[1]) || Infinity;
  else root = a;
}

const SKIP = new Set(["node_modules", ".git", ".idea", ".vscode", ".DS_Store", "Thumbs.db"]);

async function list(dir, depth = 0, prefix = "") {
  if (depth > maxDepth) return;
  let entries = await fsp.readdir(dir, { withFileTypes: true });
  entries = entries.filter(e => !SKIP.has(e.name)).sort((a, b) => {
    // folders first, then files (alpha)
    if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  const lastIdx = entries.length - 1;
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const isLast = i === lastIdx;
    const branch = isLast ? "└── " : "├── ";
    const nextPrefix = prefix + (isLast ? "    " : "│   ");
    const full = path.join(dir, e.name);

    console.log(prefix + branch + e.name + (e.isDirectory() ? "/" : ""));
    if (e.isDirectory()) {
      await list(full, depth + 1, nextPrefix);
    }
  }
}

(async () => {
  const abs = path.resolve(root);
  console.log(abs);
  await list(abs, 0, "");
})().catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});
