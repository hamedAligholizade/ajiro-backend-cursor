/**
 * Loyalty Program model
 * @param {import('sequelize').Sequelize} sequelize - Sequelize instance
 * @param {import('sequelize/types').DataTypes} DataTypes - Sequelize data types
 * @returns {import('sequelize').Model} - LoyaltyProgram model
 */
module.exports = (sequelize, DataTypes) => {
  /**
   * @swagger
   * components:
   *   schemas:
   *     LoyaltyProgram:
   *       type: object
   *       required:
   *         - name
   *         - points_per_currency
   *         - is_active
   *       properties:
   *         id:
   *           type: string
   *           format: uuid
   *           description: The auto-generated program ID
   *         name:
   *           type: string
   *           description: The name of the loyalty program
   *         description:
   *           type: string
   *           description: Description of the loyalty program
   *         points_per_currency:
   *           type: number
   *           description: Number of points awarded per currency unit spent
   *         is_active:
   *           type: boolean
   *           description: Whether the program is currently active
   *         start_date:
   *           type: string
   *           format: date-time
   *           description: When the program starts
   *         end_date:
   *           type: string
   *           format: date-time
   *           description: When the program ends (optional)
   */
  const LoyaltyProgram = sequelize.define('LoyaltyProgram', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    points_per_currency: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 1.0,
      validate: {
        min: 0.01
      }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'loyalty_programs',
    timestamps: true,
    underscored: true
  });

  // Define associations
  LoyaltyProgram.associate = function(models) {
    // A loyalty program has many loyalty transactions
    LoyaltyProgram.hasMany(models.LoyaltyTransaction, {
      foreignKey: 'program_id',
      as: 'transactions'
    });

    // A loyalty program has many rewards
    if (models.LoyaltyReward) {
      LoyaltyProgram.hasMany(models.LoyaltyReward, {
        foreignKey: 'program_id',
        as: 'rewards'
      });
    }
  };

  return LoyaltyProgram;
}; 