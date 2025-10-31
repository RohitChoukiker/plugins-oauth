# plugins-oauth

This repository contains a Chrome extension (manifest.json, background.js, popup.html, popup.js).

What I added:

- `package.json` — provides an `npm run build` script that packages the extension into `dist/extension.zip`.

How to build locally:

```bash
npm run build
```

This will create `dist/extension.zip` containing the repository files (excluding `node_modules`, `.git`, and `dist`).

Next steps (optional):
- Use a proper bundler (esbuild/webpack/rollup) if you need transpilation or dependency bundling.
- Add a CI job to run the build and upload the artifact.
