import './App.css';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { Box, Chip } from '@mui/joy';
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
  minPrice: '0',
  maxPrice: '200',
  minimumStorage: '0',
  minimumMemory: '0',
  cpuToCompare: 'Core-i7-3770',
  cpuBlacklist: [],
  orderBy: 'price',
  orderDirection: 'asc'
};

function App() {
  const [data, setData] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [cpuBlacklistList, setCpuBlacklistList] = useState([]);
  const [options, setOptions] = useState({
    minPrice: searchParams.get('minPrice') || parseInt(DEFAULT_VALUES.minPrice, 10),
    maxPrice: searchParams.get('maxPrice') || parseInt(DEFAULT_VALUES.maxPrice, 10),
    minimumStorage: searchParams.get('minimumStorage') || parseInt(DEFAULT_VALUES.minimumStorage, 10),
    minimumMemory: searchParams.get('minimumMemory') || parseInt(DEFAULT_VALUES.minimumMemory, 10),
    cpuToCompare: searchParams.get('cpuToCompare') || DEFAULT_VALUES.cpuToCompare,
    cpuBlacklist: searchParams.getAll('cpuBlacklist') || DEFAULT_VALUES.cpuBlacklist,
    orderBy: searchParams.get('orderBy') || DEFAULT_VALUES.orderBy,
    orderDirection: searchParams.get('orderDirection') || DEFAULT_VALUES.orderDirection
  });
  let initalRequest = false;

  useEffect(() => {
    if (initalRequest) {
      return;
    }
    initalRequest = true;
    const queryParams = Object.entries(options).map(([key, val]) => {
      if (Array.isArray(val)) {
        return val.map(v => `${key}=${v}`).join('&');
      } else {
        return `${key}=${val}`;
      }
    }).join('&');
    fetch(`api/servers?${queryParams}`)
      .then(response => response.json())
      .then(json => {
        setData(json);
        setCpuBlacklistList([...new Set([...BASE_BLACKLIST, ...json.map(val => val.cpu), ...options.cpuBlacklist])]);
      })
      .catch(error => console.error(error));
  }, []);
  const handleblacklistchange = (event, newValue) => {
    handleChange({
      target: {
        name: 'cpuBlacklist',
        value: newValue
      }
    });
  };
  const handlecpuCompareChange = (event, newValue) => {
    handleChange({
      target: {
        name: 'cpuToCompare',
        value: newValue
      }
    });
  };
  const handleChange = (event) => {
    const newOptions = {
      ...options,
      [event.target.name]: event.target.value
    };
    setSearchParams('');
    const queryParams = Object.entries(newOptions).map(([key, val]) => {
      if (Array.isArray(val)) {
        return val.map(v => `${key}=${v}`).join('&');
      } else {
        return `${key}=${val}`;
      }
    }).join('&');
    for (const [key, value] of Object.entries(newOptions)) {
      if (value === DEFAULT_VALUES[key]) {
        delete newOptions[key];
      }
    }
    setOptions(newOptions);
    const newNewOptions = { ...newOptions };
    for (const [key, value] of Object.entries(newNewOptions)) {
      if (value === DEFAULT_VALUES[key] || value === '' || value === undefined || value === null) {
        delete newNewOptions[key];
      }
    }
    setSearchParams(newNewOptions);
    fetch(`api/servers?${queryParams}`)
      .then(response => response.json())
      .then(json => {
        setData(json);
        setCpuBlacklistList([...new Set([...BASE_BLACKLIST, ...json.map(val => val.cpu), ...newOptions.cpuBlacklist])]);
      })
      .catch(error => console.error(error));
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
  function onRequestSort(event, property) {
    const newOrderDirection = options.orderBy === property && options.orderDirection === 'asc' ? 'desc' : 'asc';
    const newOrderBy = property;
    const newOptions = {
      ...options,
      orderDirection: newOrderDirection,
      orderBy: newOrderBy
    };
    setSearchParams('');
    const queryParams = Object.entries(newOptions).map(([key, val]) => {
      if (Array.isArray(val)) {
        return val.map(v => `${key}=${v}`).join('&');
      } else {
        return `${key}=${val}`;
      }
    }).join('&');
    setOptions(newOptions);
    const newNewOptions = { ...newOptions };
    for (const [key, value] of Object.entries(newNewOptions)) {
      if (value === DEFAULT_VALUES[key] || value === '' || value === undefined || value === null) {
        delete newNewOptions[key];
      }
    }
    setSearchParams(newNewOptions);
    fetch(`api/servers?${queryParams}`)
      .then(response => response.json())
      .then(json => {
        setData(json);
        setCpuBlacklistList([...new Set([...BASE_BLACKLIST, ...json.map(val => val.cpu), ...newOptions.cpuBlacklist])]);
      })
      .catch(error => console.error(error));
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
        <form className='form' onChange={handleChange}>
          <div className='filter'>
            <FormControl className='filter-price'>
              <FormLabel>Minimum Price</FormLabel>
              <Input type='number' defaultValue={options.minPrice} name='minPrice'></Input>
            </FormControl>
            <FormControl className='filter-price'>
              <FormLabel>Maximum Price</FormLabel>
              <Input type='number' defaultValue={options.maxPrice} name='maxPrice'></Input>
            </FormControl>
            <FormControl className='filter-storage'>
              <FormLabel>Minimum Storage</FormLabel>
              <Input type='number' defaultValue={options.minimumStorage} name='minimumStorage'></Input>
            </FormControl>
            <FormControl className='filter-memory'>
              <FormLabel>Minimum Memory</FormLabel>
              <Input type='number' defaultValue={options.minimumMemory} name='minimumMemory'></Input>
            </FormControl>
            <FormControl className='filter-cpuCompare'>
              <FormLabel>CPU To Compare</FormLabel>
              <Select
                onChange={handlecpuCompareChange}
                name='cpuToCompare'
                defaultValue={options.cpuToCompare}
              >
                <Option value='Core-i7-3770'>Core-i7-3770</Option>
                <Option value='Xeon-E-2276G'>Xeon-E-2276G</Option>
              </Select>
            </FormControl>
            <FormControl className='cpuBlacklist'>
              <FormLabel>CPU Blacklist</FormLabel>
              <Select
                multiple
                onChange={handleblacklistchange}
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
          </div>
        </form>
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
