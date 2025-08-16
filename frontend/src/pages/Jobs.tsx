import { useState, useEffect } from 'react';
import { useIsOwner } from '../stores/auth.store';
import { BackButton } from '../components/BackButton';
import { useLocation } from 'react-router-dom';
import { ScrollablePageContainer } from '../components/ScrollablePageContainer';

// Jobs service for localStorage
const jobsService = {
  getAll: () => {
    const stored = localStorage.getItem('khs-crm-jobs');
    return stored ? JSON.parse(stored) : [];
  },
  save: (jobs) => {
    localStorage.setItem('khs-crm-jobs', JSON.stringify(jobs));
  }
};

const statusColors = {
  QUOTED: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Quoted' },
  SCHEDULED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Scheduled' },
  IN_PROGRESS: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'In Progress' },
  COMPLETED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' },
};

const Jobs = () => {
  const isOwner = useIsOwner();
  const location = useLocation();
  const [filter, setFilter] = useState('ALL');
  const [jobs, setJobs] = useState([]);
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [prefilledCustomer, setPrefilledCustomer] = useState(null);
  
  useEffect(() => {
    setJobs(jobsService.getAll());
    
    // Check if we came from a customer page with "Add Job"
    if (location.state?.customerId && location.state?.customerName) {
      setPrefilledCustomer({
        id: location.state.customerId,
        name: location.state.customerName
      });
      setShowNewJobModal(true);
    }
  }, [location.state]);
  
  const filteredJobs = jobs.filter(job => {
    if (filter === 'ALL') {
      return true;
    }
    return job.status === filter;
  });

  return (
    <ScrollablePageContainer>
      {/* Back Button */}
      <div className="mb-4">
        <BackButton />
      </div>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Jobs</h2>
        {isOwner && (
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Job
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 overflow-x-auto mb-4 -mx-4 px-4">
        {['ALL', 'QUOTED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-3 text-sm font-medium rounded-md whitespace-nowrap min-w-[80px] ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {status === 'ALL' ? 'All Jobs' : statusColors[status as keyof typeof statusColors]?.label || status}
          </button>
        ))}
      </div>

      {/* Jobs List */}
      <div className="space-y-3">
        {filteredJobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center text-gray-500">
            No jobs found.
          </div>
        ) : (
          filteredJobs.map((job) => {
            const status = statusColors[job.status as keyof typeof statusColors];
            return (
              <div key={job.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 active:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="text-base font-medium text-gray-900">{job.title}</h3>
                      <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{job.customer}</p>
                    <p className="mt-1 text-sm text-gray-500">{job.address}</p>
                    
                    <div className="mt-3 flex items-center text-sm text-gray-500">
                      <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(job.startDate).toLocaleDateString()} - {new Date(job.endDate).toLocaleDateString()}
                    </div>
                    
                    {job.assignedTo.length > 0 && (
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {job.assignedTo.join(', ')}
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4 flex-shrink-0 text-right">
                    <p className="text-lg font-medium text-gray-900">${job.totalCost.toLocaleString()}</p>
                    <button className="mt-2 text-sm text-blue-600 hover:text-blue-500">
                      View Details →
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </ScrollablePageContainer>
  );
};

export default Jobs;