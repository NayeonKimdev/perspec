'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // user_social_logins 테이블 생성
    await queryInterface.createTable('user_social_logins', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: '사용자 ID'
      },
      provider: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: '소셜 로그인 제공자 (google, kakao, naver 등)'
      },
      provider_id: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: '소셜 로그인 제공자의 사용자 ID'
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    });

    // provider와 provider_id 복합 유니크 인덱스 (같은 provider의 같은 provider_id는 중복 불가)
    await queryInterface.addIndex('user_social_logins', ['provider', 'provider_id'], {
      unique: true,
      name: 'user_social_logins_provider_provider_id_unique'
    });

    // user_id 인덱스 (조회 성능 향상)
    await queryInterface.addIndex('user_social_logins', ['user_id'], {
      name: 'user_social_logins_user_id_idx'
    });

    // 기존 users 테이블의 provider, provider_id 데이터를 user_social_logins로 마이그레이션
    const [users] = await queryInterface.sequelize.query(`
      SELECT id, provider, provider_id 
      FROM users 
      WHERE provider IS NOT NULL AND provider_id IS NOT NULL
    `);

    if (users.length > 0) {
      const socialLogins = users.map(user => ({
        id: Sequelize.UUIDV4(),
        user_id: user.id,
        provider: user.provider,
        provider_id: user.provider_id,
        created_at: new Date(),
        updated_at: new Date()
      }));

      await queryInterface.bulkInsert('user_social_logins', socialLogins);
    }
  },

  down: async (queryInterface, Sequelize) => {
    // 인덱스 제거
    await queryInterface.removeIndex('user_social_logins', 'user_social_logins_user_id_idx');
    await queryInterface.removeIndex('user_social_logins', 'user_social_logins_provider_provider_id_unique');

    // 테이블 제거
    await queryInterface.dropTable('user_social_logins');
  }
};

