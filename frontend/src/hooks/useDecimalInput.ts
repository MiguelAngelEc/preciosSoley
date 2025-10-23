import { useState, useEffect } from 'react';

interface DecimalInputOptions {
  min?: number;
  max?: number;
  step?: number;
  decimals?: number;
  required?: boolean;
  allowZero?: boolean;
}

function useDecimalInput(
  initialValue: number | string | null | undefined,
  options: DecimalInputOptions = {}
) {
  const {
    min = 0,
    max,
    // step = 0.01,
    decimals = 2,
    required = false,
    allowZero = true
  } = options;

  const [value, setValue] = useState<string>(() => {
    if (initialValue == null) return '';
    const num = typeof initialValue === 'string' ? parseFloat(initialValue) : initialValue;
    return isNaN(num) ? '' : num.toFixed(decimals);
  });

  const [error, setError] = useState<string | null>(null);

  const numericValue = parseFloat(value) || 0;

  const isValid = !error;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setValue(inputValue);
    // Clear error on change
    if (error) setError(null);
  };

  const handleBlur = () => {
    let numValue = parseFloat(value);

    if (isNaN(numValue)) {
      if (required) {
        setError('This field is required');
      } else {
        setValue('');
      }
      return;
    }

    if (min !== undefined && numValue < min) {
      setError(`Value must be at least ${min}`);
      return;
    }

    if (max !== undefined && numValue > max) {
      setError(`Value must be at most ${max}`);
      return;
    }

    if (!allowZero && numValue === 0) {
      setError('Value cannot be zero');
      return;
    }

    // Format to specified decimals
    setValue(numValue.toFixed(decimals));
    setError(null);
  };

  const reset = (newValue: number) => {
    setValue(newValue.toFixed(decimals));
    setError(null);
  };

  useEffect(() => {
    if (initialValue != null) {
      const num = typeof initialValue === 'string' ? parseFloat(initialValue) : initialValue;
      if (!isNaN(num)) {
        setValue(num.toFixed(decimals));
      }
    }
  }, [initialValue, decimals]);

  return {
    value,
    numericValue,
    handleChange,
    handleBlur,
    error,
    isValid,
    reset
  };
}

export default useDecimalInput;