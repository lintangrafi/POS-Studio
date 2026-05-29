import { pgTable, serial, text, integer, timestamp, boolean, pgEnum, decimal, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── Enums ───────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum('user_role', ['CASHIER', 'ADMIN', 'SUPERADMIN']);
export const categoryTypeEnum = pgEnum('category_type', ['STUDIO', 'FB']);
export const orderStatusEnum = pgEnum('order_status', ['COMPLETED', 'VOID']);
export const paymentMethodEnum = pgEnum('payment_method', ['CASH', 'QRIS', 'TRANSFER']);
export const shiftStatusEnum = pgEnum('shift_status', ['OPEN', 'CLOSED']);
export const openBillStatusEnum = pgEnum('open_bill_status', ['OPEN', 'PARTIAL', 'CLOSED', 'VOID']);
export const stockAdjustmentTypeEnum = pgEnum('stock_adjustment_type', ['IN', 'OUT', 'OPNAME']);
export const expenseCategoryEnum = pgEnum('expense_category', ['SUPPLIES', 'UTILITIES', 'MAINTENANCE', 'OTHER']);
export const incomeCategoryEnum = pgEnum('income_category', ['SERVICE', 'REFUND', 'OTHER']);

// ─── Users ───────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  role: userRoleEnum('role').default('CASHIER').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Categories ──────────────────────────────────────────────────────────────

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: categoryTypeEnum('type').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Products ────────────────────────────────────────────────────────────────

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id').references(() => categories.id).notNull(),
  sku: text('sku').unique(),
  name: text('name').notNull(),
  price: decimal('price', { precision: 12, scale: 2 }).notNull(),
  costPrice: decimal('cost_price', { precision: 12, scale: 2 }).notNull().default('0'),
  stock: integer('stock').notNull().default(0),
  minStock: integer('min_stock').notNull().default(0), // Alert threshold
  isMenuItem: boolean('is_menu_item').notNull().default(true),
  isArchived: boolean('is_archived').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Orders ──────────────────────────────────────────────────────────────────

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  invoiceNumber: text('invoice_number').notNull().unique(),
  shiftId: integer('shift_id').references(() => shifts.id).notNull(), // Link to shift
  userId: integer('user_id').references(() => users.id).notNull(),
  customerName: text('customer_name'),
  subtotalAmount: decimal('subtotal_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  discountType: text('discount_type').default('FIXED'), // FIXED or PERCENT
  discountValue: decimal('discount_value', { precision: 12, scale: 2 }).notNull().default('0'),
  discountAmount: decimal('discount_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
  note: text('note'),
  status: orderStatusEnum('status').default('COMPLETED').notNull(),
  voidReason: text('void_reason'),
  voidedBy: integer('voided_by').references(() => users.id),
  voidedAt: timestamp('voided_at'),
  couponCode: text('coupon_code'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Order Items ─────────────────────────────────────────────────────────────

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id).notNull(),
  productId: integer('product_id').references(() => products.id).notNull(),
  productName: text('product_name').notNull(), // Snapshot
  quantity: integer('quantity').notNull(),
  unitPrice: decimal('unit_price', { precision: 12, scale: 2 }).notNull(),
  costPrice: decimal('cost_price', { precision: 12, scale: 2 }).notNull().default('0'),
  subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull(),
});

// ─── Payments ────────────────────────────────────────────────────────────────

export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id).notNull(),
  method: paymentMethodEnum('method').notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Open Bills (Suspended Transactions) ────────────────────────────────────

