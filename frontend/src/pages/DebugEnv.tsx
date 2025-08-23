import React from 'react';

export default function DebugEnv() {
  const apiUrl = import.meta.env.VITE_API_URL;
  const allEnvVars = import.meta.env;
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>Environment Debug</h1>
      
      <h2>VITE_API_URL:</h2>
      <pre style={{ background: '#f4f4f4', padding: '10px' }}>
        {apiUrl || '(empty/undefined)'}
      </pre>
      
      <h2>Login URL would be:</h2>
      <pre style={{ background: '#f4f4f4', padding: '10px' }}>
        {`${apiUrl || ''}/api/auth/login`}
      </pre>
      
      <h2>All Vite Environment Variables:</h2>
      <pre style={{ background: '#f4f4f4', padding: '10px' }}>
        {JSON.stringify(allEnvVars, null, 2)}
      </pre>
      
      <h2>Window Location:</h2>
      <pre style={{ background: '#f4f4f4', padding: '10px' }}>
        {JSON.stringify({
          origin: window.location.origin,
          href: window.location.href,
          host: window.location.host
        }, null, 2)}
      </pre>
    </div>
  );
}