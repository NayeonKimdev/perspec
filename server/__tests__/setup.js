/**
 * Jest 테스트 설정
 * 각 테스트 전후에 실행되는 공통 설정
 */

// 테스트 환경 변수 설정
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only';
process.env.DB_NAME = (process.env.DB_NAME || 'perspec') + '_test';

// 데이터베이스 연결 비활성화 (필요시 각 테스트에서 활성화)
// sequelize 연결은 각 테스트에서 필요할 때만 수행

// 콘솔 로그 억제 (선택적)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

// 테스트 후 정리
afterAll(async () => {
  // 모든 테스트가 끝난 후 정리 작업
  // 예: 데이터베이스 연결 종료 등
  // Jest가 종료되도록 짧은 대기
  await new Promise(resolve => setTimeout(resolve, 100));
});


