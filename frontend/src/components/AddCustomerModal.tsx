import { useState } from 'react';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
  }) => void;
}

export const AddCustomerModal = ({ isOpen, onClose, onAdd }: AddCustomerModalProps) => {
  // Prevent any state changes if not open
  if (!isOpen) return null;
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');

  // Mock address database for auto-completion
  const addressDatabase: Record<string, { city: string; state: string; zip: string }> = {
    '123 main st': { city: 'Springfield', state: 'IL', zip: '62701' },
    '456 oak ave': { city: 'Springfield', state: 'IL', zip: '62702' },
    '789 elm street': { city: 'Springfield', state: 'IL', zip: '62703' },
    '321 maple drive': { city: 'Springfield', state: 'IL', zip: '62704' },
    '654 pine road': { city: 'Chicago', state: 'IL', zip: '60601' },
    '987 cedar lane': { city: 'Chicago', state: 'IL', zip: '60602' },
    '111 walnut way': { city: 'Bloomington', state: 'IL', zip: '61701' },
    '222 birch boulevard': { city: 'Champaign', state: 'IL', zip: '61820' },
    '333 oak street': { city: 'Peoria', state: 'IL', zip: '61602' },
    '444 main street': { city: 'Rockford', state: 'IL', zip: '61101' },
    '555 washington ave': { city: 'Springfield', state: 'IL', zip: '62701' },
    '666 lincoln road': { city: 'Springfield', state: 'IL', zip: '62702' },
    '777 jefferson st': { city: 'Chicago', state: 'IL', zip: '60603' },
    '888 adams drive': { city: 'Chicago', state: 'IL', zip: '60604' },
    '999 madison avenue': { city: 'Chicago', state: 'IL', zip: '60605' },
  };

  const formatPhoneNumber = (value: string) => {
    const phoneNumber = value.replace(/\D/g, '');
    if (phoneNumber.length === 0) return '';
    if (phoneNumber.length <= 3) return `(${phoneNumber}`;
    if (phoneNumber.length <= 6) return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    if (formatted.length <= 14) {
      setPhone(formatted);
    }
  };

  const handleStreetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setStreet(value);
    
    // Check if the street matches any in our database (case-insensitive)
    const normalizedStreet = value.toLowerCase().trim();
    const addressInfo = addressDatabase[normalizedStreet];
    
    if (addressInfo) {
      setCity(addressInfo.city);
      setState(addressInfo.state);
      setZip(addressInfo.zip);
    }
  };

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 5) {
      setZip(value);
      
      const zipData: Record<string, { city: string; state: string }> = {
        '62701': { city: 'Springfield', state: 'IL' },
        '62702': { city: 'Springfield', state: 'IL' },
        '62703': { city: 'Springfield', state: 'IL' },
        '62704': { city: 'Springfield', state: 'IL' },
        '60601': { city: 'Chicago', state: 'IL' },
        '60602': { city: 'Chicago', state: 'IL' },
        '61701': { city: 'Bloomington', state: 'IL' },
        '61820': { city: 'Champaign', state: 'IL' },
      };

      if (value.length === 5 && zipData[value]) {
        setCity(zipData[value].city);
        setState(zipData[value].state);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const fullAddress = `${street}, ${city}, ${state} ${zip}`;
    onAdd({ name, email, phone, address: fullAddress });
    
    // Reset form
    setName('');
    setEmail('');
    setPhone('');
    setStreet('');
    setCity('');
    setState('');
    setZip('');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Backdrop */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)'
        }}
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div style={{
        position: 'relative',
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '448px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        margin: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
            <h2 className="text-xl font-bold mb-4">Add New Customer</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="(555) 123-4567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address *
                </label>
                <p className="text-xs text-gray-500 mb-1">Try: 123 Main St, 456 Oak Ave, 654 Pine Road</p>
                <input
                  type="text"
                  value={street}
                  onChange={handleStreetChange}
                  placeholder="e.g., 123 Main St"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zip *
                  </label>
                  <input
                    type="text"
                    value={zip}
                    onChange={handleZipChange}
                    placeholder="62701"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value.toUpperCase())}
                    maxLength={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 active:bg-blue-800"
                >
                  Add Customer
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 active:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </form>
      </div>
    </div>
  );
};