#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const tmpDir = path.join(root, 'build_tmp');
const distDir = path.join(root, 'dist');

function rmrf(p) {
  if (fs.existsSync(p)) {
    fs.rmSync(p, { recursive: true, force: true });
  }
}

function copyRecursive(src, dest, exclude = []) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (exclude.includes(path.basename(src))) return;
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry), exclude);
    }
  } else if (stat.isFile()) {
    if (exclude.includes(path.basename(src))) return;
    fs.copyFileSync(src, dest);
  }
}

try {
  // load config
  const config = require(path.join(root, 'config.js'));

  // read template manifest
  const tmpl = fs.readFileSync(path.join(root, 'manifest.template.json'), 'utf8');
  const finalManifest = tmpl.replace('__CLIENT_ID__', config.client_id);

  // prepare directories
  rmrf(tmpDir);
  fs.mkdirSync(tmpDir, { recursive: true });
  rmrf(distDir);
  fs.mkdirSync(distDir, { recursive: true });

  // copy project files into tmpDir excluding node_modules, .git, dist, scripts
  const exclude = ['node_modules', '.git', 'dist', 'scripts', '.DS_Store', 'build_tmp'];
  for (const entry of fs.readdirSync(root)) {
    if (exclude.includes(entry)) continue;
    const srcPath = path.join(root, entry);
    const destPath = path.join(tmpDir, entry);
    copyRecursive(srcPath, destPath, exclude);
  }

  // write generated manifest
  fs.writeFileSync(path.join(tmpDir, 'manifest.json'), finalManifest, 'utf8');

  // create zip
  const zipPath = path.join(distDir, 'extension.zip');
  // use zip command available on macOS
  execSync(`cd "${tmpDir}" && zip -r "${zipPath}" .`, { stdio: 'inherit' });

  // cleanup
  rmrf(tmpDir);

  console.log('\nBuild succeeded. Created', zipPath);
} catch (err) {
  console.error('Build failed:', err);
  process.exit(1);
}
