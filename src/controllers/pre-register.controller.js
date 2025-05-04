const { AppError } = require('../middleware/errorHandler');
const db = require('../models');

/**
 * Handle pre-registration
 * @route POST /api/pre-register
 */
exports.preRegister = async (req, res, next) => {
  try {
    const { fullName, email, phone, instagramId } = req.body;

    // Validate required fields
    if (!fullName || !email || !phone || !instagramId) {
      return next(new AppError('تمام فیلدها الزامی هستند', 400));
    }

    // Check if email already exists
    const existingUser = await db.PreRegister.findOne({ where: { email } });
    if (existingUser) {
      return next(new AppError('این ایمیل قبلاً ثبت شده است', 400));
    }

    // Check if phone already exists
    const existingPhone = await db.PreRegister.findOne({ where: { phone } });
    if (existingPhone) {
      return next(new AppError('این شماره تلفن قبلاً ثبت شده است', 400));
    }

    // Create pre-registration record
    const preRegister = await db.PreRegister.create({
      full_name: fullName,
      email,
      phone,
      instagram_id: instagramId,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'اطلاعات شما با موفقیت ثبت شد',
      data: {
        id: preRegister.id,
        full_name: preRegister.full_name,
        email: preRegister.email,
        phone: preRegister.phone,
        instagram_id: preRegister.instagram_id,
        status: preRegister.status
      }
    });
  } catch (error) {
    next(error);
  }
}; 