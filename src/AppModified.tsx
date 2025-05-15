import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Import pages
import Index from './pages/Index';
import Journal from './pages/Journal';
import JournalEntryEnhanced from './pages/JournalEntryEnhanced';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Feedback from './pages/Feedback';
import SessionHistory from './pages/SessionHistory';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/journal/new" element={<JournalEntryEnhanced />} />
        <Route path="/journal/entry/:id" element={<JournalEntryEnhanced />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/session-history" element={<SessionHistory />} />
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Router>
  );
}

export default App; 