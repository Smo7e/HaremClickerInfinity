import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "fix-asset-paths",
      enforce: "post",
      transform(code, id) {
        if (id.includes("node_modules")) return;

        return code
          .replace(/(['"`])\/waifus\//g, `$1assets/images/waifus/`)
          .replace(/(['"`])\/backgrounds\//g, `$1assets/images/backgrounds/`)
          .replace(/(['"`])\/enemies\//g, `$1assets/images/enemies/`)
          .replace(/(['"`])\/assets\//g, `$1assets/`);
      },
    },
  ],
  base: "/HaremClickerInfinity/",
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
  },
});
