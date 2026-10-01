#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-5000}"

node -e "const target = 'http://127.0.0.1:' + (process.env.PORT || '5000') + '/api/health/ready'; fetch(target).then((res) => process.exit(res.ok ? 0 : 1)).catch(() => process.exit(1));"
