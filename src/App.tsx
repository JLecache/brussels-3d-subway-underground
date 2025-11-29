// Fichier: src/App.tsx (Modifié)

import React from 'react'; 
import MapComponent from './MapComponent.tsx'; // Importe le composant que nous allons créer
import './index.css';

const App: React.FC = () => {
  return (
    // Force la carte à prendre tout l'espace de la fenêtre
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
      <MapComponent />
    </div>
  );
};

export default App;