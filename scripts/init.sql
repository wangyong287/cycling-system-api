-- 室内骑行系统 - 数据库初始化脚本
-- 版本: 1.0.0
-- 日期: 2024-04-16

-- =====================================================
-- 1. 创建枚举类型
-- =====================================================

-- 用户性别
CREATE TYPE user_gender AS ENUM ('male', 'female', 'unknown');

-- 用户状态
CREATE TYPE user_status AS ENUM ('active', 'banned');

-- 课程类型
CREATE TYPE course_type AS ENUM ('power', 'heart_rate', 'mixed');

-- 课程难度
CREATE TYPE course_difficulty AS ENUM ('入门', '基础', '进阶', '高级');

-- 课程状态
CREATE TYPE course_status AS ENUM ('draft', 'published', 'archived');

-- 骑行类型
CREATE TYPE ride_session_type AS ENUM ('solo', 'live', 'group');

-- 骑行状态
CREATE TYPE ride_status AS ENUM ('pending', 'active', 'completed', 'cancelled');

-- 设备类型
CREATE TYPE device_type AS ENUM ('bike', 'heart_rate', 'cadence', 'speed');

-- 设备状态
CREATE TYPE device_status AS ENUM ('connected', 'disconnected');

-- 宠物状态
CREATE TYPE pet_status AS ENUM ('active', 'inactive');

-- 积分类型
CREATE TYPE point_type AS ENUM (
  'ride_complete', 'daily_login', 'achievement', 'reward', 'invite', 'exchange'
);

-- 订阅类型
CREATE TYPE subscription_type AS ENUM ('month', 'quarter', 'year', 'lifetime');

-- 订阅状态
CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'cancelled');

-- 订单状态
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'refunded', 'cancelled');

-- 支付方式
CREATE TYPE payment_method AS ENUM ('wechat', 'alipay', 'apple');

-- 教练状态
CREATE TYPE coach_status AS ENUM ('pending', 'approved', 'suspended');

-- =====================================================
-- 2. 用户表
-- =====================================================
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(64) NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    avatar VARCHAR(255),
    gender user_gender DEFAULT 'unknown',
    birth_year SMALLINT,
    height SMALLINT,
    weight DECIMAL(5,2),
    ftp INTEGER DEFAULT 0,
    w_kg DECIMAL(4,2) DEFAULT 0,
    lthr INTEGER DEFAULT 0,
    mhr INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    points INTEGER DEFAULT 0,
    status user_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);

