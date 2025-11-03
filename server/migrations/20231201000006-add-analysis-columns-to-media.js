'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Media 테이블에 AI 분석 관련 컬럼 추가
    await queryInterface.addColumn('media', 'analysis_status', {
      type: Sequelize.ENUM('pending', 'analyzing', 'completed', 'failed'),
      defaultValue: 'pending',
      allowNull: false
    });
    
    await queryInterface.addColumn('media', 'analysis_result', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: null
    });
    
    await queryInterface.addColumn('media', 'analyzed_at', {
      type: Sequelize.DATE,
      allowNull: true
    });
    
    await queryInterface.addColumn('media', 'analysis_error', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('media', 'analysis_error');
    await queryInterface.removeColumn('media', 'analyzed_at');
    await queryInterface.removeColumn('media', 'analysis_result');
    await queryInterface.removeColumn('media', 'analysis_status');
    // ENUM 타입 제거 (PostgreSQL)
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_media_analysis_status";');
  }
};


