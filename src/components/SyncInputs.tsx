import React, { useState, useEffect } from 'react';

export const SyncInput = ({ value, onChange, onChangeValue, ...props }: any) => {
  const [local, setLocal] = useState(value ?? '');

  useEffect(() => {
    setLocal(value ?? '');
  }, [value]);

  const handleBlur = () => {
    if (local !== (value ?? '')) {
      if (onChangeValue) {
        onChangeValue(local);
      } else if (onChange) {
        onChange(local);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (local !== (value ?? '')) {
        if (onChangeValue) {
          onChangeValue(local);
        } else if (onChange) {
          onChange(local);
        }
      }
    }
  };

  return (
    <input 
      {...props} 
      value={local} 
      onChange={e => setLocal(e.target.value)} 
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  );
};

export const SyncTextarea = ({ value, onChange, onChangeValue, ...props }: any) => {
  const [local, setLocal] = useState(value ?? '');

  useEffect(() => {
    setLocal(value ?? '');
  }, [value]);

  const handleBlur = () => {
    if (local !== (value ?? '')) {
      if (onChangeValue) {
        onChangeValue(local);
      } else if (onChange) {
        onChange(local);
      }
    }
  };

  return (
    <textarea 
      {...props} 
      value={local} 
      onChange={e => setLocal(e.target.value)} 
      onBlur={handleBlur}
    />
  );
};
