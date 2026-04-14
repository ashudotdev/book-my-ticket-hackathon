import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      '/seats': 'http://localhost:8080',
      '/book': 'http://localhost:8080',
      '/auth': 'http://localhost:8080',
      '/socket.io': {
        target: 'http://localhost:8080',
        ws: true,
      },
    }
  }
});
