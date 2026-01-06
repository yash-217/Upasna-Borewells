import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      // Use esbuild for minification (built-in, faster than terser)
      minify: 'esbuild',
      sourcemap: isProd ? 'hidden' : true,
      // Drop console.* in production
      target: 'es2022',
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'supabase': ['@supabase/supabase-js'],
            'recharts': ['recharts'],
            'tesseract': ['tesseract.js'],
            'gen-ai': ['@google/generative-ai'],
            'ui-icons': ['lucide-react'],
            'query': ['@tanstack/react-query'],
          }
        }
      }
    },
    esbuild: {
      // Remove console.* and debugger in production
      drop: isProd ? ['console', 'debugger'] : [],
    },
    // Optimize deps for faster cold starts
    optimizeDeps: {
      include: ['react', 'react-dom', '@supabase/supabase-js', '@tanstack/react-query'],
    }
  };
});
