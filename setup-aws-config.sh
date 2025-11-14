#!/bin/bash
# AWS CLI 설정 스크립트
# 사용법: ./setup-aws-config.sh

echo "AWS CLI 설정을 시작합니다..."
echo ""

# .aws 디렉토리 생성
mkdir -p ~/.aws

# 사용자 입력 받기
read -p "AWS Access Key ID를 입력하세요: " ACCESS_KEY_ID
read -sp "AWS Secret Access Key를 입력하세요 (화면에 표시되지 않습니다): " SECRET_ACCESS_KEY
echo ""
read -p "Default region name [ap-northeast-2]: " REGION
REGION=${REGION:-ap-northeast-2}
read -p "Default output format [json]: " OUTPUT
OUTPUT=${OUTPUT:-json}

# credentials 파일 생성
cat > ~/.aws/credentials << EOF
[default]
aws_access_key_id = ${ACCESS_KEY_ID}
aws_secret_access_key = ${SECRET_ACCESS_KEY}
EOF

# config 파일 생성
cat > ~/.aws/config << EOF
[default]
region = ${REGION}
output = ${OUTPUT}
EOF

echo ""
echo "✅ AWS CLI 설정이 완료되었습니다!"
echo ""
echo "설정 확인:"
echo "  - credentials 파일: ~/.aws/credentials"
echo "  - config 파일: ~/.aws/config"
echo ""
echo "설정 테스트를 실행하시겠습니까? (y/n)"
read -p "> " TEST
if [ "$TEST" = "y" ] || [ "$TEST" = "Y" ]; then
    echo ""
    echo "현재 사용자 정보 확인 중..."
    aws sts get-caller-identity
fi

