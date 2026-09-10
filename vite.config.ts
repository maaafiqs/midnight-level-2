import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

/**
 * Custom Vite plugin to serve the `managed/` folder as static assets
 * under the /managed/ URL path. This allows the browser to fetch:
 *   - /managed/keys/guess_number.prover   (ZK prover key)
 *   - /managed/keys/guess_number.verifier (ZK verifier key)
 *   - /managed/zkir/guess_number.zkir     (ZKIR circuit representation)
 *   - /managed/contract/index.js          (Compact compiled contract binding)
 */
function serveManaged() {
  const managedDir = path.resolve(__dirname, 'managed');
  return {
    name: 'serve-managed',
    configureServer(server: any) {
      server.middlewares.use('/managed', (req: any, res: any, next: any) => {
        const filePath = path.join(managedDir, req.url ?? '');
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          // Serve JS files as ES module
          if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
          } else if (filePath.endsWith('.mjs')) {
            res.setHeader('Content-Type', 'application/javascript');
          } else {
            res.setHeader('Content-Type', 'application/octet-stream');
          }
          res.end(fs.readFileSync(filePath));
        } else {
          next();
        }
      });
    },
  };
}

/**
 * Copy managed/ directory to dist/managed/ after production build
 * so that /managed/contract/index.js, prover/verifier keys, and ZKIR
 * are accessible at runtime in the deployed bundle.
 */
function copyManagedToDist() {
  return {
    name: 'copy-managed-to-dist',
    closeBundle() {
      const src = path.resolve(__dirname, 'managed');
      const dest = path.resolve(__dirname, 'dist', 'managed');
      const copyDir = (from: string, to: string) => {
        if (!fs.existsSync(to)) fs.mkdirSync(to, { recursive: true });
        for (const entry of fs.readdirSync(from)) {
          const srcEntry = path.join(from, entry);
          const destEntry = path.join(to, entry);
          if (fs.statSync(srcEntry).isDirectory()) {
            copyDir(srcEntry, destEntry);
          } else {
            fs.copyFileSync(srcEntry, destEntry);
          }
        }
      };
      copyDir(src, dest);
      console.log('[copy-managed-to-dist] Copied managed/ → dist/managed/');
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), serveManaged(), copyManagedToDist()],
  server: {
    port: 3000,
    host: true,
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      // Externalize @midnight-ntwrk/compact-runtime — it is not a public npm package.
      // It is only available at runtime as part of managed/contract/index.js served
      // as a static asset from /managed/contract/index.js.
      external: ['@midnight-ntwrk/compact-runtime'],
    },
  },
  // Resolve @midnight-ntwrk packages as ESM
  optimizeDeps: {
    include: ['@midnight-ntwrk/dapp-connector-api'],
  },
});
