#!/bin/bash
set -e

REGION="ap-northeast-2"
ACCOUNT_ID="109968338833"
ECR_REGISTRY="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

echo "Logging in to ECR..."
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_REGISTRY

echo "Building and pushing API image..."
docker build -t perspec-api:latest -f server/Dockerfile .
docker tag perspec-api:latest ${ECR_REGISTRY}/perspec-api:latest
docker push ${ECR_REGISTRY}/perspec-api:latest

echo "Building and pushing Client image..."
docker build -t perspec-client:latest -f client/Dockerfile ./client
docker tag perspec-client:latest ${ECR_REGISTRY}/perspec-client:latest
docker push ${ECR_REGISTRY}/perspec-client:latest

echo "Images pushed successfully!"

