# 前端 Dockerfile - 多阶段构建

# ========== 构建阶段 ==========
FROM node:20-alpine AS builder

WORKDIR /app

# 复制 package.json 和 lock 文件
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制源代码和共享模块
COPY . .
COPY ../shared /shared

# 设置构建时的环境变量（API地址）
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL

# 构建应用
RUN npm run build

# ========== 生产阶段 - 使用 Nginx 提供静态文件 ==========
FROM nginx:alpine AS production

# 复制自定义 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 从构建阶段复制静态文件
COPY --from=builder /app/dist /usr/share/nginx/html

# 暴露端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
