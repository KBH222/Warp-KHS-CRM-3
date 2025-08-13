import { useState, useEffect } from 'react';
import { calendarJobStorage, customerStorage } from '../utils/localStorage';

const Reports = () => {
  const [jobs, setJobs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [timeRange, setTimeRange] = useState('month'); // week, month, quarter, year
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1); // Start of current month
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    date.setDate(0); // End of current month
    return date.toISOString().split('T')[0];
  });

  useEffect(() => {
    setJobs(calendarJobStorage.getAll());
    setCustomers(customerStorage.getAll());
  }, []);

  useEffect(() => {
    // Update date range based on selected time range
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (timeRange) {
      case 'week':
        start.setDate(today.getDate() - today.getDay());
        end.setDate(start.getDate() + 6);
        break;
      case 'month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'quarter':
        const quarter = Math.floor(today.getMonth() / 3);
        start = new Date(today.getFullYear(), quarter * 3, 1);
        end = new Date(today.getFullYear(), quarter * 3 + 3, 0);
        break;
      case 'year':
        start = new Date(today.getFullYear(), 0, 1);
        end = new Date(today.getFullYear(), 11, 31);
        break;
      case 'custom':
        return; // Don't update dates for custom range
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  }, [timeRange]);

  // Filter jobs by date range
  const filteredJobs = jobs.filter(job => {
    const jobDate = new Date(job.startDate);
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return jobDate >= start && jobDate <= end;
  });

  // Calculate statistics
  const stats = {
    totalJobs: filteredJobs.length,
    completedJobs: filteredJobs.filter(j => j.status === 'completed').length,
    inProgressJobs: filteredJobs.filter(j => j.status === 'in-progress').length,
    pendingJobs: filteredJobs.filter(j => j.status === 'pending' || !j.status).length,
    totalRevenue: filteredJobs.reduce((sum, job) => sum + (job.price || 0), 0),
    avgJobValue: filteredJobs.length > 0 ? 
      filteredJobs.reduce((sum, job) => sum + (job.price || 0), 0) / filteredJobs.length : 0,
    totalCustomers: new Set(filteredJobs.map(j => j.customerId)).size,
    jobsByWorker: {},
    jobsByCustomer: {},
    jobsByMonth: {}
  };

  // Calculate jobs by worker
  filteredJobs.forEach(job => {
    (job.workers || []).forEach(worker => {
      if (!stats.jobsByWorker[worker]) {
        stats.jobsByWorker[worker] = 0;
      }
      stats.jobsByWorker[worker]++;
    });
  });

  // Calculate jobs by customer
  filteredJobs.forEach(job => {
    const customerName = job.customerName || 'Unknown';
    if (!stats.jobsByCustomer[customerName]) {
      stats.jobsByCustomer[customerName] = 0;
    }
    stats.jobsByCustomer[customerName]++;
  });

  // Calculate jobs by month
  filteredJobs.forEach(job => {
    const date = new Date(job.startDate);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!stats.jobsByMonth[monthKey]) {
      stats.jobsByMonth[monthKey] = 0;
    }
    stats.jobsByMonth[monthKey]++;
  });

  const StatCard = ({ title, value, subtitle, color = '#3B82F6' }) => (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      borderLeft: `4px solid ${color}`
    }}>
      <h3 style={{ 
        fontSize: '14px', 
        color: '#6B7280', 
        margin: '0 0 8px 0',
        fontWeight: '500'
      }}>
        {title}
      </h3>
      <p style={{ 
        fontSize: '28px', 
        fontWeight: 'bold', 
        margin: '0 0 4px 0',
        color: '#111827'
      }}>
        {value}
      </p>
      {subtitle && (
        <p style={{ 
          fontSize: '12px', 
          color: '#9CA3AF', 
          margin: 0 
        }}>
          {subtitle}
        </p>
      )}
    </div>
  );

  const timeRangeOptions = [
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => window.history.back()}
            style={{
              background: 'none',
              border: 'none',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: '#6B7280',
              borderRadius: '6px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <svg style={{ width: '28px', height: '28px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
              Reports & Analytics
            </h1>
            <p style={{ color: '#6B7280', margin: 0 }}>
              Track your business performance and insights
            </p>
          </div>
        </div>
      </div>

      {/* Date Range Selector */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap'
      }}>
        <label style={{ fontWeight: '500', color: '#374151' }}>
          Time Range:
        </label>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          {timeRangeOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {timeRange === 'custom' && (
          <>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
            <span style={{ color: '#6B7280' }}>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </>
        )}
        
        <span style={{ 
          marginLeft: 'auto', 
          fontSize: '14px', 
          color: '#6B7280' 
        }}>
          {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
        </span>
      </div>

      {/* Summary Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <StatCard
          title="Total Jobs"
          value={stats.totalJobs}
          subtitle={`${stats.completedJobs} completed`}
          color="#3B82F6"
        />
        <StatCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          subtitle={`Avg: $${Math.round(stats.avgJobValue).toLocaleString()}`}
          color="#10B981"
        />
        <StatCard
          title="Active Customers"
          value={stats.totalCustomers}
          subtitle="Unique customers"
          color="#8B5CF6"
        />
        <StatCard
          title="Completion Rate"
          value={`${stats.totalJobs > 0 ? Math.round((stats.completedJobs / stats.totalJobs) * 100) : 0}%`}
          subtitle={`${stats.inProgressJobs} in progress`}
          color="#F59E0B"
        />
      </div>

      {/* Job Status Breakdown */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
          Job Status Breakdown
        </h2>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '14px', color: '#374151' }}>Completed</span>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>{stats.completedJobs}</span>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#E5E7EB',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${stats.totalJobs > 0 ? (stats.completedJobs / stats.totalJobs) * 100 : 0}%`,
                  height: '100%',
                  backgroundColor: '#10B981',
                  transition: 'width 0.3s'
                }} />
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '14px', color: '#374151' }}>In Progress</span>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>{stats.inProgressJobs}</span>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#E5E7EB',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${stats.totalJobs > 0 ? (stats.inProgressJobs / stats.totalJobs) * 100 : 0}%`,
                  height: '100%',
                  backgroundColor: '#3B82F6',
                  transition: 'width 0.3s'
                }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '14px', color: '#374151' }}>Pending</span>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>{stats.pendingJobs}</span>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#E5E7EB',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${stats.totalJobs > 0 ? (stats.pendingJobs / stats.totalJobs) * 100 : 0}%`,
                  height: '100%',
                  backgroundColor: '#F59E0B',
                  transition: 'width 0.3s'
                }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Jobs by Worker */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '24px'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
            Jobs by Worker
          </h2>
          {Object.keys(stats.jobsByWorker).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.entries(stats.jobsByWorker)
                .sort(([,a], [,b]) => b - a)
                .map(([worker, count]) => (
                  <div key={worker} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: '1px solid #F3F4F6'
                  }}>
                    <span style={{ fontSize: '14px', color: '#374151' }}>{worker}</span>
                    <span style={{ 
                      fontSize: '14px', 
                      fontWeight: '600',
                      backgroundColor: '#E0E7FF',
                      color: '#3730A3',
                      padding: '2px 8px',
                      borderRadius: '12px'
                    }}>
                      {count}
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <p style={{ color: '#9CA3AF', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
              No worker data available
            </p>
          )}
        </div>

        {/* Top Customers */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
            Top Customers
          </h2>
          {Object.keys(stats.jobsByCustomer).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.entries(stats.jobsByCustomer)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([customer, count]) => (
                  <div key={customer} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: '1px solid #F3F4F6'
                  }}>
                    <span style={{ 
                      fontSize: '14px', 
                      color: '#374151',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '70%'
                    }}>
                      {customer}
                    </span>
                    <span style={{ 
                      fontSize: '14px', 
                      fontWeight: '600',
                      backgroundColor: '#D1FAE5',
                      color: '#065F46',
                      padding: '2px 8px',
                      borderRadius: '12px'
                    }}>
                      {count} jobs
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <p style={{ color: '#9CA3AF', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
              No customer data available
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;