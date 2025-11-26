#!/bin/bash
set -e

# 설정 변수
REGION="ap-southeast-2"
SECRET_NAME="perspec/production"
DOMAIN_NAME=""  # 예: perspec.ai

echo "=========================================="
echo "도메인 환경변수 업데이트 스크립트"
echo "=========================================="
echo ""

# 사용자 입력 받기
if [ -z "$DOMAIN_NAME" ]; then
    read -p "도메인 이름을 입력하세요 (예: perspec.ai): " DOMAIN_NAME
fi

# HTTPS URL 생성
HTTPS_DOMAIN="https://$DOMAIN_NAME"
HTTPS_WWW="https://www.$DOMAIN_NAME"

echo ""
echo "업데이트할 환경변수:"
echo "  CORS_ORIGIN: $HTTPS_DOMAIN,$HTTPS_WWW"
echo "  FRONTEND_URL: $HTTPS_DOMAIN"
echo "  APP_URL: $HTTPS_DOMAIN"
echo "  GOOGLE_CALLBACK_URL: $HTTPS_DOMAIN/api/v1/auth/google/callback"
echo "  KAKAO_CALLBACK_URL: $HTTPS_DOMAIN/api/v1/auth/kakao/callback"
echo "  NAVER_CALLBACK_URL: $HTTPS_DOMAIN/api/v1/auth/naver/callback"
echo ""

read -p "계속하시겠습니까? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
    echo "취소되었습니다."
    exit 0
fi

echo ""
echo "Secrets Manager에서 기존 시크릿 가져오는 중..."

# 기존 시크릿 가져오기
SECRET_JSON=$(aws secretsmanager get-secret-value \
    --secret-id $SECRET_NAME \
    --region $REGION \
    --query 'SecretString' \
    --output text)

if [ -z "$SECRET_JSON" ]; then
    echo "❌ 시크릿을 찾을 수 없습니다: $SECRET_NAME"
    exit 1
fi

# JSON 파싱 및 업데이트 (jq 사용)
if command -v jq &> /dev/null; then
    # jq가 설치되어 있으면 사용
    UPDATED_JSON=$(echo "$SECRET_JSON" | jq \
        --arg cors "$HTTPS_DOMAIN,$HTTPS_WWW" \
        --arg frontend "$HTTPS_DOMAIN" \
        --arg app "$HTTPS_DOMAIN" \
        --arg google "$HTTPS_DOMAIN/api/v1/auth/google/callback" \
        --arg kakao "$HTTPS_DOMAIN/api/v1/auth/kakao/callback" \
        --arg naver "$HTTPS_DOMAIN/api/v1/auth/naver/callback" \
        '.CORS_ORIGIN = $cors |
         .FRONTEND_URL = $frontend |
         .APP_URL = $app |
         .GOOGLE_CALLBACK_URL = $google |
         .KAKAO_CALLBACK_URL = $kakao |
         .NAVER_CALLBACK_URL = $naver')
else
    echo "⚠️  jq가 설치되어 있지 않습니다."
    echo "수동으로 Secrets Manager 콘솔에서 다음 값들을 업데이트하세요:"
    echo ""
    echo "CORS_ORIGIN=$HTTPS_DOMAIN,$HTTPS_WWW"
    echo "FRONTEND_URL=$HTTPS_DOMAIN"
    echo "APP_URL=$HTTPS_DOMAIN"
    echo "GOOGLE_CALLBACK_URL=$HTTPS_DOMAIN/api/v1/auth/google/callback"
    echo "KAKAO_CALLBACK_URL=$HTTPS_DOMAIN/api/v1/auth/kakao/callback"
    echo "NAVER_CALLBACK_URL=$HTTPS_DOMAIN/api/v1/auth/naver/callback"
    echo ""
    exit 0
fi

echo "시크릿 업데이트 중..."
aws secretsmanager put-secret-value \
    --secret-id $SECRET_NAME \
    --secret-string "$UPDATED_JSON" \
    --region $REGION > /dev/null

echo ""
echo "=========================================="
echo "✅ 환경변수 업데이트 완료!"
echo "=========================================="
echo ""
echo "다음 단계:"
echo "1. ECS 서비스 재시작 (환경변수 적용)"
echo "2. OAuth 앱 설정에서 콜백 URL 업데이트"
echo "3. 애플리케이션 테스트"
echo ""

