import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Check, Search, X } from 'lucide-react';
import { cn } from '../lib/utils';

export interface SelectOption {
  value: string | number;
  label: string;
  sublabel?: string;
  badge?: string;
  badgeColor?: string;
  icon?: React.ReactNode;
}

interface GlassSelectProps {
  value: string | number;
  onChange: (value: any) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  dropdownClassName?: string;
  searchable?: boolean;
  allowCustomInput?: boolean;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  disabled?: boolean;
}

export const GlassSelect: React.FC<GlassSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Chọn...',
  className = '',
  dropdownClassName = '',
  searchable = false,
  allowCustomInput = false,
  size = 'md',
  icon,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Floating coordinates state
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; placeAbove: boolean }>({
    top: 0,
    left: 0,
    width: 200,
    placeAbove: false,
  });

  // Calculate dynamic floating position
  const updateCoords = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = 260; // Max expected height
    const spaceBelow = window.innerHeight - rect.bottom;
    const placeAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

    const width = Math.max(rect.width, 200);
    // Keep within screen edges
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
    const top = placeAbove ? rect.top - 6 : rect.bottom + 6;

    setCoords({
      top,
      left,
      width,
      placeAbove,
    });
  };

  useLayoutEffect(() => {
    if (isOpen) {
      updateCoords();
    }
  }, [isOpen]);

  // Update coords on window scroll / resize
  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = (e: Event) => {
      // Close if user scrolls outside dropdown, or update position
      if (dropdownRef.current && dropdownRef.current.contains(e.target as Node)) {
        return;
      }
      updateCoords();
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const isTrigger = triggerRef.current && triggerRef.current.contains(e.target as Node);
      const isDropdown = dropdownRef.current && dropdownRef.current.contains(e.target as Node);
      if (!isTrigger && !isDropdown) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const selectedOption = options.find(o => String(o.value) === String(value));

  // Display text
  const displayLabel = selectedOption
    ? selectedOption.label
    : (allowCustomInput && value ? String(value) : placeholder);

  // Filter options
  const filteredOptions = options.filter(o => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      o.label.toLowerCase().includes(q) ||
      (o.sublabel && o.sublabel.toLowerCase().includes(q))
    );
  });

  const handleSelect = (val: string | number) => {
    onChange(val);
    setIsOpen(false);
    setSearch('');
  };

  const handleCustomSubmit = () => {
    if (allowCustomInput && search.trim()) {
      onChange(search.trim());
      setIsOpen(false);
      setSearch('');
    }
  };

  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-xs rounded-xl gap-1.5',
    md: 'px-3.5 py-2 text-xs font-semibold rounded-xl gap-2',
    lg: 'px-4 py-2.5 text-sm font-bold rounded-2xl gap-2.5',
  };

  return (
    <div className={cn('relative inline-block w-full text-left', className)}>
      {/* Trigger Button */}
      <motion.button
        ref={triggerRef}
        type="button"
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        onClick={() => {
          if (!disabled) {
            updateCoords();
            setIsOpen(!isOpen);
          }
        }}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between transition-all duration-200 cursor-pointer select-none',
          'bg-[#0b1329]/90 backdrop-blur-md border border-white/15 hover:border-blue-400/40 hover:bg-white/10 text-slate-100 shadow-md',
          isOpen && 'ring-2 ring-blue-500/50 border-blue-400/60 bg-[#0f1b3a]',
          disabled && 'opacity-50 cursor-not-allowed',
          sizeClasses[size]
        )}
      >
        <div className="flex items-center gap-2 min-w-0 truncate">
          {icon && <span className="shrink-0 text-blue-400">{icon}</span>}
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          <span className={cn('truncate font-medium', !selectedOption && !value && 'text-slate-500')}>
            {displayLabel}
          </span>
          {selectedOption?.badge && (
            <span className={cn(
              'px-1.5 py-0.5 text-[10px] font-bold rounded-md shrink-0 border border-white/10',
              selectedOption.badgeColor || 'bg-blue-500/20 text-blue-300'
            )}>
              {selectedOption.badge}
            </span>
          )}
        </div>

        <ChevronDown
          className={cn(
            'w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200',
            isOpen && 'rotate-180 text-blue-400'
          )}
        />
      </motion.button>

      {/* Floating Dropdown Menu via React Portal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, scale: 0.95, y: coords.placeAbove ? 6 : -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: coords.placeAbove ? 6 : -6 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              style={{
                position: 'fixed',
                left: `${coords.left}px`,
                width: `${coords.width}px`,
                ...(coords.placeAbove
                  ? { bottom: `${window.innerHeight - coords.top}px` }
                  : { top: `${coords.top}px` }),
                zIndex: 99999,
              }}
              className={cn(
                'max-h-64 overflow-hidden flex flex-col',
                'bg-[#0a1226]/98 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.9)]',
                dropdownClassName
              )}
            >
              {/* Search Bar if enabled or > 6 items */}
              {(searchable || options.length > 6 || allowCustomInput) && (
                <div className="p-2 border-b border-white/10 shrink-0 bg-black/40 flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-slate-400 ml-1 shrink-0" />
                  <input
                    type="text"
                    placeholder={allowCustomInput ? 'Tìm hoặc nhập tên...' : 'Tìm kiếm...'}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCustomSubmit()}
                    className="w-full bg-transparent border-none text-xs text-white placeholder:text-slate-500 outline-none px-1 py-1"
                    autoFocus
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="p-1 text-slate-400 hover:text-white">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}

              {/* Custom input submit option */}
              {allowCustomInput && search.trim() && !options.some(o => o.label.toLowerCase() === search.trim().toLowerCase()) && (
                <button
                  type="button"
                  onClick={handleCustomSubmit}
                  className="px-3 py-2 text-xs font-bold text-blue-300 hover:bg-blue-500/20 text-left border-b border-white/10 flex items-center justify-between"
                >
                  <span>Nhập trực tiếp: "{search}"</span>
                  <span className="text-[10px] bg-blue-500/30 px-1.5 py-0.5 rounded">Bấm Enter</span>
                </button>
              )}

              {/* Options List */}
              <div className="overflow-y-auto flex-1 p-1 space-y-0.5 custom-scrollbar">
                {filteredOptions.length === 0 ? (
                  <div className="px-3 py-4 text-center text-xs text-slate-500 italic">
                    Không tìm thấy lựa chọn nào
                  </div>
                ) : (
                  filteredOptions.map((opt) => {
                    const isSelected = String(opt.value) === String(value);
                    return (
                      <motion.button
                        key={String(opt.value)}
                        type="button"
                        whileHover={{ x: 2 }}
                        onClick={() => handleSelect(opt.value)}
                        className={cn(
                          'w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors font-medium',
                          isSelected
                            ? 'bg-gradient-to-r from-blue-600/30 to-purple-600/30 text-white font-bold border border-blue-500/30 shadow-[0_0_12px_rgba(59,130,246,0.2)]'
                            : 'text-slate-300 hover:bg-white/10 hover:text-white'
                        )}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                          <div className="truncate">
                            <p className="truncate font-semibold">{opt.label}</p>
                            {opt.sublabel && <p className="text-[10px] text-slate-400 truncate">{opt.sublabel}</p>}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          {opt.badge && (
                            <span className={cn(
                              'px-1.5 py-0.5 text-[9px] font-bold rounded-md border border-white/10',
                              opt.badgeColor || 'bg-blue-500/20 text-blue-300'
                            )}>
                              {opt.badge}
                            </span>
                          )}
                          {isSelected && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                        </div>
                      </motion.button>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
