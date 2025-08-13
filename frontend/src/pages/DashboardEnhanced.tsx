import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

const DashboardEnhanced = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  const navigationCards = [
    {
      title: 'Customers',
      description: 'View and manage customer information',
      icon: '👥',
      path: '/customers',
      color: '#3B82F6'
    },
    {
      title: 'Schedule',
      description: 'View calendar and timeline of all jobs',
      icon: '📅',
      path: '/schedule',
      color: '#10B981'
    },
    {
      title: 'Workers',
      description: 'Manage team assignments and schedules',
      icon: '👷',
      path: '/workers',
      color: '#F59E0B'
    },
    {
      title: 'Materials',
      description: 'Master list from all jobs',
      icon: '📦',
      path: '/materials',
      color: '#8B5CF6'
    },
    {
      title: 'Profile',
      description: 'Account settings and preferences',
      icon: '⚙️',
      path: '/profile',
      color: '#6B7280'
    },
    {
      title: 'Security',
      description: 'Privacy and security settings',
      icon: '🔒',
      path: '/security',
      color: '#DC2626'
    },
  ];

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const formatDateTime = () => {
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    const date = currentTime.toLocaleDateString('en-US', options);
    const time = currentTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
    return { date, time };
  };

  return (
    <div style={{ 
      height: '100%',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
      paddingBottom: '100px' // Extra padding for iOS scrolling
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        {/* Header Section */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            color: '#111827',
            marginBottom: '4px'
          }}>
            {formatDateTime().date}
          </div>
          <div style={{ 
            fontSize: '20px', 
            color: '#3B82F6',
            fontFamily: 'monospace'
          }}>
            {formatDateTime().time}
          </div>
        </div>

        {/* Navigation Cards */}
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: '#374151' }}>
          Quick Access
        </h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px'
        }}>
          {navigationCards.map((card) => (
          <div
            key={card.path}
            onClick={() => navigate(card.path)}
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              cursor: 'pointer',
              overflow: 'hidden',
              transition: 'transform 0.2s, box-shadow 0.2s',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            }}
          >
            {/* Colored header bar */}
            <div style={{ 
              height: '4px', 
              backgroundColor: card.color 
            }} />
            
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'start', marginBottom: '12px' }}>
                <span style={{ fontSize: '32px', marginRight: '12px' }}>{card.icon}</span>
                <div style={{ flex: 1 }}>
                  <h3 style={{ 
                    fontSize: '18px', 
                    fontWeight: '600', 
                    color: '#111827',
                    marginBottom: '4px'
                  }}>
                    {card.title}
                  </h3>
                  <p style={{ 
                    fontSize: '14px', 
                    color: '#6B7280',
                    lineHeight: '1.4'
                  }}>
                    {card.description}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Arrow indicator */}
            <div style={{
              position: 'absolute',
              right: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9CA3AF'
            }}>
              →
            </div>
          </div>
        ))}
      </div>


        {/* Quick Actions */}
        <div style={{ 
          marginTop: '40px',
          display: 'flex',
          gap: '12px',
          justifyContent: 'center'
        }}>
          <button
            onClick={() => navigate('/customers')}
            style={{
              backgroundColor: '#3B82F6',
              color: 'white',
              padding: '12px 20px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            + New Customer
          </button>
          <button
            onClick={() => navigate('/schedule')}
            style={{
              backgroundColor: '#10B981',
              color: 'white',
              padding: '12px 20px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            + New Job
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardEnhanced;