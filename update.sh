#!/bin/bash

# 1. 进入工作目录
cd /opt/babylive/dist-package

# 2. 拉取新镜像
docker-compose pull

# 3. 重启容器
docker-compose up -d

# 4. 检查容器状态
docker-compose ps
