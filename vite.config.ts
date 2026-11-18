import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    watch: {
      // 某些编辑器（以及自动化改文件的工具）会在源码目录里创建临时目录/文件，
      // 它们的句柄常常是短时间锁定的。忽略它们，避免 watcher 因 EBUSY 崩溃。
      ignored: [/\.tmpdir/, /\.tmp$/, '**/.DS_Store'],
    },
  },
})
