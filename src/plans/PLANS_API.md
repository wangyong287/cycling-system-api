# Plans 模块接口文档

> 路径前缀：`/plans`
> 鉴权：除 `GET /`、`GET /:id` 外，其余均需登录（JWT Bearer Token）

---

## 1. POST `/plans/generate` — 问卷生成方案 ⭐核心

根据用户提交的问卷，自动匹配模板或动态生成训练计划，并自动订阅。

### Request Body
```json
{
  "goal": "fat_burn",                  // 必填：fat_burn|endurance|strength|rehab|weight_loss|competition
  "level": "beginner",                 // 必填：beginner|intermediate|advanced|expert
  "daysPerWeek": 3,                    // 必填：2-7
  "durationWeeks": 4,                  // 必填：2-12
  "heightCm": 175,                     // 可选：100-250
  "weightKg": 70,                      // 可选：30-200
  "age": 28,                           // 可选：10-100
  "ftp": 220,                          // 可选：50-500
  "maxHeartRate": 185,                 // 可选：100-230
  "preferredTypes": "endurance,interval", // 可选：偏好类型，逗号分隔
  "notes": "膝盖有旧伤，避免高强度跳跃"     // 可选：备注
}
```

### Response 200
```json
{
  "data": {
    "id": "1",
    "name": "入门燃脂 4 周计划",
    "description": "面向新手，每周 3 天，稳态有氧 + 轻间歇",
    "goal": "fat_burn",
    "level": "beginner",
    "daysPerWeek": 3,
    "durationWeeks": 4,
    "structure": [
      {
        "week": 1,
        "theme": "基础适应期",
        "totalDurationMin": 120,
        "workouts": [
          { "day": 1, "type": "endurance", "durationMin": 30, "intensity": "low", "description": "...", "tip": "..." },
          ...
        ]
      },
      ...
    ],
    "estimatedCalories": 4860,
    "enrolledCount": 1280,
    "rating": 4.6,
    "status": "published",
    "isSystem": true,
    "createdAt": "2024-04-16T10:00:00Z",
    "updatedAt": "2024-04-16T10:00:00Z"
  },
  "userPlan": {
    "id": "5",
    "userId": "1",
    "planId": "1",
    "status": "active",
    "currentWeek": 1,
    "currentDay": 1,
    "completedDays": 0,
    "totalCalories": 0,
    "totalMinutes": 0,
    "startedAt": "2024-04-16"
  },
  "source": "template"   // "template"=命中模板 | "generated"=动态生成
}
```

### 字段说明
- `structure[i].workouts[j].type`：`endurance` 稳态 | `interval` 间歇 | `strength` 力量 | `recovery` 恢复 | `mixed` 混合 | `rest` 休息
- `structure[i].workouts[j].intensity`：`low` | `moderate` | `high` | `peak`
- `structure[i].workouts[j].targetZone`：`{min, max}` 心率区间百分比（%HRmax）

---

## 2. GET `/plans` — 方案库列表

### Query
- `goal` (optional)
- `level` (optional)
- `page` (default 1)
- `pageSize` (default 20)

### Response
```json
{
  "data": [ /* Plan[] */ ],
  "pagination": { "total": 4, "page": 1, "pageSize": 20 }
}
```

---

## 3. GET `/plans/:id` — 方案详情

返回单个 Plan 对象（含完整 structure）。

---

## 4. GET `/plans/recommend` — 推荐方案（需登录）

基于用户历史订阅的 level 推荐同类热门方案。

### Query
- `limit` (default 5)

### Response
```json
{ "data": [ /* Plan[]，按 enrolledCount 降序 */ ] }
```

---

## 5. GET `/plans/my` — 我的训练计划（需登录）

### Response
```json
{
  "data": [
    {
      "id": "5",
      "planId": "1",
      "status": "active",
      "currentWeek": 1,
      "currentDay": 2,
      "completedDays": 1,
      "totalCalories": 320,
      "totalMinutes": 45,
      "plan": { /* Plan 详情 */ }
    }
  ]
}
```

---

## 6. GET `/plans/my/:userPlanId/today` — 今日训练（需登录）

返回当前周/日对应的训练内容。

### Response
```json
{
  "data": {
    "week": { /* WeekPlan */ },
    "day": { /* DailyWorkout */ },
    "userPlan": { /* UserPlan */ }
  }
}
```
或：
```json
{ "data": null, "message": "本日休息" }
```

---

## 7. POST `/plans/:id/subscribe` — 订阅方案（需登录）

### Response
```json
{ "data": { /* UserPlan */ } }
```

---

## 8. POST `/plans/my/:userPlanId/progress` — 推进进度（需登录）

每次完成训练后调用，自动推进 week/day。

### Request Body
```json
{ "calories": 320, "minutes": 45 }
```

### Response
```json
{ "data": { /* UserPlan（已推进） */ } }
```

---

## 9. POST `/plans` — 手动创建方案（需登录，管理员用）

```json
{
  "name": "我的自定义方案",
  "goal": "endurance",
  "level": "intermediate",
  "daysPerWeek": 4,
  "durationWeeks": 6
}
```

后端会按规则自动生成 structure。

---

## 数据库表

### `plans` — 方案模板库
| 字段 | 类型 | 说明 |
|---|---|---|
| id | BIGSERIAL | 主键 |
| name | VARCHAR(100) | 方案名 |
| goal | enum | 目标 |
| level | enum | 水平 |
| days_per_week | SMALLINT | 每周天数 |
| duration_weeks | SMALLINT | 总周数 |
| structure | JSONB | 完整周计划 |
| estimated_calories | INT | 预估卡路里 |
| enrolled_count | INT | 订阅数 |
| rating | DECIMAL(3,2) | 评分 |
| is_system | BOOL | 系统预置 |
| status | enum | 状态 |

### `user_plans` — 用户方案关联
| 字段 | 类型 | 说明 |
|---|---|---|
| id | BIGSERIAL | 主键 |
| user_id | BIGINT | FK users |
| plan_id | BIGINT | FK plans |
| status | enum | active/completed/paused/abandoned |
| current_week | SMALLINT | 当前周 |
| current_day | SMALLINT | 当前日（1-7）|
| completed_days | SMALLINT | 已完成天数 |
| total_calories | INT | 累计卡路里 |
| total_minutes | INT | 累计时长 |
| started_at | DATE | 开始日期 |
| completed_at | DATE | 完成日期 |

---

## 错误码
- 400: 参数不合法（如 daysPerWeek 越界）
- 401: 未登录
- 404: 方案不存在
- 500: 生成失败

---

## 前端对接要点

1. **PlanGeneratorPanel** 收集问卷 → 调 `POST /plans/generate` → 展示 `data.structure` 给用户
2. **PlansList** 调 `GET /plans?goal=&level=` → 渲染卡片列表
3. **PlanCustomizer** 调 `GET /plans/:id` → 渲染详情；用户确认后调 `POST /plans/:id/subscribe`
4. **My Plans** 调 `GET /plans/my` → 展示用户订阅的方案 + 进度
5. **今日训练** 调 `GET /plans/my/:userPlanId/today` → 展示当日训练
6. **训练完成后** 调 `POST /plans/my/:userPlanId/progress` → 自动推进

---

## 启动验证

```bash
cd cycling-system-api
psql -U postgres -d cycling -f scripts/init.sql   # 初始化 DB
npm run start:dev                                  # 起服务
curl http://localhost:3000/plans                   # 验证能返回种子数据
```
