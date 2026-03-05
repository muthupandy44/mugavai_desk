import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Optimize for slow connections
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks for better caching
          vendor: ['react', 'react-dom'],
          radix: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          utils: ['clsx', 'tailwind-merge', 'class-variance-authority'],
          charts: ['recharts'],
          icons: ['lucide-react'],
        },
      },
    },
    // Enable source maps for debugging in production
    sourcemap: true,
    // Optimize chunk size for mobile networks
    chunkSizeWarningLimit: 1000,
    // Minify for faster loading
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console logs for debugging
        drop_debugger: true,
      },
    },
  },
  // Optimize dependencies for better bundling
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react'],
  },
}));
