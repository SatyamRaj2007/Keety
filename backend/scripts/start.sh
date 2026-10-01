#!/usr/bin/env bash
set -euo pipefail

NODE_ENV="${NODE_ENV:-production}"
PORT="${PORT:-5000}"

node -e "const { getEnv } = require('./src/config/env'); const env = getEnv(); if (!env.MONGODB_URI || !env.JWT_SECRET) { throw new Error('Missing required environment configuration'); } console.log('Environment validation passed');"

exec node src/server.js
