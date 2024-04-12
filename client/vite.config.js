import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dotenv from 'dotenv';

dotenv.config();

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Expose environment variables to the client-side code
    'process.env': process.env,
  },
  // server: {
  //   port: 5173,
  //   strictPort: true,
  //   host: true,
  //   origin: 'https://0.0.0.0:5173'
  // }
});
