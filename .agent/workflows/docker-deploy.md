---
description: 使用 Docker 本地部署 toutou 项目
---

# Docker 本地部署

## 前置条件

- 安装 Docker 和 Docker Compose

## 快速启动

// turbo-all

1. 复制环境变量文件

```bash
cp .env.docker .env
```

2. 构建并启动所有服务

```bash
docker-compose up --build
```

3. 访问应用

- 前端: http://localhost
- 后端 API: http://localhost:3000/api/v1
- API 文档: http://localhost:3000/api/docs

## 常用命令

### 后台运行

```bash
docker-compose up -d
```

### 查看日志

```bash
docker-compose logs -f
```

### 停止服务

```bash
docker-compose down
```

### 清除数据卷（重置数据库）

```bash
docker-compose down -v
```

### 重新构建镜像

```bash
docker-compose up --build
```

## 仅启动依赖服务（开发模式）

如果你只想用 Docker 运行数据库和 Redis，本地运行代码：

```bash
docker-compose up postgres redis -d
```

然后在本地运行：

```bash
# 后端
cd backend && npm install && npm run start:dev

# 前端
cd frontend && npm install && npm run dev
```
