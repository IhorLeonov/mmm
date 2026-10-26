import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Run the same server handler in local development and on Vercel.
function localResultsApi() {
  return {
    name: 'local-results-api',
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), '')
      for (const key of ['RESEND_API_KEY', 'RESULTS_EMAIL', 'EMAIL_FROM', 'APP_ORIGIN']) {
        if (env[key] !== undefined) process.env[key] = env[key]
      }
      server.middlewares.use('/api/results', async (req, res) => {
        const { default: handler } = await import('./api/results.js')
        await handler(req, res)
      })
    },
  }
}

export default defineConfig({ plugins: [react(), localResultsApi()] })
