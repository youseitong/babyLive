#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 函数：打印带颜色的消息
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

# 检查是否以root用户运行
if [ "$(id -u)" -ne 0 ]; then
    print_error "请使用root用户运行此脚本"
    exit 1
fi

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    print_error "Docker未安装，请先安装Docker"
    exit 1
fi

# 检查Docker Compose是否安装
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose未安装，请先安装Docker Compose"
    exit 1
fi

# 配置
WORK_DIR="/opt/babylive"
BACKUP_DIR="/opt/babylive_backups"
PACKAGE_PATH="/tmp/babylive-latest.tar.gz"
ENV_FILE="${WORK_DIR}/.env"
BACKUP_TIMESTAMP=$(date +"%Y%m%d%H%M%S")

# 加载环境变量
load_env() {
    if [ -f "${ENV_FILE}" ]; then
        print_message "加载环境变量从 ${ENV_FILE}..."
        source "${ENV_FILE}"
    fi
}

# 备份现有数据
backup_existing() {
    if [ -d "${WORK_DIR}" ]; then
        print_message "备份现有数据..."
        mkdir -p "${BACKUP_DIR}"
        local backup_name="${BACKUP_DIR}/backup_${BACKUP_TIMESTAMP}.tar.gz"
        tar -czf "${backup_name}" -C "${WORK_DIR}" .
        print_message "数据已备份至: ${backup_name}"
    fi
}

# 准备部署目录
prepare_deployment() {
    print_message "准备部署目录: ${WORK_DIR}"
    mkdir -p "${WORK_DIR}" || {
        print_error "创建目录失败: ${WORK_DIR}"
        exit 1
    }

    # 检查部署包
    if [ ! -f "${PACKAGE_PATH}" ]; then
        print_error "未找到部署包: ${PACKAGE_PATH}"
        print_message "请将部署包复制到 ${PACKAGE_PATH} 后重试"
        exit 1
    fi

    # 解压部署包
    print_message "正在解压部署包..."
    tar -xzf "${PACKAGE_PATH}" -C "${WORK_DIR}" || {
        print_error "解压部署包失败"
        exit 1
    }

    # 恢复环境变量
    if [ -f "${WORK_DIR}/.env.example" ] && [ ! -f "${WORK_DIR}/.env" ]; then
        cp "${WORK_DIR}/.env.example" "${ENV_FILE}"
        print_message "已创建新的 .env 文件，请根据需要进行配置"
    fi

    # 设置文件权限
    print_message "设置文件权限..."
    chown -R www-data:www-data "${WORK_DIR}" || true
    find "${WORK_DIR}" -type d -exec chmod 755 {} \;
    find "${WORK_DIR}" -type f -exec chmod 644 {} \;
    chmod 750 "${WORK_DIR}"
    chmod +x "${WORK_DIR}/deploy.sh"
}

# 部署应用
deploy_application() {
    cd "${WORK_DIR}" || {
        print_error "无法进入目录: ${WORK_DIR}"
        exit 1
    }

    # 加载环境变量
    load_env

    # 构建并启动容器
    print_message "正在启动Docker容器..."
    
    # 停止并清理旧容器
    print_message "清理现有容器..."
    docker-compose down -v --remove-orphans || true
    
    # 拉取最新镜像
    print_message "拉取最新Docker镜像..."
    docker-compose pull || {
        print_message "${YELLOW}警告: 拉取Docker镜像失败，尝试本地构建...${NC}"
    }
    
    # 构建镜像
    print_message "构建Docker镜像..."
    docker-compose build --no-cache || {
        print_error "Docker镜像构建失败"
        exit 1
    }
    
    # 启动服务
    print_message "启动服务..."
    docker-compose up -d --force-recreate --remove-orphans || {
        print_error "启动容器失败"
        exit 1
    }
    
    # 检查服务状态
    check_services
}

# 检查服务状态
check_services() {
    print_message "检查服务状态..."
    
    # 等待服务启动
    print_message "等待服务启动..."
    sleep 10
    
    # 检查容器状态
    if ! docker-compose ps | grep -q "Up"; then
        print_error "服务启动失败，请检查日志"
        docker-compose logs
        exit 1
    fi
    
    # 显示容器状态
    print_message "容器状态:"
    docker-compose ps
    
    # 显示访问信息
    local ip_address
    ip_address=$(hostname -I | awk '{print $1}')
    
    echo -e "\n${GREEN}✅ BabyLive 部署成功!${NC}\n"
    echo -e "访问地址:"
    echo -e "- 本地访问: ${BLUE}http://localhost:3000${NC}"
    echo -e "- 网络访问: ${BLUE}http://${ip_address}:3000${NC}\n"
    echo -e "管理命令:"
    echo -e "- 查看日志:   ${YELLOW}cd ${WORK_DIR} && docker-compose logs -f${NC}"
    echo -e "- 停止服务:   ${YELLOW}cd ${WORK_DIR} && docker-compose down${NC}"
    echo -e "- 重启服务:   ${YELLOW}cd ${WORK_DIR} && docker-compose restart${NC}"
    echo -e "- 更新应用:   ${YELLOW}重新运行此部署脚本${NC}\n"
}

# 主函数
main() {
    echo -e "\n${GREEN}=== BabyLive 部署脚本 ===${NC}\n"
    
    # 检查Docker和Docker Compose
    check_dependencies
    
    # 备份现有数据
    backup_existing
    
    # 准备部署
    prepare_deployment
    
    # 部署应用
    deploy_application
}

# 检查依赖
check_dependencies() {
    local missing_deps=0
    
    # 检查Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker未安装，请先安装Docker"
        missing_deps=$((missing_deps + 1))
    fi
    
    # 检查Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose未安装，请先安装Docker Compose"
        missing_deps=$((missing_deps + 1))
    fi
    
    # 如果有依赖缺失，退出
    if [ $missing_deps -gt 0 ]; then
        exit 1
    fi
}

# 执行主函数
main "$@"

# 添加命令行参数处理
case "$1" in
  "")
    # 默认行为：部署应用
    main
    ;;
  "stop")
    # 停止应用
    cd "${WORK_DIR}" && docker-compose down -v
    ;;
  "update")
    # 更新应用
    cd "${WORK_DIR}" && docker-compose pull && docker-compose up -d && docker-compose ps
    ;;
  "monitor")
    # 监控应用
    cd "${WORK_DIR}" && docker-compose ps && docker stats --no-stream && docker-compose logs --tail=100
    ;;
  "help")
    # 显示帮助信息
    echo -e "\n${GREEN}=== BabyLive 部署脚本 ===${NC}\n"
    echo -e "用法: $0 [选项]\n"
    echo -e "选项:"
    echo -e "  无参数    执行完整部署流程"
    echo -e "  stop      停止应用"
    echo -e "  update    更新应用"
    echo -e "  monitor   监控应用状态"
    echo -e "  help      显示此帮助信息\n"
    ;;
  *)
    echo -e "${RED}[ERROR]${NC} 未知选项: $1"
    echo -e "使用 '$0 help' 查看可用选项"
    exit 1
    ;;
esac
