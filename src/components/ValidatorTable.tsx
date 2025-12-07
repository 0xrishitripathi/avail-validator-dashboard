'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ChevronUp, ChevronDown, Copy, Check, Filter, X } from 'lucide-react';
import type { Validator, SortField, SortDirection } from '@/types';
import { ValidatorDetails } from './ValidatorDetails';
import { getValidatorLogo } from '@/utils/logoMapping';

interface ValidatorTableProps {
  validators: Validator[];
  loading: boolean;
  currentEra: number;
}

function SortIcon({ field, currentField, direction }: { field: SortField; currentField: SortField | null; direction: SortDirection }) {
  if (field !== currentField) {
    return <ChevronDown className="w-4 h-4 text-gray-600" />;
  }
  return direction === 'asc' 
    ? <ChevronUp className="w-4 h-4 text-[#5fb3fc]" />
    : <ChevronDown className="w-4 h-4 text-[#5fb3fc]" />;
}

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="h-14 skeleton rounded-lg" />
      ))}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 hover:bg-[#2a2a2a] rounded transition-colors"
      title="Copy address"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-green-400" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-gray-500" />
      )}
    </button>
  );
}

// Get version statistics and determine which is "latest" (most common)
function getVersionStats(validators: Validator[]) {
  const versionCounts = new Map<string, number>();
  
  for (const v of validators) {
    const version = v.nodeVersion || 'Unknown';
    versionCounts.set(version, (versionCounts.get(version) || 0) + 1);
  }
  
  // Sort by count descending, then by version string descending (newer versions typically have higher strings)
  // Keep "Unknown" at the bottom
  const sorted = Array.from(versionCounts.entries()).sort((a, b) => {
    // Unknown always goes to bottom
    if (a[0] === 'Unknown') return 1;
    if (b[0] === 'Unknown') return -1;
    // First by count
    if (b[1] !== a[1]) return b[1] - a[1];
    // Then by version string (descending)
    return b[0].localeCompare(a[0]);
  });
  
  // Find the latest (most common known version)
  const latestKnown = sorted.find(([v]) => v !== 'Unknown')?.[0] || 'Unknown';
  
  return {
    versions: sorted,
    latest: latestKnown,
    total: validators.length
  };
}

// Get color class for a version based on its ranking
function getVersionColor(version: string, latest: string, versions: [string, number][]) {
  if (!version || version === 'Unknown') return 'bg-gray-700 text-gray-400';
  if (version === latest) return 'bg-green-900/50 text-green-400 border border-green-700';
  
  // Find position in sorted list
  const index = versions.findIndex(([v]) => v === version);
  if (index === 1) return 'bg-yellow-900/50 text-yellow-400 border border-yellow-700';
  if (index >= 2) return 'bg-red-900/50 text-red-400 border border-red-700';
  
  return 'bg-gray-700 text-gray-300';
}

