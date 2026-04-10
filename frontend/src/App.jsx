import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ResumeDrafting from './pages/ResumeDrafting';
import CoverLetter from './pages/CoverLetter';
import MockInterview from './pages/MockInterview';
import Tracker from './pages/Tracker';
import Insights from './pages/Insights';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tracker" element={<Tracker />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/resume" element={<ResumeDrafting />} />
        <Route path="/cover-letter" element={<CoverLetter />} />
        <Route path="/interview" element={<MockInterview />} />
      </Routes>
    </Router>
  );
}

export default App;
