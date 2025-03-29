const { DataTypes } = require('sequelize');

/**
 * UserSession model for managing authenticated sessions
 * @param {import('sequelize').Sequelize} sequelize - Sequelize instance
 * @returns {import('sequelize').Model} - UserSession model
 */
module.exports = (sequelize) => {
  /**
   * @swagger
   * components:
   *   schemas:
   *     UserSession:
   *       type: object
   *       required:
   *         - user_id
   *         - token
   *         - expires_at
   *       properties:
   *         id:
   *           type: string
   *           format: uuid
   *           description: The auto-generated session ID
   *         user_id:
   *           type: string
   *           format: uuid
   *           description: ID of the user this session belongs to
   *         token:
   *           type: string
   *           description: Session token
   *         ip_address:
   *           type: string
   *           description: IP address of the client
   *         user_agent:
   *           type: string
   *           description: User agent of the client
   *         expires_at:
   *           type: string
   *           format: date-time
   *           description: Session expiration timestamp
   *         created_at:
   *           type: string
   *           format: date-time
   *           description: Creation timestamp
   */
  const UserSession = sequelize.define('UserSession', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    token: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    ip_address: {
      type: DataTypes.STRING(45)
    },
    user_agent: {
      type: DataTypes.TEXT
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    tableName: 'user_sessions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false, // No updated_at timestamp for sessions
    paranoid: false, // No soft delete for sessions
    
    // Indexes
    indexes: [
      {
        name: 'idx_user_sessions_token',
        unique: true,
        fields: ['token']
      },
      {
        name: 'idx_user_sessions_user_id',
        fields: ['user_id']
      }
    ]
  });

  // Instance method to check if session is expired
  UserSession.prototype.isExpired = function() {
    return new Date() > this.expires_at;
  };

  return UserSession;
}; 