-- =====================================================
-- 3. 教练表
-- =====================================================
CREATE TABLE coaches (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(50),
    bio TEXT,
    certificate VARCHAR(255),
    specialties JSONB,
    rating DECIMAL(2,1) DEFAULT 0,
    total_students INTEGER DEFAULT 0,
    status coach_status DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 4. 角色表
-- =====================================================
CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    permissions JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入默认角色
INSERT INTO roles (name, permissions) VALUES 
('coach', '["course:create", "course:edit", "course:publish", "live:start"]'::jsonb),
('coach_admin', '["course:*", "user:*", "live:*", "coach:manage"]'::jsonb),
('super_admin', '["*"]'::jsonb);

-- =====================================================
-- 5. 教练权限表
-- =====================================================
CREATE TABLE coach_permissions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(id),
    granted_by BIGINT NOT NULL REFERENCES users(id),
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 6. 课程表
-- =====================================================
CREATE TABLE courses (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    cover VARCHAR(255),
    coach_id BIGINT NOT NULL REFERENCES users(id),
    type course_type DEFAULT 'power',
    difficulty course_difficulty DEFAULT '基础',
    duration INTEGER NOT NULL,
    section_config JSONB NOT NULL,
    reward_config JSONB,
    difficulty_value INTEGER DEFAULT 50,
    tss INTEGER DEFAULT 0,
    if_value DECIMAL(4,2) DEFAULT 0,
    status course_status DEFAULT 'draft',
    enrolled_count INTEGER DEFAULT 0,
    rating DECIMAL(2,1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP
);

CREATE INDEX idx_courses_coach ON courses(coach_id);
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_published_at ON courses(published_at);

-- =====================================================
-- 7. 课程预约表
-- =====================================================
CREATE TABLE course_enrollments (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, course_id, scheduled_at)
);

-- =====================================================
-- 8. 骑行记录表
-- =====================================================
CREATE TABLE ride_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id BIGINT REFERENCES courses(id) ON DELETE SET NULL,
    session_type ride_session_type DEFAULT 'solo',
    duration INTEGER DEFAULT 0,
    power INTEGER DEFAULT 0,
    avg_power INTEGER DEFAULT 0,
    max_power INTEGER DEFAULT 0,
    heart_rate INTEGER DEFAULT 0,
    avg_heart_rate INTEGER DEFAULT 0,
    cadence INTEGER DEFAULT 0,
    calories INTEGER DEFAULT 0,
    score VARCHAR(2),
    tss INTEGER DEFAULT 0,
    if_value DECIMAL(4,2) DEFAULT 0,
    np INTEGER DEFAULT 0,
    match_rate INTEGER DEFAULT 0,
    ranking INTEGER DEFAULT 0,
    power_curve JSONB,
    heart_rate_curve JSONB,
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ride_sessions_user_started ON ride_sessions(user_id, started_at);
CREATE INDEX idx_ride_sessions_course ON ride_sessions(course_id);

-- =====================================================
-- 9. 设备表
-- =====================================================
CREATE TABLE devices (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_type device_type NOT NULL,
    brand VARCHAR(50),
    model VARCHAR(50),
    device_id VARCHAR(100) NOT NULL,
    protocol VARCHAR(20) DEFAULT 'ble',
    status device_status DEFAULT 'disconnected',
    last_connected_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, device_type, device_id)
);

-- =====================================================
-- 10. 宠物表
-- =====================================================
CREATE TABLE pets (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pet_type VARCHAR(20) NOT NULL,
    name VARCHAR(50) NOT NULL,
    level INTEGER DEFAULT 1,
    intimacy INTEGER DEFAULT 0,
    energy INTEGER DEFAULT 0,
    skin VARCHAR(20),
    status pet_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_interaction_at TIMESTAMP
);

