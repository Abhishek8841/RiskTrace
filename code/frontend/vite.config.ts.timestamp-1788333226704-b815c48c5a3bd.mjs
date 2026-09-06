// vite.config.ts
import { defineConfig } from "file:///C:/Users/LENOVO/OneDrive/Desktop/RiskTrace/code/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/LENOVO/OneDrive/Desktop/RiskTrace/code/frontend/node_modules/@vitejs/plugin-react/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: process.env.VITE_API_URL || "http://localhost:3001",
        changeOrigin: true
      },
      "/health": {
        target: process.env.VITE_API_URL || "http://localhost:3001",
        changeOrigin: true
      }
    }
  }
});
export {
  vite_config_default as default
};
