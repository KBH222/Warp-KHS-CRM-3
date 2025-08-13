import { useState } from 'react';

interface DebugPhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  id?: string;
}

export const DebugPhoneInput = ({ 
  value = '', 
  onChange, 
  className = '',
  id, 
}: DebugPhoneInputProps) => {
  const [localValue, setLocalValue] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    console.log('Input received:', input);
    
    // Get only numbers
    const numbers = input.replace(/\D/g, '');
    console.log('Numbers only:', numbers);
    
    // Format the display
    let formatted = '';
    if (numbers.length > 0) {
      if (numbers.length <= 3) {
        formatted = `(${numbers}`;
      } else if (numbers.length <= 6) {
        formatted = `(${numbers.slice(0,3)}) ${numbers.slice(3)}`;
      } else {
        formatted = `(${numbers.slice(0,3)}) ${numbers.slice(3,6)}-${numbers.slice(6,10)}`;
      }
    }
    
    console.log('Formatted:', formatted);
    setLocalValue(formatted);
    
    if (onChange) {
      onChange(numbers);
    }
  };

  return (
    <div>
      <input
        id={id}
        type="tel"
        value={localValue || value}
        onChange={handleChange}
        placeholder="(808) 789-7845"
        className={`appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${className}`}
      />
      <div className="mt-2 text-xs text-gray-500">
        <p>Debug Info:</p>
        <p>Current value: {localValue}</p>
        <p>Raw numbers: {localValue.replace(/\D/g, '')}</p>
      </div>
    </div>
  );
};