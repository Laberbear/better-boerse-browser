const Hapi = require('@hapi/hapi');
const path = require('path');
const { getDataFromDisk, updateDataFromHetzner } = require('./hetznerSB');
const logger = require('./logger');

const init = async () => {
  await updateDataFromHetzner(false);
  const server = Hapi.server({
    port: 3001,
    host: '0.0.0.0',
    routes: {
      files: {
        relativeTo: path.join(__dirname, 'public')
      }
    }
  });

  await server.register(require('@hapi/inert'));
  server.route({
    method: 'GET',
    path: '/{param*}',
    handler: {
      directory: {
        path: './'
      }
    }
  });
  server.route({
    method: 'GET',
    path: '/api/servers',
    handler: async (request) => {
      logger.info(`${new Date().toISOString()} Server Request from ${request.info.remoteAddress}`);
      logger.info(`Request Query: ${JSON.stringify(request.query)}`);
      return await getDataFromDisk({
        minPrice: request.query.minPrice,
        maxPrice: request.query.maxPrice,
        cpuBlacklist: request.query.cpuBlacklist,
        minimumMemory: request.query.minimumMemory,
        minimumStorage: request.query.minimumStorage,
        minPerformance: request.query.minPerformance,
        onlyWithSsd: request.query.onlyWithSsd,
        onlyWithEcc: request.query.onlyWithEcc,
        cpuToCompare: request.query.cpuToCompare,
        orderBy: request.query.orderBy,
        orderDirection: request.query.orderDirection
      });
    }
  });

  await server.start();
  console.log('Server running on %s', server.info.uri);
};

setInterval(async () => {
  console.log('UPDATE DATA');
  await updateDataFromHetzner(true);
}, 1000 * 60 * 5);

process.on('unhandledRejection', (err) => {
  console.log(err);
  process.exit(1);
});

init();
