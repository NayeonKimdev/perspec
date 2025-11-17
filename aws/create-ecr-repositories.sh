#!/bin/bash
set -e

# AWS 리전 설정 (워크플로우와 동일하게)
REGION="ap-northeast-2"
ACCOUNT_ID="109968338833"

echo "ECR 리포지토리 생성 중..."
echo "리전: $REGION"
echo "계정 ID: $ACCOUNT_ID"

# 백엔드 리포지토리 생성
echo ""
echo "1. 백엔드 리포지토리 (perspec-api) 생성 중..."
aws ecr create-repository \
  --repository-name perspec-api \
  --region $REGION \
  --image-scanning-configuration scanOnPush=true \
  --encryption-configuration encryptionType=AES256 \
  2>&1 | grep -v "RepositoryAlreadyExistsException" || echo "  ✓ 리포지토리가 이미 존재합니다."

# 프론트엔드 리포지토리 생성
echo ""
echo "2. 프론트엔드 리포지토리 (perspec-client) 생성 중..."
aws ecr create-repository \
  --repository-name perspec-client \
  --region $REGION \
  --image-scanning-configuration scanOnPush=true \
  --encryption-configuration encryptionType=AES256 \
  2>&1 | grep -v "RepositoryAlreadyExistsException" || echo "  ✓ 리포지토리가 이미 존재합니다."

echo ""
echo "✅ ECR 리포지토리 생성 완료!"
echo ""
echo "생성된 리포지토리 URI:"
echo "  - API: ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/perspec-api"
echo "  - Client: ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/perspec-client"

