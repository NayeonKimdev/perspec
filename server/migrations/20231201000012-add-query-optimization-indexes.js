'use strict';

/**
 * 데이터베이스 쿼리 최적화를 위한 인덱스 추가 마이그레이션
 * 
 * 추가되는 인덱스:
 * 1. 복합 인덱스: 자주 함께 조회되는 필드 조합에 대한 인덱스
 * 2. 검색 성능 향상: 파일명 검색을 위한 인덱스
 * 3. 정렬 최적화: created_at 정렬을 위한 인덱스
 * 
 * 참고: concurrently 옵션은 프로덕션에서 큰 테이블에 인덱스를 추가할 때 유용하지만,
 * Sequelize CLI에서는 직접 지원하지 않으므로 일반 인덱스로 추가합니다.
 * 프로덕션 환경에서는 수동으로 CONCURRENTLY 옵션을 사용하는 것을 권장합니다.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    // Media 테이블 복합 인덱스 추가
    // user_id + analysis_status + created_at 조합은 가장 자주 사용되는 쿼리 패턴
    // 이 인덱스는 WHERE user_id = ? AND analysis_status = ? ORDER BY created_at 쿼리를 최적화
    await queryInterface.addIndex('media', ['user_id', 'analysis_status', 'created_at'], {
      name: 'idx_media_user_status_created'
    });

    // Media 테이블 파일명 검색 인덱스 추가 (ILIKE 검색 성능 향상)
    await queryInterface.addIndex('media', ['file_name'], {
      name: 'idx_media_file_name'
    });

    // TextDocument 테이블 복합 인덱스 추가
    // user_id + analysis_status + created_at 조합
    await queryInterface.addIndex('text_documents', ['user_id', 'analysis_status', 'created_at'], {
      name: 'idx_text_documents_user_status_created'
    });

    // TextDocument 테이블 user_id + document_type + analysis_status 복합 인덱스
    // document_type 필터링이 자주 사용되는 경우를 위해
    await queryInterface.addIndex('text_documents', ['user_id', 'document_type', 'analysis_status'], {
      name: 'idx_text_documents_user_type_status'
    });

    // TextDocument 테이블 파일명 검색 인덱스
    await queryInterface.addIndex('text_documents', ['file_name'], {
      name: 'idx_text_documents_file_name'
    });

    // Analysis 테이블 복합 인덱스 추가
    // user_id + created_at 조합 (최신 분석 조회 시 사용)
    await queryInterface.addIndex('analyses', ['user_id', 'created_at'], {
      name: 'idx_analyses_user_created'
    });

    // MBTIEstimation 테이블 복합 인덱스 추가
    await queryInterface.addIndex('mbti_estimations', ['user_id', 'created_at'], {
      name: 'idx_mbti_estimations_user_created'
    });

    // EmotionAnalysis 테이블 복합 인덱스 추가
    await queryInterface.addIndex('emotion_analyses', ['user_id', 'created_at'], {
      name: 'idx_emotion_analyses_user_created'
    });
  },

  async down(queryInterface, Sequelize) {
    // 인덱스 제거 (롤백)
    await queryInterface.removeIndex('media', 'idx_media_user_status_created');
    await queryInterface.removeIndex('media', 'idx_media_file_name');
    await queryInterface.removeIndex('text_documents', 'idx_text_documents_user_status_created');
    await queryInterface.removeIndex('text_documents', 'idx_text_documents_user_type_status');
    await queryInterface.removeIndex('text_documents', 'idx_text_documents_file_name');
    await queryInterface.removeIndex('analyses', 'idx_analyses_user_created');
    await queryInterface.removeIndex('mbti_estimations', 'idx_mbti_estimations_user_created');
    await queryInterface.removeIndex('emotion_analyses', 'idx_emotion_analyses_user_created');
  }
};

