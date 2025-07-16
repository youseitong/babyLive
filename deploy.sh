#!/bin/bash

# 1. 创建工作目录
mkdir -p /opt/babylive
cd /opt/babylive

# 2. 解压打包文件
tar -xzf /path/to/babylive-*.tar.gz

# 3. 确保所有文件有正确的权限
chmod +x dist-package/Dockerfile
chmod +x dist-package/docker-compose.yml

# 4. 启动容器
cd dist-package
docker-compose down -v  # 清理旧的容器和卷
docker-compose build --no-cache  # 重新构建镜像
docker-compose up -d  # 启动容器

# 5. 检查容器状态
docker-compose ps

# 6. 查看日志
docker-compose logs -f
