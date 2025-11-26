#!/bin/bash
set -e

REGION="ap-southeast-2"
CLUSTER="perspec-cluster"

echo "=========================================="
echo "ECS 서비스 업데이트"
echo "=========================================="
echo ""

# 백엔드 서비스 업데이트
echo "1. 백엔드 서비스 업데이트 중..."
aws ecs update-service \
  --cluster $CLUSTER \
  --service perspec-api-service \
  --force-new-deployment \
  --region $REGION \
  --query 'service.serviceName' \
  --output text

echo "✅ 백엔드 서비스 업데이트 완료"
echo ""

# 프론트엔드 서비스 업데이트
echo "2. 프론트엔드 서비스 업데이트 중..."
aws ecs update-service \
  --cluster $CLUSTER \
  --service perspec-client-service \
  --force-new-deployment \
  --region $REGION \
  --query 'service.serviceName' \
  --output text

echo "✅ 프론트엔드 서비스 업데이트 완료"
echo ""

echo "=========================================="
echo "✅ ECS 서비스 업데이트 완료!"
echo "=========================================="
echo ""
echo "배포 상태 확인:"
echo "aws ecs describe-services --cluster $CLUSTER --services perspec-api-service perspec-client-service --region $REGION"
echo ""

