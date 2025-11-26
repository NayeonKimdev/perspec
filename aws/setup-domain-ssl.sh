#!/bin/bash
set -e

# 설정 변수
REGION="ap-southeast-2"
ALB_ARN="arn:aws:elasticloadbalancing:ap-southeast-2:109968338833:loadbalancer/app/perspec-alb/d2c596b0fa478651"
DOMAIN_NAME=""  # 예: perspec.ai
CERTIFICATE_ARN=""  # ACM 인증서 ARN
API_TG_ARN="arn:aws:elasticloadbalancing:ap-southeast-2:109968338833:targetgroup/perspec-api-tg/fa1e470adb3196f4"
CLIENT_TG_ARN="arn:aws:elasticloadbalancing:ap-southeast-2:109968338833:targetgroup/perspec-client-tg/bd7da52d2791e96d"

echo "=========================================="
echo "도메인 및 SSL 설정 스크립트"
echo "=========================================="
echo ""

# 사용자 입력 받기
if [ -z "$DOMAIN_NAME" ]; then
    read -p "도메인 이름을 입력하세요 (예: perspec.ai): " DOMAIN_NAME
fi

if [ -z "$CERTIFICATE_ARN" ]; then
    echo ""
    echo "ACM 인증서 목록:"
    aws acm list-certificates --region $REGION --query 'CertificateSummaryList[*].[CertificateArn,DomainName,Status]' --output table
    echo ""
    read -p "SSL 인증서 ARN을 입력하세요: " CERTIFICATE_ARN
fi

# ALB 정보 확인
echo ""
echo "ALB 정보 확인 중..."
ALB_DNS=$(aws elbv2 describe-load-balancers \
    --load-balancer-arns $ALB_ARN \
    --region $REGION \
    --query 'LoadBalancers[0].DNSName' \
    --output text)

echo "ALB DNS: $ALB_DNS"
echo ""

# HTTP 리스너 ARN 확인
echo "HTTP 리스너(80) 확인 중..."
HTTP_LISTENER_ARN=$(aws elbv2 describe-listeners \
    --load-balancer-arn $ALB_ARN \
    --region $REGION \
    --query 'Listeners[?Port==`80`].ListenerArn' \
    --output text)

if [ -z "$HTTP_LISTENER_ARN" ]; then
    echo "❌ HTTP 리스너(80)를 찾을 수 없습니다."
    exit 1
fi

echo "HTTP 리스너 ARN: $HTTP_LISTENER_ARN"
echo ""

# HTTPS 리스너 확인
echo "HTTPS 리스너(443) 확인 중..."
HTTPS_LISTENER_ARN=$(aws elbv2 describe-listeners \
    --load-balancer-arn $ALB_ARN \
    --region $REGION \
    --query 'Listeners[?Port==`443`].ListenerArn' \
    --output text)

# HTTPS 리스너가 없으면 생성
if [ -z "$HTTPS_LISTENER_ARN" ]; then
    echo "HTTPS 리스너(443) 생성 중..."
    HTTPS_LISTENER_ARN=$(aws elbv2 create-listener \
        --load-balancer-arn $ALB_ARN \
        --protocol HTTPS \
        --port 443 \
        --certificates CertificateArn=$CERTIFICATE_ARN \
        --default-actions Type=forward,TargetGroupArn=$CLIENT_TG_ARN \
        --region $REGION \
        --query 'Listeners[0].ListenerArn' \
        --output text)
    
    echo "✅ HTTPS 리스너 생성 완료: $HTTPS_LISTENER_ARN"
else
    echo "✅ HTTPS 리스너가 이미 존재합니다: $HTTPS_LISTENER_ARN"
    
    # SSL 인증서 업데이트
    echo "SSL 인증서 업데이트 중..."
    aws elbv2 modify-listener \
        --listener-arn $HTTPS_LISTENER_ARN \
        --certificates CertificateArn=$CERTIFICATE_ARN \
        --region $REGION > /dev/null
    
    echo "✅ SSL 인증서 업데이트 완료"
fi

echo ""

# HTTPS 리스너 규칙 설정
echo "HTTPS 리스너 규칙 설정 중..."

# 기존 규칙 확인
EXISTING_RULES=$(aws elbv2 describe-rules \
    --listener-arn $HTTPS_LISTENER_ARN \
    --region $REGION \
    --query 'Rules[?Priority!=`default`].RuleArn' \
    --output text)

# API 규칙 확인
API_RULE_ARN=$(aws elbv2 describe-rules \
    --listener-arn $HTTPS_LISTENER_ARN \
    --region $REGION \
    --query 'Rules[?contains(Conditions[0].Values[0], `/api`)].RuleArn' \
    --output text)

if [ -z "$API_RULE_ARN" ]; then
    echo "API 경로 규칙(/api/*) 생성 중..."
    aws elbv2 create-rule \
        --listener-arn $HTTPS_LISTENER_ARN \
        --priority 1 \
        --conditions Field=path-pattern,Values='/api/*' \
        --actions Type=forward,TargetGroupArn=$API_TG_ARN \
        --region $REGION > /dev/null
    
    echo "✅ API 경로 규칙 생성 완료"
else
    echo "✅ API 경로 규칙이 이미 존재합니다"
fi

# 기본 규칙을 프론트엔드로 설정
echo "기본 규칙을 프론트엔드로 설정 중..."
aws elbv2 modify-listener \
    --listener-arn $HTTPS_LISTENER_ARN \
    --default-actions Type=forward,TargetGroupArn=$CLIENT_TG_ARN \
    --region $REGION > /dev/null

echo "✅ 기본 규칙 설정 완료"
echo ""

# HTTP → HTTPS 리다이렉트 설정
echo "HTTP → HTTPS 리다이렉트 설정 중..."

# 기존 HTTP 리스너 규칙 확인
HTTP_DEFAULT_ACTION=$(aws elbv2 describe-listeners \
    --listener-arns $HTTP_LISTENER_ARN \
    --region $REGION \
    --query 'Listeners[0].DefaultActions[0].Type' \
    --output text)

if [ "$HTTP_DEFAULT_ACTION" != "redirect" ]; then
    aws elbv2 modify-listener \
        --listener-arn $HTTP_LISTENER_ARN \
        --default-actions "Type=redirect,RedirectConfig={Protocol=HTTPS,Port=443,StatusCode=HTTP_301}" \
        --region $REGION > /dev/null
    
    echo "✅ HTTP → HTTPS 리다이렉트 설정 완료"
else
    echo "✅ HTTP → HTTPS 리다이렉트가 이미 설정되어 있습니다"
fi

echo ""
echo "=========================================="
echo "✅ SSL 설정 완료!"
echo "=========================================="
echo ""
echo "다음 단계:"
echo "1. Route 53에서 A 레코드 생성 확인"
echo "2. DNS 전파 대기 (보통 몇 시간)"
echo "3. https://$DOMAIN_NAME 접속 테스트"
echo "4. Secrets Manager에서 환경변수 업데이트"
echo ""