export const openBills = pgTable('open_bills', {
  id: serial('id').primaryKey(),
  billNumber: text('bill_number').notNull().unique(),
  userId: integer('user_id').references(() => users.id).notNull(),
  customerName: text('customer_name'),
  note: text('note'),
  subtotalAmount: decimal('subtotal_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  discountType: text('discount_type').default('FIXED'),
  discountValue: decimal('discount_value', { precision: 12, scale: 2 }).notNull().default('0'),
  discountAmount: decimal('discount_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  downPayment: decimal('down_payment', { precision: 12, scale: 2 }).notNull().default('0'),
  downPaymentMethod: paymentMethodEnum('down_payment_method'),
  status: openBillStatusEnum('status').notNull().default('OPEN'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  closedAt: timestamp('closed_at'),
});

// ─── Open Bill Items ─────────────────────────────────────────────────────────

export const openBillItems = pgTable('open_bill_items', {
  id: serial('id').primaryKey(),
  openBillId: integer('open_bill_id').references(() => openBills.id, { onDelete: 'cascade' }).notNull(),
  productId: integer('product_id').references(() => products.id).notNull(),
  productName: text('product_name').notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: decimal('unit_price', { precision: 12, scale: 2 }).notNull(),
});

// ─── Shifts ──────────────────────────────────────────────────────────────────

export const shifts = pgTable('shifts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  startTime: timestamp('start_time').defaultNow().notNull(),
  endTime: timestamp('end_time'),
  openingCash: decimal('opening_cash', { precision: 12, scale: 2 }).notNull().default('0'),
  closingCash: decimal('closing_cash', { precision: 12, scale: 2 }),
  expectedCash: decimal('expected_cash', { precision: 12, scale: 2 }),
  cashDifference: decimal('cash_difference', { precision: 12, scale: 2 }),
  totalSales: decimal('total_sales', { precision: 12, scale: 2 }).default('0'),
  totalTransactions: integer('total_transactions').default(0),
  status: shiftStatusEnum('status').default('OPEN').notNull(),
  note: text('note'),
});

// ─── Stock Adjustments ───────────────────────────────────────────────────────

export const stockAdjustments = pgTable('stock_adjustments', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').references(() => products.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  type: stockAdjustmentTypeEnum('type').notNull(),
  quantityBefore: integer('quantity_before').notNull(),
  quantityAfter: integer('quantity_after').notNull(),
  change: integer('change').notNull(),
  reason: text('reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Expenses ────────────────────────────────────────────────────────────────

export const expenses = pgTable('expenses', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  description: text('description').notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  category: expenseCategoryEnum('category').default('OTHER').notNull(),
  paymentMethod: paymentMethodEnum('payment_method').default('CASH').notNull(),
  date: timestamp('date').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Incomes ─────────────────────────────────────────────────────────────────

export const incomes = pgTable('incomes', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  description: text('description').notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  category: incomeCategoryEnum('category').default('OTHER').notNull(),
  paymentMethod: paymentMethodEnum('payment_method').default('CASH').notNull(),
  date: timestamp('date').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Store Settings ──────────────────────────────────────────────────────────

export const storeSettings = pgTable('store_settings', {
  id: serial('id').primaryKey(),
  storeName: text('store_name').notNull().default('Studio POS'),
  storeSubtitle: text('store_subtitle').notNull().default('Point of Sale'),
  logoInitial: text('logo_initial').notNull().default('S'),
  theme: text('theme').notNull().default('indigo'), // indigo, emerald, rose, amber, violet, sky
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Coupons ─────────────────────────────────────────────────────────────────

export const coupons = pgTable('coupons', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  description: text('description'),
  discountType: text('discount_type').notNull().default('FIXED'), // FIXED or PERCENT
  discountValue: decimal('discount_value', { precision: 12, scale: 2 }).notNull(),
  minPurchase: decimal('min_purchase', { precision: 12, scale: 2 }).notNull().default('0'),
  maxDiscount: decimal('max_discount', { precision: 12, scale: 2 }), // Max discount for PERCENT type
  usageLimit: integer('usage_limit'), // null = unlimited
  usageCount: integer('usage_count').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  validFrom: timestamp('valid_from'),
  validUntil: timestamp('valid_until'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Audit Logs ──────────────────────────────────────────────────────────────

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  entityId: integer('entity_id'),
  detail: text('detail'), // JSON string
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Relations ───────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  shifts: many(shifts),
  orders: many(orders),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  shift: one(shifts, { fields: [orders.shiftId], references: [shifts.id] }),
  items: many(orderItems),
  payments: many(payments),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, { fields: [payments.orderId], references: [orders.id] }),
}));

export const shiftsRelations = relations(shifts, ({ one, many }) => ({
  user: one(users, { fields: [shifts.userId], references: [users.id] }),
  orders: many(orders),
}));

export const openBillsRelations = relations(openBills, ({ one, many }) => ({
  user: one(users, { fields: [openBills.userId], references: [users.id] }),
  items: many(openBillItems),
}));

export const openBillItemsRelations = relations(openBillItems, ({ one }) => ({
  openBill: one(openBills, { fields: [openBillItems.openBillId], references: [openBills.id] }),
  product: one(products, { fields: [openBillItems.productId], references: [products.id] }),
}));

export const stockAdjustmentsRelations = relations(stockAdjustments, ({ one }) => ({
  product: one(products, { fields: [stockAdjustments.productId], references: [products.id] }),
  user: one(users, { fields: [stockAdjustments.userId], references: [users.id] }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  user: one(users, { fields: [expenses.userId], references: [users.id] }),
}));

export const incomesRelations = relations(incomes, ({ one }) => ({
  user: one(users, { fields: [incomes.userId], references: [users.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));
