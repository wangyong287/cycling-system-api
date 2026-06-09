#!/bin/bash
# ============================================================
# 多鱼-测试与反馈协调工程师 写的 B 方案后端一键验证脚本
# 用途：检测依赖 + 跑 5 个核心 API E2E + 输出 ✅/❌
# 用法：bash scripts/start-test.sh
# 前提：postgres (pgserver) + redis (redislite) + nest 已起
# 退出码：0=全绿 / 1=环境未起 / 2=API 挂
# ============================================================

set -e
cd "$(dirname "$0")/.."

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS=0
FAIL=0
TOTAL=6  # 5 个绿 API + 1 个 401 鉴权预期

echo "=============================================="
echo "  🐟 多鱼·B 方案后端一键验证"
echo "  时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=============================================="
echo ""

# ----------------------------------------
# Step 1: 检查环境服务
# ----------------------------------------
echo "=== Step 1/4: 检查环境服务 ==="
ENV_OK=1

if ! lsof -iTCP:5432 -sTCP:LISTEN 2>/dev/null | grep -q LISTEN; then
  echo -e "${RED}❌ postgres 5432 未起${NC}"
  ENV_OK=0
else
  echo -e "${GREEN}✅ postgres 5432${NC}"
fi

if ! lsof -iTCP:6379 -sTCP:LISTEN 2>/dev/null | grep -q LISTEN; then
  echo -e "${RED}❌ redis 6379 未起${NC}"
  ENV_OK=0
else
  echo -e "${GREEN}✅ redis 6379${NC}"
fi

if ! lsof -iTCP:3000 -sTCP:LISTEN 2>/dev/null | grep -q LISTEN; then
  echo -e "${RED}❌ nest 3000 未起${NC}"
  ENV_OK=0
else
  echo -e "${GREEN}✅ nest 3000${NC}"
fi

if [ $ENV_OK -eq 0 ]; then
  echo ""
  echo -e "${RED}=============================================="
  echo -e "  ❌ 环境未就绪，请先跑："
  echo -e "     bash scripts/start-backend.sh"
  echo -e "  或：node -e \"import('pgserver')\""
  echo -e "==============================================${NC}"
  exit 1
fi
echo ""

# ----------------------------------------
# Step 2: 健康检查
# ----------------------------------------
echo "=== Step 2/4: 健康检查 ==="
HEALTH=$(curl -s http://localhost:3000/health)
if echo "$HEALTH" | grep -q '"status":"ok"'; then
  echo -e "${GREEN}✅ /health OK${NC} - $HEALTH"
else
  echo -e "${RED}❌ /health 异常${NC} - $HEALTH"
  exit 1
fi
echo ""

# ----------------------------------------
# Step 3: 5 个核心 API E2E
# ----------------------------------------
echo "=== Step 3/4: 5 个核心 API E2E ==="

check_api() {
  local name="$1"
  local method="$2"
  local path="$3"
  local expected="$4"
  local extra_curl="$5"
  local resp=$(eval "curl -s -o /tmp/api_resp -w '%{http_code}' $extra_curl -X $method 'http://localhost:3000$path'")
  if [ "$resp" = "$expected" ]; then
    echo -e "  ${GREEN}✅ $name${NC}  [$method $path → $resp]"
    PASS=$((PASS+1))
    # 展示返回数据摘要
    if [ -s /tmp/api_resp ]; then
      head -c 200 /tmp/api_resp | tr -d '\n' | head -c 150
      echo "..."
    fi
    echo ""
    return 0
  else
    echo -e "  ${RED}❌ $name${NC}  [$method $path → 期望 $expected, 实际 $resp]"
    FAIL=$((FAIL+1))
    if [ -s /tmp/api_resp ]; then
      head -c 300 /tmp/api_resp
      echo ""
    fi
    echo ""
    return 1
  fi
}

# 公开 API
check_api "课程列表"     GET "/api/v1/courses"           200
check_api "课程详情"     GET "/api/v1/courses/1"         200
check_api "课程推荐"     GET "/api/v1/courses/recommend" 200
check_api "方案列表"     GET "/api/v1/plans"             200
check_api "方案详情"     GET "/api/v1/plans/1"           200

# 鉴权预期：未带 token 返回 401
check_api "方案推荐(无token)" GET "/api/v1/plans/recommend" 401

# ----------------------------------------
# Step 4: 汇总
# ----------------------------------------
echo "=== Step 4/4: 汇总 ==="
echo ""
echo "  通过: $PASS / $TOTAL"
echo "  失败: $FAIL / $TOTAL"
echo ""

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}=============================================="
  echo -e "  ✅ B 方案后端全绿"
  echo -e "==============================================${NC}"
  echo "  进程日志: tail -f /tmp/nest.log"
  echo "  健康检查: curl http://localhost:3000/health"
  echo "  API 文档: http://localhost:3000/api/docs"
  exit 0
else
  echo -e "${RED}=============================================="
  echo -e "  ❌ B 方案后端有 $FAIL 个 API 挂"
  echo -e "==============================================${NC}"
  echo "  排查步骤："
  echo "  1. tail -f /tmp/nest.log 看 nest 错误堆栈"
  echo "  2. 看具体挂的 API 是不是有路由缺失/列名不对"
  echo "  3. 找妹妹修代码 / 找老王兜底"
  exit 2
fi
