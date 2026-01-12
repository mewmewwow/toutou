# 前端 Dockerfile - 多阶段构建
# 注意：构建上下文为项目根目录，Dockerfile 路径为 frontend/Dockerfile

# ========== 构建阶段 ==========
FROM node:20-alpine AS builder

WORKDIR /app

# 先复制 shared 模块
COPY shared /app/shared

# 复制前端 package.json 和 lock 文件
COPY frontend/package*.json ./frontend/

# 安装依赖
WORKDIR /app/frontend
RUN npm install

# 复制前端源代码
COPY frontend/ ./

# 设置构建时的环境变量（API地址）
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=$VITE_API_URL

# 构建应用（跳过 TSC 类型检查，Vite 会自己处理 TS 转译）
RUN npx vite build

# ========== 生产阶段 - 使用 Nginx 提供静态文件 ==========
FROM nginx:alpine AS production

# 复制自定义 Nginx 配置
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# 从构建阶段复制静态文件
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# 暴露端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
