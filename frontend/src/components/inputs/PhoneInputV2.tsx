import { useState, useEffect, useRef, InputHTMLAttributes } from 'react';

interface PhoneInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: string;
  onChange?: (value: string) => void;
}

export const PhoneInputV2 = ({ value = '', onChange, ...props }: PhoneInputProps) => {
  const [displayValue, setDisplayValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const lastCursorPos = useRef(0);

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
return `(${trimmed}`;
}
    if (trimmed.length <= 6) {
return `(${trimmed.slice(0, 3)}) ${trimmed.slice(3)}`;
}
    if (trimmed.length <= 10) {
return `(${trimmed.slice(0, 3)}) ${trimmed.slice(3, 6)}-${trimmed.slice(6)}`;
}
    return trimmed;
  };

  // Get cursor position after formatting
  const getCursorPosition = (oldValue: string, newValue: string, oldPos: number): number => {
    // Count digits before cursor in old value
    const digitsBeforeCursor = oldValue.slice(0, oldPos).replace(/\D/g, '').length;
    
    // Find position in new value with same number of digits
    let newPos = 0;
    let digitCount = 0;
    
    for (let i = 0; i < newValue.length; i++) {
      if (/\d/.test(newValue[i])) {
        digitCount++;
      }
      newPos = i + 1;
      if (digitCount === digitsBeforeCursor) {
        break;
      }
    }
    
    return newPos;
  };

  // Update display value when value prop changes
  useEffect(() => {
    const formatted = formatPhoneNumber(value);
    setDisplayValue(formatted);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    const oldValue = displayValue;
    
    // Only allow digits and formatting characters
    const cleaned = input.replace(/[^\d()-\s]/g, '');
    
    // Get just the digits
    const digits = cleaned.replace(/\D/g, '');
    
    // Format the number
    const formatted = formatPhoneNumber(digits);
    setDisplayValue(formatted);
    
    // Update cursor position after React renders
    setTimeout(() => {
      if (inputRef.current) {
        const newPos = getCursorPosition(oldValue, formatted, cursorPos);
        inputRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
    
    // Call onChange with raw digits
    if (onChange) {
      onChange(digits);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const cursorPos = e.currentTarget.selectionStart || 0;
    
    // Store cursor position for backspace handling
    if (e.key === 'Backspace') {
      lastCursorPos.current = cursorPos;
    }
  };

  return (
    <input
      ref={inputRef}
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