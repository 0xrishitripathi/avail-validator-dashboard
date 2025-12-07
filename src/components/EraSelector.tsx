'use client';

import { ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface EraSelectorProps {
  currentEra: number;
  selectedEra: number;
  onEraChange: (era: number) => void;
  loading: boolean;
}

export function EraSelector({ currentEra, selectedEra, onEraChange, loading }: EraSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Show last 84 eras (currentEra down to currentEra - 83)
  const eras = Array.from({ length: Math.min(84, currentEra + 1) }, (_, i) => currentEra - i);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg hover:border-[#3a3a3a] transition-colors disabled:opacity-50"
      >
        <span className="text-xs sm:text-sm text-gray-400">Era:</span>
        <span className="text-xs sm:text-sm font-medium text-white">{selectedEra}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full right-0 sm:left-0 sm:right-auto mt-2 w-32 max-h-64 overflow-y-auto bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-xl z-50">
          {eras.map((era) => (
            <button
              key={era}
              onClick={() => {
                onEraChange(era);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-[#2a2a2a] transition-colors ${
                era === selectedEra ? 'text-[#5fb3fc] bg-[#5fb3fc]/10' : 'text-white'
              }`}
            >
              Era {era}
              {era === currentEra && (
                <span className="ml-2 text-xs text-gray-500">(current)</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
