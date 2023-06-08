# vite-plugin-import-to-require

This Vite plugin transforms all import statements of node builtin modules to `global.require`.
This feature may need for vite+nw.js projects.

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { importToRequirePlugin } from 'vite-plugin-import-to-require';

export default defineConfig({
  build: {
    target: 'esnext',
    outDir: 'dist',
  },
  plugins: [react(), importToRequirePlugin()],
})
```