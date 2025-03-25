const { AppError } = require('../middleware/errorHandler');
const db = require('../models');
const { Op } = require('sequelize');

/**
 * Get all loyalty rewards with pagination and filtering
 * @route GET /api/loyalty/rewards
 */
exports.getAllRewards = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    // Build query with filtering options
    const query = {
      limit,
      offset,
      order: [['points_required', 'ASC']],
      include: [
        {
          model: db.Product,
          as: 'product',
          attributes: ['id', 'name', 'image_url'],
          required: false
        }
      ]
    };

    // Add search filter if provided
    if (req.query.search) {
      query.where = {
        [Op.or]: [
          { name: { [Op.iLike]: `%${req.query.search}%` } },
          { description: { [Op.iLike]: `%${req.query.search}%` } }
        ]
      };
    }

    // Add reward type filter if provided
    if (req.query.reward_type) {
      query.where = {
        ...query.where,
        reward_type: req.query.reward_type
      };
    }

    // Add active status filter if provided
    if (req.query.is_active !== undefined) {
      const isActive = req.query.is_active === 'true';
      query.where = {
        ...query.where,
        is_active: isActive
      };
    }

    // Add min tier filter if provided
    if (req.query.min_tier) {
      query.where = {
        ...query.where,
        min_tier: req.query.min_tier
      };
    }

    // Add available now filter
    if (req.query.available_now === 'true') {
      const today = new Date().toISOString().split('T')[0];
      query.where = {
        ...query.where,
        [Op.and]: [
          {
            [Op.or]: [
              { start_date: null },
              { start_date: { [Op.lte]: today } }
            ]
          },
          {
            [Op.or]: [
              { end_date: null },
              { end_date: { [Op.gte]: today } }
            ]
          }
        ],
        is_active: true
      };
    }

    const { count, rows: rewards } = await db.LoyaltyReward.findAndCountAll(query);

    res.status(200).json({
      success: true,
      data: {
        rewards,
        pagination: {
          total: count,
          page,
          limit,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get reward by ID
 * @route GET /api/loyalty/rewards/:id
 */
exports.getRewardById = async (req, res, next) => {
  try {
    const reward = await db.LoyaltyReward.findByPk(req.params.id, {
      include: [
        {
          model: db.Product,
          as: 'product',
          attributes: ['id', 'name', 'image_url'],
          required: false
        }
      ]
    });

    if (!reward) {
      return next(new AppError('Reward not found', 404, 'REWARD_NOT_FOUND'));
    }

    res.status(200).json({
      success: true,
      data: {
        reward
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new loyalty reward
 * @route POST /api/loyalty/rewards
 */
exports.createReward = async (req, res, next) => {
  try {
    const { 
      name, description, points_required, reward_type,
      discount_amount, discount_percent, product_id,
      min_tier, image_url, start_date, end_date, is_active
    } = req.body;

    // Validate reward type-specific fields
    if (reward_type === 'discount' && !discount_amount && !discount_percent) {
      return next(new AppError('Discount rewards require either discount_amount or discount_percent', 400, 'VALIDATION_ERROR'));
    }

    if (reward_type === 'free_product' && !product_id) {
      return next(new AppError('Free product rewards require a product_id', 400, 'VALIDATION_ERROR'));
    }

    // Check if product exists (if provided)
    if (product_id) {
      const product = await db.Product.findByPk(product_id);
      if (!product) {
        return next(new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND'));
      }
    }

    // Create new reward
    const reward = await db.LoyaltyReward.create({
      name,
      description,
      points_required,
      reward_type,
      discount_amount,
      discount_percent,
      product_id,
      min_tier: min_tier || 'bronze',
      image_url,
      start_date,
      end_date,
      is_active: is_active !== undefined ? is_active : true
    });

    res.status(201).json({
      success: true,
      data: {
        reward
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update loyalty reward
 * @route PUT /api/loyalty/rewards/:id
 */
exports.updateReward = async (req, res, next) => {
  try {
    const { 
      name, description, points_required, reward_type,
      discount_amount, discount_percent, product_id,
      min_tier, image_url, start_date, end_date, is_active
    } = req.body;
    
    const rewardId = req.params.id;

    // Check if reward exists
    const reward = await db.LoyaltyReward.findByPk(rewardId);
    if (!reward) {
      return next(new AppError('Reward not found', 404, 'REWARD_NOT_FOUND'));
    }

    // Validate reward type-specific fields if changing reward type
    if (reward_type && reward_type !== reward.reward_type) {
      if (reward_type === 'discount' && !discount_amount && !discount_percent) {
        return next(new AppError('Discount rewards require either discount_amount or discount_percent', 400, 'VALIDATION_ERROR'));
      }

      if (reward_type === 'free_product' && !product_id) {
        return next(new AppError('Free product rewards require a product_id', 400, 'VALIDATION_ERROR'));
      }
    }

    // Check if product exists (if provided)
    if (product_id && product_id !== reward.product_id) {
      const product = await db.Product.findByPk(product_id);
      if (!product) {
        return next(new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND'));
      }
    }

    // Update reward
    await reward.update({
      name: name || reward.name,
      description: description !== undefined ? description : reward.description,
      points_required: points_required || reward.points_required,
      reward_type: reward_type || reward.reward_type,
      discount_amount: discount_amount !== undefined ? discount_amount : reward.discount_amount,
      discount_percent: discount_percent !== undefined ? discount_percent : reward.discount_percent,
      product_id: product_id !== undefined ? product_id : reward.product_id,
      min_tier: min_tier || reward.min_tier,
      image_url: image_url !== undefined ? image_url : reward.image_url,
      start_date: start_date !== undefined ? start_date : reward.start_date,
      end_date: end_date !== undefined ? end_date : reward.end_date,
      is_active: is_active !== undefined ? is_active : reward.is_active
    });

    res.status(200).json({
      success: true,
      data: {
        reward
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete loyalty reward
 * @route DELETE /api/loyalty/rewards/:id
 */
exports.deleteReward = async (req, res, next) => {
  try {
    const rewardId = req.params.id;

    // Check if reward exists
    const reward = await db.LoyaltyReward.findByPk(rewardId);
    if (!reward) {
      return next(new AppError('Reward not found', 404, 'REWARD_NOT_FOUND'));
    }

    // Check if reward has been redeemed
    const redemptionsCount = await db.LoyaltyRewardRedemption.count({ 
      where: { reward_id: rewardId } 
    });

    if (redemptionsCount > 0) {
      // Instead of deleting, just deactivate
      await reward.update({ is_active: false });
      
      return res.status(200).json({
        success: true,
        message: 'Reward has been redeemed by customers and cannot be deleted. Reward has been deactivated instead.',
        data: {
          reward: {
            id: reward.id,
            is_active: reward.is_active
          }
        }
      });
    }

    // Delete reward
    await reward.destroy();

    res.status(200).json({
      success: true,
      message: 'Reward deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all customer redemptions
 * @route GET /api/loyalty/redemptions
 */
exports.getAllRedemptions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    // Build query with filtering options
    const query = {
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: db.Customer,
          as: 'customer',
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone']
        },
        {
          model: db.LoyaltyReward,
          as: 'reward',
          attributes: ['id', 'name', 'points_required', 'reward_type']
        },
        {
          model: db.User,
          as: 'processor',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ]
    };

    // Add customer filter if provided
    if (req.query.customer_id) {
      query.where = {
        ...query.where,
        customer_id: req.query.customer_id
      };
    }

    // Add reward filter if provided
    if (req.query.reward_id) {
      query.where = {
        ...query.where,
        reward_id: req.query.reward_id
      };
    }

    // Add status filter if provided
    if (req.query.status) {
      query.where = {
        ...query.where,
        status: req.query.status
      };
    }

    // Add date range filter if provided
    if (req.query.from_date && req.query.to_date) {
      query.where = {
        ...query.where,
        created_at: {
          [Op.between]: [req.query.from_date, req.query.to_date]
        }
      };
    } else if (req.query.from_date) {
      query.where = {
        ...query.where,
        created_at: {
          [Op.gte]: req.query.from_date
        }
      };
    } else if (req.query.to_date) {
      query.where = {
        ...query.where,
        created_at: {
          [Op.lte]: req.query.to_date
        }
      };
    }

    const { count, rows: redemptions } = await db.LoyaltyRewardRedemption.findAndCountAll(query);

    res.status(200).json({
      success: true,
      data: {
        redemptions,
        pagination: {
          total: count,
          page,
          limit,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get redemption by ID
 * @route GET /api/loyalty/redemptions/:id
 */
exports.getRedemptionById = async (req, res, next) => {
  try {
    const redemption = await db.LoyaltyRewardRedemption.findByPk(req.params.id, {
      include: [
        {
          model: db.Customer,
          as: 'customer',
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone']
        },
        {
          model: db.LoyaltyReward,
          as: 'reward',
          include: [
            {
              model: db.Product,
              as: 'product',
              attributes: ['id', 'name', 'image_url'],
              required: false
            }
          ]
        },
        {
          model: db.User,
          as: 'processor',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ]
    });

    if (!redemption) {
      return next(new AppError('Redemption not found', 404, 'REDEMPTION_NOT_FOUND'));
    }

    res.status(200).json({
      success: true,
      data: {
        redemption
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new redemption
 * @route POST /api/loyalty/redemptions
 */
exports.createRedemption = async (req, res, next) => {
  try {
    const { customer_id, reward_id, notes } = req.body;

    // Check if customer exists
    const customer = await db.Customer.findByPk(customer_id);
    if (!customer) {
      return next(new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND'));
    }

    // Check if reward exists
    const reward = await db.LoyaltyReward.findByPk(reward_id);
    if (!reward) {
      return next(new AppError('Reward not found', 404, 'REWARD_NOT_FOUND'));
    }

    // Check if reward is active
    if (!reward.is_active) {
      return next(new AppError('This reward is no longer available', 400, 'REWARD_INACTIVE'));
    }

    // Check if reward is within date range
    const today = new Date();
    if (reward.start_date && new Date(reward.start_date) > today) {
      return next(new AppError('This reward is not yet available', 400, 'REWARD_NOT_AVAILABLE'));
    }
    if (reward.end_date && new Date(reward.end_date) < today) {
      return next(new AppError('This reward has expired', 400, 'REWARD_EXPIRED'));
    }

    // Check if customer has sufficient loyalty points
    if (customer.loyalty_points < reward.points_required) {
      return next(new AppError('Customer does not have enough loyalty points', 400, 'INSUFFICIENT_POINTS'));
    }

    // Check if customer's tier is sufficient
    const tierRanking = { bronze: 0, silver: 1, gold: 2, platinum: 3 };
    if (tierRanking[customer.loyalty_tier] < tierRanking[reward.min_tier]) {
      return next(new AppError(`This reward requires at least ${reward.min_tier} tier`, 400, 'INSUFFICIENT_TIER'));
    }

    // Create redemption record (the hook in the model will handle point deduction)
    const redemption = await db.LoyaltyRewardRedemption.create({
      customer_id,
      reward_id,
      points_used: reward.points_required,
      user_id: req.user.id,
      status: 'pending',
      notes
    });

    res.status(201).json({
      success: true,
      data: {
        redemption,
        customer: {
          id: customer.id,
          loyalty_points: customer.loyalty_points - reward.points_required
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update redemption status
 * @route PATCH /api/loyalty/redemptions/:id/status
 */
exports.updateRedemptionStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const redemptionId = req.params.id;

    if (!['pending', 'completed', 'cancelled'].includes(status)) {
      return next(new AppError('Invalid status. Must be pending, completed, or cancelled', 400, 'INVALID_STATUS'));
    }

    // Check if redemption exists
    const redemption = await db.LoyaltyRewardRedemption.findByPk(redemptionId, {
      include: [
        {
          model: db.Customer,
          as: 'customer'
        },
        {
          model: db.LoyaltyReward,
          as: 'reward'
        }
      ]
    });

    if (!redemption) {
      return next(new AppError('Redemption not found', 404, 'REDEMPTION_NOT_FOUND'));
    }

    // Handle status change from pending to cancelled
    if (redemption.status === 'pending' && status === 'cancelled') {
      // Refund points to customer
      await redemption.customer.increment('loyalty_points', { by: redemption.points_used });

      // Record loyalty transaction
      await db.LoyaltyTransaction.create({
        customer_id: redemption.customer_id,
        points: redemption.points_used,
        type: 'credit',
        user_id: req.user.id,
        description: `Reward redemption cancelled: ${redemption.id}`
      });
    }

    // Handle status change from pending to completed
    // No additional action needed as points were already deducted

    // Update redemption status
    await redemption.update({ 
      status, 
      user_id: req.user.id // Update processor to the user who changed status
    });

    res.status(200).json({
      success: true,
      message: `Redemption status updated to ${status}`,
      data: {
        redemption
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get customer loyalty transactions
 * @route GET /api/loyalty/transactions
 */
exports.getLoyaltyTransactions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    // Build query with filtering options
    const query = {
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: db.Customer,
          as: 'customer',
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone']
        },
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email'],
          required: false
        },
        {
          model: db.Sale,
          as: 'sale',
          attributes: ['id', 'invoice_number', 'total_amount'],
          required: false
        }
      ]
    };

    // Add customer filter if provided
    if (req.query.customer_id) {
      query.where = {
        ...query.where,
        customer_id: req.query.customer_id
      };
    }

    // Add transaction type filter if provided
    if (req.query.type) {
      query.where = {
        ...query.where,
        type: req.query.type
      };
    }

    // Add date range filter if provided
    if (req.query.from_date && req.query.to_date) {
      query.where = {
        ...query.where,
        created_at: {
          [Op.between]: [req.query.from_date, req.query.to_date]
        }
      };
    } else if (req.query.from_date) {
      query.where = {
        ...query.where,
        created_at: {
          [Op.gte]: req.query.from_date
        }
      };
    } else if (req.query.to_date) {
      query.where = {
        ...query.where,
        created_at: {
          [Op.lte]: req.query.to_date
        }
      };
    }

    const { count, rows: transactions } = await db.LoyaltyTransaction.findAndCountAll(query);

    res.status(200).json({
      success: true,
      data: {
        transactions,
        pagination: {
          total: count,
          page,
          limit,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get customer loyalty summary
 * @route GET /api/loyalty/customer/:id/summary
 */
exports.getCustomerLoyaltySummary = async (req, res, next) => {
  try {
    const customerId = req.params.id;

    // Check if customer exists
    const customer = await db.Customer.findByPk(customerId);
    if (!customer) {
      return next(new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND'));
    }

    // Get total points earned
    const earnedPoints = await db.LoyaltyTransaction.sum('points', {
      where: {
        customer_id: customerId,
        type: 'credit'
      }
    }) || 0;

    // Get total points used
    const usedPoints = await db.LoyaltyTransaction.sum('points', {
      where: {
        customer_id: customerId,
        type: 'debit'
      }
    }) || 0;

    // Get recent transactions
    const recentTransactions = await db.LoyaltyTransaction.findAll({
      where: {
        customer_id: customerId
      },
      order: [['created_at', 'DESC']],
      limit: 5,
      include: [
        {
          model: db.Sale,
          as: 'sale',
          attributes: ['id', 'invoice_number'],
          required: false
        }
      ]
    });

    // Get pending redemptions
    const pendingRedemptions = await db.LoyaltyRewardRedemption.findAll({
      where: {
        customer_id: customerId,
        status: 'pending'
      },
      include: [
        {
          model: db.LoyaltyReward,
          as: 'reward',
          attributes: ['id', 'name', 'reward_type']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Get completed redemptions
    const completedRedemptions = await db.LoyaltyRewardRedemption.count({
      where: {
        customer_id: customerId,
        status: 'completed'
      }
    });

    // Next tier calculation
    let nextTier = null;
    let pointsToNextTier = 0;

    if (customer.loyalty_tier === 'bronze') {
      nextTier = 'silver';
      pointsToNextTier = 200 - customer.loyalty_points;
    } else if (customer.loyalty_tier === 'silver') {
      nextTier = 'gold';
      pointsToNextTier = 500 - customer.loyalty_points;
    } else if (customer.loyalty_tier === 'gold') {
      nextTier = 'platinum';
      pointsToNextTier = 1000 - customer.loyalty_points;
    }

    if (pointsToNextTier < 0) pointsToNextTier = 0;

    res.status(200).json({
      success: true,
      data: {
        customer: {
          id: customer.id,
          first_name: customer.first_name,
          last_name: customer.last_name,
          loyalty_points: customer.loyalty_points,
          loyalty_tier: customer.loyalty_tier
        },
        loyalty_summary: {
          total_points_earned: earnedPoints,
          total_points_used: Math.abs(usedPoints),
          current_balance: customer.loyalty_points,
          current_tier: customer.loyalty_tier,
          next_tier: nextTier,
          points_to_next_tier: pointsToNextTier,
          completed_redemptions: completedRedemptions
        },
        recent_transactions: recentTransactions,
        pending_redemptions: pendingRedemptions
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get loyalty program tiers
 * @route GET /api/loyalty/tiers
 */
exports.getLoyaltyTiers = async (req, res, next) => {
  try {
    // Define the loyalty tier structure
    const tiers = [
      {
        name: 'bronze',
        points_required: 0,
        benefits: [
          'Basic rewards access',
          'Birthday reward'
        ]
      },
      {
        name: 'silver',
        points_required: 200,
        benefits: [
          'All bronze benefits',
          '5% discount on purchases',
          'Special seasonal rewards'
        ]
      },
      {
        name: 'gold',
        points_required: 500,
        benefits: [
          'All silver benefits',
          '8% discount on purchases',
          'Early access to promotions',
          'Free delivery on orders'
        ]
      },
      {
        name: 'platinum',
        points_required: 1000,
        benefits: [
          'All gold benefits',
          '10% discount on purchases',
          'Premium rewards access',
          'Priority customer service',
          'Exclusive event invitations'
        ]
      }
    ];

    res.status(200).json({
      success: true,
      data: {
        tiers
      }
    });
  } catch (error) {
    next(error);
  }
}; 