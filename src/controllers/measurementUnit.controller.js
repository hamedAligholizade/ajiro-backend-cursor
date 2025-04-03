const { AppError } = require('../middleware/errorHandler');
const db = require('../models');

/**
 * Get all measurement units for the current shop
 */
exports.getAllUnits = async (req, res, next) => {
  try {
    const { shop } = req.user;
    
    if (!shop) {
      return next(new AppError('No shop associated with this user', 400));
    }

    const units = await db.MeasurementUnit.findAll({
      where: {
        shop_id: shop.id,
        is_active: true
      },
      order: [['name', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: units
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new measurement unit
 */
exports.createUnit = async (req, res, next) => {
  try {
    const { name, abbreviation } = req.body;
    const { shop } = req.user;
    
    if (!shop) {
      return next(new AppError('No shop associated with this user', 400));
    }

    // Check if unit with the same name already exists
    const existingUnit = await db.MeasurementUnit.findOne({
      where: {
        shop_id: shop.id,
        name
      }
    });

    if (existingUnit) {
      return next(new AppError('A measurement unit with this name already exists', 400));
    }

    const unit = await db.MeasurementUnit.create({
      name,
      abbreviation,
      shop_id: shop.id,
      is_active: true
    });

    res.status(201).json({
      success: true,
      data: unit
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a measurement unit
 */
exports.updateUnit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, abbreviation, is_active } = req.body;
    const { shop } = req.user;
    
    if (!shop) {
      return next(new AppError('No shop associated with this user', 400));
    }

    // Get the unit
    const unit = await db.MeasurementUnit.findOne({
      where: {
        id,
        shop_id: shop.id
      }
    });

    if (!unit) {
      return next(new AppError('Measurement unit not found', 404));
    }

    // Check if name is being changed and if new name already exists
    if (name && name !== unit.name) {
      const existingUnit = await db.MeasurementUnit.findOne({
        where: {
          shop_id: shop.id,
          name,
          id: { [db.Sequelize.Op.ne]: id }
        }
      });

      if (existingUnit) {
        return next(new AppError('A measurement unit with this name already exists', 400));
      }
    }

    // Update the unit
    await unit.update({
      name: name || unit.name,
      abbreviation: abbreviation !== undefined ? abbreviation : unit.abbreviation,
      is_active: is_active !== undefined ? is_active : unit.is_active
    });

    res.status(200).json({
      success: true,
      data: unit
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a measurement unit
 */
exports.deleteUnit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { shop } = req.user;
    
    if (!shop) {
      return next(new AppError('No shop associated with this user', 400));
    }

    // Get the unit
    const unit = await db.MeasurementUnit.findOne({
      where: {
        id,
        shop_id: shop.id
      }
    });

    if (!unit) {
      return next(new AppError('Measurement unit not found', 404));
    }

    // Delete the unit (soft delete)
    await unit.update({ is_active: false });

    res.status(200).json({
      success: true,
      message: 'Measurement unit deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}; 