import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { Analytics } from '@vercel/analytics/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, AppProvider } from './contexts';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - data considered fresh
      gcTime: 1000 * 60 * 30, // 30 minutes - keep in cache (formerly cacheTime)
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Don't refetch if data is fresh
      retry: 1, // Only retry failed requests once
    },
  },
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AppProvider>
          <App />
          <Analytics />
        </AppProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);