import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { calendarJobStorage } from '../utils/localStorage';

const JobPhotos = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [photos, setPhotos] = useState({
    before: [],
    during: [],
    after: []
  });
  const [activeTab, setActiveTab] = useState('before');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState('before');

  useEffect(() => {
    // Load job details
    const allJobs = calendarJobStorage.getAll();
    const foundJob = allJobs.find(j => j.id === id);
    if (foundJob) {
      setJob(foundJob);
      // Load photos from localStorage
      const savedPhotos = localStorage.getItem(`job_photos_${id}`);
      if (savedPhotos) {
        setPhotos(JSON.parse(savedPhotos));
      }
    }
  }, [id]);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newPhotos = [];

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const photo = {
          id: Date.now() + Math.random(),
          url: event.target.result,
          name: file.name,
          uploadDate: new Date().toISOString(),
          type: uploadType
        };
        newPhotos.push(photo);
        
        if (newPhotos.length === files.length) {
          const updatedPhotos = {
            ...photos,
            [uploadType]: [...photos[uploadType], ...newPhotos]
          };
          setPhotos(updatedPhotos);
          // Save to localStorage
          localStorage.setItem(`job_photos_${id}`, JSON.stringify(updatedPhotos));
          setShowUploadModal(false);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDeletePhoto = (type, photoId) => {
    if (confirm('Are you sure you want to delete this photo?')) {
      const updatedPhotos = {
        ...photos,
        [type]: photos[type].filter(p => p.id !== photoId)
      };
      setPhotos(updatedPhotos);
      localStorage.setItem(`job_photos_${id}`, JSON.stringify(updatedPhotos));
    }
  };

  if (!job) {
    return <div style={{ padding: '20px' }}>Loading...</div>;
  }

  const tabs = [
    { id: 'before', label: 'Before', count: photos.before.length },
    { id: 'during', label: 'During', count: photos.during.length },
    { id: 'after', label: 'After', count: photos.after.length }
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => navigate('/schedule')}
          style={{
            marginBottom: '15px',
            padding: '8px 16px',
            backgroundColor: '#E5E7EB',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          ← Back to Schedule
        </button>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
              Job Photos
            </h1>
            <p style={{ color: '#6B7280', margin: 0 }}>
              {job.title} - {job.customerName}
            </p>
          </div>
          <button
            onClick={() => {
              setUploadType(activeTab);
              setShowUploadModal(true);
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            + Upload Photos
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '2px',
        backgroundColor: '#E5E7EB',
        padding: '2px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '10px 16px',
              backgroundColor: activeTab === tab.id ? 'white' : 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === tab.id ? '600' : '400',
              color: activeTab === tab.id ? '#111827' : '#6B7280',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span style={{
                backgroundColor: activeTab === tab.id ? '#3B82F6' : '#9CA3AF',
                color: 'white',
                borderRadius: '12px',
                padding: '2px 8px',
                fontSize: '12px',
                fontWeight: '500'
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Photo Grid */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        {photos[activeTab].length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#9CA3AF'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📷</div>
            <p style={{ fontSize: '16px', margin: '0 0 8px 0' }}>
              No {activeTab} photos yet
            </p>
            <p style={{ fontSize: '14px', margin: 0 }}>
              Click "Upload Photos" to add some
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '16px'
          }}>
            {photos[activeTab].map(photo => (
              <div
                key={photo.id}
                style={{
                  position: 'relative',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '1px solid #E5E7EB',
                  backgroundColor: '#F9FAFB'
                }}
              >
                <img
                  src={photo.url}
                  alt={photo.name}
                  style={{
                    width: '100%',
                    height: '200px',
                    objectFit: 'cover',
                    cursor: 'pointer'
                  }}
                  onClick={() => window.open(photo.url, '_blank')}
                />
                <div style={{
                  padding: '12px',
                  borderTop: '1px solid #E5E7EB'
                }}>
                  <p style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    margin: '0 0 4px 0',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {photo.name}
                  </p>
                  <p style={{
                    fontSize: '12px',
                    color: '#6B7280',
                    margin: 0
                  }}>
                    {new Date(photo.uploadDate).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDeletePhoto(activeTab, photo.id)}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '32px',
                    height: '32px',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px'
                  }}
                  title="Delete photo"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>
              Upload {uploadType.charAt(0).toUpperCase() + uploadType.slice(1)} Photos
            </h2>
            
            <div style={{
              border: '2px dashed #E5E7EB',
              borderRadius: '8px',
              padding: '40px',
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              <input
                type="file"
                id="photo-upload"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <label
                htmlFor="photo-upload"
                style={{
                  cursor: 'pointer',
                  display: 'block'
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📁</div>
                <p style={{
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#3B82F6',
                  margin: '0 0 8px 0'
                }}>
                  Click to select photos
                </p>
                <p style={{
                  fontSize: '14px',
                  color: '#6B7280',
                  margin: 0
                }}>
                  or drag and drop them here
                </p>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowUploadModal(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#E5E7EB',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobPhotos;