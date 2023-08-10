import { useState, useEffect } from 'react';
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
  const [printers, setPrinters] = useState<String[]>([]);

  const handleChange = (event: any) => {
    const { value } = event.target;
    setPrinter(value);
    window.electron.ipcRenderer.sendMessage('change', value);
  };

  const loadPrinters = () => {
    window.electron.ipcRenderer
      .invoke('refresh')
      .then((res: any) => {
        if (res.printer) setPrinter(res.printer);
        // setPrinters(res.printers);
        setPrinters(['a', 'b', 'c']);
        return res;
      })
      .catch((e: any) => {
        console.log('err', e);
      });
  };

  useEffect(() => {
    loadPrinters();
  }, []);

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
              <MenuItem value={item} key={item}>
                {item}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={4} style={{ display: 'flex', alignItems: 'center' }}>
        <FormControl>
          <Button variant="outlined" onClick={loadPrinters}>
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
