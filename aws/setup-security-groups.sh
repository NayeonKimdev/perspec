#!/bin/bash
set -e

REGION="ap-southeast-2"
ALB_SG="sg-039bc4b22ce8e6310"
ECS_SG="sg-04f2f25364af203a0"

echo "Adding ALB security group rules..."
aws ec2 authorize-security-group-ingress --group-id $ALB_SG --protocol tcp --port 443 --cidr 0.0.0.0/0 --region $REGION 2>&1 | grep -v "InvalidPermission.Duplicate" || true

echo "Adding ECS security group rules..."
aws ec2 authorize-security-group-ingress --group-id $ECS_SG --protocol tcp --port 5000 --source-group $ALB_SG --region $REGION 2>&1 | grep -v "InvalidPermission.Duplicate" || true
aws ec2 authorize-security-group-ingress --group-id $ECS_SG --protocol tcp --port 80 --source-group $ALB_SG --region $REGION 2>&1 | grep -v "InvalidPermission.Duplicate" || true

echo "Security group rules configured!"

