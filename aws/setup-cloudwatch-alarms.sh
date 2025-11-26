#!/bin/bash
set -e

REGION="ap-southeast-2"
CLUSTER="perspec-cluster"
API_SERVICE="perspec-api-service"
CLIENT_SERVICE="perspec-client-service"
ALB_ARN="arn:aws:elasticloadbalancing:ap-southeast-2:109968338833:loadbalancer/app/perspec-alb/d2c596b0fa478651"
SNS_TOPIC_ARN=""  # SNS 토픽 ARN (없으면 생성)

echo "=========================================="
echo "CloudWatch 알람 설정"
echo "=========================================="
echo ""

# SNS 토픽 생성 또는 확인
if [ -z "$SNS_TOPIC_ARN" ]; then
    echo "SNS 토픽 확인 중..."
    SNS_TOPIC_ARN=$(aws sns list-topics --region $REGION --query "Topics[?contains(TopicArn, 'perspec-alerts')].TopicArn" --output text)
    
    if [ -z "$SNS_TOPIC_ARN" ]; then
        echo "SNS 토픽 생성 중..."
        SNS_TOPIC_ARN=$(aws sns create-topic --name perspec-alerts --region $REGION --query 'TopicArn' --output text)
        echo "✅ SNS 토픽 생성 완료: $SNS_TOPIC_ARN"
        echo ""
        echo "⚠️  이메일 구독을 설정하세요:"
        echo "aws sns subscribe --topic-arn $SNS_TOPIC_ARN --protocol email --notification-endpoint your-email@example.com --region $REGION"
    else
        echo "✅ 기존 SNS 토픽 사용: $SNS_TOPIC_ARN"
    fi
fi

echo ""

# 1. ECS 서비스 CPU 사용률 알람
echo "1. ECS API 서비스 CPU 사용률 알람 생성 중..."
aws cloudwatch put-metric-alarm \
    --alarm-name perspec-api-cpu-high \
    --alarm-description "API 서비스 CPU 사용률이 80% 초과" \
    --metric-name CPUUtilization \
    --namespace AWS/ECS \
    --statistic Average \
    --period 300 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 2 \
    --alarm-actions $SNS_TOPIC_ARN \
    --dimensions Name=ServiceName,Value=$API_SERVICE Name=ClusterName,Value=$CLUSTER \
    --region $REGION \
    --treat-missing-data breaching \
    > /dev/null
echo "✅ API CPU 알람 생성 완료"

echo "2. ECS Client 서비스 CPU 사용률 알람 생성 중..."
aws cloudwatch put-metric-alarm \
    --alarm-name perspec-client-cpu-high \
    --alarm-description "Client 서비스 CPU 사용률이 80% 초과" \
    --metric-name CPUUtilization \
    --namespace AWS/ECS \
    --statistic Average \
    --period 300 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 2 \
    --alarm-actions $SNS_TOPIC_ARN \
    --dimensions Name=ServiceName,Value=$CLIENT_SERVICE Name=ClusterName,Value=$CLUSTER \
    --region $REGION \
    --treat-missing-data breaching \
    > /dev/null
echo "✅ Client CPU 알람 생성 완료"

# 3. ECS 서비스 메모리 사용률 알람
echo "3. ECS API 서비스 메모리 사용률 알람 생성 중..."
aws cloudwatch put-metric-alarm \
    --alarm-name perspec-api-memory-high \
    --alarm-description "API 서비스 메모리 사용률이 80% 초과" \
    --metric-name MemoryUtilization \
    --namespace AWS/ECS \
    --statistic Average \
    --period 300 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 2 \
    --alarm-actions $SNS_TOPIC_ARN \
    --dimensions Name=ServiceName,Value=$API_SERVICE Name=ClusterName,Value=$CLUSTER \
    --region $REGION \
    --treat-missing-data breaching \
    > /dev/null
echo "✅ API 메모리 알람 생성 완료"

