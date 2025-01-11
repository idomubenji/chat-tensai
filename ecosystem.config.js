module.exports = {
  apps: [{
    name: 'chat-genius',
    cwd: '/home/ec2-user/chat-genius',
    script: 'npm',
    args: 'run start:next -- -p 3000',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NEXT_TELEMETRY_DISABLED: 1
    }
  }]
} 