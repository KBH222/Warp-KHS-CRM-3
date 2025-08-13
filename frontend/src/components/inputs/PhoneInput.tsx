import { useState, useEffect, InputHTMLAttributes } from 'react';

interface PhoneInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: string;
  onChange?: (value: string) => void;
}

export const PhoneInput = ({ value = '', onChange, ...props }: PhoneInputProps) => {
  const [displayValue, setDisplayValue] = useState('');

  // Format phone number for display
  const formatPhoneNumber = (input: string): string => {
    // Remove all non-digits
    const digits = input.replace(/\D/g, '');
    
    // Limit to 10 digits
    const trimmed = digits.slice(0, 10);
    
    // Format based on length
    if (trimmed.length === 0) {
return '';
}
    if (trimmed.length <= 3) {
return trimmed;
}
    if (trimmed.length <= 6) {
return `(${trimmed.slice(0, 3)}) ${trimmed.slice(3)}`;
}
    return `(${trimmed.slice(0, 3)}) ${trimmed.slice(3, 6)}-${trimmed.slice(6)}`;
  };

  // Extract raw digits from formatted phone number
  const extractDigits = (formatted: string): string => {
    return formatted.replace(/\D/g, '');
  };

  // Update display value when value prop changes
  useEffect(() => {
    setDisplayValue(formatPhoneNumber(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const formatted = formatPhoneNumber(input);
    setDisplayValue(formatted);
    
    // Call onChange with raw digits
    if (onChange) {
      onChange(extractDigits(formatted));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow backspace to work naturally
    if (e.key === 'Backspace' && displayValue.length > 0) {
      const cursorPos = e.currentTarget.selectionStart || 0;
      
      // If cursor is right after a formatting character, move it back
      if (displayValue[cursorPos - 1] === ' ' || displayValue[cursorPos - 1] === '-' || displayValue[cursorPos - 1] === ')') {
        e.currentTarget.setSelectionRange(cursorPos - 1, cursorPos - 1);
      }
    }
  };

  return (
    <input
      {...props}
      type="tel"
      value={displayValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={props.placeholder || '(808) 789-7845'}
      className={`appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${props.className || ''}`}
    />
  );
};