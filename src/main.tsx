import React from 'react';
import ReactDOM from 'react-dom/client';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import App from './App';
import { configureAmplify, useMockApi } from './config/amplify';
import './styles.css';

configureAmplify();

const application = useMockApi ? (
  <App />
) : (
  <Authenticator hideSignUp>
    <App />
  </Authenticator>
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>{application}</React.StrictMode>,
);
