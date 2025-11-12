# 이메일 발송 설정 가이드

이메일 인증 기능을 사용하려면 SMTP 설정이 필요합니다.

## 방법 1: Gmail 사용 (권장)

### 1단계: Gmail 앱 비밀번호 생성

1. Google 계정 관리 페이지로 이동: https://myaccount.google.com/
2. **보안** 탭 클릭
3. **2단계 인증**이 활성화되어 있는지 확인 (없으면 먼저 활성화)
4. **앱 비밀번호** 섹션으로 이동
5. **앱 선택** → "메일" 선택
6. **기기 선택** → "기타(맞춤 이름)" 선택 후 "Perspec" 입력
7. **생성** 버튼 클릭
8. 생성된 16자리 앱 비밀번호를 복사 (예: `abcd efgh ijkl mnop`)

### 2단계: 환경 변수 설정

`.env` 파일을 생성하거나 기존 파일에 다음 내용을 추가하세요:

```env
# 이메일 발송 설정
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-digit-app-password
SMTP_FROM=your-email@gmail.com
FRONTEND_URL=http://localhost:5173
APP_NAME=Perspec
APP_URL=http://localhost:5000
```

**중요**: 
- `SMTP_USER`: Gmail 주소 (예: `yourname@gmail.com`)
- `SMTP_PASS`: 위에서 생성한 16자리 앱 비밀번호 (공백 없이 입력)
- `SMTP_FROM`: 발신자 이메일 (보통 `SMTP_USER`와 동일)

### 3단계: Docker Compose 재시작

```bash
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d
```

## 방법 2: 다른 이메일 서비스 사용

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

### 네이버 메일
```env
SMTP_HOST=smtp.naver.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@naver.com
SMTP_PASS=your-password
```

### 다음(Daum) 메일
```env
SMTP_HOST=smtp.daum.net
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@daum.net
SMTP_PASS=your-password
```

### SendGrid (프로덕션 권장)
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### Mailgun (프로덕션 권장)
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
```

## 방법 3: 개발 환경에서 이메일 발송 비활성화

개발 중에는 이메일 발송 없이 테스트할 수 있습니다:

```env
EMAIL_ENABLED=false
```

이 경우:
- 서버 콘솔에 인증 링크가 출력됩니다
- 프론트엔드 화면에 인증 링크가 표시됩니다
- 실제 이메일은 발송되지 않습니다

## 문제 해결

### "이메일 발송 중 오류가 발생했습니다" 오류

1. **SMTP 설정 확인**
   - `SMTP_USER`와 `SMTP_PASS`가 올바르게 설정되었는지 확인
   - Gmail 사용 시 앱 비밀번호를 사용했는지 확인 (일반 비밀번호는 작동하지 않음)

2. **방화벽/네트워크 확인**
   - 포트 587 또는 465가 차단되지 않았는지 확인
   - 회사 네트워크에서는 SMTP 포트가 차단될 수 있음

3. **로그 확인**
   ```bash
   docker-compose -f docker-compose.dev.yml logs api
   ```
   에러 메시지를 확인하여 원인 파악

4. **Gmail 보안 설정**
   - "보안 수준이 낮은 앱의 액세스"가 활성화되어 있는지 확인
   - 또는 앱 비밀번호 사용 (권장)

### Gmail 앱 비밀번호 생성이 안 될 때

- 2단계 인증이 활성화되어 있어야 합니다
- Google Workspace 계정은 관리자가 앱 비밀번호 생성을 허용해야 할 수 있습니다

## 프로덕션 환경 권장사항

프로덕션 환경에서는 다음 서비스를 사용하는 것을 권장합니다:

1. **SendGrid** - 무료 티어 제공 (월 100통)
2. **Mailgun** - 무료 티어 제공 (월 5,000통)
3. **Amazon SES** - 저렴한 가격
4. **Postmark** - 트랜잭션 이메일에 특화

이러한 서비스들은:
- 높은 전달률 보장
- 스팸 필터 우회
- 이메일 통계 제공
- API 기반으로 더 안정적


