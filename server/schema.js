const { text, sqliteTable, real, int, uniqueIndex } = require('drizzle-orm/sqlite-core');

const servers = sqliteTable('servers', {
  id: text('id').notNull(),
  data: text('data').notNull(),
  isAvailable: text('is_available').notNull(),
  createdAt: int('created_at').notNull().$defaultFn(() => Date.now()),
  updatedAt: int('updated_at').notNull().$defaultFn(() => Date.now())
}, servers => ({
  idIdx: uniqueIndex('idIdx').on(servers.id)
}));
const prices = sqliteTable('prices', {
  serverId: text('server_id').notNull().references(() => servers.id),
  price: real('price').notNull(),
  nextReduce: int('next_reduce').notNull(),
  isFixed: text('is_fixed').notNull(),
  createdAt: int('created_at').notNull().$defaultFn(() => Date.now())
}, prices => ({
  priceServerIdIdx: uniqueIndex('price_server_id_unique_idx').on(prices.serverId, prices.price)
}));

module.exports = {
  servers,
  prices
};
