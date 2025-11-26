#!/bin/bash
set -e

# 설정 변수
REGION="ap-southeast-2"
DOMAIN_NAME=""  # 예: perspec.ai
ALB_ARN="arn:aws:elasticloadbalancing:ap-southeast-2:109968338833:loadbalancer/app/perspec-alb/d2c596b0fa478651"

echo "=========================================="
echo "Route 53 레코드 생성 스크립트"
echo "=========================================="
echo ""

# 사용자 입력 받기
if [ -z "$DOMAIN_NAME" ]; then
    read -p "도메인 이름을 입력하세요 (예: perspec.ai): " DOMAIN_NAME
fi

# 호스팅 영역 확인
echo "호스팅 영역 확인 중..."
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones \
    --query "HostedZones[?Name=='${DOMAIN_NAME}.'].[Id]" \
    --output text | cut -d'/' -f3)

if [ -z "$HOSTED_ZONE_ID" ]; then
    echo "❌ 호스팅 영역을 찾을 수 없습니다: $DOMAIN_NAME"
    echo ""
    echo "호스팅 영역 목록:"
    aws route53 list-hosted-zones --query 'HostedZones[*].[Name,Id]' --output table
    echo ""
    read -p "호스팅 영역 ID를 직접 입력하세요 (예: Z1234567890ABC): " HOSTED_ZONE_ID
fi

echo "호스팅 영역 ID: $HOSTED_ZONE_ID"
echo ""

# ALB 정보 가져오기
echo "ALB 정보 가져오는 중..."
ALB_DNS=$(aws elbv2 describe-load-balancers \
    --load-balancer-arns $ALB_ARN \
    --region $REGION \
    --query 'LoadBalancers[0].DNSName' \
    --output text)

ALB_HOSTED_ZONE_ID=$(aws elbv2 describe-load-balancers \
    --load-balancer-arns $ALB_ARN \
    --region $REGION \
    --query 'LoadBalancers[0].CanonicalHostedZoneId' \
    --output text)

echo "ALB DNS: $ALB_DNS"
echo "ALB Hosted Zone ID: $ALB_HOSTED_ZONE_ID"
echo ""

# 루트 도메인 A 레코드 생성
echo "루트 도메인 A 레코드 생성 중..."
aws route53 change-resource-record-sets \
    --hosted-zone-id $HOSTED_ZONE_ID \
    --change-batch "{
        \"Changes\": [{
            \"Action\": \"UPSERT\",
            \"ResourceRecordSet\": {
                \"Name\": \"$DOMAIN_NAME\",
                \"Type\": \"A\",
                \"AliasTarget\": {
                    \"HostedZoneId\": \"$ALB_HOSTED_ZONE_ID\",
                    \"DNSName\": \"$ALB_DNS\",
                    \"EvaluateTargetHealth\": false
                }
            }
        }]
    }" > /dev/null

echo "✅ 루트 도메인 A 레코드 생성 완료"
echo ""

# www 서브도메인 A 레코드 생성
echo "www 서브도메인 A 레코드 생성 중..."
aws route53 change-resource-record-sets \
    --hosted-zone-id $HOSTED_ZONE_ID \
    --change-batch "{
        \"Changes\": [{
            \"Action\": \"UPSERT\",
            \"ResourceRecordSet\": {
                \"Name\": \"www.$DOMAIN_NAME\",
                \"Type\": \"A\",
                \"AliasTarget\": {
                    \"HostedZoneId\": \"$ALB_HOSTED_ZONE_ID\",
                    \"DNSName\": \"$ALB_DNS\",
                    \"EvaluateTargetHealth\": false
                }
            }
        }]
    }" > /dev/null

echo "✅ www 서브도메인 A 레코드 생성 완료"
echo ""

echo "=========================================="
echo "✅ Route 53 레코드 생성 완료!"
echo "=========================================="
echo ""
echo "생성된 레코드:"
echo "  - $DOMAIN_NAME → ALB"
echo "  - www.$DOMAIN_NAME → ALB"
echo ""
echo "다음 단계:"
echo "1. DNS 전파 대기 (보통 몇 시간)"
echo "2. DNS 확인: dig $DOMAIN_NAME"
echo "3. SSL 인증서 설정"
echo ""

