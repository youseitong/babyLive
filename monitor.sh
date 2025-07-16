#!/bin/bash

# 检查容器状态
docker-compose ps

# 检查资源使用
docker stats

# 检查日志
docker-compose logs --tail=100
