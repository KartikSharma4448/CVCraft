import React, { useEffect } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import CreateCV from './pages/CreateCV';
import { Toaster } from './components/ui/toaster';
import { initGA4, trackPageView } from './lib/analytics';

/**
 * Tracks page views on route changes.
 * Must be rendered inside BrowserRouter to access useLocation.
 */
function PageTracker() {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname, document.title);
  }, [location]);

  return null;
}

function App() {
  useEffect(() => {
    initGA4();
  }, []);

  return (
    <div className="App">
      <BrowserRouter>
        <PageTracker />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreateCV />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;
