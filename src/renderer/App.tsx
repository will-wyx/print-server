import { useState } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import {
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Button,
  Grid,
} from '@mui/material';

function Hello() {
  const [printer, setPrinter] = useState('');
  const [printers, setPrinters] = useState([]);

  const handleChange = (event: any) => {
    setPrinter(event.target.value);
  };

  const handleRefresh = () => {
    window.electron.ipcRenderer
      .invoke('refresh')
      .then((res: []) => {
        setPrinters(res);
      })
      .catch((e: any) => {
        console.log('err', e);
      });
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={8}>
        <FormControl fullWidth size="small">
          <InputLabel id="demo-simple-select-label">打印机</InputLabel>
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={printer}
            label="Printer"
            onChange={handleChange}
          >
            {printers.map((item: any) => (
              <MenuItem value={item}>{item}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={4} style={{ display: 'flex', alignItems: 'center' }}>
        <FormControl>
          <Button variant="outlined" onClick={handleRefresh}>
            刷新设备
          </Button>
        </FormControl>
      </Grid>
    </Grid>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    </Router>
  );
}
