// Fichier: src/main.tsx

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

// ❌ SUPPRIME CETTE LIGNE :
// import "mapbox-gl/dist/mapbox-gl.css"; 

// ✅ GARDE LE RESTE :
import './index.css'; 

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);