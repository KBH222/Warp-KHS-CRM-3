import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../services/config';

const TestConnection = () => {
  const [results, setResults] = useState<any[]>([]);
  const [deviceInfo, setDeviceInfo] = useState<any>({});
  
  useEffect(() => {
    // Get device info
    const info = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      online: navigator.onLine,
      cookiesEnabled: navigator.cookieEnabled,
      isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
      isIPhone: /iPhone|iPad|iPod/i.test(navigator.userAgent),
      apiUrl: API_BASE_URL || 'Not configured',
      viteApiUrl: import.meta.env.VITE_API_URL || 'Not set'
    };
    setDeviceInfo(info);
  }, []);
  
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
  
  const testKHSToolsSync = async () => {
    try {
      const token = localStorage.getItem('khs-crm-token') || 
                   localStorage.getItem('auth-token') ||
                   localStorage.getItem('token');
      
      if (!token) {
        addResult('KHS Tools Sync', false, { error: 'No auth token found' });
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/khs-tools-sync`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
      
      addResult('KHS Tools Sync', response.ok, { 
        status: response.status, 
        token: `${token.substring(0, 20)}...`,
        data: data ? { version: data.version, hasTools: !!data.tools } : data
      });
    } catch (err: any) {
      addResult('KHS Tools Sync', false, { error: err.message, stack: err.stack });
    }
  };
  
  const testAuthCheck = async () => {
    try {
      const token = localStorage.getItem('khs-crm-token') || 
                   localStorage.getItem('auth-token') ||
                   localStorage.getItem('token');
      
      if (!token) {
        addResult('Auth Check', false, { error: 'No auth token found' });
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/auth/check`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = response.ok ? await response.json() : await response.text();
      
      addResult('Auth Check', response.ok, { 
        status: response.status,
        user: data.user?.email || 'Unknown',
        data 
      });
    } catch (err: any) {
      addResult('Auth Check', false, { error: err.message });
    }
  };
  
  const runAllTests = async () => {
    setResults([]);
    await testHealth();
    await testAuthCheck();
    await testToolsWithoutAuth();
    await testToolsWithAuth();
    await testKHSToolsSync();
  };
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>API Connection Test</h1>
      
      <div style={{
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#F3F4F6',
        borderRadius: '8px'
      }}>
        <h3>Device Information:</h3>
        <p><strong>Platform:</strong> {deviceInfo.platform}</p>
        <p><strong>Mobile:</strong> {deviceInfo.isMobile ? 'Yes' : 'No'}</p>
        <p><strong>iPhone:</strong> {deviceInfo.isIPhone ? 'Yes' : 'No'}</p>
        <p><strong>Online:</strong> {deviceInfo.online ? 'Yes' : 'No'}</p>
        <p><strong>API URL:</strong> {deviceInfo.apiUrl}</p>
        <p><strong>VITE_API_URL:</strong> {deviceInfo.viteApiUrl}</p>
        <p style={{ fontSize: '12px', wordBreak: 'break-all' }}>
          <strong>User Agent:</strong> {deviceInfo.userAgent}
        </p>
      </div>
      
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