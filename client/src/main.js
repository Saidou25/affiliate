import { jsx as _jsx } from "react/jsx-runtime";
// client/src/main.tsx or client/src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ApolloProvider } from '@apollo/client';
import client from './apolloClient';
ReactDOM.createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsx(ApolloProvider, { client: client, children: _jsx(App, {}) }) }));
