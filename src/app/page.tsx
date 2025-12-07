'use client';

import { useState, useEffect, useCallback } from 'react';
import { Header, StatsCards, EraSelector, ValidatorTable } from '@/components';
import type { EraData } from '@/types';

export default function Home() {
  const [data, setData] = useState<EraData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEra, setSelectedEra] = useState<number | null>(null);

  const fetchData = useCallback(async (era?: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const url = era !== undefined ? `/api/validators?era=${era}` : '/api/validators';
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch validator data');
      }
      
      const result: EraData = await response.json();
      setData(result);
      setSelectedEra(result.era);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEraChange = (era: number) => {
    setSelectedEra(era);
    fetchData(era);
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      <Header />
      
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Title and Era Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Validator Dashboard</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Monitor Avail network validators and staking metrics
            </p>
          </div>
          <EraSelector
            currentEra={data?.currentEra || 0}
            selectedEra={selectedEra || data?.era || 0}
            onEraChange={handleEraChange}
            loading={loading}
          />
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={() => fetchData(selectedEra || undefined)}
              className="mt-2 text-sm text-red-400 hover:text-red-300 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="mb-6 sm:mb-8">
          <StatsCards data={data} loading={loading} />
        </div>

        {/* Validator Table */}
        <ValidatorTable
          validators={data?.validators || []}
          loading={loading}
          currentEra={selectedEra || data?.era || 0}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2a2a2a] mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              Avail Validator Dashboard
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/availproject"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-500 hover:text-white transition-colors"
              >
                GitHub
              </a>
              <a
                href="https://twitter.com/AvailProject"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-500 hover:text-white transition-colors"
              >
                Twitter
              </a>
              <a
                href="https://discord.gg/availproject"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-500 hover:text-white transition-colors"
              >
                Discord
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
