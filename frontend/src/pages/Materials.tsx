import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScrollablePageContainer } from '../components/ScrollablePageContainer';

const Materials = () => {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);
  const [groupedMaterials, setGroupedMaterials] = useState({});
  const [groupBy, setGroupBy] = useState('store'); // 'store' or 'job'
  const [selectedStore, setSelectedStore] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Load materials from all jobs
  useEffect(() => {
    const loadMaterialsFromJobs = () => {
      const allMaterials = [];
      
      // Get all jobs from localStorage
      const savedJobs = localStorage.getItem('khs-crm-jobs');
      const jobs = savedJobs ? JSON.parse(savedJobs) : [];
      
      // For each job, get its materials
      jobs.forEach(job => {
        const jobMaterials = localStorage.getItem(`job_materials_${job.id}`);
        if (jobMaterials) {
          const materials = JSON.parse(jobMaterials);
          materials.forEach(material => {
            allMaterials.push({
              ...material,
              jobId: job.id,
              jobTitle: job.title,
              customerName: job.customerName
            });
          });
        }
      });


      setMaterials(allMaterials);
    };

    loadMaterialsFromJobs();
  }, []);

  // Group materials whenever materials or groupBy changes
  useEffect(() => {
    const grouped = {};
    
    materials.forEach(material => {
      const key = groupBy === 'store' ? material.store : material.jobTitle;
      if (!grouped[key]) {
        grouped[key] = {
          items: [],
          total: 0,
          count: 0
        };
      }
      grouped[key].items.push(material);
      grouped[key].total += material.total;
      grouped[key].count += material.quantity;
    });

    setGroupedMaterials(grouped);
  }, [materials, groupBy]);

  // Filter materials based on search and selected store
  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStore = selectedStore === 'all' || material.store === selectedStore;
    return matchesSearch && matchesStore;
  });

  // Get unique stores
  const stores = [...new Set(materials.map(m => m.store))];

  // Calculate totals
  const totalCost = filteredMaterials.reduce((sum, m) => sum + m.total, 0);

  return (
    <ScrollablePageContainer customPaddingBottom={100}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
        marginBottom: '24px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate('/dashboard')}
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
            <h1 style={{ fontSize: '27.6px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
              Master Materials List
            </h1>
            <p style={{ color: '#6B7280', margin: 0 }}>
              All materials from all jobs in one place
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/jobs')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3B82F6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16.1px',
            fontWeight: '500'
          }}
        >
          View Jobs
        </button>
      </div>

      {/* Filters and Search */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: '1 1 300px' }}>
          <input
            type="text"
            placeholder="Search materials, jobs, or customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              fontSize: '16.1px'
            }}
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '16.1px', fontWeight: '500', color: '#374151' }}>
            Store:
          </label>
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              fontSize: '16.1px',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Stores</option>
            {stores.map(store => (
              <option key={store} value={store}>{store}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '16.1px', fontWeight: '500', color: '#374151' }}>
            Group by:
          </label>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              fontSize: '16.1px',
              cursor: 'pointer'
            }}
          >
            <option value="store">Store</option>
            <option value="job">Job</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #3B82F6'
        }}>
          <h3 style={{ fontSize: '16.1px', color: '#6B7280', margin: '0 0 8px 0', fontWeight: '500' }}>
            Total Materials
          </h3>
          <p style={{ fontSize: '32.2px', fontWeight: 'bold', margin: '0', color: '#111827' }}>
            {filteredMaterials.length}
          </p>
          <p style={{ fontSize: '13.8px', color: '#9CA3AF', marginTop: '4px' }}>
            Unique items
          </p>
        </div>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #10B981'
        }}>
          <h3 style={{ fontSize: '16.1px', color: '#6B7280', margin: '0 0 8px 0', fontWeight: '500' }}>
            Total Cost
          </h3>
          <p style={{ fontSize: '32.2px', fontWeight: 'bold', margin: '0', color: '#111827' }}>
            ${totalCost.toFixed(2)}
          </p>
          <p style={{ fontSize: '13.8px', color: '#9CA3AF', marginTop: '4px' }}>
            All materials
          </p>
        </div>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #8B5CF6'
        }}>
          <h3 style={{ fontSize: '16.1px', color: '#6B7280', margin: '0 0 8px 0', fontWeight: '500' }}>
            Stores
          </h3>
          <p style={{ fontSize: '32.2px', fontWeight: 'bold', margin: '0', color: '#111827' }}>
            {stores.length}
          </p>
          <p style={{ fontSize: '13.8px', color: '#9CA3AF', marginTop: '4px' }}>
            Different suppliers
          </p>
        </div>
      </div>

      {/* Grouped Materials */}
      {Object.entries(groupedMaterials).map(([groupName, groupData]) => (
        <div key={groupName} style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          marginBottom: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '16px',
            backgroundColor: '#F9FAFB',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h3 style={{ fontSize: '18.4px', fontWeight: '600', margin: '0', color: '#111827' }}>
                {groupName}
              </h3>
              <p style={{ fontSize: '16.1px', color: '#6B7280', margin: '4px 0 0 0' }}>
                {groupData.items.length} items • Total: ${groupData.total.toFixed(2)}
              </p>
            </div>
            {groupBy === 'job' && (
              <button
                onClick={() => {
                  const job = materials.find(m => m.jobTitle === groupName);
                  if (job && job.jobId) {
                    navigate(`/jobs/${job.jobId}`);
                  }
                }}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#E5E7EB',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13.8px'
                }}
              >
                View Job
              </button>
            )}
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13.8px', fontWeight: '600', color: '#6B7280' }}>
                  Material
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13.8px', fontWeight: '600', color: '#6B7280' }}>
                  Quantity
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13.8px', fontWeight: '600', color: '#6B7280' }}>
                  Unit
                </th>
                {groupBy === 'store' && (
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13.8px', fontWeight: '600', color: '#6B7280' }}>
                    Job
                  </th>
                )}
                {groupBy === 'job' && (
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13.8px', fontWeight: '600', color: '#6B7280' }}>
                    Store
                  </th>
                )}
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13.8px', fontWeight: '600', color: '#6B7280' }}>
                  Price/Unit
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13.8px', fontWeight: '600', color: '#6B7280' }}>
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {groupData.items
                .filter(material => {
                  const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                       material.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                       material.customerName.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchesStore = selectedStore === 'all' || material.store === selectedStore;
                  return matchesSearch && matchesStore;
                })
                .map((material, index) => (
                  <tr key={material.id} style={{ 
                    borderBottom: index < groupData.items.length - 1 ? '1px solid #F3F4F6' : 'none' 
                  }}>
                    <td style={{ padding: '16px', fontSize: '16.1px', color: '#111827' }}>
                      {material.name}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center', fontSize: '16.1px', color: '#374151' }}>
                      {material.quantity}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center', fontSize: '16.1px', color: '#374151' }}>
                      {material.unit}
                    </td>
                    {groupBy === 'store' && (
                      <td style={{ padding: '16px', fontSize: '16.1px', color: '#374151' }}>
                        <div>
                          <div style={{ fontWeight: '500' }}>{material.jobTitle}</div>
                          <div style={{ fontSize: '13.8px', color: '#6B7280' }}>{material.customerName}</div>
                        </div>
                      </td>
                    )}
                    {groupBy === 'job' && (
                      <td style={{ padding: '16px', textAlign: 'center', fontSize: '16.1px' }}>
                        <span style={{
                          padding: '4px 8px',
                          backgroundColor: material.store === 'Home Depot' ? '#FEF3C7' : material.store === 'Lowes' ? '#DBEAFE' : '#E5E7EB',
                          color: material.store === 'Home Depot' ? '#92400E' : material.store === 'Lowes' ? '#1E3A8A' : '#374151',
                          borderRadius: '4px',
                          fontSize: '13.8px',
                          fontWeight: '500'
                        }}>
                          {material.store}
                        </span>
                      </td>
                    )}
                    <td style={{ padding: '16px', textAlign: 'right', fontSize: '16.1px', color: '#374151' }}>
                      ${material.price.toFixed(2)}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right', fontSize: '16.1px', fontWeight: '600', color: '#111827' }}>
                      ${material.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ))}

      </div>
    </ScrollablePageContainer>
  );
};

export default Materials;