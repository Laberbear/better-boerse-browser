const fetch = require('node-fetch');
const Document = require('queryselector-lite');

const fs = require('fs');

let CPU_CACHE = {};
let COMPARE_CACHE = {};
let WEBSITE_CACHE = {};
try {
  CPU_CACHE = JSON.parse(fs.readFileSync(`${__dirname}/cpuCache.json`).toString());
} catch (error) {

}

try {
  COMPARE_CACHE = JSON.parse(fs.readFileSync(`${__dirname}/compareCache.json`).toString());
} catch (error) {

}

try {
  WEBSITE_CACHE = JSON.parse(fs.readFileSync(`${__dirname}/websiteCache.json`).toString());
} catch (error) {

}

console.log(__dirname);

async function getTechnicalCityCpuName(cpuString) {
  if (CPU_CACHE[cpuString] !== undefined) {
    // console.log('Data Cache Hit!');
    return CPU_CACHE[cpuString];
  }
  console.log(`Data Cache Miss! ${cpuString}`);
  const res = await (await fetch(`https://technical.city/en/select2?type=cpu&query=${cpuString}&limit=10`)).json();
  let label = null;
  if (res.length) {
    label = res[0].label;
  }
  CPU_CACHE[cpuString] = label;
  return label;
}


function cpuNameMatcher(aCpu, bCpu) {
  return aCpu === bCpu || bCpu.includes(aCpu) || aCpu.includes(bCpu);
}

async function compareCPUs(cpu1, cpu2) {
  if (!cpu2 || !cpu1) {
    return null;
  }
  const sanitizedCpu1 = cpu1.replace(/\s/gm, '-');
  const sanitizedCpu2 = cpu2.replace(/\s/gm, '-');
  if (sanitizedCpu1 === sanitizedCpu2) {
    return null;
  }
  if (COMPARE_CACHE[`${sanitizedCpu1}${sanitizedCpu2}`]) {
    // console.log('Compare Cache Hit!');
    return COMPARE_CACHE[`${sanitizedCpu1}${sanitizedCpu2}`];
  }
  console.log(`Compare Cache Miss! ${sanitizedCpu1} vs ${sanitizedCpu2}`);
  const compareLink = `https://technical.city/en/cpu/${sanitizedCpu1}-vs-${sanitizedCpu2}`;
  let resp;
  if (WEBSITE_CACHE[compareLink]) {
    resp = WEBSITE_CACHE[compareLink];
  } else {
    try {
      console.log(`Website Cache Miss! ${sanitizedCpu1} vs ${sanitizedCpu2}`);
      resp = await (await fetch(compareLink)).text();
      WEBSITE_CACHE[compareLink] = resp;
    } catch (error) {
      console.log(error);
    }
  }

  const benchmarkArea = new Document(resp).querySelector('.block');
  const bechmarkText = resp.substring(benchmarkArea.tag0Start, benchmarkArea.tag1End);

  const doc = new Document(bechmarkText);
  const benchmarkSummary = doc.querySelector('.gray_text').contents;
  const ratingBlocks = [...doc.querySelectorAll('.tab'), ...doc.querySelectorAll('.tabactive')];
  // get Rating numbers
  const ratings = ratingBlocks.map((ratingBlock) => {
    const ratingText = bechmarkText.substring(ratingBlock.tag0Start, ratingBlock.tag1End);
    const subDoc = new Document(ratingText);
    const name = subDoc.querySelector('h4').contents;
    const results = subDoc.querySelectorAll('.heading').map((result) => {
      const subSubDoc = new Document(ratingText.substring(result.tag0Start, result.tag1End));

      return {
        cpu: subSubDoc.querySelector('.title').contents.replace(/(\t|\r|\s)/, '').trim(),
        value: parseInt(subSubDoc.querySelector('.avarage').contents.replace(/(\t|\r|\s)/, '').trim(), 10),
      };
    });
    return {
      results,
      name,
      compareLink,
    };
  });
  const cpuName = benchmarkSummary.replace(/outperforms.*/, '').trim().replace(/\s/gm, '-');
  const amountInPercent = parseInt(benchmarkSummary.replace(/.*by/, '').replace(/based.*/, '').replace('%', '').trim(), 10);
  let cpuIndex = null;
  if (cpuNameMatcher(cpuName, sanitizedCpu1)) {
    cpuIndex = 0;
  } else if (cpuNameMatcher(cpuName, sanitizedCpu2)) {
    cpuIndex = 1;
  }
  const faster = {
    cpuName,
    cpuIndex,
    amountInPercent,
  };
  COMPARE_CACHE[`${sanitizedCpu1}${sanitizedCpu2}`] = {
    ratings,
    benchmarkSummary,
    faster,
  };
  return {
    ratings,
    benchmarkSummary,
  };
}
async function hetznerToTechnicalCity(hetznerCpu) {
  const resp = await getTechnicalCityCpuName(hetznerCpu);
  return resp;
}

async function saveCaches() {
  await fs.promises.writeFile(`${__dirname}/cpuCache.json`, JSON.stringify(CPU_CACHE));
  await fs.promises.writeFile(`${__dirname}/compareCache.json`, JSON.stringify(COMPARE_CACHE));
  await fs.promises.writeFile(`${__dirname}/websiteCache.json`, JSON.stringify(WEBSITE_CACHE));
}

module.exports = {
  compareCPUs,
  hetznerToTechnicalCity,
  saveCaches,
};

// hetznerToTechnicalCity('Intel Core i7-7700')
// compareCPUs('Core i7-7700', 'Ryzen-5-7520U').then( () => process.exit(0)
// ).catch((err) => {
//   console.error(err);
//   process.exit(1);
// });
