# GitHub Secrets 설정 가이드

## 📋 목표
GitHub Actions에서 AWS에 자동 배포하기 위해 액세스 키를 GitHub Secrets에 저장합니다.

---

## 🔑 필요한 정보

다음 정보가 필요합니다 (이미 AWS CLI 설정에서 사용한 것과 동일):
- **AWS Access Key ID**: `YOUR_AWS_ACCESS_KEY_ID`
- **AWS Secret Access Key**: `YOUR_AWS_SECRET_ACCESS_KEY`

⚠️ **보안 주의**: 이 정보는 절대 공개하지 마세요!

---

## 📝 단계별 가이드

### 1단계: GitHub 저장소 접속

1. 웹 브라우저에서 **GitHub** 접속: https://github.com
2. 로그인
3. **perspec** 저장소로 이동
   - 저장소 목록에서 선택하거나
   - URL로 직접 접속: `https://github.com/사용자명/perspec`

### 2단계: Settings 메뉴로 이동

1. 저장소 페이지 상단의 **탭 메뉴** 확인
   - Code, Issues, Pull requests, Actions, Projects, Wiki, Security, **Settings** 등
2. **Settings** 탭 클릭
   - 저장소 이름 옆에 있는 **Settings** (톱니바퀴 아이콘)

### 3단계: Secrets and variables 메뉴 찾기

Settings 페이지 왼쪽 사이드바에서:

1. **"Secrets and variables"** 섹션 찾기
   - 보통 중간 부분에 위치
2. **"Actions"** 클릭
   - `Secrets and variables` > `Actions` 메뉴

### 4단계: 새 Secret 추가

1. **"New repository secret"** 버튼 클릭
   - 오른쪽 상단에 위치

### 5단계: 첫 번째 Secret 추가 (AWS_ACCESS_KEY_ID)

**5-1. Name 입력**
- **Name**: `AWS_ACCESS_KEY_ID`
- ⚠️ 정확히 이 이름으로 입력 (대소문자 구분)

**5-2. Secret 입력**
- **Secret**: `YOUR_AWS_ACCESS_KEY_ID`
- ⚠️ 공백 없이 정확히 입력 (실제 AWS Access Key ID 값 사용)

**5-3. 저장**
- **"Add secret"** 버튼 클릭

### 6단계: 두 번째 Secret 추가 (AWS_SECRET_ACCESS_KEY)

**6-1. 다시 "New repository secret" 클릭**

**6-2. Name 입력**
- **Name**: `AWS_SECRET_ACCESS_KEY`
- ⚠️ 정확히 이 이름으로 입력 (대소문자 구분)

**6-3. Secret 입력**
- **Secret**: `YOUR_AWS_SECRET_ACCESS_KEY`
- ⚠️ 공백 없이 정확히 입력 (실제 AWS Secret Access Key 값 사용)

**6-4. 저장**
- **"Add secret"** 버튼 클릭

### 7단계: 확인

Secrets 목록에 다음 2개가 표시되어야 합니다:

```
AWS_ACCESS_KEY_ID        Updated just now
AWS_SECRET_ACCESS_KEY    Updated just now
```

---

## ✅ 완료 체크리스트

- [ ] GitHub 저장소 Settings 접속 완료
- [ ] Secrets and variables > Actions 메뉴 접속 완료
- [ ] `AWS_ACCESS_KEY_ID` Secret 추가 완료
- [ ] `AWS_SECRET_ACCESS_KEY` Secret 추가 완료
- [ ] 두 Secret 모두 목록에 표시되는지 확인 완료

---

## 🔍 스크린샷 가이드 (참고)

### Settings 페이지 경로
```
저장소 > Settings > Secrets and variables > Actions
```

### Secret 추가 화면
```
Name: AWS_ACCESS_KEY_ID
Secret: [액세스 키 ID 입력]
```

---

## 🆘 문제 해결

### 문제: "Secrets and variables" 메뉴가 보이지 않음
- **원인**: 저장소에 대한 관리자 권한이 없음
- **해결**: 저장소 소유자에게 권한 요청

### 문제: "New repository secret" 버튼이 없음
- **원인**: 권한 부족 또는 잘못된 페이지
- **해결**: Settings > Secrets and variables > Actions 경로 확인

### 문제: Secret을 추가했는데 목록에 안 보임
- **원인**: 페이지 새로고침 필요
- **해결**: 페이지 새로고침 (F5)

### 문제: Secret 이름을 잘못 입력함
- **해결**: 
  1. 잘못된 Secret 옆의 **연필 아이콘** 클릭하여 수정
  2. 또는 **휴지통 아이콘** 클릭하여 삭제 후 다시 생성

---

## 🔒 보안 주의사항

1. **절대 공개하지 마세요**
   - GitHub Issues에 올리지 마세요
   - 공개 채팅방에 올리지 마세요
   - 코드에 하드코딩하지 마세요

2. **정기적으로 로테이션**
   - 90일마다 새로운 액세스 키 생성
   - 오래된 키 삭제

3. **최소 권한 원칙**
   - 필요한 권한만 부여된 IAM 사용자 사용

---

## 📚 다음 단계

GitHub Secrets 설정이 완료되면:
1. ✅ `.github/workflows/deploy-aws.yml` 파일 확인
2. ✅ main 브랜치에 푸시하여 자동 배포 테스트
3. ✅ Actions 탭에서 워크플로우 실행 확인

---

## 💡 팁

- Secret은 한 번 저장하면 **다시 볼 수 없습니다**
- 수정하려면 삭제 후 다시 생성해야 합니다
- Secret 이름은 대소문자를 구분합니다
- 여러 환경(production, staging)을 사용한다면 환경별로 Secret을 분리할 수 있습니다


