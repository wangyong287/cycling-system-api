# AGENTS.md — 室内骑行系统后端

> **多鱼·测试与反馈协调工程师** 写给未来所有 agent 的项目入门文档
> 
> 任何 agent 接手这个项目前，**先读这文件**再动手。

---

## 🎯 项目一句话

NestJS + TypeORM + PostgreSQL 实现的室内骑行系统后端 API（用户/课程/方案/骑行/宠物/订阅/教练/订单/设备/积分）。

---

## 🚀 30 秒上手

```bash
# 1. 起服务（pgserver + redislite 嵌入式，brew 装不上 pg17/18 的替代方案）
bash scripts/start-backend.sh

# 2. 验证 6 个核心 API + 1 个鉴权预期
bash scripts/start-test.sh

# 3. 看 API 文档
open http://localhost:3000/api/docs
```

**期望输出**：`✅ B 方案后端全绿`（6/6 通过）

---

## 📁 关键文件地图

| 文件 | 干嘛的 | 谁负责 |
|---|---|---|
| `src/main.ts` | 入口，端口 3000，全局前缀 `api/v1` | 妹妹 |
| `src/app.module.ts` | 11 个 module 总装 + TypeORM + SnakeNamingStrategy | 妹妹 |
| `src/config/snake-naming.strategy.ts` | camelCase → snake_case（camelCase entity 自动映射数据库 snake_case 列） | 多鱼（已加） |
| `scripts/start-backend.sh` | 一键起 postgres/redis/nest（pgserver + redislite fallback） | 多鱼（已加） |
| `scripts/start-test.sh` | 跑 6 个核心 API E2E，输出 ✅/❌ | 多鱼（已加） |
| `scripts/init.sql` | 15 张表 + 种子数据（用户/课程/方案/教练/宠物） | 妹妹 |
| `.env` | 环境变量（dev 用 trust 认证，无密码） | - |
| `.github/workflows/test.yml` | CI：push 自动跑 E2E | 多鱼（已加） |
| `docker-compose.yml` | CI 用 postgres+redis+api 三件套 | 多鱼（已加） |
| `test/*.spec.ts` | Jest 单测（auth/courses/rides/subscriptions/users） | 多鱼 |

---

## 🗄️ 数据库（关键！）

- **本机**：`pgserver` 嵌入式 PostgreSQL 16.2（**brew 装不上 pg17/18** 的替代）
- **CI**：`postgres:16-alpine` 容器
- **认证**：dev 用 trust，无密码（`DB_USERNAME=wangyong, DB_PASSWORD=`）
- **库名**：`cycling`（dev）/ `cycling_test`（CI）
- **15 张表**：`users/courses/course_enrollments/plans/user_plans/ride_sessions/devices/pets/point_records/subscriptions/orders/coaches/...`
- **列名**：snake_case（`coach_id`, `enrolled_count`, `enrolled_at` 等）
- **schema 来源**：`scripts/init.sql`（dev 用这个建表，synchronize=false）
- **entity 装饰器**：`@Column({ name: 'xxx_yyy' })` 显式指定 snake_case 列名

---

## 🐛 已知坑（别再踩）

1. **TypeORM 列名映射**：如果用 `where: { xxxYyy: ... }` 报 "column not found"，先看 entity 是不是有 `@Column({ name: 'xxx_yyy' })` 显式映射，或者 SnakeNamingStrategy 没生效
2. **`@Get(':id')` 路由顺序**：`/courses/recommend` 必须在 `@Get(':id')` **前面**声明，否则会被 `:id` 吞掉
3. **decimal 字段**：`if_value`, `rating` 在 PostgreSQL 是 `decimal(4,2)` / `decimal(2,1)`，API 返回是**字符串**（`"1.08"`），前端要 `parseFloat()`
4. **brew 装不上 postgresql 17/18**：用 `pgserver` Python 包（`pip install pgserver` + `python -c "import pgserver; pgserver.get_server('/tmp/pg')"`）
5. **dist/ 是编译产物**：`nest build` 编译到 `dist/`，nest 跑 `node dist/main.js`。改 .ts 不会自动生效，必须 `npx nest build` 再重启

---

## 🧪 测试体系

- **E2E 验证**：`scripts/start-test.sh` 跑 6 个核心 API（5 个绿 + 1 个 401 鉴权预期）
- **Jest 单测**：`test/*.spec.ts`（`npm run test`）
- **CI 跑测**：push 后 GitHub Actions 自动跑，状态会显示在 PR

---

## 🔄 5 个核心 API（必须绿）

| API | 鉴权 | 状态 |
|---|---|---|
| `GET /api/v1/courses` | 公开 | 200 ✅ |
| `GET /api/v1/courses/:id` | 公开 | 200 ✅ |
| `GET /api/v1/courses/recommend` | 公开 | 200 ✅（多鱼补的） |
| `GET /api/v1/plans` | 公开 | 200 ✅ |
| `GET /api/v1/plans/:id` | 公开 | 200 ✅ |
| `GET /api/v1/plans/recommend` | JWT 必填 | 无 token → 401 ✅（预期） |

---

## 🤖 给未来 agent 的话

1. **别瞎改 .env**（pgserver 嵌入式配置已调好）
2. **加新 API** 时：先看 `src/courses/courses.controller.ts` 风格 + `plans/plans.service.ts` 业务逻辑
3. **加新表** 时：先改 `scripts/init.sql`（dev 用），再写 entity
4. **修 bug** 时：先 `tail -f /tmp/nest.log` 看堆栈，再动代码
5. **测试** 时：跑 `bash scripts/start-test.sh` 验证 5/5 + 1 鉴权都绿
6. **不确定** 时：问多鱼（tester），多鱼不懂问老王（兜底）
