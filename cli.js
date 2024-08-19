/**
 * How to run:
 * node cli.js
 */

const fs = require('fs');
const { getDataFromDisk, updateDataFromHetzner } = require('./server/hetznerSB');

const MAX_PRICE = 62;
const MINIMUM_RAM_GB = 32;
const MINIMUM_HDD_GB = 15000;
const CPU_TO_COMPARE = 'Core-i7-3770'; // Technical city name
const CPU_BLACKLIST = [
  'i7-3770',
  'E3-1275v5',
  'E5-1650V2',
  'Intel Xeon E5-1650V3',
  'Intel Xeon E3-1275V6',
  'Intel Core i7-4770',
  'Intel Xeon E3-1246V3',
  'Intel Core i7-2600',
  'Intel Xeon E3-1270V3',
  'Intel Xeon E3-1271V3'
];

async function main() {
  await updateDataFromHetzner(false);
  const servers = await getDataFromDisk({
    maxPrice: MAX_PRICE,
    minimumMemory: MINIMUM_RAM_GB,
    minimumStorage: MINIMUM_HDD_GB,
    cpuToCompare: CPU_TO_COMPARE,
    cpuBlacklist: CPU_BLACKLIST
  });
  fs.writeFileSync('output.json', JSON.stringify(servers, '', 2));
  fs.writeFileSync('output.log', servers.reduce((prev, server) => `${prev + server.summary}\n`, ''));

  console.log('See ./output.log and ./output.json for output');
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
