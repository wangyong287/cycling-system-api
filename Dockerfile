# 骑行系统后端
FROM node:20-alpine

WORKDIR /app

# 安装pnpm
RUN npm install -g pnpm

# 复制依赖文件
COPY package.json pnpm-lock.yaml* ./

# 安装依赖
RUN if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; else npm install; fi

# 复制源码
COPY . .

# 构建
RUN npm run build

# 运行用户
USER node

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "dist/main.js"]