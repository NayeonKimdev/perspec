'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('profiles', 'dreams', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    
    await queryInterface.addColumn('profiles', 'dating_style', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    
    await queryInterface.addColumn('profiles', 'other_info', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('profiles', 'dreams');
    await queryInterface.removeColumn('profiles', 'dating_style');
    await queryInterface.removeColumn('profiles', 'other_info');
  }
};

