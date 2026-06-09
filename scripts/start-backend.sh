#!/bin/bash
# 多鱼-测试与反馈协调工程师 写的 B 方案后端一键起服脚本
# 跑完这个：postgres 起来 + cycling 库建好 + .env 配好 + nest 起来

set -e
cd "$(dirname "$0")/.."
echo "=== 1. 起 postgres + redis 服务 ==="
brew services start postgresql@18 2>/dev/null || brew services start postgresql
brew services start redis
sleep 3

echo "=== 2. 验证端口 ==="
lsof -iTCP:5432 -sTCP:LISTEN 2>/dev/null | head -2
lsof -iTCP:6379 -sTCP:LISTEN 2>/dev/null | head -2

echo "=== 3. 建库 + 改密码 ==="
createuser -s postgres 2>/dev/null || true
psql -U postgres -d postgres -c "ALTER USER postgres WITH PASSWORD 'postgres';" 2>&1 | tail -2
psql -U postgres -d postgres -c "CREATE DATABASE cycling;" 2>&1 | tail -2

echo "=== 4. 配 .env ==="
if [ ! -f .env ]; then
  cp .env.example .env
  sed -i '' "s/your_password/postgres/g" .env
  echo "✅ .env 创建"
else
  echo "✅ .env 已存在"
fi

echo "=== 5. 杀旧 nest 进程 ==="
pkill -f "nest start" 2>/dev/null || true
pkill -f "node dist" 2>/dev/null || true
sleep 2

echo "=== 6. 起 nest 后端 ==="
nohup npm run start:dev > /tmp/nest.log 2>&1 &
NEST_PID=$!
echo "✅ nest 启动 PID=$NEST_PID"

echo "=== 7. 等 15 秒让 nest 就绪 ==="
sleep 15

echo "=== 8. 验证核心 API ==="
echo "--- GET /courses ---"
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3000/api/v1/courses
echo "--- POST /auth/login ---"
curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"[email protected]","password":"test123"}' \
  -w "\nHTTP %{http_code}\n" | head -5

echo ""
echo "=== ✅ B 方案后端起服完成 ==="
echo "  进程日志: tail -f /tmp/nest.log"
echo "  健康检查: curl http://localhost:3000/api/v1/courses"
