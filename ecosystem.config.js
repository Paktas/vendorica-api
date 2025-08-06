module.exports = {
  apps: [{
    name: 'vendorica-api',
    script: './dist/index.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    },
    watch: false,
    autorestart: true,
    max_memory_restart: '1G',
    error_file: './logs/vendorica-api-err.log',
    out_file: './logs/vendorica-api-out.log',
    log_file: './logs/vendorica-api-combined.log',
    time: true
  }]
}