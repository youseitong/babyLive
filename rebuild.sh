
#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 函数：打印带颜色的消息
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

print_message "正在拉取最新代码..."
git pull

print_message "开始重建BabyLive应用..."

# 停止并移除现有容器和卷
print_message "停止并移除现有容器和卷..."
docker-compose down -v

# 构建新镜像
print_message "构建新镜像..."
docker-compose build --no-cache

# 启动服务
print_message "启动服务..."
docker-compose up -d

# 显示容器状态
print_message "容器状态:"
docker-compose ps

print_message "${GREEN}✅ BabyLive 重建完成!${NC}"
