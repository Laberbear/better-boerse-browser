import logo from './logo.svg';
import './App.css';
import React, { useState, useEffect } from 'react';
import Input from '@mui/joy/Input';
import Select from '@mui/joy/Select';
import Option from '@mui/joy/Option';
import { Box, Chip } from '@mui/joy';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Typography from '@mui/joy/Typography';
import Table from '@mui/joy/Table';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { useSearchParams } from "react-router-dom";
import Link from '@mui/joy/Link';
import { visuallyHidden } from '@mui/utils';

const BASE_BLACKLIST = ['AMD', 'Intel'];

function App() {
  const [data, setData] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [cpuBlacklistList, setCpuBlacklistList] = useState([]);
  const [options, setOptions] = useState({
    minPrice: searchParams.get('minPrice') || 0,
    maxPrice: searchParams.get('maxPrice') || 120,
    minimumStorage: searchParams.get('minimumStorage') || 0,
    minimumMemory: searchParams.get('minimumMemory') || 0,
    cpuToCompare: searchParams.get('cpuToCompare') || 'Core-i7-3770',
    cpuBlacklist: searchParams.getAll('cpuBlacklist') || [],
    orderBy: searchParams.get('orderBy') || 'price',
    orderDirection: searchParams.get('orderDirection') || 'asc'
  });

  useEffect(() => {
    const queryParams = Object.entries(options).map(([key, val]) => {
      if (Array.isArray(val)) {
        return val.map(v => `${key}=${v}`).join('&')
      } else {
        return `${key}=${val}`
      }
    }).join('&')
    fetch(`api/servers?${queryParams}`)
      .then(response => response.json())
      .then(json => {
        setData(json)
        setCpuBlacklistList([...new Set([...BASE_BLACKLIST, ...json.map(val => val.cpu), ...options.cpuBlacklist])])
      })
      .catch(error => console.error(error));
  }, []);
  const handleblacklistchange = (event, newValue) => {
    console.log('this blacklist change')
    handleChange({
      target: {
        name: 'cpuBlacklist',
        value: newValue
      }
    })
  }
  const handlecpuCompareChange = (event, newValue) => {
    console.log('this cpu compare change')
    handleChange({
      target: {
        name: 'cpuToCompare',
        value: newValue
      }
    })
  }
  const handleChange = (event) => {
    console.log(event);
    console.log('handle change called', event.target.name, event.target.value)
    const newOptions = {
      ...options,
      [event.target.name]: event.target.value
    }
    setSearchParams('')
    setOptions(newOptions);
    const queryParams = Object.entries(newOptions).map(([key, val]) => {
      if (Array.isArray(val)) {
        return val.map(v => `${key}=${v}`).join('&')
      } else {
        return `${key}=${val}`
      }
    }).join('&')
    setSearchParams(newOptions);
    fetch(`api/servers?${queryParams}`)
      .then(response => response.json())
      .then(json => {
        setData(json)
        setCpuBlacklistList([...new Set([...BASE_BLACKLIST, ...json.map(val => val.cpu), ...newOptions.cpuBlacklist])])
      })
      .catch(error => console.error(error));
  }
  
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
  },
];
function onRequestSort(event, property) {
  console.log('handle sort called', event, property)
  const newOrderDirection = options.orderBy === property && options.orderDirection === 'asc' ? 'desc' : 'asc';
  const newOrderBy = property;
  const newOptions = {
    ...options,
    orderDirection: newOrderDirection,
    orderBy: newOrderBy
  }
  setSearchParams('')
  setOptions(newOptions);
  const queryParams = Object.entries(newOptions).map(([key, val]) => {
    if (Array.isArray(val)) {
      return val.map(v => `${key}=${v}`).join('&')
    } else {
      return `${key}=${val}`
    }
  }).join('&')
  setSearchParams(newOptions);
  fetch(`api/servers?${queryParams}`)
    .then(response => response.json())
    .then(json => {
      setData(json)
      setCpuBlacklistList([...new Set([...BASE_BLACKLIST, ...json.map(val => val.cpu), ...newOptions.cpuBlacklist])])
    })
    .catch(error => console.error(error));
};
const createSortHandler = (property) => (event) => {
  onRequestSort(event, property);
};
  return (
    <div className="App">
      <div className='containerContainer'>
        <Typography className="title" level="h1">Better Börse Browser</Typography>
        <form className="form" onChange={handleChange}>
          <div className="filter">
            <FormControl className="filter-price">
              <FormLabel>Minimum Price</FormLabel>
              <Input type="number" defaultValue={options.minPrice} name="minPrice"></Input>
            </FormControl>
            <FormControl className="filter-price">
              <FormLabel>Maximum Price</FormLabel>
              <Input type="number" defaultValue={options.maxPrice} name="maxPrice"></Input>
            </FormControl>
            <FormControl className="filter-storage">
              <FormLabel>Minimum Storage</FormLabel>
              <Input type="number" defaultValue={options.minPrice} name="minimumStorage"></Input>
            </FormControl>
            <FormControl className="filter-memory">
              <FormLabel>Minimum Memory</FormLabel>
              <Input type="number" defaultValue={options.minPrice} name="minimumMemory"></Input>
            </FormControl>
            <FormControl className="filter-cpuCompare">
              <FormLabel>CPU To Compare</FormLabel>
              <Select
                onChange={handlecpuCompareChange} name="cpuToCompare" defaultValue={options.cpuToCompare}>
                <Option value="Core-i7-3770">Core-i7-3770</Option>
                <Option value="Xeon-E-2276G">Xeon-E-2276G</Option>
              </Select>
            </FormControl>
            <FormControl className="cpuBlacklist">
              <FormLabel>CPU Blacklist</FormLabel>
              <Select
                multiple
                onChange={handleblacklistchange}
                placeholder="Choose CPUs to Blacklist"
                defaultValue={options.cpuBlacklist}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', gap: '0.25rem' }}>
                    {selected.map((selectedOption) => (
                      <Chip key={selectedOption.label} variant="soft" color="primary">
                        {selectedOption.label}
                      </Chip>
                    ))}
                  </Box>
                )}
                sx={{
                  minWidth: '15rem',
                }}
                slotProps={{
                  listbox: {
                    sx: {
                      width: '100%',
                    },
                  },
                }}
              >
                {cpuBlacklistList.sort().map((val) => (
                  <Option key={val} value={val}>{val}</Option>))}
              </Select>
            </FormControl>
          </div>
        </form>
        <div className='tableContainer'>
          {!data ? 'Loading' : (<Table>
            <thead>
      <tr>
        {headCells.map((headCell) => {
          const active = options.orderBy === headCell.id;
          return (
            <th
              key={headCell.id}
              aria-sort={
                active ? { asc: 'ascending', desc: 'descending' }[options.orderDirection] : undefined
              }
            >
              {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
              <Link
                underline="none"
                color="neutral"
                textColor={active ? 'primary.plainColor' : undefined}
                component="button"
                onClick={createSortHandler(headCell.id)}
                fontWeight="lg"
                startDecorator={
                  headCell.numeric ? (
                    <ArrowDownwardIcon sx={{ opacity: active ? 1 : 0 }} />
                  ) : null
                }
                endDecorator={
                  !headCell.numeric ? (
                    <ArrowDownwardIcon sx={{ opacity: active ? 1 : 0 }} />
                  ) : null
                }
                sx={{
                  '& svg': {
                    transition: '0.2s',
                    transform:
                      active && options.orderDirection === 'asc' ? 'rotate(0deg)' : 'rotate(180deg)',
                  },
                  '&:hover': { '& svg': { opacity: 1 } },
                }}
              >
                {headCell.label}
                {active ? (
                  <Box component="span" sx={visuallyHidden}>
                    {options.orderDirection === 'desc' ? 'sorted descending' : 'sorted ascending'}
                  </Box>
                ) : null}
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
                    <td><a href={listValue.link}>{listValue.cpu}</a></td>
                    <td>{listValue.hddSum}GB</td>
                    <td>{listValue.ram_size}GB</td>
                    <td>{listValue.actualPrice}€</td>
                    <td>{!listValue.comparison ? 'Not Available' :
                      ((listValue.comparison.faster.cpuIndex === 0 ? '👎 Slower' : '👍 Faster') + ` by ${listValue.comparison.faster.amountInPercent}%\n(aggregated)`)}</td>
                  </tr>
                );
              })}

            </tbody></Table>)
          }</div>
      </div></div>
  );
}

export default App;
