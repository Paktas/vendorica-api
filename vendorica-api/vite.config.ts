import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    server: {
      // Use PORT from env, otherwise let Vite choose default
      ...(env.PORT && { port: parseInt(env.PORT) }),
      host: true
    },
    resolve: {
      alias: {
        '@': '/src',
        '@controllers': '/src/controllers',
        '@services': '/src/services',
        '@routes': '/src/routes',
        '@middleware': '/src/middleware',
        '@config': '/src/config'
      }
    },
    build: {
      target: 'node18',
      ssr: true,
      rollupOptions: {
        input: './src/index.ts',
        output: {
          format: 'es'
        },
        external: [
          /^node:/,
          '@supabase/supabase-js',
          'express',
          'cors',
          'dotenv',
          'bcryptjs',
          'handlebars',
          'resend'
        ]
      }
    }
  }
})