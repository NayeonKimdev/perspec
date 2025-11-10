/**
 * Swagger/OpenAPI 설정
 * API 문서 자동 생성
 */
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Perspec API',
      version: '1.0.0',
      description: 'Perspec 사용자 분석 플랫폼 API 문서',
      contact: {
        name: 'API Support',
        email: 'support@perspec.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}/api/v1`,
        description: '개발 서버 (v1)'
      },
      {
        url: 'https://api.perspec.com/api/v1',
        description: '프로덕션 서버 (v1)'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT 토큰을 Bearer 형식으로 전달하세요'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: '에러 메시지'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: '사용자 ID'
            },
            email: {
              type: 'string',
              format: 'email',
              description: '이메일 주소'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: '생성일시'
            }
          }
        },
        Media: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: '미디어 ID'
            },
            file_name: {
              type: 'string',
              description: '파일명'
            },
            file_type: {
              type: 'string',
              description: '파일 타입'
            },
            file_size: {
              type: 'integer',
              description: '파일 크기 (bytes)'
            },
            file_url: {
              type: 'string',
              format: 'uri',
              description: '파일 URL'
            },
            analysis_status: {
              type: 'string',
              enum: ['pending', 'analyzing', 'completed', 'failed'],
              description: '분석 상태'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: '생성일시'
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: '인증 토큰이 없거나 유효하지 않습니다',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                message: '인증 토큰이 필요합니다.'
              }
            }
          }
        },
        NotFoundError: {
          description: '요청한 리소스를 찾을 수 없습니다',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                message: '요청한 리소스를 찾을 수 없습니다.'
              }
            }
          }
        },
        ValidationError: {
          description: '입력 데이터가 유효하지 않습니다',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                message: '입력 데이터가 유효하지 않습니다.',
                errors: []
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: '인증',
        description: '사용자 인증 관련 API'
      },
      {
        name: '프로필',
        description: '사용자 프로필 관리 API'
      },
      {
        name: '미디어',
        description: '이미지 업로드 및 관리 API'
      },
      {
        name: '문서',
        description: '텍스트 문서 업로드 및 관리 API'
      },
      {
        name: '분석',
        description: '데이터 분석 관련 API'
      },
      {
        name: 'MBTI',
        description: 'MBTI 추정 관련 API'
      },
      {
        name: '감정',
        description: '감정 분석 관련 API'
      },
      {
        name: '레포트',
        description: '종합 레포트 생성 및 조회 API'
      },
      {
        name: '헬스',
        description: '서버 상태 확인 API'
      }
    ]
  },
  apis: [
    './routes/*.js',
    './controllers/*.js',
    './server.js'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

const swaggerSetup = (app) => {
  // Swagger UI 설정
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Perspec API Documentation',
    customfavIcon: '/favicon.ico'
  }));

  // JSON 형식으로도 접근 가능
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};

module.exports = {
  swaggerSpec,
  swaggerSetup
};

