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

# 检查Docker是否运行
if ! docker info >/dev/null 2>&1; then
    print_error "Docker未运行，请先启动Docker"
    exit 1
fi

print_message "开始构建BabyLive应用..."

# 1. 构建前端
print_message "正在安装前端依赖..."
npm install || {
    print_error "前端依赖安装失败"
    exit 1
}

print_message "正在构建前端代码..."
npm run build || {
    print_error "前端构建失败"
    exit 1
}

# 2. 构建Docker镜像
print_message "正在构建Docker镜像..."
docker-compose build || {
    print_error "Docker镜像构建失败"
    exit 1
}

# 3. 创建打包目录
PACKAGE_DIR="./dist-package"
PACKAGE_NAME="babylive-$(date +%Y%m%d_%H%M%S).tar.gz"
TEMP_DIR="/tmp/babylive-package-$(date +%s)"

print_message "创建临时目录: ${TEMP_DIR}"
mkdir -p "${TEMP_DIR}" || {
    print_error "创建临时目录失败"
    exit 1
}

# 4. 复制必要文件
print_message "正在复制文件..."

# 必需的文件
FILES=(
    "docker-compose.yml"
    "Dockerfile"
    "dist"
    "server.js"
    "package.json"
    "package-lock.json"
)

# 可选配置文件
CONFIG_FILES=(
    ".env"
    ".env.production"
)

for file in "${FILES[@]}"; do
    if [ -e "${file}" ]; then
        cp -r "${file}" "${TEMP_DIR}/" || {
            print_error "复制文件失败: ${file}"
            exit 1
        }
    else
        print_error "未找到必需文件: ${file}"
        exit 1
    fi
done

# 复制可选配置文件
for file in "${CONFIG_FILES[@]}"; do
    if [ -e "${file}" ]; then
        cp -r "${file}" "${TEMP_DIR}/"
    else
        print_message "未找到可选配置文件: ${file}，跳过..."
    fi
done

# 5. 创建打包脚本
cat > "${TEMP_DIR}/deploy.sh" << 'EOF'
#!/bin/bash

# 解压部署包
tar -xzf /tmp/babylive-latest.tar.gz -C /opt/babylive
cd /opt/babylive || exit 1

# 启动服务
docker-compose up -d

echo "部署完成！"
EOF

chmod +x "${TEMP_DIR}/deploy.sh"

# 6. 打包
print_message "正在创建部署包: ${PACKAGE_DIR}/${PACKAGE_NAME}"
mkdir -p "${PACKAGE_DIR}"
tar -czf "${PACKAGE_DIR}/${PACKAGE_NAME}" -C "$(dirname "${TEMP_DIR}")" "$(basename "${TEMP_DIR}")" || {
    print_error "创建部署包失败"
    exit 1
}

# 7. 创建最新版本的软链接
LATEST_PACKAGE="${PACKAGE_DIR}/babylive-latest.tar.gz"
ln -sf "${PACKAGE_DIR}/${PACKAGE_NAME}" "${LATEST_PACKAGE}"

# 8. 清理临时文件
rm -rf "${TEMP_DIR}"

print_message "${GREEN}✅ 打包完成!${NC}"
print_message "部署包路径: ${YELLOW}${PACKAGE_DIR}/${PACKAGE_NAME}${NC}"
print_message "最新部署包: ${YELLOW}${LATEST_PACKAGE}${NC}"
print_message "\n部署说明:"
print_message "1. 将 ${YELLOW}${LATEST_PACKAGE}${NC} 复制到目标服务器"
print_message "2. 在目标服务器上运行: ${YELLOW}tar -xzf babylive-latest.tar.gz -C /opt/babylive${NC}"
print_message "3. 进入目录: ${YELLOW}cd /opt/babylive${NC}"
print_message "4. 执行部署: ${YELLOW}./deploy.sh${NC}"
tar --format=ustar -czf babylive-$DATE.tar.gz ./dist-package/*

# 清理临时文件
rm -rf ./dist-package

echo "打包完成: babylive-$DATE.tar.gz"