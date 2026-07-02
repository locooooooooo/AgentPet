import React from 'react';
import ReactDOM from 'react-dom/client';
import RanchApp from './RanchApp';
import './styles/ranch.css';

ReactDOM.createRoot(document.getElementById('ranch-root')!).render(
  <React.StrictMode>
    <RanchApp />
  </React.StrictMode>
);
