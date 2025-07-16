#!/bin/bash

# 1. 获取日期
DATE=$(date +%Y%m%d_%H%M%S)

# 2. 创建备份目录
mkdir -p /opt/babylive/backups

# 3. 备份配置文件
cp docker-compose.yml /opt/babylive/backups/docker-compose_$DATE.yml
cp .env /opt/babylive/backups/env_$DATE

# 4. 备份容器数据
docker-compose exec app sh -c 'tar czf /backup/data_$DATE.tar.gz /app/dist /app/data'
docker cp babylive-app-1:/backup/data_$DATE.tar.gz /opt/babylive/backups/

# 5. 清理旧备份（保留最近5个）
cd /opt/babylive/backups
ls -t | tail -n +6 | xargs rm -rf
