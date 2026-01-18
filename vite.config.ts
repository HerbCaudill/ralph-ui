import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { VitePWA } from "vite-plugin-pwa"
import path from "path"

export default defineConfig({
  server: {
    port: 5179,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/ws": {
        target: "ws://localhost:3000",
        ws: true,
        configure: proxy => {
          // Suppress EPIPE errors that occur when WebSocket clients disconnect
          proxy.on("error", (err: NodeJS.ErrnoException) => {
            if (err.code !== "EPIPE") {
              console.error("[ws proxy]", err.message)
            }
          })
          proxy.on("proxyReqWs", (_proxyReq, _req, socket) => {
            socket.on("error", (err: NodeJS.ErrnoException) => {
              if (err.code !== "EPIPE") {
                console.error("[ws proxy socket]", err.message)
              }
            })
          })
        },
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Ralph Ui",
        short_name: "ralph-ui",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#000000",
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
