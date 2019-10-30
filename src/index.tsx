import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import './index.css';

ReactDOM.render(
  <App width={1000} height={600} />,
  document.getElementById('root') as HTMLElement
);
registerServiceWorker();
