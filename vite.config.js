import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const isCapacitorBuild = process.env.CAPACITOR_BUILD === 'true'

export default defineConfig({
  base: isCapacitorBuild ? '/' : '/WeMONEY/',
  plugins: [react(), tailwindcss()],
})
