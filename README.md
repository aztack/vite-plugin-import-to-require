# vite-plugin-import-to-require

This Vite plugin transforms all import statements of Node.js built-in modules to global.require.
This feature may be necessary for Vite+nw.js projects.

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
