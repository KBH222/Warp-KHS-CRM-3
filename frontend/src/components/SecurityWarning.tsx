export const SecurityWarning = () => {
  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#FEE2E2',
      border: '2px solid #DC2626',
      borderRadius: '8px',
      marginBottom: '20px'
    }}>
      <h3 style={{ 
        margin: '0 0 12px 0', 
        fontSize: '18.4px', 
        fontWeight: '600',
        color: '#991B1B'
      }}>
        ⛔ Critical Security Update Required
      </h3>
      <p style={{ 
        margin: '0 0 16px 0', 
        fontSize: '16.1px',
        color: '#991B1B'
      }}>
        Google Drive sync has been disabled due to critical security vulnerabilities:
      </p>
      <ul style={{ 
        margin: '0 0 16px 0', 
        paddingLeft: '20px',
        fontSize: '16.1px',
        color: '#991B1B'
      }}>
        <li>API credentials were exposed in frontend code</li>
        <li>Customer personal information was being synced unencrypted</li>
        <li>No privacy controls or audit logging in place</li>
      </ul>
      <p style={{ 
        margin: '0', 
        fontSize: '16.1px',
        color: '#991B1B',
        fontWeight: '600'
      }}>
        All customer data is now stored locally only. A secure sync solution is being developed.
      </p>
    </div>
  );
};