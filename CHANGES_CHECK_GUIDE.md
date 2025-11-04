# 변경사항 확인 가이드

## 🔍 변경사항 확인 방법

### 1. Git으로 변경사항 확인

#### 변경된 파일 목록 확인
```bash
# 모든 변경된 파일 확인
git status

# 변경된 파일의 간단한 요약
git status -s

# 변경 내용 미리보기 (diff)
git diff

# 특정 파일의 변경 내용만 보기
git diff client/src/components/Toast.jsx
git diff client/src/pages/Login.jsx
```

#### 커밋 전 변경사항 상세 확인
```bash
# 스테이징되지 않은 변경사항 확인
git diff

# 스테이징된 변경사항 확인
git diff --staged

# 특정 디렉토리의 변경사항만 확인
git diff client/src/
```

#### 변경 통계 확인
```bash
# 변경된 파일 수와 라인 수 통계
git diff --stat

# 더 자세한 통계
git diff --numstat
```

---

### 2. 실제 서버 실행해서 확인

#### 방법 1: 루트에서 한 번에 실행 (권장)
```bash
# 프로젝트 루트 디렉토리에서
npm run dev
```
- 백엔드 서버 (포트 5000)와 프론트엔드 서버 (포트 5173)가 동시에 실행됩니다.

#### 방법 2: 개별 실행
**터미널 1 - 백엔드 서버:**
```bash
cd server
npm start
# 또는 개발 모드 (자동 재시작)
npm run dev
```

**터미널 2 - 프론트엔드 서버:**
```bash
cd client
npm run dev
```

#### 접속 확인
- 프론트엔드: `http://localhost:5173`
- 백엔드 API: `http://localhost:5000`

---

### 3. 브라우저에서 기능 확인

#### Toast 알림 확인 절차

1. **로그인 페이지**
   - `http://localhost:5173/login` 접속
   - 잘못된 이메일/비밀번호 입력 → 에러 Toast 확인
   - 올바른 정보 입력 → 성공 Toast 확인

2. **회원가입 페이지**
   - `http://localhost:5173/register` 접속
   - 회원가입 시도 → 성공 Toast 확인

3. **이미지 업로드**
   - 이미지 업로드 후 → 성공 Toast 확인
   - 업로드 실패 시 → 에러 Toast 확인

4. **MBTI 분석**
   - `/mbti` 페이지에서 분석 시작
   - 데이터 부족 시 → 경고 Toast 확인
   - 분석 완료 시 → 자동으로 결과 페이지 이동

5. **레포트 생성**
   - `/reports` 페이지에서 레포트 생성
   - 성공/실패 Toast 확인

#### 스켈레톤 UI 확인 절차

1. **MBTI 페이지**
   - `/mbti` 페이지 접속
   - 페이지 로딩 중 스켈레톤 UI가 표시되는지 확인

2. **레포트 생성 페이지**
   - `/reports` 페이지 접속
   - 초기 로딩 시 스켈레톤 UI 확인

#### 로딩 스피너 확인

1. **로그인/회원가입 버튼**
   - 폼 제출 시 버튼에 로딩 스피너 표시 확인

2. **분석 진행 중**
   - MBTI, 감정 분석 등 진행 중 로딩 애니메이션 확인

---

### 4. 브라우저 개발자 도구로 확인

#### 콘솔 확인
```javascript
// 브라우저 개발자 도구 (F12) → Console 탭
// 에러가 없는지 확인
```

#### Network 탭 확인
- 네트워크 요청/응답 확인
- API 호출이 정상적으로 이루어지는지 확인

#### React DevTools 확장 프로그램
- React 컴포넌트 상태 확인
- Toast 컴포넌트가 제대로 렌더링되는지 확인

---

### 5. 변경된 주요 파일 확인

#### 새로 생성된 컴포넌트
```bash
# Toast 컴포넌트
client/src/components/Toast.jsx

# LoadingSpinner 컴포넌트
client/src/components/LoadingSpinner.jsx

# Skeleton 컴포넌트
client/src/components/Skeleton.jsx
```

