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

# 创建固定的打包输出目录
OUTPUT_DIR="./packages"
mkdir -p "${OUTPUT_DIR}"

# 创建打包目录
PACKAGE_DIR="./dist-package"
DATE=$(date +%Y%m%d_%H%M%S)
PACKAGE_NAME="babylive-${DATE}.tar.gz"
LATEST_PACKAGE="babylive-latest.tar.gz"

# 创建临时打包目录
mkdir -p "${PACKAGE_DIR}"

# 复制必要文件到打包目录
print_message "复制文件到打包目录..."
cp docker-compose.yml "${PACKAGE_DIR}/"
cp Dockerfile "${PACKAGE_DIR}/"
cp .dockerignore "${PACKAGE_DIR}/" 2>/dev/null || true
cp server.js "${PACKAGE_DIR}/"
cp package.json "${PACKAGE_DIR}/"
cp -r src "${PACKAGE_DIR}/"
cp -r public "${PACKAGE_DIR}/"
cp .env "${PACKAGE_DIR}/" 2>/dev/null || true
cp -r data "${PACKAGE_DIR}/" 2>/dev/null || true

# 复制部署脚本
cp deploy.sh "${PACKAGE_DIR}/"
chmod +x "${PACKAGE_DIR}/deploy.sh"

# 创建打包文件
print_message "创建打包文件..."
tar -czf "${OUTPUT_DIR}/${PACKAGE_NAME}" -C "${PACKAGE_DIR}" .

# 创建固定名称的副本
print_message "创建固定名称的部署包副本..."
cp "${OUTPUT_DIR}/${PACKAGE_NAME}" "${OUTPUT_DIR}/${LATEST_PACKAGE}"
cp "${OUTPUT_DIR}/${PACKAGE_NAME}" "/tmp/${LATEST_PACKAGE}"

# 清理临时文件
rm -rf "${PACKAGE_DIR}"

print_message "${GREEN}✅ 打包完成!${NC}"
print_message "部署包: ${YELLOW}${OUTPUT_DIR}/${PACKAGE_NAME}${NC}"
print_message "固定名称部署包: ${YELLOW}${OUTPUT_DIR}/${LATEST_PACKAGE}${NC}"

print_message "\n部署说明:"
print_message "1. 将打包文件传输到服务器: ${YELLOW}scp ${OUTPUT_DIR}/${LATEST_PACKAGE} 用户名@服务器IP:/tmp/${LATEST_PACKAGE}${NC}"
print_message "2. 登录到服务器: ${YELLOW}ssh 用户名@服务器IP${NC}"
print_message "3. 首次部署执行: ${YELLOW}sudo mkdir -p /opt/babylive && sudo tar -xzf /tmp/babylive-latest.tar.gz -C /opt/babylive && sudo chmod +x /opt/babylive/deploy.sh && sudo /opt/babylive/deploy.sh${NC}"
print_message "4. 后续更新执行: ${YELLOW}sudo /opt/babylive/deploy.sh${NC}"