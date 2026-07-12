import { useState, useCallback } from 'react';

interface NumberInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  min?: number;
  max?: number;
}

function isInvalid(v: string, min?: number, max?: number): boolean {
  if (!v.trim()) return false;
  const n = parseFloat(v.replace(/,/g, '.'));
  if (isNaN(n)) return true;
  if (min !== undefined && n < min) return true;
  if (max !== undefined && n > max) return true;
  return false;
}

export function NumberInput({ id, value, onChange, placeholder, className = '', min, max }: NumberInputProps) {
  const [invalid, setInvalid] = useState(false);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  const handleBlur = useCallback(() => {
    setInvalid(isInvalid(value, min, max));
  }, [value, min, max]);

  const handleFocus = useCallback(() => {
    setInvalid(false);
  }, []);

  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      placeholder={placeholder ? `${placeholder}…` : undefined}
      aria-invalid={invalid}
      className={`input-dark ${invalid ? 'border-danger' : ''} ${className}`}
      spellCheck={false}
    />
  );
}