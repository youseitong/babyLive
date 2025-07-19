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
DEPLOY_PACKAGE_NAME="deploy-babylive.tar.gz"

# 清理旧的打包目录
if [ -d "${PACKAGE_DIR}" ]; then
    print_message "清理旧的打包目录..."
    rm -rf "${PACKAGE_DIR}"
fi

print_message "创建打包目录: ${PACKAGE_DIR}"
mkdir -p "${PACKAGE_DIR}" || {
    print_error "创建打包目录失败"
    exit 1
}

# 3. 复制必要文件
print_message "正在复制文件..."

# 必需的文件
FILES=(
    "docker-compose.yml"
    "Dockerfile"
    ".dockerignore"
    "server.js"
    "package.json"
    "package-lock.json"
    "src"
    "public"
    ".env"
    "data"
)

# 可选配置文件
CONFIG_FILES=(
    ".env.production"
    ".gitignore"
    "vite.config.ts"
    "tsconfig.json"
    "tsconfig.app.json"
    "tsconfig.node.json"
)

for file in "${FILES[@]}"; do
    if [ -e "${file}" ]; then
        cp -r "${file}" "${PACKAGE_DIR}/" || {
            print_error "复制文件失败: ${file}"
            exit 1
        }
    else
        print_message "未找到文件: ${file}，跳过..."
    fi
done

# 复制可选配置文件
for file in "${CONFIG_FILES[@]}"; do
    if [ -e "${file}" ]; then
        cp -r "${file}" "${PACKAGE_DIR}/"
    else
        print_message "未找到可选配置文件: ${file}，跳过..."
    fi
done

# 4. 创建部署脚本
cat > "${PACKAGE_DIR}/deploy.sh" << 'EOF'
#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}[INFO]${NC} 开始部署BabyLive应用..."

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}[ERROR]${NC} Docker未安装，请先安装Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}[ERROR]${NC} Docker Compose未安装，请先安装Docker Compose"
    exit 1
fi

# 确保目标目录存在
mkdir -p /opt/babylive

# 检查当前目录
if [ ! -f "docker-compose.yml" ] || [ ! -f "Dockerfile" ]; then
    echo -e "${RED}[ERROR]${NC} 当前目录不包含必要的应用文件"
    echo -e "${GREEN}[INFO]${NC} 请确保您已解压部署包并进入解压后的目录"
    exit 1
fi

# 复制文件到部署目录
echo -e "${GREEN}[INFO]${NC} 复制文件到 /opt/babylive"
cp -r ./* /opt/babylive/

# 进入部署目录
cd /opt/babylive || { echo -e "${RED}[ERROR]${NC} 无法进入目录 /opt/babylive"; exit 1; }

# 确保data目录存在并设置权限
mkdir -p data
chmod -R 777 data

# 确保logs目录存在并设置权限
mkdir -p logs
chmod -R 777 logs

# 使用Docker部署
echo -e "${GREEN}[INFO]${NC} 构建Docker镜像..."
docker-compose build --no-cache

echo -e "${GREEN}[INFO]${NC} 启动Docker服务..."
docker-compose down
docker-compose up -d

echo -e "${GREEN}[INFO]${NC} 部署完成！应用已在后台运行"
echo -e "${GREEN}[INFO]${NC} 访问地址: http://$(hostname -I | awk '{print $1}'):3000"
echo -e "\n${GREEN}[INFO]${NC} 常用命令:"
echo -e "  查看日志: ${YELLOW}docker-compose logs -f${NC}"
echo -e "  重启服务: ${YELLOW}docker-compose restart${NC}"
echo -e "  停止服务: ${YELLOW}docker-compose down${NC}"
EOF

chmod +x "${PACKAGE_DIR}/deploy.sh"

# 5. 复制部署脚本到打包目录，方便用户直接使用
cp "${PACKAGE_DIR}/deploy.sh" "${PACKAGE_DIR}/deploy-babylive.sh"

# 6. 创建部署包
print_message "正在创建部署包: ${PACKAGE_NAME}"
tar -czf "${PACKAGE_NAME}" -C "${PACKAGE_DIR}" . || {
    print_error "创建部署包失败"
    exit 1
}

# 7. 创建deploy-babylive.tar.gz的副本，与deploy-babylive.sh名称匹配
cp "${PACKAGE_NAME}" "${DEPLOY_PACKAGE_NAME}" || {
    print_error "创建deploy-babylive.tar.gz失败"
    exit 1
}

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