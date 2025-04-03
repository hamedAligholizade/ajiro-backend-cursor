const AppError = require('../utils/appError');
const db = require('../models');
const { Unit } = db;

/**
 * Get all measurement units for the current shop
 */
exports.getUnits = async (req, res, next) => {
  try {
    // Get user's shop ID from the UserShop relation
    const userShop = await db.UserShop.findOne({
      where: { user_id: req.user.id }
    });

    if (!userShop) {
      return next(new AppError('No shop associated with this user', 400));
    }

    // Get all units for the shop
    const units = await Unit.findAll({
      where: { shop_id: userShop.shop_id }
    });

    res.status(200).json({
      status: 'success',
      results: units.length,
      data: {
        units
      }
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
    // Get user's shop ID from the UserShop relation
    const userShop = await db.UserShop.findOne({
      where: { user_id: req.user.id }
    });

    if (!userShop) {
      return next(new AppError('No shop associated with this user', 400));
    }

    // Extract unit data from request
    const { name, abbreviation, is_default = false, conversion_factor = 1 } = req.body;

    // Check if a unit with the same name already exists in this shop
    const existingUnit = await Unit.findOne({
      where: { 
        shop_id: userShop.shop_id,
        name
      }
    });

    if (existingUnit) {
      return next(new AppError('A unit with this name already exists', 400));
    }

    // Create new unit
    const unit = await Unit.create({
      name,
      abbreviation,
      is_default,
      conversion_factor,
      shop_id: userShop.shop_id
    });

    // If this unit is set as default, update other units to not be default
    if (is_default) {
      await Unit.update(
        { is_default: false },
        { 
          where: { 
            shop_id: userShop.shop_id,
            id: { [db.Sequelize.Op.ne]: unit.id }
          }
        }
      );
    }

    res.status(201).json({
      status: 'success',
      data: {
        unit
      }
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
    
    // Get user's shop ID from the UserShop relation
    const userShop = await db.UserShop.findOne({
      where: { user_id: req.user.id }
    });

    if (!userShop) {
      return next(new AppError('No shop associated with this user', 400));
    }

    // Find the unit to update
    const unit = await Unit.findOne({
      where: { 
        id,
        shop_id: userShop.shop_id
      }
    });

    if (!unit) {
      return next(new AppError('Unit not found or does not belong to your shop', 404));
    }

    // Extract unit data from request
    const { name, abbreviation, is_default, conversion_factor } = req.body;

    // Check if a unit with the same name already exists in this shop (excluding this unit)
    if (name && name !== unit.name) {
      const existingUnit = await Unit.findOne({
        where: { 
          shop_id: userShop.shop_id,
          name,
          id: { [db.Sequelize.Op.ne]: id }
        }
      });

      if (existingUnit) {
        return next(new AppError('A unit with this name already exists', 400));
      }
    }

    // Update the unit
    await unit.update({
      name: name || unit.name,
      abbreviation: abbreviation || unit.abbreviation,
      is_default: is_default !== undefined ? is_default : unit.is_default,
      conversion_factor: conversion_factor !== undefined ? conversion_factor : unit.conversion_factor
    });

    // If this unit is set as default, update other units to not be default
    if (is_default) {
      await Unit.update(
        { is_default: false },
        { 
          where: { 
            shop_id: userShop.shop_id,
            id: { [db.Sequelize.Op.ne]: unit.id }
          }
        }
      );
    }

    res.status(200).json({
      status: 'success',
      data: {
        unit
      }
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
    
    // Get user's shop ID from the UserShop relation
    const userShop = await db.UserShop.findOne({
      where: { user_id: req.user.id }
    });

    if (!userShop) {
      return next(new AppError('No shop associated with this user', 400));
    }

    // Find the unit to delete
    const unit = await Unit.findOne({
      where: { 
        id,
        shop_id: userShop.shop_id
      }
    });

    if (!unit) {
      return next(new AppError('Unit not found or does not belong to your shop', 404));
    }

    // Check if unit is in use by any products
    const productsUsingUnit = await db.Product.count({
      where: { unit_id: id }
    });

    if (productsUsingUnit > 0) {
      return next(new AppError('Cannot delete unit that is in use by products', 400));
    }

    // Delete the unit
    await unit.destroy();

    res.status(200).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
}; 