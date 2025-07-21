FROM node:18 AS build

WORKDIR /app

# 安装构建依赖
RUN apt-get update --fix-missing && \
    apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 复制 package 文件并安装所有依赖
COPY package*.json ./
RUN npm ci

# 复制源代码
COPY . .

# 构建前端
RUN npm run build

# 生产阶段
FROM node:18-slim

WORKDIR /app

# 安装运行时依赖
RUN apt-get update --fix-missing && \
    apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 复制构建产物和必要的文件
COPY --from=build /app/package*.json ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/server.js .
COPY --from=build /app/src/db ./src/db

# 只安装生产依赖
RUN npm ci --only=production

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "server.js"]