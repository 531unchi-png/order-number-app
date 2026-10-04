import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
export const orders = sqliteTable("orders", {
  seq: integer("seq").primaryKey(),
  requestId: text("request_id").notNull().unique(),
  customer: text("customer").notNull(),
  memo: text("memo").notNull(),
  amount: integer("amount"),
  createdAt: text("created_at").notNull(),
  cancelledAt: text("cancelled_at"),
  code: text("code").notNull().default("411C"),
  localSeq: integer("local_seq"),
},t=>[uniqueIndex("orders_code_local_seq_unique").on(t.code,t.localSeq)]);
export const staff=sqliteTable("staff",{
 code:text("code").primaryKey(),
 name:text("name").notNull(),
 baseline:integer("baseline").notNull().default(0),
 configured:integer("configured").notNull().default(0),
});