-- =====================================================
-- 11. 积分记录表
-- =====================================================
CREATE TABLE point_records (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type point_type NOT NULL,
    value INTEGER NOT NULL,
    balance INTEGER NOT NULL,
    source_id BIGINT,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_point_records_user_created ON point_records(user_id, created_at);

-- =====================================================
-- 12. 订阅套餐表
-- =====================================================
CREATE TABLE subscription_plans (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    duration INTEGER NOT NULL,
    duration_type VARCHAR(20) NOT NULL,
    features JSONB,
    recommended BOOLEAN DEFAULT FALSE,
    status subscription_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入默认套餐
INSERT INTO subscription_plans (name, price, duration, duration_type, features, recommended) VALUES
('月卡', 68, 30, 'day', '["无限课程", "高级课程", "数据同步"]', FALSE),
('季卡', 168, 90, 'day', '["无限课程", "高级课程", "专属教练", "数据同步"]', FALSE),
('年卡', 568, 365, 'day', '["无限课程", "高级课程", "专属教练", "数据同步", "优先客服"]', TRUE);

-- =====================================================
-- 13. 用户订阅表
-- =====================================================
CREATE TABLE subscriptions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type subscription_type NOT NULL,
    start_at TIMESTAMP NOT NULL,
    expire_at TIMESTAMP NOT NULL,
    auto_renew BOOLEAN DEFAULT FALSE,
    status subscription_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscriptions_user_expire ON subscriptions(user_id, expire_at);

-- =====================================================
-- 14. 订单表
-- =====================================================
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    order_no VARCHAR(50) UNIQUE NOT NULL,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id BIGINT NOT NULL REFERENCES subscription_plans(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_method payment_method NOT NULL,
    status order_status DEFAULT 'pending',
    paid_at TIMESTAMP,
    transaction_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_user_status ON orders(user_id, status);
CREATE INDEX idx_orders_created ON orders(created_at);

-- =====================================================
-- 15. 初始化测试数据
-- =====================================================

-- 测试用户 (密码: test123)
INSERT INTO users (phone, password_hash, nickname, ftp, weight, w_kg, lthr, level, points) VALUES
('13800000001', '$2a$10$abcdefghijklmnopqrstuvwxyz', '测试用户1', 300, 70, 4.29, 185, 12, 12580),
('13800000002', '$2a$10$abcdefghijklmnopqrstuvwxyz', '测试用户2', 250, 65, 3.85, 175, 8, 5800),
('13800000003', '$2a$10$abcdefghijklmnopqrstuvwxyz', '测试用户3', 350, 80, 4.38, 188, 15, 25800);

-- 测试教练
INSERT INTO coaches (user_id, title, bio, status) VALUES
(1, '高级教练', '从业10年，专业骑行教练', 'approved');

-- 测试课程
INSERT INTO courses (title, description, coach_id, type, difficulty, duration, section_config, tss, if_value, status, enrolled_count, rating) VALUES
('HIIT冲刺', '高强度间歇训练，提升耐力和爆发力', 1, 'power', '进阶', 45, 
'[{"name":"热身","type":"warmup","duration":300,"powerRange":[80,120]},{"name":"爬坡","type":"climb","duration":480,"powerRange":[120,200]},{"name":"冲刺","type":"sprint","duration":120,"powerRange":[300,400]}]',
125, 1.08, 'published', 1234, 4.8),
('耐力训练', '长时间有氧训练，提升基础耐力', 1, 'power', '基础', 60,
'[{"name":"热身","type":"warmup","duration":300},{"name":"有氧","type":"aerobic","duration":2400,"powerRange":[150,200]},{"name":"放松","type":"recovery","duration":300}]',
150, 0.85, 'published', 980, 4.6);

-- 测试骑行记录
INSERT INTO ride_sessions (user_id, course_id, duration, power, avg_power, max_power, heart_rate, cadence, calories, tss, if_value, np, score, status, started_at, ended_at) VALUES
(1, 1, 2700, 325, 285, 520, 145, 92, 582, 85, 1.08, 325, 'A+', 'completed', '2024-04-16 14:30:00', '2024-04-16 15:15:00'),
(1, 2, 3600, 280, 250, 420, 142, 88, 780, 120, 0.95, 280, 'A', 'completed', '2024-04-14 18:00:00', '2024-04-14 19:00:00');

-- 测试宠物
INSERT INTO pets (user_id, pet_type, name, level, intimacy, energy) VALUES
(1, '电阻马', '小电', 3, 75, 450);

-- =====================================================
-- 16. 视图和函数
-- =====================================================

-- 用户骑行统计视图
CREATE OR REPLACE VIEW user_ride_stats AS
SELECT 
    u.id as user_id,
    u.nickname,
    COUNT(r.id) as ride_count,
    COALESCE(SUM(r.duration), 0) as total_duration,
    COALESCE(SUM(r.calories), 0) as total_calories,
    COALESCE(SUM(r.tss), 0) as total_tss,
    COALESCE(AVG(r.avg_power), 0)::INTEGER as avg_power,
    COALESCE(MAX(r.max_power), 0) as max_power
FROM users u
LEFT JOIN ride_sessions r ON u.id = r.user_id AND r.status = 'completed'
GROUP BY u.id, u.nickname;

-- =====================================================
-- 12. 训练计划模块 (plans)
-- =====================================================

-- 计划目标
CREATE TYPE plan_goal AS ENUM (
  'fat_burn', 'endurance', 'strength', 'rehab', 'weight_loss', 'competition'
);

-- 计划水平
CREATE TYPE plan_level AS ENUM (
  'beginner', 'intermediate', 'advanced', 'expert'
);

-- 计划状态
CREATE TYPE plan_status AS ENUM ('draft', 'published', 'archived');

-- 用户方案状态
CREATE TYPE user_plan_status AS ENUM (
  'active', 'completed', 'paused', 'abandoned'
);

-- 方案主表
CREATE TABLE IF NOT EXISTS plans (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  cover TEXT,
  goal plan_goal NOT NULL,
  level plan_level NOT NULL,
  days_per_week SMALLINT NOT NULL DEFAULT 3,
  duration_weeks SMALLINT NOT NULL DEFAULT 4,
  structure JSONB,
  estimated_calories INTEGER NOT NULL DEFAULT 0,
  enrolled_count INTEGER NOT NULL DEFAULT 0,
  rating DECIMAL(3, 2) NOT NULL DEFAULT 0,
  status plan_status NOT NULL DEFAULT 'published',
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_plans_goal_level_status
  ON plans (goal, level, status);
CREATE INDEX IF NOT EXISTS idx_plans_enrolled_count
  ON plans (enrolled_count DESC);
CREATE INDEX IF NOT EXISTS idx_plans_rating
  ON plans (rating DESC);

-- 用户方案关联
CREATE TABLE IF NOT EXISTS user_plans (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id BIGINT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  status user_plan_status NOT NULL DEFAULT 'active',
  current_week SMALLINT NOT NULL DEFAULT 0,
  current_day SMALLINT NOT NULL DEFAULT 0,
  completed_days SMALLINT NOT NULL DEFAULT 0,
  total_calories INTEGER NOT NULL DEFAULT 0,
  total_minutes INTEGER NOT NULL DEFAULT 0,
  started_at DATE,
  completed_at DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_plans_user_id_status
  ON user_plans (user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_plans_plan_id
  ON user_plans (plan_id);

-- =====================================================
-- 系统预置方案种子数据
-- =====================================================
INSERT INTO plans (name, description, goal, level, days_per_week, duration_weeks, structure, estimated_calories, is_system, status, enrolled_count, rating)
VALUES
('入门燃脂 4 周计划', '面向新手，每周 3 天，稳态有氧 + 轻间歇', 'fat_burn', 'beginner', 3, 4,
'[
  {"week": 1, "theme": "基础适应期", "totalDurationMin": 120, "workouts": [
    {"day": 1, "type": "endurance", "durationMin": 30, "intensity": "low", "description": "稳态骑行 30 分钟，60-70%HRmax"},
    {"day": 3, "type": "endurance", "durationMin": 45, "intensity": "moderate", "description": "稳态骑行 45 分钟，65-75%HRmax"},
    {"day": 5, "type": "mixed", "durationMin": 45, "intensity": "moderate", "description": "混合训练 45 分钟"}
  ]},
  {"week": 2, "theme": "强度爬升期", "totalDurationMin": 150, "workouts": [
    {"day": 1, "type": "endurance", "durationMin": 45, "intensity": "moderate", "description": "稳态骑行 45 分钟"},
    {"day": 3, "type": "interval", "durationMin": 40, "intensity": "high", "description": "间歇训练 40 分钟"},
    {"day": 5, "type": "endurance", "durationMin": 60, "intensity": "moderate", "description": "长距离稳态 60 分钟"}
  ]},
  {"week": 3, "theme": "巅峰训练期", "totalDurationMin": 165, "workouts": [
    {"day": 1, "type": "interval", "durationMin": 45, "intensity": "high", "description": "高强度间歇 45 分钟"},
    {"day": 3, "type": "endurance", "durationMin": 60, "intensity": "moderate", "description": "稳态骑行 60 分钟"},
    {"day": 5, "type": "interval", "durationMin": 60, "intensity": "peak", "description": "巅峰间歇 60 分钟"}
  ]},
  {"week": 4, "theme": "巩固提升期", "totalDurationMin": 150, "workouts": [
    {"day": 1, "type": "endurance", "durationMin": 60, "intensity": "moderate", "description": "巩固长距离 60 分钟"},
    {"day": 3, "type": "mixed", "durationMin": 45, "intensity": "high", "description": "混合训练 45 分钟"},
    {"day": 5, "type": "interval", "durationMin": 45, "intensity": "high", "description": "冲刺间歇 45 分钟"}
  ]}
]'::jsonb, 4860, TRUE, 'published', 1280, 4.60),

('进阶耐力 6 周计划', '中级用户，每周 4 天，长距离 + 节奏训练', 'endurance', 'intermediate', 4, 6,
'[
  {"week": 1, "theme": "基础适应期", "totalDurationMin": 180, "workouts": [
    {"day": 1, "type": "endurance", "durationMin": 45, "intensity": "moderate", "description": "稳态骑行 45 分钟"},
    {"day": 2, "type": "recovery", "durationMin": 30, "intensity": "low", "description": "主动恢复 30 分钟"},
    {"day": 4, "type": "endurance", "durationMin": 60, "intensity": "moderate", "description": "长距离 60 分钟"},
    {"day": 6, "type": "interval", "durationMin": 45, "intensity": "high", "description": "节奏间歇 45 分钟"}
  ]},
  {"week": 2, "theme": "强度爬升期", "totalDurationMin": 210, "workouts": [
    {"day": 1, "type": "endurance", "durationMin": 60, "intensity": "moderate", "description": "稳态骑行 60 分钟"},
    {"day": 2, "type": "interval", "durationMin": 45, "intensity": "high", "description": "VO2max 间歇 45 分钟"},
    {"day": 4, "type": "endurance", "durationMin": 75, "intensity": "moderate", "description": "长距离 75 分钟"},
    {"day": 6, "type": "interval", "durationMin": 60, "intensity": "high", "description": "节奏间歇 60 分钟"}
  ]}
]'::jsonb, 7560, TRUE, 'published', 856, 4.70),

('高级力量 8 周计划', '高级用户，每周 5 天，爬坡 + 力量 + 间歇', 'strength', 'advanced', 5, 8,
'[
  {"week": 1, "theme": "基础适应期", "totalDurationMin": 240, "workouts": [
    {"day": 1, "type": "strength", "durationMin": 45, "intensity": "high", "description": "爬坡力量 45 分钟"},
    {"day": 2, "type": "endurance", "durationMin": 60, "intensity": "moderate", "description": "稳态骑行 60 分钟"},
    {"day": 3, "type": "strength", "durationMin": 45, "intensity": "high", "description": "低踏频高阻力 45 分钟"},
    {"day": 5, "type": "interval", "durationMin": 45, "intensity": "high", "description": "高强度间歇 45 分钟"},
    {"day": 6, "type": "endurance", "durationMin": 75, "intensity": "moderate", "description": "长距离 75 分钟"}
  ]}
]'::jsonb, 17280, TRUE, 'published', 432, 4.80),

('康复恢复 4 周计划', '低强度，每周 3 天，主动恢复为主', 'rehab', 'beginner', 3, 4,
'[
  {"week": 1, "theme": "基础适应期", "totalDurationMin": 75, "workouts": [
    {"day": 1, "type": "recovery", "durationMin": 25, "intensity": "low", "description": "主动恢复 25 分钟"},
    {"day": 3, "type": "mixed", "durationMin": 30, "intensity": "low", "description": "低强度混合 30 分钟"},
    {"day": 5, "type": "recovery", "durationMin": 20, "intensity": "low", "description": "轻松骑 20 分钟"}
  ]}
]'::jsonb, 1875, TRUE, 'published', 256, 4.50)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 完成
-- =====================================================
SELECT '数据库初始化完成（含 plans 模块）！' as message;