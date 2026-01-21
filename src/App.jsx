import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MyStudents from './pages/MyStudents';
import IEPWriter from './pages/IEPWriter';
import Billing from './pages/Billing';
import Settings from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/students" element={<MyStudents />} />
        <Route path="/iep-writer" element={<IEPWriter />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/" element={<Navigate to="/students" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
