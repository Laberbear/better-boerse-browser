import './App.css';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { Box, Button, Checkbox, Chip } from '@mui/joy';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Input from '@mui/joy/Input';
import Link from '@mui/joy/Link';
import Option from '@mui/joy/Option';
import Select from '@mui/joy/Select';
import Table from '@mui/joy/Table';
import Typography from '@mui/joy/Typography';
import { visuallyHidden } from '@mui/utils';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const BASE_BLACKLIST = ['AMD', 'Intel'];
const DEFAULT_VALUES = {
  minPrice: 0,
  maxPrice: 200,
  minimumStorage: 0,
  minimumMemory: 0,
  minPerformance: -9999,
  onlyWithSsd: false,
  onlyWithEcc: false,
  cpuToCompare: 'Core-i7-3770',
  cpuBlacklist: [],
  orderBy: 'price',
  orderDirection: 'asc'
};

function getNumberSearchParam(searchParams, key) {
  const val = searchParams.get(key);
  try {
    if (val !== null && val !== undefined) {
      return parseInt(val, 10);
    }
  } catch (error) {
    console.error(`Error while trying to parse query param ${key} with value ${val}`);
    console.error(error);
    return null;
  }
}

function App() {
  const [data, setData] = useState(null);
  const [showExpandedFilters, setShowExpandedFilters] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [cpuBlacklistList, setCpuBlacklistList] = useState([]);
  const [options, setOptions] = useState({
    minPrice: getNumberSearchParam(searchParams, 'minPrice') || parseInt(DEFAULT_VALUES.minPrice, 10),
    maxPrice: getNumberSearchParam(searchParams, 'maxPrice') || parseInt(DEFAULT_VALUES.maxPrice, 10),
    minimumStorage: getNumberSearchParam(searchParams, 'minimumStorage') || parseInt(DEFAULT_VALUES.minimumStorage, 10),
    minimumMemory: getNumberSearchParam(searchParams, 'minimumMemory') || parseInt(DEFAULT_VALUES.minimumMemory, 10),
    cpuToCompare: searchParams.get('cpuToCompare') || DEFAULT_VALUES.cpuToCompare,
    cpuBlacklist: searchParams.getAll('cpuBlacklist') || DEFAULT_VALUES.cpuBlacklist,
    minPerformance: searchParams.get('minPerformance') || DEFAULT_VALUES.minPerformance,
    onlyWithSsd: searchParams.get('onlyWithSsd') || DEFAULT_VALUES.onlyWithSsd,
    onlyWithEcc: searchParams.get('onlyWithEcc') || DEFAULT_VALUES.onlyWithEcc,
    orderBy: searchParams.get('orderBy') || DEFAULT_VALUES.orderBy,
    orderDirection: searchParams.get('orderDirection') || DEFAULT_VALUES.orderDirection
  });
  let notInitalRequestAnymore = false;

  async function requestNewServers(queryParams, options) {
    try {
      const response = await fetch(`api/servers?${queryParams}`);
      const json = await response.json();
      if (!json) {
        return;
      }
      setData(json);
      setCpuBlacklistList([...new Set([...BASE_BLACKLIST, ...json.map(val => val.cpu), ...options.cpuBlacklist])]);
    } catch (error) {
      console.error(error);
    }
  }

  async function setNewData(options) {
    console.log('setting new data', options);
    setSearchParams('');
    const queryParams = Object.entries(options).map(([key, val]) => {
      if (Array.isArray(val)) {
        return val.map(v => `${key}=${v}`).join('&');
      } else {
        return `${key}=${val}`;
      }
    }).join('&');
    setOptions(options);
    const optionsWithoutDefaults = { ...options };
    for (const [key, value] of Object.entries(optionsWithoutDefaults)) {
      if (value === DEFAULT_VALUES[key] || value === '' || value === undefined || value === null) {
        delete optionsWithoutDefaults[key];
      }
    }
    setSearchParams(optionsWithoutDefaults);
    await requestNewServers(queryParams, options);
  }

  useEffect(() => {
    console.log('Use Effect Called');
    if (notInitalRequestAnymore) {
      return;
    }
    console.log('Initial Request', options);
    notInitalRequestAnymore = true;
    const queryParams = Object.entries(options).map(([key, val]) => {
      if (Array.isArray(val)) {
        return val.map(v => `${key}=${v}`).join('&');
      } else {
        return `${key}=${val}`;
      }
    }).join('&');
    requestNewServers(queryParams, options);
  }, []);
  /**
   * Simulated a normal event to reuse the regular input event handler
   *
   * @param {string} key Name of the input
   * @returns
   */
  const handleSelectChange = (key) => (event, newValue) => {
    if (newValue === null) {
      return;
    }
    handleChange({
      target: {
        name: key,
        value: newValue
      }
    });
  };
  const handleChange = async (event) => {
    let actualVal = event.target.value;
    const name = event.target.name;
    if (['minPrice', 'maxPrice', 'minimumStorage', 'minimumMemory', 'minPerformance'].includes(name)) {
      actualVal = parseInt(actualVal, 10);
    }
    if (['onlyWithSsd', 'onlyWithEcc'].includes(name)) {
      actualVal = event.target.checked;
    }
    console.log('Got a change', name, actualVal, event.target);
    const newOptions = {
      ...options,
      [event.target.name]: actualVal
    };
    setNewData(newOptions);
  };

  const headCells = [
    {
      id: 'cpu',
      label: 'CPU'
    },
    {
      id: 'storage',
      label: 'Storage Space'
    },
    {
      id: 'memory',
      label: 'Memory'
    },
    {
      id: 'price',
      label: 'Price'
    },
    {
      id: 'performance',
      label: 'Performance'
    }
  ];
  async function onRequestSort(event, property) {
    console.log(property, options.orderDirection);
    const newOrderDirection = options.orderBy === property && options.orderDirection === 'asc' ? 'desc' : 'asc';
    const newOrderBy = property;
    const newOptions = {
      ...options,
      orderDirection: newOrderDirection,
      orderBy: newOrderBy
    };
    setNewData(newOptions);
  }
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  function getPerformanceString(performanceData) {
    if (!performanceData) {
      return 'Not Available';
    }
    if (performanceData.amountInPercent === 0) {
      return '🤌 Performance is Equal';
    }
    if (performanceData.cpuIndex === 0) {
      return `👎 Slower by ${performanceData.amountInPercent}%\n(aggregated)`;
    } else {
      return `👍 Faster by ${performanceData.amountInPercent}%\n(aggregated)`;
    }
  }
  return (
    <div className='App'>
      <div className='containerContainer'>
        <Typography className='title' level='h1'>Better Börse Browser</Typography>
        <div className='filter-container'>
          <form className='form' onChange={handleChange}>
            <div className='filter'>
              <FormControl className='filter-price'>
                <FormLabel>Max Price</FormLabel>
                <Input type='number' defaultValue={options.maxPrice} name='maxPrice'></Input>
              </FormControl>
              <FormControl className='filter-storage'>
                <FormLabel>Min Storage</FormLabel>
                <Input type='number' defaultValue={options.minimumStorage} name='minimumStorage'></Input>
              </FormControl>
              <FormControl className='filter-memory'>
                <FormLabel>Min Memory</FormLabel>
                <Input type='number' defaultValue={options.minimumMemory} name='minimumMemory'></Input>
              </FormControl>
              <FormControl className='filter-cpuCompare'>
                <FormLabel>CPU To Compare</FormLabel>
                <Select
                  onChange={handleSelectChange('cpuToCompare')}
                  name='cpuToCompare'
                  defaultValue={options.cpuToCompare}
                >
                  <Option value='Core-i7-3770'>Core-i7-3770</Option>
                  <Option value='Xeon-E-2276G'>Xeon-E-2276G</Option>
                </Select>
              </FormControl>
              <FormControl className='filter-minPerformance'>
                <FormLabel>Min Performance</FormLabel>
                <Select
                  onChange={handleSelectChange('minPerformance')}
                  name='minPerformance'
                  defaultValue={`${options.minPerformance}`}
                >
                  <Option value='-9999'>Any</Option>
                  <Option value='-10'>10% Slower</Option>
                  <Option value='0'>Not Slower</Option>
                  <Option value='10'>10% Faster</Option>
                  <Option value='25'>25% Faster</Option>
                  <Option value='50'>50% Faster</Option>
                  <Option value='100'>100% Faster</Option>
                </Select>
              </FormControl>
              <div className='filter-expand-container'>
                <Button
                  className='filter-expand'
                  onClick={() => setShowExpandedFilters(!showExpandedFilters)}
                >
                  {showExpandedFilters ? 'Collapse Filters' : 'Expand Filters'}
                </Button>
              </div>
            </div>
            {showExpandedFilters
              && (
                <div className='filter-expanded'>
                  <FormControl className='filter-price'>
                    <FormLabel>Min Price</FormLabel>
                    <Input type='number' defaultValue={options.minPrice} name='minPrice'></Input>
                  </FormControl>
                  <FormControl className='cpuBlacklist'>
                    <FormLabel>CPU Blacklist</FormLabel>
                    <Select
                      multiple
                      onChange={handleSelectChange('cpuBlacklist')}
                      placeholder='Choose CPUs to Blacklist'
                      defaultValue={options.cpuBlacklist}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', gap: '0.25rem' }}>
                          {selected.map((selectedOption) => (
                            <Chip key={selectedOption.label} variant='soft' color='primary'>
                              {selectedOption.label}
                            </Chip>
                          ))}
                        </Box>
                      )}
                      sx={{
                        minWidth: '15rem'
                      }}
                      slotProps={{
                        listbox: {
                          sx: {
                            width: '100%'
                          }
                        }
                      }}
                    >
                      {cpuBlacklistList.sort().map((val) => <Option key={val} value={val}>{val}</Option>)}
                    </Select>
                  </FormControl>
                  <div className='filter-checkbox-container'>
                    <FormControl className='filter-ssd'>
                      {/* Not gonna lie, just extremely lazy to align things manually */}
                      <FormLabel>‎</FormLabel>
                      <Checkbox defaultChecked={options.onlyWithSsd} label='Only with SSD' name='onlyWithSsd' />
                    </FormControl>
                  </div>
                  <div className='filter-checkbox-container'>
                    <FormControl className='filter-ecc'>
                      {/* Not gonna lie, just extremely lazy to align things manually */}
                      <FormLabel>‎</FormLabel>
                      <Checkbox defaultChecked={options.onlyWithEcc} label='Only with ECC' name='onlyWithEcc' />
                    </FormControl>
                  </div>
                </div>
              )}
          </form>
        </div>
        <div className='tableContainer'>
          {!data ? 'Loading' : (
            <Table
              stickyHeader
            >
              <thead>
                <tr>
                  {headCells.map((headCell) => {
                    const active = options.orderBy === headCell.id;
                    return (
                      <th
                        key={headCell.id}
                        aria-sort={active
                          ? { asc: 'ascending', desc: 'descending' }[options.orderDirection]
                          : undefined}
                      >
                        <Link
                          underline='none'
                          color='neutral'
                          textColor={active ? 'primary.plainColor' : undefined}
                          component='button'
                          onClick={createSortHandler(headCell.id)}
                          fontWeight='lg'
                          startDecorator={headCell.numeric
                            ? <ArrowDownwardIcon sx={{ opacity: active ? 1 : 0 }} />
                            : null}
                          endDecorator={!headCell.numeric
                            ? <ArrowDownwardIcon sx={{ opacity: active ? 1 : 0 }} />
                            : null}
                          sx={{
                            '& svg': {
                              transition: '0.2s',
                              transform: active && options.orderDirection === 'asc' ? 'rotate(0deg)' : 'rotate(180deg)'
                            },
                            '&:hover': { '& svg': { opacity: 1 } }
                          }}
                        >
                          {headCell.label}
                          {active
                            ? (
                              <Box component='span' sx={visuallyHidden}>
                                {options.orderDirection === 'desc' ? 'sorted descending' : 'sorted ascending'}
                              </Box>
                            )
                            : null}
                        </Link>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {data.map((listValue, index) => {
                  return (
                    <tr key={index}>
                      <td>
                        <a target='_blank' rel='noopener noreferrer' href={listValue.link}>{listValue.cpu}</a>
                      </td>
                      <td>
                        {listValue.hddSum}GB <br></br>
                        {listValue.ssd ? `(has ${listValue.ssd} SSD)` : ''}
                      </td>
                      <td>{listValue.ram_size}GB {listValue.hasEcc ? '(ECC)' : ''}</td>
                      <td>{listValue.actualPrice}€</td>
                      <td>
                        {getPerformanceString(listValue?.comparison?.faster)}
                        <a target='_blank' rel='noopener noreferrer' href={listValue.comparison.compareLink}>🔗</a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
