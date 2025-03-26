const { AppError } = require('../middleware/errorHandler');
const db = require('../models');
const { Op, QueryTypes } = require('sequelize');

/**
 * Get sales reports with various metrics and time periods
 * @route GET /api/reports/sales
 */
exports.getSalesReport = async (req, res, next) => {
  try {
    const { 
      start_date = new Date(new Date().setDate(1)), // Default to start of current month
      end_date = new Date(), 
      period = 'daily',
      include_taxes = 'true',
      include_discounts = 'true',
      payment_method,
      customer_id,
      user_id,
      category_id,
      product_id
    } = req.query;

    // Format dates for query
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    endDate.setHours(23, 59, 59, 999);

    // Base query conditions
    const baseConditions = {
      sale_date: {
        [Op.between]: [startDate, endDate]
      },
      payment_status: {
        [Op.not]: 'cancelled'
      }
    };

    // Add optional filters
    if (payment_method) {
      baseConditions.payment_method = payment_method;
    }
    
    if (customer_id) {
      baseConditions.customer_id = customer_id;
    }
    
    if (user_id) {
      baseConditions.user_id = user_id;
    }

    // Determine group by clause based on period
    let groupFormat, intervalLabel;
    switch (period) {
      case 'hourly':
        groupFormat = 'hour';
        intervalLabel = 'Hour';
        break;
      case 'weekly':
        groupFormat = 'week';
        intervalLabel = 'Week';
        break;
      case 'monthly':
        groupFormat = 'month';
        intervalLabel = 'Month';
        break;
      case 'yearly':
        groupFormat = 'year';
        intervalLabel = 'Year';
        break;
      case 'daily':
      default:
        groupFormat = 'day';
        intervalLabel = 'Day';
        break;
    }

    // Get sales summary for the period
    let salesData = await db.Sale.findAll({
      where: baseConditions,
      attributes: [
        [db.sequelize.fn('date_trunc', groupFormat, db.sequelize.col('sale_date')), 'interval'],
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count'],
        [db.sequelize.fn('SUM', db.sequelize.col('total_amount')), 'total_sales'],
        [db.sequelize.fn('SUM', db.sequelize.col('subtotal')), 'subtotal'],
        ...(include_taxes === 'true' ? [[db.sequelize.fn('SUM', db.sequelize.col('tax_amount')), 'total_tax']] : []),
        ...(include_discounts === 'true' ? [[db.sequelize.fn('SUM', db.sequelize.col('discount_amount')), 'total_discount']] : [])
      ],
      group: [db.sequelize.fn('date_trunc', groupFormat, db.sequelize.col('sale_date'))],
      order: [db.sequelize.literal('interval ASC')],
      raw: true
    });

    // If product or category filter is applied, we need to join with sale_items
    if (product_id || category_id) {
      // More complex query with joins
      const joinQuery = `
        SELECT
          date_trunc('${groupFormat}', s.sale_date) as interval,
          COUNT(DISTINCT s.id) as count,
          SUM(s.total_amount) as total_sales,
          SUM(s.subtotal) as subtotal
          ${include_taxes === 'true' ? ', SUM(s.tax_amount) as total_tax' : ''}
          ${include_discounts === 'true' ? ', SUM(s.discount_amount) as total_discount' : ''}
        FROM sales s
        JOIN sale_items si ON s.id = si.sale_id
        ${category_id ? 'JOIN products p ON si.product_id = p.id' : ''}
        WHERE s.sale_date BETWEEN :startDate AND :endDate
          AND s.payment_status != 'cancelled'
          ${payment_method ? 'AND s.payment_method = :paymentMethod' : ''}
          ${customer_id ? 'AND s.customer_id = :customerId' : ''}
          ${user_id ? 'AND s.user_id = :userId' : ''}
          ${product_id ? 'AND si.product_id = :productId' : ''}
          ${category_id ? 'AND p.category_id = :categoryId' : ''}
        GROUP BY date_trunc('${groupFormat}', s.sale_date)
        ORDER BY interval ASC
      `;

      salesData = await db.sequelize.query(joinQuery, {
        type: QueryTypes.SELECT,
        replacements: { 
          startDate, 
          endDate,
          paymentMethod: payment_method,
          customerId: customer_id,
          userId: user_id,
          productId: product_id,
          categoryId: category_id
        }
      });
    }

    // Get overall summary
    const summary = await db.Sale.findAll({
      where: baseConditions,
      attributes: [
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'total_transactions'],
        [db.sequelize.fn('SUM', db.sequelize.col('total_amount')), 'total_revenue'],
        [db.sequelize.fn('AVG', db.sequelize.col('total_amount')), 'average_sale_value'],
        [db.sequelize.fn('COUNT', db.sequelize.fn('DISTINCT', db.sequelize.col('customer_id'))), 'unique_customers'],
        ...(include_taxes === 'true' ? [[db.sequelize.fn('SUM', db.sequelize.col('tax_amount')), 'total_tax']] : []),
        ...(include_discounts === 'true' ? [[db.sequelize.fn('SUM', db.sequelize.col('discount_amount')), 'total_discount']] : [])
      ],
      raw: true
    });

    // Get payment method breakdown
    const paymentMethodBreakdown = await db.Sale.findAll({
      where: baseConditions,
      attributes: [
        'payment_method',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count'],
        [db.sequelize.fn('SUM', db.sequelize.col('total_amount')), 'total']
      ],
      group: ['payment_method'],
      raw: true
    });

    // Format response
    res.status(200).json({
      success: true,
      data: {
        period: {
          start_date: startDate,
          end_date: endDate,
          interval: intervalLabel
        },
        summary: {
          total_transactions: parseInt(summary[0].total_transactions) || 0,
          total_revenue: parseFloat(summary[0].total_revenue) || 0,
          average_sale_value: parseFloat(summary[0].average_sale_value) || 0,
          unique_customers: parseInt(summary[0].unique_customers) || 0,
          ...(include_taxes === 'true' ? { total_tax: parseFloat(summary[0].total_tax) || 0 } : {}),
          ...(include_discounts === 'true' ? { total_discount: parseFloat(summary[0].total_discount) || 0 } : {})
        },
        sales_over_time: salesData.map(item => ({
          interval: item.interval,
          count: parseInt(item.count) || 0,
          total_sales: parseFloat(item.total_sales) || 0,
          subtotal: parseFloat(item.subtotal) || 0,
          ...(include_taxes === 'true' ? { total_tax: parseFloat(item.total_tax) || 0 } : {}),
          ...(include_discounts === 'true' ? { total_discount: parseFloat(item.total_discount) || 0 } : {})
        })),
        payment_methods: paymentMethodBreakdown.map(item => ({
          payment_method: item.payment_method,
          count: parseInt(item.count) || 0,
          total: parseFloat(item.total) || 0,
          percentage: parseFloat((item.total / summary[0].total_revenue) * 100).toFixed(2)
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get inventory reports including stock status and movement
 * @route GET /api/reports/inventory
 */
exports.getInventoryReport = async (req, res, next) => {
  try {
    const { 
      low_stock_threshold = 10, 
      category_id, 
      include_zero_stock = 'true', 
      sort_by = 'stock_quantity', 
      sort_order = 'asc' 
    } = req.query;

    // Base query conditions
    const whereConditions = {};
    if (include_zero_stock !== 'true') {
      whereConditions['$inventory.stock_quantity$'] = { [Op.gt]: 0 };
    }
    
    if (category_id) {
      whereConditions.category_id = category_id;
    }

    // Get inventory status
    const inventoryStatus = await db.Product.findAll({
      attributes: [
        'id', 
        'name', 
        'sku', 
        'category_id'
      ],
      include: [
        {
          model: db.Inventory,
          as: 'inventory',
          attributes: [
            'stock_quantity', 
            'available_quantity', 
            'reorder_level',
            'updated_at'
          ]
        },
        {
          model: db.Category,
          as: 'category',
          attributes: ['id', 'name']
        }
      ],
      where: whereConditions,
      order: [[db.sequelize.literal(`inventory.${sort_by}`), sort_order.toUpperCase()]],
      raw: false
    });

    // Identify low stock products
    const lowStockProducts = inventoryStatus.filter(
      product => product.inventory && 
      product.inventory.stock_quantity <= (product.inventory.reorder_level || low_stock_threshold)
    );

    // Count products by stock status
    const stockStatusCounts = {
      total: inventoryStatus.length,
      low_stock: lowStockProducts.length,
      out_of_stock: inventoryStatus.filter(p => p.inventory && p.inventory.stock_quantity === 0).length,
      in_stock: inventoryStatus.filter(p => p.inventory && p.inventory.stock_quantity > 0).length
    };

    // Get recent inventory movements (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentMovements = await db.InventoryTransaction.findAll({
      attributes: [
        'id', 
        'product_id', 
        'quantity', 
        'transaction_type', 
        'created_at'
      ],
      include: [
        {
          model: db.Product,
          as: 'product',
          attributes: ['id', 'name', 'sku']
        }
      ],
      where: {
        created_at: { [Op.gte]: thirtyDaysAgo }
      },
      order: [['created_at', 'DESC']],
      limit: 100
    });

    // Group inventory by category
    const inventoryByCategory = await db.Category.findAll({
      attributes: ['id', 'name'],
      include: [
        {
          model: db.Product,
          as: 'products',
          attributes: ['id'],
          include: [
            {
              model: db.Inventory,
              as: 'inventory',
              attributes: [
                [db.sequelize.fn('SUM', db.sequelize.col('stock_quantity')), 'total_stock'],
                [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'product_count']
              ]
            }
          ]
        }
      ],
      group: ['Category.id', 'products.id', 'products->inventory.id'],
      raw: false
    });

    res.status(200).json({
      success: true,
      data: {
        summary: stockStatusCounts,
        inventory_status: inventoryStatus.map(product => ({
          id: product.id,
          name: product.name,
          sku: product.sku,
          category: product.category ? product.category.name : null,
          stock_quantity: product.inventory ? product.inventory.stock_quantity : 0,
          available_quantity: product.inventory ? product.inventory.available_quantity : 0,
          reorder_level: product.inventory ? product.inventory.reorder_level : null,
          status: product.inventory ? (
            product.inventory.stock_quantity === 0 ? 'Out of Stock' :
            product.inventory.stock_quantity <= (product.inventory.reorder_level || low_stock_threshold) ? 'Low Stock' :
            'In Stock'
          ) : 'No Inventory'
        })),
        low_stock_products: lowStockProducts.map(product => ({
          id: product.id,
          name: product.name,
          sku: product.sku,
          category: product.category ? product.category.name : null,
          stock_quantity: product.inventory ? product.inventory.stock_quantity : 0,
          reorder_level: product.inventory ? product.inventory.reorder_level : null
        })),
        recent_movements: recentMovements.map(movement => ({
          id: movement.id,
          product: movement.product ? movement.product.name : null,
          quantity: movement.quantity,
          type: movement.transaction_type,
          date: movement.created_at
        })),
        inventory_by_category: inventoryByCategory.map(category => ({
          id: category.id,
          name: category.name,
          product_count: category.products ? category.products.length : 0,
          total_stock: category.products && category.products[0] && category.products[0].inventory 
            ? parseInt(category.products[0].inventory.dataValues.total_stock) || 0 
            : 0
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get customer reports including customer statistics and activity
 * @route GET /api/reports/customers
 */
exports.getCustomerReport = async (req, res, next) => {
  try {
    const { 
      start_date = new Date(new Date().setFullYear(new Date().getFullYear() - 1)), // Default to 1 year ago
      end_date = new Date(), 
      sort_by = 'total_spend',
      sort_order = 'desc',
      limit = 100
    } = req.query;

    // Format dates for query
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    endDate.setHours(23, 59, 59, 999);

    // Get customer activity summary
    const customerSummary = await db.Sale.findAll({
      attributes: [
        'customer_id',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'transaction_count'],
        [db.sequelize.fn('SUM', db.sequelize.col('total_amount')), 'total_spend'],
        [db.sequelize.fn('AVG', db.sequelize.col('total_amount')), 'average_spend'],
        [db.sequelize.fn('MAX', db.sequelize.col('sale_date')), 'last_purchase']
      ],
      include: [
        {
          model: db.Customer,
          as: 'customer',
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'loyalty_points', 'loyalty_tier']
        }
      ],
      where: {
        sale_date: { [Op.between]: [startDate, endDate] },
        customer_id: { [Op.not]: null },
        payment_status: { [Op.not]: 'cancelled' }
      },
      group: ['customer_id', 'customer.id'],
      order: [[db.sequelize.literal(sort_by), sort_order.toUpperCase()]],
      limit: parseInt(limit, 10),
      raw: false
    });

    // Get new vs returning customer counts over time (monthly)
    const newVsReturningQuery = `
      WITH first_purchases AS (
        SELECT 
          customer_id, 
          MIN(sale_date) as first_purchase_date
        FROM sales
        WHERE customer_id IS NOT NULL
        GROUP BY customer_id
      ),
      monthly_purchases AS (
        SELECT 
          DATE_TRUNC('month', s.sale_date) as month,
          COUNT(DISTINCT CASE WHEN fp.first_purchase_date = s.sale_date THEN s.customer_id END) as new_customers,
          COUNT(DISTINCT CASE WHEN fp.first_purchase_date < s.sale_date THEN s.customer_id END) as returning_customers
        FROM sales s
        JOIN first_purchases fp ON s.customer_id = fp.customer_id
        WHERE s.sale_date BETWEEN :startDate AND :endDate
          AND s.payment_status != 'cancelled'
        GROUP BY DATE_TRUNC('month', s.sale_date)
        ORDER BY month
      )
      SELECT * FROM monthly_purchases
    `;

    const newVsReturning = await db.sequelize.query(newVsReturningQuery, {
      type: QueryTypes.SELECT,
      replacements: { startDate, endDate }
    });

    // Get loyalty tier breakdown
    const loyaltyTiers = await db.Customer.findAll({
      attributes: [
        'loyalty_tier',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'customer_count']
      ],
      group: ['loyalty_tier'],
      raw: true
    });

    // Get overall customer metrics
    const customerMetrics = await db.Customer.findAll({
      attributes: [
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'total_customers'],
        [db.sequelize.fn('SUM', db.sequelize.col('loyalty_points')), 'total_loyalty_points']
      ],
      raw: true
    });

    // Get customers with no purchases in the last 90 days (inactive)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const inactiveCustomersQuery = `
      SELECT 
        c.id, c.first_name, c.last_name, c.email, c.phone,
        MAX(s.sale_date) as last_purchase_date
      FROM customers c
      LEFT JOIN sales s ON c.id = s.customer_id AND s.payment_status != 'cancelled'
      GROUP BY c.id, c.first_name, c.last_name, c.email, c.phone
      HAVING MAX(s.sale_date) < :ninetyDaysAgo OR MAX(s.sale_date) IS NULL
      ORDER BY last_purchase_date DESC NULLS LAST
      LIMIT 100
    `;

    const inactiveCustomers = await db.sequelize.query(inactiveCustomersQuery, {
      type: QueryTypes.SELECT,
      replacements: { ninetyDaysAgo }
    });

    res.status(200).json({
      success: true,
      data: {
        period: {
          start_date: startDate,
          end_date: endDate
        },
        summary: {
          total_customers: parseInt(customerMetrics[0].total_customers) || 0,
          total_loyalty_points: parseInt(customerMetrics[0].total_loyalty_points) || 0,
          active_customers: customerSummary.length,
          inactive_customers: inactiveCustomers.length
        },
        top_customers: customerSummary.map(cs => ({
          id: cs.customer_id,
          name: cs.customer ? `${cs.customer.first_name} ${cs.customer.last_name}` : 'Unknown',
          email: cs.customer ? cs.customer.email : null,
          phone: cs.customer ? cs.customer.phone : null,
          loyalty_tier: cs.customer ? cs.customer.loyalty_tier : null,
          loyalty_points: cs.customer ? cs.customer.loyalty_points : 0,
          transaction_count: parseInt(cs.dataValues.transaction_count) || 0,
          total_spend: parseFloat(cs.dataValues.total_spend) || 0,
          average_spend: parseFloat(cs.dataValues.average_spend) || 0,
          last_purchase: cs.dataValues.last_purchase
        })),
        new_vs_returning: newVsReturning.map(month => ({
          month: month.month,
          new_customers: parseInt(month.new_customers) || 0,
          returning_customers: parseInt(month.returning_customers) || 0,
          total_customers: (parseInt(month.new_customers) || 0) + (parseInt(month.returning_customers) || 0)
        })),
        loyalty_tiers: loyaltyTiers.map(tier => ({
          tier: tier.loyalty_tier,
          count: parseInt(tier.customer_count) || 0
        })),
        inactive_customers: inactiveCustomers.map(customer => ({
          id: customer.id,
          name: `${customer.first_name} ${customer.last_name}`,
          email: customer.email,
          phone: customer.phone,
          last_purchase_date: customer.last_purchase_date
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get business performance dashboard with key metrics
 * @route GET /api/reports/dashboard
 */
exports.getDashboardReport = async (req, res, next) => {
  try {
    // Get date ranges
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const endOfToday = new Date(today.setHours(23, 59, 59, 999));
    
    const startOfYesterday = new Date(yesterday.setHours(0, 0, 0, 0));
    const endOfYesterday = new Date(yesterday.setHours(23, 59, 59, 999));
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const startOfPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);

    // Get today's sales
    const todaySales = await db.Sale.findAll({
      where: {
        sale_date: { [Op.between]: [startOfToday, endOfToday] },
        payment_status: { [Op.not]: 'cancelled' }
      },
      attributes: [
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count'],
        [db.sequelize.fn('SUM', db.sequelize.col('total_amount')), 'total']
      ],
      raw: true
    });

    // Get yesterday's sales for comparison
    const yesterdaySales = await db.Sale.findAll({
      where: {
        sale_date: { [Op.between]: [startOfYesterday, endOfYesterday] },
        payment_status: { [Op.not]: 'cancelled' }
      },
      attributes: [
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count'],
        [db.sequelize.fn('SUM', db.sequelize.col('total_amount')), 'total']
      ],
      raw: true
    });

    // Get this week's sales
    const thisWeekSales = await db.Sale.findAll({
      where: {
        sale_date: { [Op.between]: [startOfWeek, endOfToday] },
        payment_status: { [Op.not]: 'cancelled' }
      },
      attributes: [
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count'],
        [db.sequelize.fn('SUM', db.sequelize.col('total_amount')), 'total']
      ],
      raw: true
    });

    // Get this month's sales
    const thisMonthSales = await db.Sale.findAll({
      where: {
        sale_date: { [Op.between]: [startOfMonth, endOfToday] },
        payment_status: { [Op.not]: 'cancelled' }
      },
      attributes: [
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count'],
        [db.sequelize.fn('SUM', db.sequelize.col('total_amount')), 'total']
      ],
      raw: true
    });

    // Get previous month's sales for comparison
    const prevMonthSales = await db.Sale.findAll({
      where: {
        sale_date: { [Op.between]: [startOfPrevMonth, endOfPrevMonth] },
        payment_status: { [Op.not]: 'cancelled' }
      },
      attributes: [
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count'],
        [db.sequelize.fn('SUM', db.sequelize.col('total_amount')), 'total']
      ],
      raw: true
    });

    // Get inventory alerts (low stock)
    const lowStockCount = await db.sequelize.query(`
      SELECT COUNT(*) as count
      FROM inventories i
      JOIN products p ON i.product_id = p.id
      WHERE i.stock_quantity <= COALESCE(i.reorder_level, 10)
        AND p.is_active = true
    `, { type: QueryTypes.SELECT });

    // Get out of stock count
    const outOfStockCount = await db.sequelize.query(`
      SELECT COUNT(*) as count
      FROM inventories i
      JOIN products p ON i.product_id = p.id
      WHERE i.stock_quantity = 0
        AND p.is_active = true
    `, { type: QueryTypes.SELECT });

    // Get customer count
    const customerCount = await db.Customer.count({
      where: { is_active: true }
    });

    // Get new customers this month
    const newCustomersThisMonth = await db.sequelize.query(`
      SELECT COUNT(*) as count
      FROM customers
      WHERE created_at >= :startOfMonth
        AND is_active = true
    `, {
      type: QueryTypes.SELECT,
      replacements: { startOfMonth }
    });

    // Get recent sales
    const recentSales = await db.Sale.findAll({
      include: [
        {
          model: db.Customer,
          as: 'customer',
          attributes: ['id', 'first_name', 'last_name']
        },
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name']
        }
      ],
      where: {
        payment_status: { [Op.not]: 'cancelled' }
      },
      order: [['sale_date', 'DESC']],
      limit: 5
    });

    // Calculate growth rates
    const dailyGrowth = yesterdaySales[0].total ? 
      ((parseFloat(todaySales[0].total) - parseFloat(yesterdaySales[0].total)) / parseFloat(yesterdaySales[0].total) * 100) : 0;
    
    const monthlyGrowth = prevMonthSales[0].total ? 
      ((parseFloat(thisMonthSales[0].total) - parseFloat(prevMonthSales[0].total)) / parseFloat(prevMonthSales[0].total) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        sales: {
          today: {
            count: parseInt(todaySales[0].count) || 0,
            total: parseFloat(todaySales[0].total) || 0,
            growth: dailyGrowth.toFixed(2)
          },
          this_week: {
            count: parseInt(thisWeekSales[0].count) || 0,
            total: parseFloat(thisWeekSales[0].total) || 0
          },
          this_month: {
            count: parseInt(thisMonthSales[0].count) || 0,
            total: parseFloat(thisMonthSales[0].total) || 0,
            growth: monthlyGrowth.toFixed(2)
          }
        },
        inventory: {
          low_stock: parseInt(lowStockCount[0].count) || 0,
          out_of_stock: parseInt(outOfStockCount[0].count) || 0
        },
        customers: {
          total: customerCount,
          new_this_month: parseInt(newCustomersThisMonth[0].count) || 0
        },
        recent_sales: recentSales.map(sale => ({
          id: sale.id,
          invoice_number: sale.invoice_number,
          date: sale.sale_date,
          customer: sale.customer ? `${sale.customer.first_name} ${sale.customer.last_name}` : 'Guest',
          cashier: sale.user ? `${sale.user.first_name} ${sale.user.last_name}` : 'Unknown',
          amount: parseFloat(sale.total_amount),
          status: sale.payment_status
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get product performance report
 * @route GET /api/reports/products
 */
exports.getProductReport = async (req, res, next) => {
  try {
    const { 
      start_date = new Date(new Date().setMonth(new Date().getMonth() - 1)), // Default to last month
      end_date = new Date(), 
      category_id,
      limit = 20,
      sort_by = 'quantity_sold',
      sort_order = 'desc'
    } = req.query;

    // Format dates for query
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    endDate.setHours(23, 59, 59, 999);

    // Base query for product sales
    let productSalesQuery = `
      SELECT 
        p.id, p.name, p.sku, p.category_id, c.name as category_name,
        SUM(si.quantity) as quantity_sold,
        SUM(si.total) as revenue,
        COUNT(DISTINCT s.id) as sale_count
      FROM products p
      JOIN sale_items si ON p.id = si.product_id
      JOIN sales s ON si.sale_id = s.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE s.sale_date BETWEEN :startDate AND :endDate
        AND s.payment_status != 'cancelled'
        ${category_id ? 'AND p.category_id = :categoryId' : ''}
      GROUP BY p.id, p.name, p.sku, p.category_id, c.name
      ORDER BY ${sort_by} ${sort_order.toUpperCase()}
      LIMIT :limit
    `;

    const productSales = await db.sequelize.query(productSalesQuery, {
      type: QueryTypes.SELECT,
      replacements: { 
        startDate, 
        endDate, 
        categoryId: category_id,
        limit: parseInt(limit, 10)
      }
    });

    // Get category performance
    const categoryPerformanceQuery = `
      SELECT 
        c.id, c.name,
        SUM(si.quantity) as quantity_sold,
        SUM(si.total) as revenue,
        COUNT(DISTINCT p.id) as product_count
      FROM categories c
      JOIN products p ON c.id = p.category_id
      JOIN sale_items si ON p.id = si.product_id
      JOIN sales s ON si.sale_id = s.id
      WHERE s.sale_date BETWEEN :startDate AND :endDate
        AND s.payment_status != 'cancelled'
      GROUP BY c.id, c.name
      ORDER BY revenue DESC
    `;

    const categoryPerformance = await db.sequelize.query(categoryPerformanceQuery, {
      type: QueryTypes.SELECT,
      replacements: { startDate, endDate }
    });

    // Get products with no sales (dead stock)
    const deadStockQuery = `
      SELECT 
        p.id, p.name, p.sku, c.name as category_name,
        i.stock_quantity, i.updated_at as last_updated
      FROM products p
      LEFT JOIN sale_items si ON p.id = si.product_id
      LEFT JOIN sales s ON si.sale_id = s.id AND s.sale_date BETWEEN :startDate AND :endDate
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventories i ON p.id = i.product_id
      WHERE p.is_active = true
        AND si.id IS NULL
        AND i.stock_quantity > 0
      GROUP BY p.id, p.name, p.sku, c.name, i.stock_quantity, i.updated_at
      ORDER BY i.stock_quantity DESC
      LIMIT 20
    `;

    const deadStock = await db.sequelize.query(deadStockQuery, {
      type: QueryTypes.SELECT,
      replacements: { startDate, endDate }
    });

    res.status(200).json({
      success: true,
      data: {
        period: {
          start_date: startDate,
          end_date: endDate
        },
        top_products: productSales.map(product => ({
          id: product.id,
          name: product.name,
          sku: product.sku,
          category: product.category_name,
          quantity_sold: parseInt(product.quantity_sold) || 0,
          revenue: parseFloat(product.revenue) || 0,
          sale_count: parseInt(product.sale_count) || 0
        })),
        category_performance: categoryPerformance.map(category => ({
          id: category.id,
          name: category.name,
          quantity_sold: parseInt(category.quantity_sold) || 0,
          revenue: parseFloat(category.revenue) || 0,
          product_count: parseInt(category.product_count) || 0
        })),
        dead_stock: deadStock.map(product => ({
          id: product.id,
          name: product.name,
          sku: product.sku,
          category: product.category_name,
          stock_quantity: parseInt(product.stock_quantity) || 0,
          last_updated: product.last_updated
        }))
      }
    });
  } catch (error) {
    next(error);
  }
}; 