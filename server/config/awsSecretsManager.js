/**
 * AWS Secrets Manager 연동
 * 프로덕션 환경에서 환경 변수를 Secrets Manager에서 로드
 */

const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const dotenv = require('dotenv');
const path = require('path');

// 로컬 개발 환경에서는 .env 파일 사용
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.join(__dirname, '../.env') });
}

let secretsCache = null;
let secretsClient = null;

/**
 * Secrets Manager 클라이언트 초기화
 */
const initSecretsClient = () => {
  if (!secretsClient) {
    secretsClient = new SecretsManagerClient({
      region: process.env.AWS_REGION || 'ap-northeast-2',
    });
  }
  return secretsClient;
};

/**
 * Secrets Manager에서 시크릿 가져오기
 */
const getSecret = async (secretName) => {
  try {
    const client = initSecretsClient();
    const command = new GetSecretValueCommand({ SecretId: secretName });
    const response = await client.send(command);
    
    // JSON 문자열을 파싱
    if (response.SecretString) {
      return JSON.parse(response.SecretString);
    }
    
    // Binary 시크릿인 경우
    if (response.SecretBinary) {
      const buff = Buffer.from(response.SecretBinary, 'base64');
      return JSON.parse(buff.toString('utf-8'));
    }
    
    throw new Error('시크릿이 비어있습니다.');
  } catch (error) {
    console.error(`Secrets Manager에서 시크릿을 가져오는 중 오류 발생: ${error.message}`);
    throw error;
  }
};

/**
 * 환경 변수 로드 (Secrets Manager 또는 환경 변수)
 */
const loadEnvironmentVariables = async () => {
  // 이미 로드된 경우 캐시 반환
  if (secretsCache) {
    return secretsCache;
  }

  const secretName = process.env.AWS_SECRETS_MANAGER_SECRET_NAME || 'perspec/production';
  
  try {
    // Secrets Manager에서 시크릿 가져오기
    const secrets = await getSecret(secretName);
    
    // 환경 변수로 설정 (기존 환경 변수가 있으면 우선)
    Object.keys(secrets).forEach((key) => {
      if (!process.env[key]) {
        process.env[key] = secrets[key];
      }
    });
    
    secretsCache = secrets;
    console.log('✅ Secrets Manager에서 환경 변수를 성공적으로 로드했습니다.');
    
    return secrets;
  } catch (error) {
    console.warn('⚠️  Secrets Manager에서 환경 변수를 로드할 수 없습니다. 환경 변수를 직접 사용합니다.');
    console.warn(`오류: ${error.message}`);
    
    // Secrets Manager 실패 시 환경 변수 직접 사용
    // 이미 process.env에 설정된 값 사용
    return {};
  }
};

/**
 * 동기식 환경 변수 로드 (애플리케이션 시작 시 호출)
 * 주의: 비동기 함수이므로 await 또는 .then() 사용 필요
 */
const initializeSecrets = async () => {
  if (process.env.NODE_ENV === 'production') {
    await loadEnvironmentVariables();
  }
};

module.exports = {
  loadEnvironmentVariables,
  initializeSecrets,
  getSecret,
};

