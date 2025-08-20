export const GoogleDriveSetup = () => {
  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#FEF3C7',
      border: '1px solid #F59E0B',
      borderRadius: '8px',
      marginBottom: '20px'
    }}>
      <h3 style={{
        margin: '0 0 12px 0',
        fontSize: '18.4px',
        fontWeight: '600',
        color: '#92400E'
      }}>
        ⚠️ Google Drive Setup Required
      </h3>
      <p style={{
        margin: '0 0 16px 0',
        fontSize: '16.1px',
        color: '#92400E'
      }}>
        To enable Google Drive sync, you need to set up Google API credentials:
      </p>
      <ol style={{
        margin: '0 0 16px 0',
        paddingLeft: '20px',
        fontSize: '16.1px',
        color: '#92400E'
      }}>
        <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" style={{ color: '#3B82F6' }}>Google Cloud Console</a></li>
        <li>Create a new project or select an existing one</li>
        <li>Enable the Google Drive API</li>
        <li>Create credentials (OAuth 2.0 Client ID)</li>
        <li>Add authorized JavaScript origins:
          <ul style={{ marginTop: '4px' }}>
            <li><code>http://localhost:5173</code> (for development)</li>
            <li>Your production URL (when deployed)</li>
          </ul>
        </li>
        <li>Copy your Client ID and API Key</li>
        <li>Update <code>src/services/googleDriveSync.ts</code>:
          <pre style={{
            backgroundColor: '#FEF9E7',
            padding: '8px',
            borderRadius: '4px',
            fontSize: '13.8px',
            marginTop: '8px',
            overflowX: 'auto'
          }}>
{`const CLIENT_ID = 'YOUR_CLIENT_ID_HERE';
const API_KEY = 'YOUR_API_KEY_HERE';`}
          </pre>
        </li>
      </ol>
      <p style={{
        margin: '0',
        fontSize: '13.8px',
        color: '#92400E',
        fontStyle: 'italic'
      }}>
        Note: For production use, store these credentials securely using environment variables.
      </p>
    </div>
  );
};