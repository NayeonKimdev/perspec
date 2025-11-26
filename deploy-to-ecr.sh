#!/bin/bash
set -e

# 설정
REGION="ap-northeast-2"
ACCOUNT_ID="109968338833"
ECR_REGISTRY="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

echo "=========================================="
echo "Docker 이미지 빌드 및 ECR 푸시"
echo "=========================================="
echo ""

# ECR 로그인
echo "1. ECR 로그인 중..."
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_REGISTRY

if [ $? -ne 0 ]; then
    echo "❌ ECR 로그인 실패"
    exit 1
fi
echo "✅ ECR 로그인 성공"
echo ""

# 백엔드 이미지 빌드
echo "2. 백엔드 이미지 빌드 중..."
docker build -t perspec-api:latest -f server/Dockerfile .

if [ $? -ne 0 ]; then
    echo "❌ 백엔드 이미지 빌드 실패"
    exit 1
fi
echo "✅ 백엔드 이미지 빌드 완료"
echo ""

# 백엔드 이미지 태그 및 푸시
echo "3. 백엔드 이미지 태그 및 푸시 중..."
docker tag perspec-api:latest ${ECR_REGISTRY}/perspec-api:latest
docker push ${ECR_REGISTRY}/perspec-api:latest

if [ $? -ne 0 ]; then
    echo "❌ 백엔드 이미지 푸시 실패"
    exit 1
fi
echo "✅ 백엔드 이미지 푸시 완료"
echo ""

# 프론트엔드 이미지 빌드
echo "4. 프론트엔드 이미지 빌드 중..."
docker build -t perspec-client:latest -f client/Dockerfile ./client

if [ $? -ne 0 ]; then
    echo "❌ 프론트엔드 이미지 빌드 실패"
    exit 1
fi
echo "✅ 프론트엔드 이미지 빌드 완료"
echo ""

# 프론트엔드 이미지 태그 및 푸시
echo "5. 프론트엔드 이미지 태그 및 푸시 중..."
docker tag perspec-client:latest ${ECR_REGISTRY}/perspec-client:latest
docker push ${ECR_REGISTRY}/perspec-client:latest

if [ $? -ne 0 ]; then
    echo "❌ 프론트엔드 이미지 푸시 실패"
    exit 1
fi
echo "✅ 프론트엔드 이미지 푸시 완료"
echo ""

echo "=========================================="
echo "✅ 모든 이미지 푸시 완료!"
echo "=========================================="
echo ""
echo "다음 단계: ECS 서비스 업데이트"
echo ""

