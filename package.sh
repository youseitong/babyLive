#!/bin/bash

# 构建项目
docker-compose build
docker-compose up -d
sleep 2  # 等待容器启动

# 获取当前日期
DATE=$(date +%Y%m%d_%H%M%S)

# 创建临时目录
mkdir -p ./dist-package

# 复制必要的文件
cp docker-compose.yml ./dist-package/
cp .env ./dist-package/  # 如果需要
cp -r dist ./dist-package/  # 前端构建文件
cp Dockerfile ./dist-package/  # Dockerfile

# 复制配置文件（如果需要）
cp -r src/config.js ./dist-package/

# 创建 tar 包（使用 --format=ustar 来创建更兼容的 tar 包）
tar --format=ustar -czf babylive-$DATE.tar.gz ./dist-package/*

# 清理临时文件
rm -rf ./dist-package

echo "打包完成: babylive-$DATE.tar.gz"