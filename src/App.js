import React from 'react';
import './App.css';
import { ThemeProvider, useTheme } from './ThemeContext';
import NavBar from './components/NavBar';
import Welcome from './pages/Welcome';
import Gallery from './pages/Gallery';
import Discussion from './pages/Discussion';
import Location from './pages/Location';
import QuickDock from './components/QuickDock';

function useRoute() {
  const [path, setPath] = React.useState(window.location.pathname);
  React.useEffect(() => {
    const handler = () => setPath(window.location.pathname);
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);
  React.useEffect(() => {
    const onClick = (e) => {
      const a = e.target.closest('a');
      if (a && a.getAttribute('href')?.startsWith('/')) {
        e.preventDefault();
        window.history.pushState({}, '', a.getAttribute('href'));
        setPath(window.location.pathname);
      }
    };
    document.body.addEventListener('click', onClick);
    return () => document.body.removeEventListener('click', onClick);
  }, []);
  return path;
}

function Shell() {
  const route = useRoute();
  let Page = Welcome;
  if (route.startsWith('/galerie')) Page = Gallery;
  else if (route.startsWith('/discussion')) Page = Discussion;
  else if (route.startsWith('/localisation')) Page = Location;
  const { theme } = useTheme();

  // Définir les routes où le QuickDock doit être affiché
  const showQuickDock = route.startsWith('/galerie');

  return (
    <div style={{ background: theme.colors.background, minHeight: '100vh' }}>
      <NavBar />
      <Page />
      {showQuickDock && (
        <QuickDock onSendGlobal={(msg) => {
          const raw = localStorage.getItem('messages');
          const arr = raw ? JSON.parse(raw) : [];
          const next = [...arr, msg];
          localStorage.setItem('messages', JSON.stringify(next));
        }} />
      )}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Shell />
    </ThemeProvider>
  );
}

export default App;
