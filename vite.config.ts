import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // CORS 許可オリジン（APP_ORIGINS）と一致させるためポートを固定する。
    // 5173 が使用中の場合は別ポートへ自動移動せず起動エラーにする
    port: 5173,
    strictPort: true,
  },
});