#### 업데이트된 파일들
```bash
# App.jsx - ToastProvider 추가
client/src/App.jsx

# 모든 페이지 파일들
client/src/pages/Login.jsx
client/src/pages/Register.jsx
client/src/pages/MBTIEstimation.jsx
client/src/pages/ReportGeneration.jsx
# ... 등등

# CSS 애니메이션 추가
client/src/index.css
```

---

### 6. 빠른 체크리스트

#### ✅ Toast 알림 확인
- [ ] 로그인 성공/실패 시 Toast 표시
- [ ] 회원가입 성공 시 Toast 표시
- [ ] 이미지 업로드 완료 시 Toast 표시
- [ ] 에러 발생 시 에러 Toast 표시
- [ ] 링크 복사 시 성공 Toast 표시

#### ✅ 로딩 상태 확인
- [ ] 로그인 버튼 클릭 시 로딩 스피너 표시
- [ ] MBTI 페이지 로딩 시 스켈레톤 UI 표시
- [ ] 레포트 페이지 로딩 시 스켈레톤 UI 표시

#### ✅ 애니메이션 확인
- [ ] Toast가 오른쪽에서 슬라이드 인하는 애니메이션
- [ ] Toast가 자동으로 사라지는지 확인 (3초 후)
- [ ] Toast 수동 닫기 버튼 작동 확인

---

### 7. 문제 해결

#### Toast가 표시되지 않는 경우
1. 브라우저 콘솔에서 에러 확인
2. `App.jsx`에 `ToastProvider`가 제대로 감싸져 있는지 확인
3. 컴포넌트에서 `useToast()` 훅이 제대로 import되었는지 확인

#### 스켈레톤이 표시되지 않는 경우
1. `dataLoading` 상태가 올바르게 설정되었는지 확인
2. `SkeletonDashboard` 컴포넌트가 import되었는지 확인

#### 로딩 스피너가 표시되지 않는 경우
1. `LoadingSpinner` 컴포넌트가 import되었는지 확인
2. `isLoading` 상태가 올바르게 관리되는지 확인

---

### 8. 테스트 시나리오

#### 시나리오 1: 로그인 플로우
1. 로그인 페이지 접속
2. 이메일/비밀번호 입력
3. 로그인 버튼 클릭
4. **확인사항:**
   - 버튼에 로딩 스피너 표시
   - 성공 시 Toast 알림 표시
   - 대시보드로 자동 이동

#### 시나리오 2: MBTI 분석
1. MBTI 페이지 접속
2. **확인사항:**
   - 초기 로딩 시 스켈레톤 UI 표시
   - 데이터 준비 상황 표시
3. MBTI 추정 시작 버튼 클릭
4. **확인사항:**
   - 로딩 애니메이션 표시
   - 완료 시 결과 페이지로 이동

#### 시나리오 3: 이미지 업로드
1. 이미지 업로드 페이지 접속
2. 이미지 선택 후 업로드
3. **확인사항:**
   - 업로드 진행률 표시
   - 완료 시 성공 Toast 표시
   - 1초 후 갤러리로 자동 이동

---

## 📝 추가 확인 사항

### 변경 전후 비교
```bash
# 특정 파일의 변경 내용 자세히 보기
git diff HEAD client/src/pages/Login.jsx

# 변경된 모든 파일 목록
git diff --name-only HEAD

# 변경 통계
git diff --stat HEAD
```

### 특정 커밋과 비교
```bash
# 가장 최근 커밋과 비교
git diff HEAD~1

# 특정 커밋과 비교
git diff <commit-hash>
```

---

## 🎯 핵심 확인 포인트

1. **모든 `alert()` 호출이 `toast`로 교체되었는지**
   - `grep -r "alert(" client/src/pages/` → 결과가 없어야 함

2. **ToastProvider가 App.jsx에 추가되었는지**
   - `App.jsx` 파일에서 `ToastProvider` 확인

3. **로딩 상태에 스켈레톤이 추가되었는지**
   - `MBTIEstimation.jsx`와 `ReportGeneration.jsx` 확인

4. **CSS 애니메이션이 추가되었는지**
   - `index.css`에 `slide-in-right` 애니메이션 확인

