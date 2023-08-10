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
  const [age, setAge] = useState('');

  const handleChange = (event: any) => {
    setAge(event.target.value);
  };

  const handleRefresh = () => {
    window.electron.ipcRenderer.sendMessage('print', { foo: 'bar' });
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={8}>
        <FormControl fullWidth size="small">
          <InputLabel id="demo-simple-select-label">Age</InputLabel>
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={age}
            label="Age"
            onChange={handleChange}
          >
            <MenuItem value={10}>Ten</MenuItem>
            <MenuItem value={20}>Twenty</MenuItem>
            <MenuItem value={30}>Thirty</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={4} style={{ display: 'flex', alignItems: 'center' }}>
        <FormControl>
          <Button variant="outlined" onClick={handleRefresh}>
            更新设备
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
