#!/bin/bash
set -e

REGION="ap-southeast-2"
CLUSTER="perspec-cluster"
VPC_ID="vpc-07632b74bc88cfd52"
SUBNET_1="subnet-030cbe96d629b4f6a"
SUBNET_2="subnet-039c3f5089f548e70"
SUBNET_3="subnet-091591b28ecd078fa"
ECS_SG="sg-04f2f25364af203a0"
ALB_ARN="arn:aws:elasticloadbalancing:ap-southeast-2:109968338833:loadbalancer/app/perspec-alb/d2c596b0fa478651"
API_TG_ARN="arn:aws:elasticloadbalancing:ap-southeast-2:109968338833:targetgroup/perspec-api-tg/fa1e470adb3196f4"
CLIENT_TG_ARN="arn:aws:elasticloadbalancing:ap-southeast-2:109968338833:targetgroup/perspec-client-tg/bd7da52d2791e96d"

echo "Creating ECS services..."

# 백엔드 서비스 생성
echo "Creating API service..."
aws ecs create-service \
  --cluster $CLUSTER \
  --service-name perspec-api-service \
  --task-definition perspec-api \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_1,$SUBNET_2,$SUBNET_3],securityGroups=[$ECS_SG],assignPublicIp=ENABLED}" \
  --load-balancers targetGroupArn=$API_TG_ARN,containerName=perspec-api,containerPort=5000 \
  --region $REGION \
  --query 'service.serviceName' \
  --output text

# 프론트엔드 서비스 생성
echo "Creating Client service..."
aws ecs create-service \
  --cluster $CLUSTER \
  --service-name perspec-client-service \
  --task-definition perspec-client \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_1,$SUBNET_2,$SUBNET_3],securityGroups=[$ECS_SG],assignPublicIp=ENABLED}" \
  --load-balancers targetGroupArn=$CLIENT_TG_ARN,containerName=perspec-client,containerPort=80 \
  --region $REGION \
  --query 'service.serviceName' \
  --output text

echo "ECS services created successfully!"