# 4. ECS 서비스 실행 중인 태스크 수 알람
echo "4. ECS API 서비스 태스크 수 알람 생성 중..."
aws cloudwatch put-metric-alarm \
    --alarm-name perspec-api-running-tasks-low \
    --alarm-description "API 서비스 실행 중인 태스크가 1개 미만" \
    --metric-name RunningTaskCount \
    --namespace AWS/ECS \
    --statistic Average \
    --period 60 \
    --threshold 1 \
    --comparison-operator LessThanThreshold \
    --evaluation-periods 1 \
    --alarm-actions $SNS_TOPIC_ARN \
    --dimensions Name=ServiceName,Value=$API_SERVICE Name=ClusterName,Value=$CLUSTER \
    --region $REGION \
    --treat-missing-data breaching \
    > /dev/null
echo "✅ API 태스크 수 알람 생성 완료"

# 5. ALB HTTP 5xx 에러율 알람
echo "5. ALB HTTP 5xx 에러율 알람 생성 중..."
ALB_NAME=$(echo $ALB_ARN | cut -d'/' -f2)
aws cloudwatch put-metric-alarm \
    --alarm-name perspec-alb-5xx-errors \
    --alarm-description "ALB HTTP 5xx 에러율이 5% 초과" \
    --metric-name HTTPCode_Target_5XX_Count \
    --namespace AWS/ApplicationELB \
    --statistic Sum \
    --period 60 \
    --threshold 10 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 2 \
    --alarm-actions $SNS_TOPIC_ARN \
    --dimensions Name=LoadBalancer,Value=$ALB_NAME \
    --region $REGION \
    --treat-missing-data notBreaching \
    > /dev/null
echo "✅ ALB 5xx 에러 알람 생성 완료"

# 6. ALB 타겟 응답 시간 알람
echo "6. ALB 타겟 응답 시간 알람 생성 중..."
aws cloudwatch put-metric-alarm \
    --alarm-name perspec-alb-response-time-high \
    --alarm-description "ALB 타겟 응답 시간이 5초 초과" \
    --metric-name TargetResponseTime \
    --namespace AWS/ApplicationELB \
    --statistic Average \
    --period 60 \
    --threshold 5 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 2 \
    --alarm-actions $SNS_TOPIC_ARN \
    --dimensions Name=LoadBalancer,Value=$ALB_NAME \
    --region $REGION \
    --treat-missing-data notBreaching \
    > /dev/null
echo "✅ ALB 응답 시간 알람 생성 완료"

# 7. ALB Healthy Host Count 알람
echo "7. ALB Healthy Host Count 알람 생성 중..."
API_TG_NAME=$(echo "arn:aws:elasticloadbalancing:ap-southeast-2:109968338833:targetgroup/perspec-api-tg/fa1e470adb3196f4" | cut -d'/' -f2)
aws cloudwatch put-metric-alarm \
    --alarm-name perspec-api-tg-unhealthy \
    --alarm-description "API Target Group Healthy Host가 1개 미만" \
    --metric-name HealthyHostCount \
    --namespace AWS/ApplicationELB \
    --statistic Average \
    --period 60 \
    --threshold 1 \
    --comparison-operator LessThanThreshold \
    --evaluation-periods 1 \
    --alarm-actions $SNS_TOPIC_ARN \
    --dimensions Name=TargetGroup,Value=$API_TG_NAME Name=LoadBalancer,Value=$ALB_NAME \
    --region $REGION \
    --treat-missing-data breaching \
    > /dev/null
echo "✅ API Target Group Health 알람 생성 완료"

echo ""
echo "=========================================="
echo "✅ CloudWatch 알람 설정 완료!"
echo "=========================================="
echo ""
echo "생성된 알람:"
echo "  - perspec-api-cpu-high"
echo "  - perspec-client-cpu-high"
echo "  - perspec-api-memory-high"
echo "  - perspec-api-running-tasks-low"
echo "  - perspec-alb-5xx-errors"
echo "  - perspec-alb-response-time-high"
echo "  - perspec-api-tg-unhealthy"
echo ""
echo "SNS 토픽: $SNS_TOPIC_ARN"
echo ""
echo "다음 단계:"
echo "1. 이메일 구독 설정:"
echo "   aws sns subscribe --topic-arn $SNS_TOPIC_ARN --protocol email --notification-endpoint your-email@example.com --region $REGION"
echo "2. CloudWatch 대시보드 생성"
echo "3. Sentry 통합 (선택)"
echo ""

