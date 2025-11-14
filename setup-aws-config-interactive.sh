#!/bin/bash
# AWS CLI 설정 스크립트 (대화형)
# 사용법: bash setup-aws-config-interactive.sh

echo "=========================================="
echo "AWS CLI 설정 스크립트"
echo "=========================================="
echo ""

# .aws 디렉토리 생성
mkdir -p ~/.aws

# 사용자 입력 받기
echo "IAM 사용자 생성 시 저장한 정보를 입력해주세요."
echo ""
read -p "1. AWS Access Key ID: " ACCESS_KEY_ID
read -sp "2. AWS Secret Access Key (화면에 표시되지 않습니다): " SECRET_ACCESS_KEY
echo ""
echo ""
read -p "3. Default region name [ap-northeast-2]: " REGION
REGION=${REGION:-ap-northeast-2}
read -p "4. Default output format [json]: " OUTPUT
OUTPUT=${OUTPUT:-json}

# 입력 확인
echo ""
echo "입력한 정보 확인:"
echo "  - Access Key ID: ${ACCESS_KEY_ID:0:8}..." # 처음 8자만 표시
echo "  - Region: $REGION"
echo "  - Output: $OUTPUT"
echo ""
read -p "이 정보로 설정 파일을 생성하시겠습니까? (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "설정이 취소되었습니다."
    exit 1
fi

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
echo "생성된 파일:"
echo "  - ~/.aws/credentials"
echo "  - ~/.aws/config"
echo ""

# 설정 테스트
echo "설정 테스트를 실행합니다..."
echo ""

# PATH에 AWS CLI 추가 (Git Bash용)
export PATH="/c/Program Files/Amazon/AWSCLIV2:$PATH"

if command -v aws &> /dev/null || [ -f "/c/Program Files/Amazon/AWSCLIV2/aws.exe" ]; then
    # aws 명령어 사용 시도, 없으면 전체 경로 사용
    if command -v aws &> /dev/null; then
        AWS_CMD="aws"
    else
        AWS_CMD="/c/Program Files/Amazon/AWSCLIV2/aws.exe"
    fi
    
    $AWS_CMD sts get-caller-identity
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ 설정이 정상적으로 완료되었습니다!"
    else
        echo ""
        echo "⚠️  설정 테스트 실패. 액세스 키를 확인해주세요."
    fi
else
    echo "⚠️  AWS CLI를 찾을 수 없습니다."
    echo "   AWS CLI 설치를 확인해주세요."
fi