export function ValidatorTable({ validators, loading, currentEra }: ValidatorTableProps) {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField | null>('totalStake');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [expandedValidator, setExpandedValidator] = useState<string | null>(null);
  const [versionFilter, setVersionFilter] = useState<string | null>(null);
  const [showVersionDropdown, setShowVersionDropdown] = useState(false);
  const dropdownRef = useRef<HTMLTableHeaderCellElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  const dropdownMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const isOutsideButton = dropdownRef.current && !dropdownRef.current.contains(target);
      const isOutsideMenu = dropdownMenuRef.current && !dropdownMenuRef.current.contains(target);
      
      if (isOutsideButton && isOutsideMenu) {
        setShowVersionDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Prevent scroll from bubbling when scrolling inside dropdown
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || !showVersionDropdown) return;

    const handleWheel = (e: WheelEvent) => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const isScrollable = scrollHeight > clientHeight;
      
      if (!isScrollable) return;
      
      const isAtTop = scrollTop === 0;
      const isAtBottom = Math.abs(scrollTop + clientHeight - scrollHeight) < 1;
      
      // Prevent page scroll when not at boundaries, or when scrolling away from boundary
      if ((!isAtTop && !isAtBottom) || 
          (isAtTop && e.deltaY > 0) || 
          (isAtBottom && e.deltaY < 0)) {
        e.preventDefault();
        e.stopPropagation();
        scrollContainer.scrollTop += e.deltaY;
      }
    };

    scrollContainer.addEventListener('wheel', handleWheel, { passive: false });
    return () => scrollContainer.removeEventListener('wheel', handleWheel);
  }, [showVersionDropdown]);

  // Calculate dropdown position when opening
  const openDropdown = () => {
    if (filterButtonRef.current) {
      const rect = filterButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left
      });
    }
    setShowVersionDropdown(!showVersionDropdown);
  };

  // Calculate version statistics
  const versionStats = useMemo(() => getVersionStats(validators), [validators]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredAndSortedValidators = useMemo(() => {
    let result = [...validators];

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(v => 
        v.name.toLowerCase().includes(searchLower) ||
        v.address.toLowerCase().includes(searchLower)
      );
    }

    // Filter by version
    if (versionFilter) {
      if (versionFilter === 'Unknown') {
        result = result.filter(v => !v.nodeVersion);
      } else {
        result = result.filter(v => v.nodeVersion === versionFilter);
      }
    }

    // Sort
    if (sortField) {
      result.sort((a, b) => {
        let aVal: number | string;
        let bVal: number | string;

        switch (sortField) {
          case 'name':
            aVal = a.name || a.address;
            bVal = b.name || b.address;
            break;
          case 'eraPoints':
            aVal = a.eraPoints;
            bVal = b.eraPoints;
            break;
          case 'blocksProduced':
            aVal = a.blocksProduced;
            bVal = b.blocksProduced;
            break;
          case 'totalStake':
            aVal = parseFloat(a.totalStake.replace(/,/g, ''));
            bVal = parseFloat(b.totalStake.replace(/,/g, ''));
            break;
          case 'commissionRate':
            aVal = a.commissionRate;
            bVal = b.commissionRate;
            break;
          case 'totalReward':
            aVal = parseFloat(a.totalReward.replace(/,/g, ''));
            bVal = parseFloat(b.totalReward.replace(/,/g, ''));
            break;
          default:
            return 0;
        }

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortDirection === 'asc' 
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        return sortDirection === 'asc' 
          ? (aVal as number) - (bVal as number)
          : (bVal as number) - (aVal as number);
      });
    }

    return result;
  }, [validators, search, sortField, sortDirection, versionFilter]);

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  if (loading) {
    return (
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Validators</h2>
          <div className="w-64 h-10 skeleton rounded-lg" />
        </div>
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 border-b border-[#2a2a2a]">
        <h2 className="text-base sm:text-lg font-semibold text-white">
          Validators
          <span className="ml-2 text-xs sm:text-sm font-normal text-gray-500">
            ({filteredAndSortedValidators.length})
          </span>
        </h2>
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 pl-10 pr-4 py-2 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#5fb3fc] transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        <table className="w-full validator-table min-w-[800px]">
          <thead>
            <tr className="border-b border-[#2a2a2a]">
              <th className="text-left p-4">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-1 text-xs font-medium text-gray-400 uppercase tracking-wider hover:text-white transition-colors"
                >
                  Validator
                  <SortIcon field="name" currentField={sortField} direction={sortDirection} />
                </button>
              </th>
              <th className="text-left p-4" ref={dropdownRef}>
                <button
                  ref={filterButtonRef}
                  onClick={openDropdown}
                  className={`flex items-center gap-1 text-xs font-medium uppercase tracking-wider hover:text-white transition-colors ${
                    versionFilter ? 'text-[#5fb3fc]' : 'text-gray-400'
                  }`}
                >
                  Node Version
                  <Filter className={`w-3.5 h-3.5 ${versionFilter ? 'text-[#5fb3fc]' : ''}`} />
                  {versionFilter && (
                    <span className="ml-1 px-1.5 py-0.5 bg-[#5fb3fc]/20 text-[#5fb3fc] rounded text-[10px]">
                      1
                    </span>
                  )}
                </button>
                
                {/* Version Filter Dropdown - Fixed position to escape overflow */}
                {showVersionDropdown && (
                  <div 
                    ref={dropdownMenuRef}
                    className="fixed w-72 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-xl z-[100] flex flex-col" 
                    style={{ 
                      maxHeight: '320px',
                      top: dropdownPosition.top,
                      left: dropdownPosition.left
                    }}
                  >
                    <div className="p-3 border-b border-[#2a2a2a] flex items-center justify-between flex-shrink-0">
                      <span className="text-sm font-medium text-white">Filter by Version</span>
                      {versionFilter && (
                        <button
                          onClick={() => {
                            setVersionFilter(null);
                            setShowVersionDropdown(false);
                          }}
                          className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
                        >
                          <X className="w-3 h-3" />
                          Clear
                        </button>
                      )}
                    </div>
                    <div 
                      ref={scrollContainerRef}
                      className="overflow-y-auto"
                      style={{ maxHeight: '260px' }}
                    >
                      {versionStats.versions.map(([version, count], index) => (
                        <button
                          key={version}
                          onClick={() => {
                            setVersionFilter(version === versionFilter ? null : version);
                          }}
                          className={`w-full px-3 py-2 flex items-center justify-between hover:bg-[#2a2a2a] transition-colors ${
                            version === versionFilter ? 'bg-[#5fb3fc]/20 border-l-2 border-[#5fb3fc]' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${
                              version === 'Unknown' ? 'bg-gray-500' :
                              index === 0 ? 'bg-green-500' :
                              index === 1 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`} />
                            <span className={`text-sm font-mono ${
                              version === versionFilter ? 'text-[#5fb3fc] font-semibold' : 'text-gray-300'
                            }`}>
                              {version === 'Unknown' ? 'Unknown' : version}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {count} validator{count !== 1 ? 's' : ''}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </th>
              <th className="text-right p-4">
                <button
                  onClick={() => handleSort('eraPoints')}
                  className="flex items-center gap-1 text-xs font-medium text-gray-400 uppercase tracking-wider hover:text-white transition-colors ml-auto"
                >
                  Era Points
                  <SortIcon field="eraPoints" currentField={sortField} direction={sortDirection} />
                </button>
              </th>
              <th className="text-right p-4">
                <button
                  onClick={() => handleSort('blocksProduced')}
                  className="flex items-center gap-1 text-xs font-medium text-gray-400 uppercase tracking-wider hover:text-white transition-colors ml-auto"
                >
                  Blocks
                  <SortIcon field="blocksProduced" currentField={sortField} direction={sortDirection} />
                </button>
              </th>
              <th className="text-right p-4">
                <button
                  onClick={() => handleSort('totalStake')}
                  className="flex items-center gap-1 text-xs font-medium text-gray-400 uppercase tracking-wider hover:text-white transition-colors ml-auto"
                >
                  Total Stake
                  <SortIcon field="totalStake" currentField={sortField} direction={sortDirection} />
                </button>
              </th>
              <th className="text-right p-4">
                <button
                  onClick={() => handleSort('commissionRate')}
                  className="flex items-center gap-1 text-xs font-medium text-gray-400 uppercase tracking-wider hover:text-white transition-colors ml-auto"
                >
                  Commission
                  <SortIcon field="commissionRate" currentField={sortField} direction={sortDirection} />
                </button>
              </th>
              <th className="text-right p-4">
                <button
                  onClick={() => handleSort('totalReward')}
                  className="flex items-center gap-1 text-xs font-medium text-gray-400 uppercase tracking-wider hover:text-white transition-colors ml-auto"
                >
                  Reward
                  <SortIcon field="totalReward" currentField={sortField} direction={sortDirection} />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedValidators.map((validator, index) => (
              <React.Fragment key={validator.address}>
                <tr
                  onClick={() => setExpandedValidator(
                    expandedValidator === validator.address ? null : validator.address
                  )}
                  className={`border-b border-[#2a2a2a] cursor-pointer transition-colors ${
                    expandedValidator === validator.address 
                      ? 'bg-[#5fb3fc]/5' 
                      : 'hover:bg-[#222222]'
                  }`}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const logoUrl = getValidatorLogo(validator.name);
                        return logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img 
                            src={logoUrl} 
                            alt={validator.name || 'Validator'} 
                            className="w-8 h-8 rounded-full object-cover bg-[#2a2a2a]"
                            onError={(e) => {
                              // Fallback to index number if image fails to load
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null;
                      })()}
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-[#5fb3fc] to-[#3d9be0] flex items-center justify-center text-xs font-medium text-white ${getValidatorLogo(validator.name) ? 'hidden' : ''}`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {validator.name || truncateAddress(validator.address)}
                        </p>
                        <div className="flex items-center gap-1">
                          <p className="text-xs text-gray-500">
                            {truncateAddress(validator.address)}
                          </p>
                          <CopyButton text={validator.address} />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    {validator.nodeVersion ? (
                      <span className={`text-xs px-2 py-1 rounded font-mono ${
                        getVersionColor(validator.nodeVersion, versionStats.latest, versionStats.versions)
                      }`}>
                        {validator.nodeVersion}
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-500">Unknown</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <span className="text-sm text-white">{validator.eraPoints.toLocaleString()}</span>
                  </td>
                  <td className="p-4 text-right">
                    <span className="text-sm text-white">{validator.blocksProduced.toLocaleString()}</span>
                  </td>
                  <td className="p-4 text-right">
                    <span className="text-sm text-white">{validator.totalStake}</span>
                  </td>
                  <td className="p-4 text-right">
                    <span className={`text-sm ${
                      validator.commissionRate >= 15 
                        ? 'text-orange-400' 
                        : 'text-white'
                    }`}>
                      {validator.commissionRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <span className="text-sm text-white">{validator.totalReward}</span>
                  </td>
                </tr>
                {expandedValidator === validator.address && (
                  <tr>
                    <td colSpan={7} className="p-0 bg-[#151515]">
                      <ValidatorDetails 
                        validator={validator} 
                        currentEra={currentEra}
                      />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {filteredAndSortedValidators.length === 0 && !loading && (
        <div className="p-12 text-center">
          <p className="text-gray-500">No validators found matching your search.</p>
        </div>
      )}
    </div>
  );
}
