import { useState } from 'react';

interface SecurityOnboardingProps {
  onComplete: () => void;
}

export const SecurityOnboarding = ({ onComplete }: SecurityOnboardingProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [acceptedTerms, setAcceptedTerms] = useState({
    dataStorage: false,
    encryption: false,
    localSync: false,
    privacy: false,
  });

  const steps = [
    {
      title: 'Welcome to KHS CRM',
      icon: '🏠',
      content: (
        <>
          <p style={{ marginBottom: '16px' }}>
            KHS CRM is designed with your privacy and security in mind. Let's walk through 
            how your data is protected.
          </p>
          <div style={{
            padding: '16px',
            backgroundColor: '#EFF6FF',
            borderRadius: '8px',
            fontSize: '16.1px',
          }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#1E40AF' }}>
              Our Security Principles:
            </h4>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#1E40AF' }}>
              <li>Your data stays on your devices</li>
              <li>Customer information is never uploaded to the cloud</li>
              <li>You control what gets synced and how</li>
              <li>All sensitive data can be encrypted</li>
            </ul>
          </div>
        </>
      ),
    },
    {
      title: 'Data Storage',
      icon: '💾',
      content: (
        <>
          <p style={{ marginBottom: '16px' }}>
            All your CRM data is stored locally on this device. We classify data into 
            four security levels:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              padding: '12px',
              backgroundColor: '#FEE2E2',
              borderRadius: '6px',
              border: '1px solid #FCA5A5',
            }}>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '16.1px', color: '#991B1B' }}>
                🚫 Restricted (Never Syncs)
              </h4>
              <p style={{ margin: 0, fontSize: '14.95px', color: '#991B1B' }}>
                Customer names, addresses, phone numbers, and personal information
              </p>
            </div>
            
            <div style={{
              padding: '12px',
              backgroundColor: '#FEF3C7',
              borderRadius: '6px',
              border: '1px solid #F59E0B',
            }}>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '16.1px', color: '#92400E' }}>
                🔒 Confidential (Encrypted)
              </h4>
              <p style={{ margin: 0, fontSize: '14.95px', color: '#92400E' }}>
                Worker information, payroll data, sensitive notes
              </p>
            </div>
            
            <div style={{
              padding: '12px',
              backgroundColor: '#ECFDF5',
              borderRadius: '6px',
              border: '1px solid #10B981',
            }}>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '16.1px', color: '#064E3B' }}>
                📋 Internal (Can Sync)
              </h4>
              <p style={{ margin: 0, fontSize: '14.95px', color: '#064E3B' }}>
                Job details, schedules, project information
              </p>
            </div>
            
            <div style={{
              padding: '12px',
              backgroundColor: '#EFF6FF',
              borderRadius: '6px',
              border: '1px solid #3B82F6',
            }}>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '16.1px', color: '#1E40AF' }}>
                📢 Public (Free to Share)
              </h4>
              <p style={{ margin: 0, fontSize: '14.95px', color: '#1E40AF' }}>
                Material lists, general settings, app preferences
              </p>
            </div>
          </div>
          
          <label style={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: '8px',
            marginTop: '16px',
          }}>
            <input
              type="checkbox"
              checked={acceptedTerms.dataStorage}
              onChange={(e) => setAcceptedTerms(prev => ({ 
                ...prev, 
                dataStorage: e.target.checked 
              }))}
              style={{ marginTop: '2px' }}
            />
            <span style={{ fontSize: '13px' }}>
              I understand that customer data stays on this device only
            </span>
          </label>
        </>
      ),
    },
    {
      title: 'Encryption Options',
      icon: '🔐',
      content: (
        <>
          <p style={{ marginBottom: '16px' }}>
            You can enable encryption to protect sensitive data on your device. This adds 
            an extra layer of security for confidential information.
          </p>
          
          <div style={{
            padding: '16px',
            backgroundColor: '#F9FAFB',
            borderRadius: '8px',
            marginBottom: '16px',
          }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
              What gets encrypted:
            </h4>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px' }}>
              <li>Worker personal information</li>
              <li>Payroll and wage data</li>
              <li>Sensitive project notes</li>
              <li>Any data marked as confidential</li>
            </ul>
          </div>
          
          <div style={{
            padding: '12px',
            backgroundColor: '#FEF3C7',
            borderRadius: '6px',
            border: '1px solid #F59E0B',
            marginBottom: '16px',
          }}>
            <p style={{ margin: 0, fontSize: '14.95px', color: '#92400E' }}>
              <strong>Note:</strong> If you enable encryption, you'll need to create a 
              master password. This password cannot be recovered if forgotten.
            </p>
          </div>
          
          <label style={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: '8px',
          }}>
            <input
              type="checkbox"
              checked={acceptedTerms.encryption}
              onChange={(e) => setAcceptedTerms(prev => ({ 
                ...prev, 
                encryption: e.target.checked 
              }))}
              style={{ marginTop: '2px' }}
            />
            <span style={{ fontSize: '13px' }}>
              I understand encryption is optional but recommended for sensitive data
            </span>
          </label>
        </>
      ),
    },
    {
      title: 'Local Network Sync',
      icon: '📡',
      content: (
        <>
          <p style={{ marginBottom: '16px' }}>
            You can sync non-sensitive data between your devices on the same WiFi network. 
            This keeps your data private while allowing convenient access.
          </p>
          
          <div style={{
            padding: '16px',
            backgroundColor: '#F9FAFB',
            borderRadius: '8px',
            marginBottom: '16px',
          }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
              What can sync locally:
            </h4>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px' }}>
              <li>Job information and schedules</li>
              <li>Material lists and inventory</li>
              <li>General app settings</li>
              <li style={{ color: '#DC2626' }}>
                <strong>Never syncs:</strong> Customer personal information
              </li>
            </ul>
          </div>
          
          <div style={{
            padding: '12px',
            backgroundColor: '#ECFDF5',
            borderRadius: '6px',
            border: '1px solid #10B981',
            marginBottom: '16px',
          }}>
            <p style={{ margin: 0, fontSize: '14.95px', color: '#064E3B' }}>
              <strong>How it works:</strong> Devices find each other automatically on 
              your local network. No internet connection required.
            </p>
          </div>
          
          <label style={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: '8px',
          }}>
            <input
              type="checkbox"
              checked={acceptedTerms.localSync}
              onChange={(e) => setAcceptedTerms(prev => ({ 
                ...prev, 
                localSync: e.target.checked 
              }))}
              style={{ marginTop: '2px' }}
            />
            <span style={{ fontSize: '13px' }}>
              I understand local sync only works on my WiFi network
            </span>
          </label>
        </>
      ),
    },
    {
      title: 'Privacy Commitment',
      icon: '🛡️',
      content: (
        <>
          <p style={{ marginBottom: '16px' }}>
            Your privacy is our top priority. Here's our commitment to you:
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              padding: '12px',
              backgroundColor: '#F9FAFB',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
            }}>
              <span style={{ fontSize: '23px' }}>🏠</span>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '14px' }}>
                  Your Data, Your Control
                </h4>
                <p style={{ margin: 0, fontSize: '14.95px', color: '#6B7280' }}>
                  All data stays on your devices unless you explicitly choose to sync
                </p>
              </div>
            </div>
            
            <div style={{
              padding: '12px',
              backgroundColor: '#F9FAFB',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
            }}>
              <span style={{ fontSize: '23px' }}>🚫</span>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '14px' }}>
                  No Cloud Storage of PII
                </h4>
                <p style={{ margin: 0, fontSize: '14.95px', color: '#6B7280' }}>
                  Customer personal information never leaves your device
                </p>
              </div>
            </div>
            
            <div style={{
              padding: '12px',
              backgroundColor: '#F9FAFB',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
            }}>
              <span style={{ fontSize: '23px' }}>🔍</span>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '14px' }}>
                  Transparent Security
                </h4>
                <p style={{ margin: 0, fontSize: '14.95px', color: '#6B7280' }}>
                  All data access is logged and you can review the audit trail
                </p>
              </div>
            </div>
          </div>
          
          <label style={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: '8px',
            marginTop: '16px',
          }}>
            <input
              type="checkbox"
              checked={acceptedTerms.privacy}
              onChange={(e) => setAcceptedTerms(prev => ({ 
                ...prev, 
                privacy: e.target.checked 
              }))}
              style={{ marginTop: '2px' }}
            />
            <span style={{ fontSize: '13px' }}>
              I have read and understand the privacy commitment
            </span>
          </label>
        </>
      ),
    },
  ];

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const canProceed = currentStep === 0 || Object.values(acceptedTerms).some(v => v);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F3F4F6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '600px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        overflow: 'hidden',
      }}>
        {/* Progress bar */}
        <div style={{
          height: '4px',
          backgroundColor: '#E5E7EB',
          position: 'relative',
        }}>
          <div style={{
            height: '100%',
            backgroundColor: '#3B82F6',
            width: `${((currentStep + 1) / steps.length) * 100}%`,
            transition: 'width 0.3s ease',
          }} />
        </div>

        {/* Content */}
        <div style={{ padding: '32px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{
              fontSize: '55.2px',
              marginBottom: '16px',
            }}>
              {currentStepData.icon}
            </div>
            <h2 style={{ 
              margin: '0 0 8px 0', 
              fontSize: '27.6px', 
              fontWeight: '600',
            }}>
              {currentStepData.title}
            </h2>
            <p style={{ 
              margin: 0, 
              fontSize: '16.1px',
              color: '#6B7280',
            }}>
              Step {currentStep + 1} of {steps.length}
            </p>
          </div>

          <div style={{ minHeight: '300px' }}>
            {currentStepData.content}
          </div>

          {/* Navigation */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            gap: '12px',
            marginTop: '32px',
          }}>
            <button
              onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
              style={{
                padding: '10px 20px',
                backgroundColor: currentStep === 0 ? '#F3F4F6' : '#E5E7EB',
                color: currentStep === 0 ? '#9CA3AF' : '#374151',
                border: 'none',
                borderRadius: '6px',
                cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
                fontSize: '16.1px',
                fontWeight: '500',
              }}
            >
              Previous
            </button>

            <button
              onClick={() => {
                if (isLastStep) {
                  // Save that onboarding is complete
                  localStorage.setItem('khs-crm-security-onboarding', 'completed');
                  onComplete();
                } else {
                  setCurrentStep(prev => prev + 1);
                }
              }}
              disabled={!canProceed}
              style={{
                padding: '10px 20px',
                backgroundColor: canProceed ? '#3B82F6' : '#9CA3AF',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: canProceed ? 'pointer' : 'not-allowed',
                fontSize: '16.1px',
                fontWeight: '500',
                minWidth: '100px',
              }}
            >
              {isLastStep ? 'Get Started' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};