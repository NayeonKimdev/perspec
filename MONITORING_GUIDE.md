# 모니터링 및 로깅 가이드

## 🤔 이게 뭔가요? 왜 필요한가요?

### 모니터링과 로깅이란?
서비스가 **정상적으로 작동하는지**, **문제가 없는지** 확인하는 시스템입니다.

### 왜 필요한가요?

**실제 상황 예시:**
- 😱 **사용자가 "서비스가 안 돼요!"라고 연락**
  - → 로그를 확인해서 무엇이 문제인지 바로 알 수 있음
- 😱 **서버가 갑자기 느려짐**
  - → 알람이 자동으로 이메일/문자로 알려줌
- 😱 **에러가 발생했는데 어디서 났는지 모름**
  - → 로그를 보면 정확한 위치와 원인을 알 수 있음

### 어떤 상황에서 필요한가요?

1. **서비스가 갑자기 멈췄을 때** → 알람이 자동으로 알려줌
2. **에러가 발생했을 때** → 로그를 확인해서 원인 파악
3. **서버가 느려질 때** → CPU/메모리 사용량 확인
4. **사용자가 문제를 제기했을 때** → 로그를 확인해서 재현

---

## 현재 설정 상태

### ✅ 완료된 설정

1. **CloudWatch Logs** (로그 저장소)
   - ECS 서비스 로그가 CloudWatch에 자동 수집됨
   - 로그 그룹: `/ecs/perspec-api`, `/ecs/perspec-client`
   - 리전: `ap-southeast-2` (ECS 서비스와 동일)

2. **CloudWatch 알람** (자동 알림)
   - `perspec-api-cpu-high`: API 서비스 CPU 사용률 80% 초과 시 알림
   - `perspec-api-running-tasks-low`: API 서비스가 멈췄을 때 알림

3. **로깅 시스템** (에러 기록)
   - Winston 기반 구조화된 로깅
   - 파일 로테이션 (일별, 14일 보관)
   - 에러 로그 별도 저장 (30일 보관)

4. **에러 추적 시스템** (에러 분석)
   - 에러 분류 및 심각도 판단
   - 구조화된 에러 로깅
   - Sentry 통합 준비 완료

---

## 🎯 지금 당장 해야 할 것

### 1. 로그 확인 방법 배우기 (가장 중요!)

**언제 필요한가요?**
- 사용자가 에러를 보고했을 때
- 서비스가 이상하게 동작할 때
- 문제를 디버깅할 때

**어떻게 하나요?**

#### 방법 1: AWS 콘솔에서 확인 (가장 쉬움)
1. AWS 콘솔 → CloudWatch → Logs → Log groups
2. `/ecs/perspec-api` 또는 `/ecs/perspec-client` 클릭
3. 최근 로그 스트림 선택
4. 로그 내용 확인

#### 방법 2: 명령어로 확인
```bash
# 최근 로그 확인 (실시간)
aws logs tail /ecs/perspec-api --follow --region ap-southeast-2

# 에러만 필터링해서 보기
aws logs filter-log-events \
  --log-group-name /ecs/perspec-api \
  --filter-pattern "ERROR" \
  --region ap-southeast-2
```

### 2. 알람 이메일 받기 설정 (선택사항)

**언제 필요한가요?**
- 서비스가 문제가 생겼을 때 자동으로 알림을 받고 싶을 때
- 밤에 서비스가 다운되어도 모르는 것을 방지

**어떻게 하나요?**
1. AWS 콘솔 → SNS → Topics → Create topic
2. Topic name: `perspec-alerts` 입력
3. Create subscription → Email 선택
4. 이메일 주소 입력
5. 이메일로 온 확인 링크 클릭

**그 다음:**
- CloudWatch → Alarms에서 각 알람에 SNS 토픽 연결

---

## 추가 설정 가이드 (나중에 필요하면)

### 1. CloudWatch 알람 추가 설정

#### 필요한 권한
IAM 사용자에 다음 권한 추가:
- `sns:CreateTopic`
- `sns:Subscribe`
- `cloudwatch:PutMetricAlarm`
- `cloudwatch:DescribeAlarms`

#### SNS 토픽 생성 및 이메일 구독
```bash
# SNS 토픽 생성
aws sns create-topic --name perspec-alerts --region ap-southeast-2

# 이메일 구독 (이메일 확인 필요)
aws sns subscribe \
  --topic-arn arn:aws:sns:ap-southeast-2:109968338833:perspec-alerts \
  --protocol email \
  --notification-endpoint your-email@example.com \
  --region ap-southeast-2
```

#### 추가 알람 생성
`aws/setup-cloudwatch-alarms.sh` 스크립트를 실행하거나, 다음 알람을 수동으로 생성:

- **메모리 사용률**: `perspec-api-memory-high`
- **Client CPU**: `perspec-client-cpu-high`
- **ALB 5xx 에러**: `perspec-alb-5xx-errors`
- **ALB 응답 시간**: `perspec-alb-response-time-high`
- **Target Group Health**: `perspec-api-tg-unhealthy`

