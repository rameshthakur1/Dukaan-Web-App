import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  shopName: text('shop_name'),
  shopCode: text('shop_code'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const storeData = pgTable('store_data', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  dataType: text('data_type').notNull(), // 'products', 'invoices', 'customers', etc.
  payload: jsonb('payload').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  storeData: many(storeData),
}));

export const storeDataRelations = relations(storeData, ({ one }) => ({
  user: one(users, {
    fields: [storeData.userId],
    references: [users.id],
  }),
}));
