@echo off
REM Perspec 프로젝트 - Windows용 빠른 실행 스크립트

echo ==========================================
echo Perspec 프로젝트 관리 스크립트
echo ==========================================
echo.

:menu
echo [1] 프로젝트 시작 (docker-compose up -d)
echo [2] 프로젝트 중지 (docker-compose down)
echo [3] 프로젝트 재시작 (docker-compose restart)
echo [4] 로그 확인 (docker-compose logs -f api)
echo [5] 상태 확인 (docker-compose ps)
echo [6] 마이그레이션 실행 (docker-compose exec api npm run migrate)
echo [7] 개발 모드 실행 (docker-compose -f docker-compose.dev.yml up)
echo [8] 데이터베이스 백업
echo [9] 컨테이너 재빌드 (docker-compose up -d --build)
echo [0] 종료
echo.
set /p choice="선택하세요 (0-9): "

if "%choice%"=="1" goto start
if "%choice%"=="2" goto stop
if "%choice%"=="3" goto restart
if "%choice%"=="4" goto logs
if "%choice%"=="5" goto status
if "%choice%"=="6" goto migrate
if "%choice%"=="7" goto dev
if "%choice%"=="8" goto backup
if "%choice%"=="9" goto rebuild
if "%choice%"=="0" goto end
goto menu

:start
echo.
echo 프로젝트 시작 중...
docker-compose up -d
echo.
echo ✅ 완료! http://localhost:5000 에서 확인하세요.
echo.
pause
goto menu

:stop
echo.
echo 프로젝트 중지 중...
docker-compose down
echo.
echo ✅ 완료!
echo.
pause
goto menu

:restart
echo.
echo 프로젝트 재시작 중...
docker-compose restart
echo.
echo ✅ 완료!
echo.
pause
goto menu

:logs
echo.
echo 로그 확인 중... (종료하려면 Ctrl+C)
echo.
docker-compose logs -f api
goto menu

:status
echo.
echo 컨테이너 상태 확인 중...
docker-compose ps
echo.
pause
goto menu

:migrate
echo.
echo 마이그레이션 실행 중...
docker-compose exec api npm run migrate
echo.
pause
goto menu

:dev
echo.
echo 개발 모드 실행 중... (종료하려면 Ctrl+C)
echo.
docker-compose -f docker-compose.dev.yml up
goto menu

:backup
echo.
echo 데이터베이스 백업 중...
set timestamp=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set timestamp=%timestamp: =0%
docker-compose exec -T postgres pg_dump -U postgres perspec > backups\backup_%timestamp%.sql
echo.
echo ✅ 백업 완료: backups\backup_%timestamp%.sql
echo.
pause
goto menu

:rebuild
echo.
echo 컨테이너 재빌드 중...
docker-compose up -d --build
echo.
echo ✅ 완료!
echo.
pause
goto menu

:end
echo.
echo 종료합니다.
exit