### 2. Sentry 통합 (선택사항)

#### 설치
```bash
cd server
npm install @sentry/node @sentry/profiling-node
```

#### 설정

1. **Sentry DSN 발급**
   - https://sentry.io 에서 프로젝트 생성
   - DSN 복사

2. **환경 변수 추가**
   ```env
   SENTRY_DSN=your-sentry-dsn
   SENTRY_ENVIRONMENT=production
   ```

3. **코드 통합**

`server/utils/errorTracker.js` 파일의 주석 처리된 부분을 활성화:

```javascript
const Sentry = require('@sentry/node');

// server.js에서 초기화
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT || 'production',
  tracesSampleRate: 0.1, // 10%의 트랜잭션 추적
  profilesSampleRate: 0.1, // 10%의 프로파일링
});

// errorTracker.js에서 사용
if (process.env.SENTRY_DSN) {
  Sentry.captureException(error, {
    tags: {
      errorType,
      severity
    },
    extra: context,
    user: req?.user ? { id: req.user.id } : undefined
  });
}
```

### 3. CloudWatch 대시보드 생성

#### 대시보드 생성 스크립트
`aws/create-cloudwatch-dashboard.sh` 파일을 참고하거나, AWS 콘솔에서 수동 생성:

**추천 메트릭:**
- ECS 서비스 CPU/Memory 사용률
- ECS 서비스 실행 중인 태스크 수
- ALB 요청 수 및 응답 시간
- ALB HTTP 상태 코드 분포
- Target Group Healthy Host Count

### 4. 성능 모니터링

#### 커스텀 메트릭 전송
애플리케이션에서 CloudWatch에 커스텀 메트릭을 전송할 수 있습니다:

```javascript
const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');

const cloudwatch = new CloudWatchClient({ region: 'ap-southeast-2' });

async function sendCustomMetric(metricName, value, unit = 'Count') {
  await cloudwatch.send(new PutMetricDataCommand({
    Namespace: 'Perspec/Application',
    MetricData: [{
      MetricName: metricName,
      Value: value,
      Unit: unit,
      Timestamp: new Date()
    }]
  }));
}
```

**추적할 메트릭:**
- API 응답 시간
- 요청 처리량 (RPS)
- 데이터베이스 쿼리 시간
- 외부 API 호출 시간

### 5. 알림 설정

#### Slack 통합 (선택사항)
SNS → Lambda → Slack으로 알림 전송:

1. Lambda 함수 생성
2. SNS 토픽에 Lambda 구독 추가
3. Slack Webhook URL 설정

#### PagerDuty 통합 (선택사항)
SNS → PagerDuty로 알림 전송

## 📋 일상적인 확인 체크리스트

### 매일 확인 (5분)
1. AWS 콘솔 → CloudWatch → Alarms
   - 빨간색(ALARM)이 있으면 확인
2. 사용자 문의가 있으면 로그 확인

### 주간 확인 (10분)
1. CloudWatch → Logs → `/ecs/perspec-api`
   - ERROR가 많이 나오는지 확인
2. ECS 서비스 상태 확인
   - 실행 중인 태스크 수 확인

### 문제 발생 시
1. **서비스가 안 될 때**
   - CloudWatch → Alarms 확인
   - ECS → Services → 태스크 상태 확인
   - 로그에서 에러 메시지 확인

2. **에러가 발생했을 때**
   - CloudWatch Logs에서 에러 로그 검색
   - 에러 메시지와 스택 트레이스 확인
   - 문제 원인 파악 후 수정

## 로그 확인 방법

### CloudWatch Logs
```bash
# 최근 로그 확인
aws logs tail /ecs/perspec-api --follow --region ap-southeast-2

# 특정 시간대 로그 확인
aws logs filter-log-events \
  --log-group-name /ecs/perspec-api \
  --start-time $(date -d '1 hour ago' +%s)000 \
  --region ap-southeast-2
```

### 로컬 로그 파일
```bash
# 최근 에러 로그 확인
tail -f server/logs/error-$(date +%Y-%m-%d).log

# 특정 에러 검색
grep -i "error" server/logs/application-*.log
```

## 문제 해결

### 알람이 트리거되지 않음
- 메트릭 데이터가 충분한지 확인
- 임계값이 적절한지 확인
- 평가 기간이 너무 짧은지 확인

### 로그가 수집되지 않음
- ECS 태스크 실행 역할 권한 확인
- 로그 그룹이 올바른 리전에 있는지 확인
- 태스크 정의의 로그 설정 확인

## 참고 자료

- [AWS CloudWatch 문서](https://docs.aws.amazon.com/cloudwatch/)
- [Sentry Node.js 문서](https://docs.sentry.io/platforms/javascript/guides/node/)
- [Winston 문서](https://github.com/winstonjs/winston)

