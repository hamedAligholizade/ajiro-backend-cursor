const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

/**
 * User model for staff members and administrators
 * @param {import('sequelize').Sequelize} sequelize - Sequelize instance
 * @returns {import('sequelize').Model} - User model
 */
module.exports = (sequelize) => {
  /**
   * @swagger
   * components:
   *   schemas:
   *     User:
   *       type: object
   *       required:
   *         - email
   *         - password_hash
   *         - first_name
   *         - last_name
   *         - role
   *       properties:
   *         id:
   *           type: string
   *           format: uuid
   *           description: The auto-generated user ID
   *         email:
   *           type: string
   *           format: email
   *           description: User's email address (unique)
   *         password_hash:
   *           type: string
   *           description: Hashed password (not returned in responses)
   *         first_name:
   *           type: string
   *           description: User's first name
   *         last_name:
   *           type: string
   *           description: User's last name
   *         role:
   *           type: string
   *           enum: [admin, manager, cashier, inventory, marketing]
   *           description: User's role in the system
   *         phone:
   *           type: string
   *           description: User's phone number
   *         is_active:
   *           type: boolean
   *           description: Whether the user account is active
   *         last_login_at:
   *           type: string
   *           format: date-time
   *           description: Last login timestamp
   *         created_at:
   *           type: string
   *           format: date-time
   *           description: Creation timestamp
   *         updated_at:
   *           type: string
   *           format: date-time
   *           description: Last update timestamp
   */
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash'
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('admin', 'manager', 'cashier', 'inventory', 'marketing'),
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING(20)
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    last_login_at: {
      type: DataTypes.DATE
    }
  }, {
    // Additional model options
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    
    // Hooks
    hooks: {
      beforeSave: async (user) => {
        // Only hash password if it has been modified
        if (user.changed('password_hash')) {
          const salt = await bcrypt.genSalt(10);
          user.password_hash = await bcrypt.hash(user.password_hash, salt);
        }
      }
    }
  });
  
  // Add instance method to compare passwords
  User.prototype.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password_hash);
  };
  
  // Add method to safely return user data without password
  User.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.password_hash;
    return values;
  };
  
  // Add instance method to get full name
  User.prototype.getFullName = function() {
    return `${this.first_name} ${this.last_name}`;
  };
  
  return User;
}; 