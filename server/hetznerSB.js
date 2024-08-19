/* eslint-disable no-unused-vars */
/* eslint-disable no-empty */

const getHetznerUrl = () => `https://www.hetzner.com/_resources/app/jsondata/live_data_sb.json?m=${Date.now()}`;

const fetch = require('node-fetch');
const fs = require('fs');
const { hetznerToTechnicalCity, compareCPUs, saveCaches } = require('./technicalCityWrapper');

const validOrderBy = ['storage', 'memory', 'performance', 'price', 'cpu'];
const validOrderDirection = ['asc', 'desc'];
const validComparisons = ['Core-i7-3770', 'Xeon-E-2276G']; // Technical City names

const { orderBy: orderByFunc, pick } = require('lodash');
const { bulkInsertServer } = require('./db');

async function getDataFromDisk(options) {
  console.log('Request Servers', JSON.stringify(options));
  let existingData;
  try {
    existingData = JSON.parse(fs.readFileSync(`${__dirname}/data.json`).toString());
  } catch (error) {
    console.error('Couldnt parse disk data, stopping');
    console.error(error);
    throw new Error('Error while trying to get hetzner sb data');
  }
  let orderBy = 'price';
  if (validOrderBy.includes(options.orderBy)) {
    orderBy = options.orderBy;
  }
  let orderDirection = 'asc';
  if (validOrderDirection.includes(options.orderDirection)) {
    orderDirection = options.orderDirection;
  }

  let cpuBlacklist = [];
  if (options.cpuBlacklist) {
    if (Array.isArray(options.cpuBlacklist)) {
      cpuBlacklist = options.cpuBlacklist;
    } else {
      cpuBlacklist = [options.cpuBlacklist];
    }
  }
  let cpuToCompare = 'Core-i7-3770';
  if (validComparisons.includes(options.cpuToCompare)) {
    cpuToCompare = options.cpuToCompare;
  }
  let minimumStorage = 0;
  if (options.minimumStorage) {
    try {
      minimumStorage = parseInt(options.minimumStorage, 10);
    } catch (error) {}
  }
  let minimumMemory = 0;
  if (options.minimumMemory) {
    try {
      minimumMemory = parseInt(options.minimumMemory, 10);
    } catch (error) {}
  }
  let minPrice = 0;
  if (options.minPrice) {
    try {
      minPrice = parseInt(options.minPrice, 10);
    } catch (error) {}
  }
  let maxPrice = 9999;
  if (options.maxPrice) {
    try {
      maxPrice = parseInt(options.maxPrice, 10);
    } catch (error) {}
  }
  let minPerformance = -9999;
  if (options.minPerformance) {
    try {
      minPerformance = parseInt(options.minPerformance, 10);
    } catch (error) {}
  }
  let onlyWithSsd = false;
  if (options.onlyWithSsd) {
    try {
      onlyWithSsd = options.onlyWithSsd === 'true';
    } catch (error) {}
  }
  let onlyWithEcc = false;
  if (options.onlyWithEcc) {
    try {
      onlyWithEcc = options.onlyWithEcc === 'true';
    } catch (error) {}
  }

  const { server: servers } = existingData;
  for (const server of servers) {
    const hdds = server.hdd_arr;
    let sum = 0;
    hdds.forEach((hdd) => {
      let sizeNumber;
      if (hdd.includes('TB')) {
        sizeNumber = parseInt(hdd.split('TB')[0].trim(), 10) * 1024;
      } else if (hdd.includes('GB')) {
        sizeNumber = parseInt(hdd.split('GB')[0].trim(), 10);
      } else {
        throw new Error(`Unknown Size Unit: ${hdd}`);
      }
      sum += sizeNumber;
    });
    server.actualPrice = Math.round((server.price * 1.19 + 2.04) * 100) / 100;
    server.hddSum = sum;

    server.ssd = null;
    if (server.description && server.description.includes('SSD')) {
      server.ssd = 'SATA';
      if (server.description.includes('NVME')) {
        server.ssd = 'NVME';
      }
    }
    server.hasEcc = !!server.is_ecc;

    // Benchmarks
    const technicalCityName = await hetznerToTechnicalCity(server.cpu);
    const compareData = await compareCPUs(cpuToCompare, technicalCityName);
    server.comparison = compareData;
    if (!compareData?.faster) {
      server.relativePerformance = 0;
    } else if (compareData.faster.cpuIndex === 0) {
      server.relativePerformance = -1 * compareData.faster.amountInPercent;
    } else {
      server.relativePerformance = compareData.faster.amountInPercent;
    }
    server.summary = `
      CPU: ${server.cpu}
      Memory: ${server.ram_size} GB
      Total Size: ${sum} GB (${server.hdd_arr.length} drives)
      Has SSD? ${server.description.includes('SSD') ? 'Yes' : 'No'}
      Price: ${server.actualPrice}€
      Performance Summary: ${server.comparison?.benchmarkSummary || 'Not Available'}
      Link: https://www.hetzner.com/sb/#search=${server.id}
    `;
    server.link = `https://www.hetzner.com/sb/#search=${server.id}`;
  }

  const filteredServers = servers.filter((server) => {
    if (cpuBlacklist.some((black) => server.cpu.includes(black))) {
      return false;
    }
    if (server.ram_size < minimumMemory) {
      return false;
    }
    if (server.hddSum < minimumStorage) {
      return false;
    }
    if (server.actualPrice > maxPrice) {
      return false;
    }
    if (server.actualPrice < minPrice) {
      return false;
    }
    if (onlyWithSsd && !server.ssd) {
      return false;
    }
    if (onlyWithEcc && !server.hasEcc) {
      return false;
    }
    if (server.relativePerformance < minPerformance) {
      return false;
    }
    return true;
  });

  const sorters = [];
  if (orderBy === 'storage') {
    sorters.push(['hddSum', orderDirection]);
  } else if (orderBy === 'memory') {
    sorters.push(['ram_size', orderDirection]);
  } else if (orderBy === 'performance') {
    sorters.push([(val) => {
      if (!val?.comparison?.faster) {
        return 0;
      }
      if (val.comparison.faster.cpuIndex === 1) {
        return -val.comparison.faster.amountInPercent;
      }
      return val.comparison.faster.amountInPercent;
    }, orderDirection]);
  } else if (orderBy === 'cpu') {
    sorters.push(['cpu', orderDirection]);
  } else if (orderBy === 'price') {
    sorters.push(['actualPrice', orderDirection]);
  }

  sorters.push(['actualPrice', 'asc']);
  return orderByFunc(
    filteredServers,
    ...sorters.reduce((prev, curr) => {
      prev[0].push(curr[0]);
      prev[1].push(curr[1]);
      return prev;
    }, [[], []])
  ).map((server) =>
    pick(server, [
      'actualPrice',
      'hddSum',
      'cpu',
      'ssd',
      'hasEcc',
      'comparison',
      'id',
      'link',
      'ram_size'
    ])
  );
}

async function updateDataFromHetzner(removeData = true) {
  if (removeData) {
    try {
      await fs.promises.rm(`${__dirname}/data.json`);
      console.log('removed old data');
    } catch (error) {
      console.log('Couldnt delete cached data, probably didnt exist');
    }
  }

  let existingData;
  try {
    existingData = JSON.parse(fs.readFileSync(`${__dirname}/data.json`).toString());
  } catch (error) {
    const resBody = await fetch(getHetznerUrl());
    const newData = await resBody.json();
    newData.server = newData.server.map((server) => server);
    fs.writeFileSync(`${__dirname}/data.json`, JSON.stringify(newData));
    console.log('wrote new data');
    existingData = newData;
  }
  const { server: servers } = existingData;
  await bulkInsertServer(servers);
  for (const server of servers) {
    // Benchmarks
    const technicalCityName = await hetznerToTechnicalCity(server.cpu);
    for (const compareCpu of validComparisons) {
      await compareCPUs(compareCpu, technicalCityName);
    }
  }

  await saveCaches();
  console.log('finished getting new data');
}

module.exports = {
  updateDataFromHetzner,
  getDataFromDisk
};
