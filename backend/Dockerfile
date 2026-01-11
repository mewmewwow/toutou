# 后端 Dockerfile - 多阶段构建

# ========== 构建阶段 ==========
FROM node:20-alpine AS builder

WORKDIR /app

# 复制 package.json 和 lock 文件
COPY package*.json ./

# 安装所有依赖（包括 devDependencies）
RUN npm ci

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# ========== 生产阶段 ==========
FROM node:20-alpine AS production

WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production

# 复制 package.json
COPY package*.json ./

# 只安装生产依赖
RUN npm ci --only=production && npm cache clean --force

# 从构建阶段复制编译后的代码
COPY --from=builder /app/dist ./dist

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "dist/main"]
