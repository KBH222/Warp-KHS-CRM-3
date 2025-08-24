import { useState } from 'react';
import { API_BASE_URL } from '../services/config';

const TestConnection = () => {
  const [results, setResults] = useState<any[]>([]);
  
  const addResult = (test: string, success: boolean, details: any) => {
    setResults(prev => [...prev, { test, success, details, timestamp: new Date().toISOString() }]);
  };
  
  const testHealth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      const data = await response.json();
      addResult('Health Check', response.ok, { status: response.status, data });
    } catch (err: any) {
      addResult('Health Check', false, { error: err.message });
    }
  };
  
  const testToolsWithoutAuth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tools/settings`);
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
      addResult('Tools (No Auth)', response.ok, { status: response.status, data });
    } catch (err: any) {
      addResult('Tools (No Auth)', false, { error: err.message });
    }
  };
  
  const testToolsWithAuth = async () => {
    try {
      const token = localStorage.getItem('khs-crm-token') || localStorage.getItem('auth-token');
      const response = await fetch(`${API_BASE_URL}/api/tools/settings`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
      addResult('Tools (With Auth)', response.ok, { 
        status: response.status, 
        token: token ? `${token.substring(0, 20)}...` : 'No token',
        data 
      });
    } catch (err: any) {
      addResult('Tools (With Auth)', false, { error: err.message });
    }
  };
  
  const runAllTests = async () => {
    setResults([]);
    await testHealth();
    await testToolsWithoutAuth();
    await testToolsWithAuth();
  };
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>API Connection Test</h1>
      <p>API URL: {API_BASE_URL}</p>
      
      <button 
        onClick={runAllTests}
        style={{
          padding: '10px 20px',
          backgroundColor: '#3B82F6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        Run All Tests
      </button>
      
      <div>
        {results.map((result, index) => (
          <div 
            key={index}
            style={{
              marginBottom: '10px',
              padding: '10px',
              backgroundColor: result.success ? '#D1FAE5' : '#FEE2E2',
              borderRadius: '6px'
            }}
          >
            <h3>{result.test} - {result.success ? '✅ Success' : '❌ Failed'}</h3>
            <pre style={{ fontSize: '12px', overflow: 'auto' }}>
              {JSON.stringify(result.details, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestConnection;