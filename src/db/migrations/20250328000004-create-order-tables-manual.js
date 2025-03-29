'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Use raw SQL for creating tables to avoid DataTypes issues
    await queryInterface.sequelize.query(`
      -- Create order status and payment status types
      CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');
      CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'partial', 'refunded');
      
      -- Create orders table
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_number VARCHAR(50) NOT NULL UNIQUE,
        customer_id UUID REFERENCES customers(id) ON UPDATE CASCADE ON DELETE SET NULL,
        status order_status NOT NULL DEFAULT 'pending',
        order_date TIMESTAMP NOT NULL DEFAULT NOW(),
        total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
        payment_status payment_status NOT NULL DEFAULT 'pending',
        shipping_address TEXT,
        shipping_method VARCHAR(100),
        tracking_number VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMP
      );
      
      -- Create order_items table
      CREATE TABLE IF NOT EXISTS order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id) ON UPDATE CASCADE ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        unit_price DECIMAL(12, 2) NOT NULL,
        total_price DECIMAL(12, 2) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMP
      );
      
      -- Create order_status_history table
      CREATE TABLE IF NOT EXISTS order_status_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id) ON UPDATE CASCADE ON DELETE CASCADE,
        status order_status NOT NULL,
        note TEXT,
        user_id UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date);
      CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
      CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
      CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
      CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
      CREATE INDEX IF NOT EXISTS idx_order_status_history_status ON order_status_history(status);
      CREATE INDEX IF NOT EXISTS idx_order_status_history_created_at ON order_status_history(created_at);
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables in reverse order
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS order_status_history;
      DROP TABLE IF EXISTS order_items;
      DROP TABLE IF EXISTS orders;
      DROP TYPE IF EXISTS order_status;
      DROP TYPE IF EXISTS payment_status;
    `);
  }
}; 