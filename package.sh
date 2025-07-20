#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 函数：打印带颜色的消息
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

# 检查是否在项目根目录
if [ ! -f "package.json" ] || [ ! -f "docker-compose.yml" ]; then
    print_error "请在项目根目录下运行此脚本"
    exit 1
fi

print_message "开始打包BabyLive应用..."

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    print_error "Docker未安装，请先安装Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose未安装，请先安装Docker Compose"
    exit 1
fi

# 2. 创建打包目录
PACKAGE_DIR="./dist-package"
DATE=$(date +%Y%m%d_%H%M%S)
PACKAGE_NAME="babylive-${DATE}.tar.gz"
# 修改第7行，删除以下内容
DEPLOY_PACKAGE_NAME="deploy-babylive.tar.gz"

# 修改第182-183行，删除以下内容
# 7. 创建deploy-babylive.tar.gz的副本，与deploy-babylive.sh名称匹配
cp "${PACKAGE_NAME}" "${DEPLOY_PACKAGE_NAME}" || {
    print_error "创建deploy-babylive.tar.gz失败"
    exit 1
}

# 修改第190-191行，删除以下内容
print_message "部署脚本包: ${YELLOW}${DEPLOY_PACKAGE_NAME}${NC}"

# 修改第197-198行，删除以下内容
print_message "\n方法2:"
print_message "1. 将 ${YELLOW}${DEPLOY_PACKAGE_NAME}${NC} 和 ${YELLOW}deploy-babylive.sh${NC} 复制到目标服务器同一目录"
print_message "2. 在目标服务器上运行: ${YELLOW}./deploy-babylive.sh${NC}"

# 8. 清理临时文件
rm -rf "${PACKAGE_DIR}"

print_message "${GREEN}✅ 打包完成!${NC}"
print_message "部署包: ${YELLOW}${PACKAGE_NAME}${NC}"
print_message "部署脚本包: ${YELLOW}${DEPLOY_PACKAGE_NAME}${NC}"
print_message "\n部署说明:"
print_message "方法1 (推荐):"
print_message "1. 将 ${YELLOW}${PACKAGE_NAME}${NC} 复制到目标服务器"
print_message "2. 在目标服务器上解压: ${YELLOW}tar -xzf ${PACKAGE_NAME}${NC}"
print_message "3. 进入解压目录"
print_message "4. 运行部署脚本: ${YELLOW}./deploy.sh${NC}"
print_message "\n方法2:"
print_message "1. 将 ${YELLOW}${DEPLOY_PACKAGE_NAME}${NC} 和 ${YELLOW}deploy-babylive.sh${NC} 复制到目标服务器同一目录"
print_message "2. 在目标服务器上运行: ${YELLOW}./deploy-babylive.sh${NC}"