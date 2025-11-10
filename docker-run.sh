#!/bin/bash
# Perspec 프로젝트 - Linux/Mac용 빠른 실행 스크립트

show_menu() {
    clear
    echo "=========================================="
    echo "Perspec 프로젝트 관리 스크립트"
    echo "=========================================="
    echo ""
    echo "[1] 프로젝트 시작 (docker-compose up -d)"
    echo "[2] 프로젝트 중지 (docker-compose down)"
    echo "[3] 프로젝트 재시작 (docker-compose restart)"
    echo "[4] 로그 확인 (docker-compose logs -f api)"
    echo "[5] 상태 확인 (docker-compose ps)"
    echo "[6] 마이그레이션 실행"
    echo "[7] 개발 모드 실행"
    echo "[8] 데이터베이스 백업"
    echo "[9] 컨테이너 재빌드"
    echo "[0] 종료"
    echo ""
}

start_project() {
    echo ""
    echo "프로젝트 시작 중..."
    docker-compose up -d
    echo ""
    echo "✅ 완료! http://localhost:5000 에서 확인하세요."
    echo ""
    read -p "계속하려면 Enter를 누르세요..."
}

stop_project() {
    echo ""
    echo "프로젝트 중지 중..."
    docker-compose down
    echo ""
    echo "✅ 완료!"
    echo ""
    read -p "계속하려면 Enter를 누르세요..."
}

restart_project() {
    echo ""
    echo "프로젝트 재시작 중..."
    docker-compose restart
    echo ""
    echo "✅ 완료!"
    echo ""
    read -p "계속하려면 Enter를 누르세요..."
}

show_logs() {
    echo ""
    echo "로그 확인 중... (종료하려면 Ctrl+C)"
    echo ""
    docker-compose logs -f api
}

show_status() {
    echo ""
    echo "컨테이너 상태 확인 중..."
    docker-compose ps
    echo ""
    read -p "계속하려면 Enter를 누르세요..."
}

run_migrate() {
    echo ""
    echo "마이그레이션 실행 중..."
    docker-compose exec api npm run migrate
    echo ""
    read -p "계속하려면 Enter를 누르세요..."
}

run_dev() {
    echo ""
    echo "개발 모드 실행 중... (종료하려면 Ctrl+C)"
    echo ""
    docker-compose -f docker-compose.dev.yml up
}

backup_db() {
    echo ""
    echo "데이터베이스 백업 중..."
    timestamp=$(date +%Y%m%d_%H%M%S)
    mkdir -p backups
    docker-compose exec -T postgres pg_dump -U postgres perspec > backups/backup_${timestamp}.sql
    echo ""
    echo "✅ 백업 완료: backups/backup_${timestamp}.sql"
    echo ""
    read -p "계속하려면 Enter를 누르세요..."
}

rebuild_project() {
    echo ""
    echo "컨테이너 재빌드 중..."
    docker-compose up -d --build
    echo ""
    echo "✅ 완료!"
    echo ""
    read -p "계속하려면 Enter를 누르세요..."
}

while true; do
    show_menu
    read -p "선택하세요 (0-9): " choice
    
    case $choice in
        1) start_project ;;
        2) stop_project ;;
        3) restart_project ;;
        4) show_logs ;;
        5) show_status ;;
        6) run_migrate ;;
        7) run_dev ;;
        8) backup_db ;;
        9) rebuild_project ;;
        0) echo ""; echo "종료합니다."; exit 0 ;;
        *) echo ""; echo "잘못된 선택입니다."; sleep 1 ;;
    esac
done
