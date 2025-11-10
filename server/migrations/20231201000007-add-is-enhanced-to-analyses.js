'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('analyses', 'is_enhanced', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });
    
    await queryInterface.addColumn('analyses', 'image_analysis_summary', {
      type: Sequelize.JSONB,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('analyses', 'image_analysis_summary');
    await queryInterface.removeColumn('analyses', 'is_enhanced');
  }
};











