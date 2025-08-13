import { useState, useEffect, useRef, InputHTMLAttributes } from 'react';

interface AddressInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: string;
  onChange?: (value: string) => void;
  onAddressSelect?: (address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    fullAddress: string;
  }) => void;
}

// Hawaii ZIP codes by city/area
const HAWAII_LOCATIONS = [
  // Oahu
  { city: 'Honolulu', zipCodes: ['96813', '96814', '96815', '96816', '96817', '96818', '96819', '96820', '96821', '96822', '96823', '96824', '96825', '96826'] },
  { city: 'Pearl City', zipCodes: ['96782'] },
  { city: 'Aiea', zipCodes: ['96701'] },
  { city: 'Kapolei', zipCodes: ['96707'] },
  { city: 'Waipahu', zipCodes: ['96797'] },
  { city: 'Mililani', zipCodes: ['96789'] },
  { city: 'Kailua', zipCodes: ['96734'] },
  { city: 'Kaneohe', zipCodes: ['96744'] },
  { city: 'Ewa Beach', zipCodes: ['96706'] },
  { city: 'Wahiawa', zipCodes: ['96786'] },
  { city: 'Waianae', zipCodes: ['96792'] },
  
  // Big Island
  { city: 'Hilo', zipCodes: ['96720'] },
  { city: 'Kailua-Kona', zipCodes: ['96740', '96745'] },
  { city: 'Waimea', zipCodes: ['96743'] },
  { city: 'Pahoa', zipCodes: ['96778'] },
  
  // Maui
  { city: 'Kahului', zipCodes: ['96732'] },
  { city: 'Wailuku', zipCodes: ['96793'] },
  { city: 'Kihei', zipCodes: ['96753'] },
  { city: 'Lahaina', zipCodes: ['96761'] },
  
  // Kauai
  { city: 'Lihue', zipCodes: ['96766'] },
  { city: 'Kapaa', zipCodes: ['96746'] },
  { city: 'Princeville', zipCodes: ['96722'] },
  
  // Molokai
  { city: 'Kaunakakai', zipCodes: ['96748'] },
  
  // Lanai
  { city: 'Lanai City', zipCodes: ['96763'] },
];

// Common street types in Hawaii
const STREET_TYPES = ['St', 'Street', 'Ave', 'Avenue', 'Blvd', 'Boulevard', 'Dr', 'Drive', 'Rd', 'Road', 'Way', 'Pl', 'Place', 'Ln', 'Lane', 'Cir', 'Circle', 'Ct', 'Court'];

export const AddressInput = ({ value = '', onChange, onAddressSelect, ...props }: AddressInputProps) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [suggestions, setSuggestions] = useState<Array<{
    street: string;
    city: string;
    state: string;
    zipCode: string;
    fullAddress: string;
  }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const parseStreetAddress = (input: string): { streetNumber?: string; streetName?: string; streetType?: string } => {
    const parts = input.trim().split(/\s+/);
    
    // Check if first part is a number
    const streetNumber = /^\d+/.test(parts[0]) ? parts[0] : undefined;
    
    // Find street type
    let streetTypeIndex = -1;
    let streetType = '';
    
    for (let i = parts.length - 1; i >= (streetNumber ? 1 : 0); i--) {
      const part = parts[i];
      const matchedType = STREET_TYPES.find(type => 
        type.toLowerCase() === part.toLowerCase() || 
        type.toLowerCase().startsWith(part.toLowerCase()),
      );
      
      if (matchedType) {
        streetTypeIndex = i;
        streetType = matchedType;
        break;
      }
    }
    
    // Get street name
    const startIndex = streetNumber ? 1 : 0;
    const endIndex = streetTypeIndex > -1 ? streetTypeIndex : parts.length;
    const streetName = parts.slice(startIndex, endIndex).join(' ');
    
    return { streetNumber, streetName, streetType };
  };

  const generateSuggestions = (input: string) => {
    if (input.length < 3) {
      setSuggestions([]);
      return;
    }

    const { streetNumber, streetName, streetType } = parseStreetAddress(input);
    
    if (!streetNumber || !streetName) {
      setSuggestions([]);
      return;
    }

    // Generate suggestions for different Hawaii cities
    const newSuggestions = HAWAII_LOCATIONS.slice(0, 5).map(location => {
      const street = `${streetNumber} ${streetName}${streetType ? ' ' + streetType : ''}`;
      return {
        street,
        city: location.city,
        state: 'HI',
        zipCode: location.zipCodes[0],
        fullAddress: `${street}, ${location.city}, HI ${location.zipCodes[0]}`,
      };
    });

    setSuggestions(newSuggestions);
    setShowSuggestions(true);
    setSelectedIndex(-1);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setDisplayValue(input);
    
    if (onChange) {
      onChange(input);
    }
    
    generateSuggestions(input);
  };

  const handleSelectSuggestion = (suggestion: typeof suggestions[0]) => {
    setDisplayValue(suggestion.fullAddress);
    setShowSuggestions(false);
    
    if (onChange) {
      onChange(suggestion.fullAddress);
    }
    
    if (onAddressSelect) {
      onAddressSelect(suggestion);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
return;
}

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev,
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        {...props}
        type="text"
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={props.placeholder || '350 Ward Ave'}
        className={`appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${props.className || ''}`}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              className={`w-full text-left px-3 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none ${
                index === selectedIndex ? 'bg-gray-50' : ''
              }`}
              onClick={() => handleSelectSuggestion(suggestion)}
            >
              <div className="font-medium text-gray-900">{suggestion.street}</div>
              <div className="text-sm text-gray-500">
                {suggestion.city}, {suggestion.state} {suggestion.zipCode}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};