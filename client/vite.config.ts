import path from "path";
import { defineConfig } from "vite";
import topLevelAwait from "vite-plugin-top-level-await";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";

// https://vite.dev/config/
export default defineConfig({
    plugins: [wasm(), topLevelAwait(), react()],
    optimizeDeps: {
        exclude: ["onnxruntime-node", "@anush008/tokenizers"],
    },
    build: {
        commonjsOptions: {
            exclude: ["onnxruntime-node", "@anush008/tokenizers"],
        },
        rollupOptions: {
            external: ["onnxruntime-node", "@anush008/tokenizers"],
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        proxy: {
            "/api": {
                target: "http://localhost:8080",
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, ""),
            },
            "/agents": {
                target: "http://localhost:8080",
                changeOrigin: true,
                ws: true,
            },
            "/events": {
                target: "http://localhost:3001",
                changeOrigin: true,
            },
            "/invitations": {
                target: "http://localhost:3001",
                changeOrigin: true,
            },
            "/auth": {
                target: "http://localhost:3001",
                changeOrigin: true,
            },
        },
    },
});
