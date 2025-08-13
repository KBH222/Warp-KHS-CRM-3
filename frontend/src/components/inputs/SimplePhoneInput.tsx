import { useState, useEffect } from 'react';

interface SimplePhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  placeholder?: string;
  id?: string;
}

export const SimplePhoneInput = ({ 
  value = '', 
  onChange, 
  className = '', 
  placeholder = '(808) 789-7845',
  id, 
}: SimplePhoneInputProps) => {
  const [displayValue, setDisplayValue] = useState('');

  // Format phone number
  const formatPhone = (input: string) => {
    // Remove all non-digits
    const numbers = input.replace(/\D/g, '');
    
    // Apply formatting based on length
    if (numbers.length === 0) {
return '';
}
    if (numbers.length <= 3) {
return `(${numbers}`;
}
    if (numbers.length <= 6) {
return `(${numbers.slice(0,3)}) ${numbers.slice(3)}`;
}
    if (numbers.length <= 10) {
return `(${numbers.slice(0,3)}) ${numbers.slice(3,6)}-${numbers.slice(6)}`;
}
    
    // Don't allow more than 10 digits
    return `(${numbers.slice(0,3)}) ${numbers.slice(3,6)}-${numbers.slice(6,10)}`;
  };

  // Initialize with formatted value
  useEffect(() => {
    setDisplayValue(formatPhone(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    
    // Get only the numbers from input
    const numbersOnly = input.replace(/\D/g, '');
    
    // Don't allow more than 10 digits
    if (numbersOnly.length > 10) {
return;
}
    
    // Format and display
    const formatted = formatPhone(numbersOnly);
    setDisplayValue(formatted);
    
    // Send raw numbers to parent
    if (onChange) {
      onChange(numbersOnly);
    }
  };

  return (
    <input
      id={id}
      type="tel"
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={`appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${className}`}
    />
  );
};