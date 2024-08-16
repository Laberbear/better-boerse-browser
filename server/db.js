
const  { drizzle, BetterSQLite3Database } = require('drizzle-orm/better-sqlite3');
const  Database  =require('better-sqlite3');
const { servers, prices } = require('./schema');
const logger = require('./logger');
const { intersect } = require('drizzle-orm/sqlite-core');
const { inArray, notInArray, and, eq } = require('drizzle-orm');
const { dbFile } = require('./config');
const sqlite = new Database(dbFile);
const db/*: BetterSQLite3Database*/ = drizzle(sqlite);

async function bulkInsertServer(serversToInsert) {
    logger.info(`Got ${serversToInsert.length} fresh from Hetzner
        Will update the database if anything has changed`);
    logger.info('Setting missing servers to unavailable')
    const z = await db.update(servers).set({
        isAvailable: 'false',
        updatedAt: Date.now()
    }).where(and(notInArray(servers.id, serversToInsert.map(serv => `${serv.id}`)), eq(servers.isAvailable, 'true'))).run();
    logger.info(`Marked ${z.changes} servers as unavailable`)
    const mappedservers = serversToInsert.map(serv => ({
        id: `${serv.id}`,
        data: JSON.stringify(serv),
        isAvailable: 'true'
    }));
    // https://github.com/drizzle-team/drizzle-orm/issues/1728
    const x = await db.insert(servers).values(mappedservers)
        .onConflictDoNothing()
        .run()
    logger.info(`Inserted ${x.changes} new servers into the database`)
    const mappedPrices = serversToInsert.map(serv => ({
        serverId: `${serv.id}`,
        price: serv.price,
        isFixed: serv.fixed_price.toString(),
        nextReduce: serv.next_reduce_timestamp * 1000
    }));
    const y = await db.insert(prices).values(mappedPrices)
        .onConflictDoNothing()
        .run();
    logger.info(`Added ${y.changes} new prices to the database`)
}

module.exports = {
    bulkInsertServer
}
