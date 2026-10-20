import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
import fs from 'fs'
import path from 'path'

// ビルド完了時に、プロジェクト直下へ「全銀データ作成ツール.html」を自動コピーするプラグイン
function copySingleFileToRoot(): Plugin {
  return {
    name: 'copy-single-file-to-root',
    closeBundle() {
      const src = path.resolve(__dirname, 'dist/index.html');
      const dest = path.resolve(__dirname, '全銀データ作成ツール.html');
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`\n🎉 プロジェクト直下に「全銀データ作成ツール.html」を出力しました！\n`);
      }
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile(), copySingleFileToRoot()],
  build: {
    emptyOutDir: false
  },
  server: {
    port: 5173,
    open: false
  }
})
