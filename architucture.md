Ajiro Database Schema and API Endpoints
1. Database Entities and Columns
1.1 User Management
users
id UUID PK
email VARCHAR(255) UNIQUE NOT NULL
password_hash VARCHAR(255) NOT NULL
first_name VARCHAR(100) NOT NULL
last_name VARCHAR(100) NOT NULL
role ENUM ('admin', 'manager', 'cashier', 'inventory', 'marketing') NOT NULL
phone VARCHAR(20)
is_active BOOLEAN DEFAULT TRUE
last_login_at TIMESTAMP
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
user_sessions
id UUID PK
user_id UUID FK (users.id)
token VARCHAR(255) NOT NULL
ip_address VARCHAR(45)
user_agent TEXT
expires_at TIMESTAMP NOT NULL
created_at TIMESTAMP DEFAULT NOW()
1.2 Product and Inventory Management
categories
id UUID PK
name VARCHAR(100) NOT NULL
description TEXT
parent_id UUID FK SELF REFERENCE (categories.id)
image_url TEXT
is_active BOOLEAN DEFAULT TRUE
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
products
id UUID PK
name VARCHAR(255) NOT NULL
sku VARCHAR(50) UNIQUE
barcode VARCHAR(50) UNIQUE
description TEXT
category_id UUID FK (categories.id)
purchase_price DECIMAL(12,2)
selling_price DECIMAL(12,2) NOT NULL
discount_price DECIMAL(12,2)
is_taxable BOOLEAN DEFAULT TRUE
tax_rate DECIMAL(5,2)
image_url TEXT
is_active BOOLEAN DEFAULT TRUE
weight DECIMAL(8,2)
weight_unit VARCHAR(10)
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
inventory
id UUID PK
product_id UUID FK (products.id)
stock_quantity INTEGER NOT NULL DEFAULT 0
available_quantity INTEGER NOT NULL DEFAULT 0
reserved_quantity INTEGER NOT NULL DEFAULT 0
reorder_level INTEGER
reorder_quantity INTEGER
location VARCHAR(100)
updated_at TIMESTAMP DEFAULT NOW()
inventory_transactions
id UUID PK
product_id UUID FK (products.id)
quantity INTEGER NOT NULL
transaction_type ENUM ('purchase', 'sale', 'return', 'adjustment', 'transfer') NOT NULL
reference_id UUID
note TEXT
user_id UUID FK (users.id)
created_at TIMESTAMP DEFAULT NOW()
suppliers
id UUID PK
name VARCHAR(255) NOT NULL
contact_name VARCHAR(100)
email VARCHAR(255)
phone VARCHAR(20)
address TEXT
is_active BOOLEAN DEFAULT TRUE
notes TEXT
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
purchase_orders
id UUID PK
supplier_id UUID FK (suppliers.id)
order_number VARCHAR(50) UNIQUE
order_date DATE NOT NULL
expected_delivery_date DATE
status ENUM ('draft', 'ordered', 'partial_received', 'received', 'cancelled') NOT NULL
total_amount DECIMAL(12,2) NOT NULL
paid_amount DECIMAL(12,2) DEFAULT 0
payment_status ENUM ('unpaid', 'partial', 'paid') NOT NULL
notes TEXT
user_id UUID FK (users.id)
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
purchase_order_items
id UUID PK
purchase_order_id UUID FK (purchase_orders.id)
product_id UUID FK (products.id)
quantity INTEGER NOT NULL
unit_price DECIMAL(12,2) NOT NULL
received_quantity INTEGER DEFAULT 0
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
1.3 Sales and Transactions
sales
id UUID PK
invoice_number VARCHAR(50) UNIQUE
customer_id UUID FK (customers.id)
user_id UUID FK (users.id)
sale_date TIMESTAMP NOT NULL DEFAULT NOW()
subtotal DECIMAL(12,2) NOT NULL
discount_amount DECIMAL(12,2) DEFAULT 0
tax_amount DECIMAL(12,2) DEFAULT 0
total_amount DECIMAL(12,2) NOT NULL
payment_method ENUM ('cash', 'card', 'mobile', 'credit', 'mixed') NOT NULL
payment_status ENUM ('paid', 'partial', 'unpaid', 'refunded') NOT NULL
notes TEXT
loyalty_points_earned INTEGER DEFAULT 0
loyalty_points_used INTEGER DEFAULT 0
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
sale_items
id UUID PK
sale_id UUID FK (sales.id)
product_id UUID FK (products.id)
quantity INTEGER NOT NULL
unit_price DECIMAL(12,2) NOT NULL
discount_percent DECIMAL(5,2) DEFAULT 0
discount_amount DECIMAL(12,2) DEFAULT 0
tax_percent DECIMAL(5,2) DEFAULT 0
tax_amount DECIMAL(12,2) DEFAULT 0
subtotal DECIMAL(12,2) NOT NULL
total DECIMAL(12,2) NOT NULL
created_at TIMESTAMP DEFAULT NOW()
payments
id UUID PK
sale_id UUID FK (sales.id)
amount DECIMAL(12,2) NOT NULL
payment_method ENUM ('cash', 'card', 'mobile', 'credit') NOT NULL
payment_reference VARCHAR(255)
payment_date TIMESTAMP NOT NULL DEFAULT NOW()
user_id UUID FK (users.id)
notes TEXT
created_at TIMESTAMP DEFAULT NOW()
refunds
id UUID PK
sale_id UUID FK (sales.id)
amount DECIMAL(12,2) NOT NULL
refund_method ENUM ('cash', 'card', 'mobile', 'credit') NOT NULL
refund_reference VARCHAR(255)
reason TEXT
refund_date TIMESTAMP NOT NULL DEFAULT NOW()
user_id UUID FK (users.id)
notes TEXT
created_at TIMESTAMP DEFAULT NOW()
discounts
id UUID PK
name VARCHAR(100) NOT NULL
description TEXT
type ENUM ('percentage', 'fixed') NOT NULL
value DECIMAL(12,2) NOT NULL
code VARCHAR(50) UNIQUE
is_active BOOLEAN DEFAULT TRUE
min_purchase_amount DECIMAL(12,2)
max_discount_amount DECIMAL(12,2)
start_date TIMESTAMP
end_date TIMESTAMP
usage_limit INTEGER
usage_count INTEGER DEFAULT 0
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
1.4 Customer Management
customers
id UUID PK
first_name VARCHAR(100) NOT NULL
last_name VARCHAR(100) NOT NULL
email VARCHAR(255) UNIQUE
phone VARCHAR(20) UNIQUE
birth_date DATE
address TEXT
city VARCHAR(100)
postal_code VARCHAR(20)
notes TEXT
loyalty_points INTEGER DEFAULT 0
loyalty_tier ENUM ('bronze', 'silver', 'gold', 'platinum') DEFAULT 'bronze'
is_active BOOLEAN DEFAULT TRUE
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
customer_groups
id UUID PK
name VARCHAR(100) NOT NULL
description TEXT
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
customer_group_members
id UUID PK
customer_id UUID FK (customers.id)
group_id UUID FK (customer_groups.id)
created_at TIMESTAMP DEFAULT NOW()
1.5 Loyalty Program
loyalty_tiers
id UUID PK
name VARCHAR(50) NOT NULL
min_points INTEGER NOT NULL
discount_percent DECIMAL(5,2)
benefits TEXT
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
loyalty_transactions
id UUID PK
customer_id UUID FK (customers.id)
points INTEGER NOT NULL
transaction_type ENUM ('earn', 'redeem', 'expire', 'adjust') NOT NULL
reference_id UUID
description TEXT
created_at TIMESTAMP DEFAULT NOW()
loyalty_rewards
id UUID PK
name VARCHAR(100) NOT NULL
description TEXT
points_required INTEGER NOT NULL
is_active BOOLEAN DEFAULT TRUE
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
loyalty_reward_redemptions
id UUID PK
customer_id UUID FK (customers.id)
reward_id UUID FK (loyalty_rewards.id)
points_used INTEGER NOT NULL
redemption_date TIMESTAMP DEFAULT NOW()
status ENUM ('pending', 'completed', 'cancelled') DEFAULT 'pending'
notes TEXT
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
1.6 Customer Feedback
feedback_forms
id UUID PK
title VARCHAR(255) NOT NULL
description TEXT
is_active BOOLEAN DEFAULT TRUE
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
feedback_questions
id UUID PK
form_id UUID FK (feedback_forms.id)
question_text TEXT NOT NULL
question_type ENUM ('rating', 'text', 'multiple_choice', 'checkbox') NOT NULL
options JSONB
is_required BOOLEAN DEFAULT TRUE
sequence INTEGER
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
feedback_responses
id UUID PK
form_id UUID FK (feedback_forms.id)
customer_id UUID FK (customers.id)
sale_id UUID FK (sales.id)
response_date TIMESTAMP DEFAULT NOW()
overall_rating INTEGER
created_at TIMESTAMP DEFAULT NOW()
feedback_response_details
id UUID PK
response_id UUID FK (feedback_responses.id)
question_id UUID FK (feedback_questions.id)
answer_text TEXT
answer_rating INTEGER
answer_options JSONB
created_at TIMESTAMP DEFAULT NOW()
1.7 Order Management
orders
id UUID PK
order_number VARCHAR(50) UNIQUE
customer_id UUID FK (customers.id)
status ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled') NOT NULL
order_date TIMESTAMP DEFAULT NOW()
total_amount DECIMAL(12,2) NOT NULL
payment_status ENUM ('pending', 'paid', 'partial', 'refunded') NOT NULL
shipping_address TEXT
shipping_method VARCHAR(100)
tracking_number VARCHAR(100)
notes TEXT
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
order_items
id UUID PK
order_id UUID FK (orders.id)
product_id UUID FK (products.id)
quantity INTEGER NOT NULL
unit_price DECIMAL(12,2) NOT NULL
total_price DECIMAL(12,2) NOT NULL
created_at TIMESTAMP DEFAULT NOW()
order_status_history
id UUID PK
order_id UUID FK (orders.id)
status ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled') NOT NULL
note TEXT
user_id UUID FK (users.id)
created_at TIMESTAMP DEFAULT NOW()
1.8 Marketing Campaigns
campaigns
id UUID PK
name VARCHAR(255) NOT NULL
description TEXT
type ENUM ('sms', 'email', 'push', 'in_app') NOT NULL
content TEXT
status ENUM ('draft', 'scheduled', 'active', 'completed', 'cancelled') NOT NULL
start_date TIMESTAMP
end_date TIMESTAMP
target_audience ENUM ('all', 'segment', 'individual') NOT NULL
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
campaign_segments
id UUID PK
campaign_id UUID FK (campaigns.id)
segment_type ENUM ('customer_group', 'loyalty_tier', 'custom') NOT NULL
segment_criteria JSONB
created_at TIMESTAMP DEFAULT NOW()
campaign_recipients
id UUID PK
campaign_id UUID FK (campaigns.id)
customer_id UUID FK (customers.id)
status ENUM ('pending', 'sent', 'failed', 'delivered', 'opened', 'clicked') DEFAULT 'pending'
sent_at TIMESTAMP
delivered_at TIMESTAMP
opened_at TIMESTAMP
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
1.9 Settings
business_settings
id UUID PK (always use the same UUID for a single record)
business_name VARCHAR(255) NOT NULL
business_logo TEXT
address TEXT
city VARCHAR(100)
postal_code VARCHAR(20)
phone VARCHAR(20)
email VARCHAR(255)
website VARCHAR(255)
tax_number VARCHAR(50)
default_tax_rate DECIMAL(5,2)
currency VARCHAR(3) DEFAULT 'IRR'
language VARCHAR(5) DEFAULT 'fa'
timezone VARCHAR(50) DEFAULT 'Asia/Tehran'
updated_at TIMESTAMP DEFAULT NOW()
receipt_settings
id UUID PK (always use the same UUID for a single record)
header_text TEXT
footer_text TEXT
show_logo BOOLEAN DEFAULT TRUE
show_tax BOOLEAN DEFAULT TRUE
show_discount BOOLEAN DEFAULT TRUE
show_customer BOOLEAN DEFAULT TRUE
additional_info TEXT
paper_size VARCHAR(20) DEFAULT 'A4'
font_size VARCHAR(10) DEFAULT 'medium'
updated_at TIMESTAMP DEFAULT NOW()
system_settings
id UUID PK (always use the same UUID for a single record)
loyalty_points_ratio DECIMAL(10,2) DEFAULT 10.00
points_expiry_months INTEGER DEFAULT 12
low_stock_threshold INTEGER DEFAULT 5
session_timeout_minutes INTEGER DEFAULT 30
enable_customer_notifications BOOLEAN DEFAULT TRUE
enable_stock_alerts BOOLEAN DEFAULT TRUE
updated_at TIMESTAMP DEFAULT NOW()
2. API Endpoints
2.1 Authentication API
Auth Endpoints
POST /api/auth/login - Authenticate user and return JWT
POST /api/auth/refresh - Refresh JWT token
POST /api/auth/logout - Invalidate token
POST /api/auth/forgot-password - Request password reset
POST /api/auth/reset-password - Reset password with token
User Management Endpoints
GET /api/users - List all users (admin only)
GET /api/users/:id - Get user details
POST /api/users - Create new user
PUT /api/users/:id - Update user
PATCH /api/users/:id/activate - Activate user
PATCH /api/users/:id/deactivate - Deactivate user
DELETE /api/users/:id - Delete user (soft delete)
GET /api/users/profile - Get current user profile
PUT /api/users/profile - Update current user profile
PUT /api/users/password - Change password
2.2 Product and Inventory API
Category Endpoints
GET /api/categories - List all categories
GET /api/categories/:id - Get category details
POST /api/categories - Create new category
PUT /api/categories/:id - Update category
DELETE /api/categories/:id - Delete category
GET /api/categories/:id/products - Get products in category
Product Endpoints
GET /api/products - List all products (with filtering)
GET /api/products/:id - Get product details
POST /api/products - Create new product
PUT /api/products/:id - Update product
PATCH /api/products/:id/price - Update product price
DELETE /api/products/:id - Delete product (soft delete)
GET /api/products/search - Search products by name/SKU/barcode
GET /api/products/low-stock - Get low stock products
Inventory Endpoints
GET /api/inventory - Get inventory status for all products
GET /api/inventory/:productId - Get inventory for specific product
POST /api/inventory/adjust - Make inventory adjustment
GET /api/inventory/transactions - List inventory transactions
GET /api/inventory/transactions/:id - Get transaction details
Supplier Endpoints
GET /api/suppliers - List all suppliers
GET /api/suppliers/:id - Get supplier details
POST /api/suppliers - Create new supplier
PUT /api/suppliers/:id - Update supplier
DELETE /api/suppliers/:id - Delete supplier
Purchase Order Endpoints
GET /api/purchase-orders - List all purchase orders
GET /api/purchase-orders/:id - Get purchase order details
POST /api/purchase-orders - Create new purchase order
PUT /api/purchase-orders/:id - Update purchase order
PATCH /api/purchase-orders/:id/status - Update purchase order status
DELETE /api/purchase-orders/:id - Delete purchase order
POST /api/purchase-orders/:id/receive - Receive items from purchase order
2.3 Sales API
Sales Endpoints
GET /api/sales - List all sales
GET /api/sales/:id - Get sale details
POST /api/sales - Create new sale
PUT /api/sales/:id - Update sale (if not completed)
DELETE /api/sales/:id - Delete sale (if not completed)
GET /api/sales/today - Get today's sales
GET /api/sales/by-date - Get sales by date range
Payment Endpoints
POST /api/payments - Record payment
GET /api/payments - List all payments
GET /api/payments/:id - Get payment details
POST /api/refunds - Process refund
GET /api/refunds - List all refunds
GET /api/refunds/:id - Get refund details
Discount Endpoints
GET /api/discounts - List all discounts
GET /api/discounts/:id - Get discount details
POST /api/discounts - Create new discount
PUT /api/discounts/:id - Update discount
DELETE /api/discounts/:id - Delete discount
GET /api/discounts/validate/:code - Validate discount code
2.4 Customer API
Customer Endpoints
GET /api/customers - List all customers
GET /api/customers/:id - Get customer details
POST /api/customers - Create new customer
PUT /api/customers/:id - Update customer
DELETE /api/customers/:id - Delete customer (soft delete)
GET /api/customers/search - Search customers
GET /api/customers/:id/sales - Get customer's purchase history
GET /api/customers/:id/loyalty - Get customer's loyalty details
Customer Group Endpoints
GET /api/customer-groups - List all customer groups
GET /api/customer-groups/:id - Get customer group details
POST /api/customer-groups - Create new customer group
PUT /api/customer-groups/:id - Update customer group
DELETE /api/customer-groups/:id - Delete customer group
POST /api/customer-groups/:id/members - Add customers to group
DELETE /api/customer-groups/:id/members/:customerId - Remove customer from group
2.5 Loyalty API
Loyalty Endpoints
GET /api/loyalty/tiers - List all loyalty tiers
GET /api/loyalty/tiers/:id - Get loyalty tier details
POST /api/loyalty/tiers - Create new loyalty tier
PUT /api/loyalty/tiers/:id - Update loyalty tier
DELETE /api/loyalty/tiers/:id - Delete loyalty tier
Loyalty Transaction Endpoints
POST /api/loyalty/transactions - Create loyalty transaction
GET /api/loyalty/transactions - List all loyalty transactions
GET /api/loyalty/transactions/:id - Get transaction details
GET /api/loyalty/customers/:id/transactions - Get customer's loyalty transactions
Loyalty Reward Endpoints
GET /api/loyalty/rewards - List all loyalty rewards
GET /api/loyalty/rewards/:id - Get reward details
POST /api/loyalty/rewards - Create new reward
PUT /api/loyalty/rewards/:id - Update reward
DELETE /api/loyalty/rewards/:id - Delete reward
POST /api/loyalty/redemptions - Process reward redemption
GET /api/loyalty/redemptions - List all redemptions
GET /api/loyalty/redemptions/:id - Get redemption details
PATCH /api/loyalty/redemptions/:id/status - Update redemption status
2.6 Feedback API
Feedback Form Endpoints
GET /api/feedback/forms - List all feedback forms
GET /api/feedback/forms/:id - Get form details
POST /api/feedback/forms - Create new feedback form
PUT /api/feedback/forms/:id - Update feedback form
DELETE /api/feedback/forms/:id - Delete feedback form
GET /api/feedback/forms/:id/questions - Get form questions
Feedback Question Endpoints
POST /api/feedback/questions - Create new question
PUT /api/feedback/questions/:id - Update question
DELETE /api/feedback/questions/:id - Delete question
Feedback Response Endpoints
POST /api/feedback/responses - Submit feedback
GET /api/feedback/responses - List all responses
GET /api/feedback/responses/:id - Get response details
GET /api/feedback/responses/by-customer/:id - Get customer's feedback responses
GET /api/feedback/responses/by-form/:id - Get form responses
GET /api/feedback/analytics - Get feedback analytics
2.7 Order Management API
Order Endpoints
GET /api/orders - List all orders
GET /api/orders/:id - Get order details
POST /api/orders - Create new order
PUT /api/orders/:id - Update order
PATCH /api/orders/:id/status - Update order status
DELETE /api/orders/:id - Delete order (if not processed)
GET /api/orders/customer/:id - Get customer's orders
Order Item Endpoints
POST /api/orders/:id/items - Add item to order
PUT /api/orders/:id/items/:itemId - Update order item
DELETE /api/orders/:id/items/:itemId - Remove item from order
2.8 Campaign API
Campaign Endpoints
GET /api/campaigns - List all campaigns
GET /api/campaigns/:id - Get campaign details
POST /api/campaigns - Create new campaign
PUT /api/campaigns/:id - Update campaign
DELETE /api/campaigns/:id - Delete campaign
POST /api/campaigns/:id/send - Send/activate campaign
POST /api/campaigns/:id/cancel - Cancel campaign
GET /api/campaigns/:id/analytics - Get campaign performance metrics
2.9 Settings API
Business Settings Endpoints
GET /api/settings/business - Get business settings
PUT /api/settings/business - Update business settings
Receipt Settings Endpoints
GET /api/settings/receipt - Get receipt settings
PUT /api/settings/receipt - Update receipt settings
System Settings Endpoints
GET /api/settings/system - Get system settings
PUT /api/settings/system - Update system settings
2.10 Reports API
Sales Reports
GET /api/reports/sales/summary - Get sales summary report
GET /api/reports/sales/by-product - Get sales by product
GET /api/reports/sales/by-category - Get sales by category
GET /api/reports/sales/by-customer - Get sales by customer
GET /api/reports/sales/by-payment-method - Get sales by payment method
GET /api/reports/sales/trends - Get sales trends over time
Inventory Reports
GET /api/reports/inventory/stock-levels - Get current stock levels
GET /api/reports/inventory/movement - Get inventory movement report
GET /api/reports/inventory/valuation - Get inventory valuation report
GET /api/reports/inventory/turnover - Get inventory turnover report
Customer Reports
GET /api/reports/customers/activity - Get customer activity report
GET /api/reports/customers/loyalty - Get loyalty program report
GET /api/reports/customers/acquisition - Get customer acquisition report
GET /api/reports/customers/retention - Get customer retention report
Financial Reports
GET /api/reports/finance/profit-loss - Get profit and loss report
GET /api/reports/finance/tax - Get tax collection report
GET /api/reports/finance/payments - Get payments report
Each API endpoint will implement proper validation, error handling, and authentication middleware 