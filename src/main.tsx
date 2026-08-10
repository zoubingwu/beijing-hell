import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App';
import { store } from './app/store';
import './styles/global.css';
import './styles/win98.css';
import './styles/game.css';

const root = document.getElementById('root');
if (!root) throw new Error('找不到应用根节点');

createRoot(root).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
);
