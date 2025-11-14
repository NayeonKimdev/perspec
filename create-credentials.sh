#!/bin/bash
# credentials 파일 생성 스크립트

echo "AWS credentials 파일을 생성합니다."
echo ""
read -p "AWS Access Key ID: " ACCESS_KEY_ID
read -sp "AWS Secret Access Key (화면에 표시되지 않습니다): " SECRET_ACCESS_KEY
echo ""

cat > ~/.aws/credentials << EOF
[default]
aws_access_key_id = ${ACCESS_KEY_ID}
aws_secret_access_key = ${SECRET_ACCESS_KEY}
EOF

echo ""
echo "✅ credentials 파일이 생성되었습니다!"
echo ""

# PATH에 AWS CLI 추가 (Git Bash용)
export PATH="/c/Program Files/Amazon/AWSCLIV2:$PATH"

echo "설정 테스트를 실행합니다..."
if command -v aws &> /dev/null; then
    aws sts get-caller-identity
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ AWS CLI 설정이 정상적으로 완료되었습니다!"
    else
        echo ""
        echo "⚠️  설정 테스트 실패. 액세스 키를 확인해주세요."
    fi
else
    # 전체 경로로 시도
    "/c/Program Files/Amazon/AWSCLIV2/aws.exe" sts get-caller-identity
fi

