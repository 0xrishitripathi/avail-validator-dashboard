'use client';

import { useState, useEffect } from 'react';
import { Loader2, ExternalLink, Users, Coins, Award, Percent } from 'lucide-react';
import type { Validator, ValidatorHistory } from '@/types';

interface ValidatorDetailsProps {
  validator: Validator;
  currentEra: number;
}

function StatItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-[#1a1a1a] rounded-lg">
      <div className="w-8 h-8 rounded-lg bg-[#2a2a2a] flex items-center justify-center">
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-white">{value}</p>
      </div>
    </div>
  );
}

function BlockHistoryChart({ history, loading }: { history: ValidatorHistory | null; loading: boolean }) {
  const [selectedBar, setSelectedBar] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 text-[#5fb3fc] animate-spin" />
      </div>
    );
  }

  if (!history || history.eras.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-500 text-sm">
        No block production history available
      </div>
    );
  }

  const maxBlocks = Math.max(...history.blocks);

  const handleBarClick = (index: number) => {
    setSelectedBar(selectedBar === index ? null : index);
  };

  return (
    <div className="h-44">
      <div className="flex items-end justify-between gap-1" style={{ height: '120px' }}>
        {history.blocks.map((blocks, index) => {
          const heightPx = maxBlocks > 0 ? Math.max((blocks / maxBlocks) * 110, 6) : 6;
          const isSelected = selectedBar === index;
          return (
            <div
              key={history.eras[index]}
              className="flex-1 flex flex-col items-center group relative cursor-pointer"
              style={{ height: '100%' }}
              onClick={() => handleBarClick(index)}
              onMouseEnter={() => setSelectedBar(index)}
              onMouseLeave={() => setSelectedBar(null)}
            >
              <div className="absolute bottom-0 w-full flex justify-center">
                <div
                  className={`w-full max-w-[16px] rounded-t transition-all ${
                    isSelected 
                      ? 'bg-gradient-to-t from-[#5fb3fc] to-[#8ac9fd]' 
                      : 'bg-gradient-to-t from-[#3d9be0] to-[#5fb3fc]'
                  }`}
                  style={{ height: `${heightPx}px` }}
                />
              </div>
              <div className={`absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-1 bg-[#2a2a2a] rounded text-xs text-white transition-opacity whitespace-nowrap z-10 pointer-events-none ${
                isSelected ? 'opacity-100' : 'opacity-0'
              }`}>
                Era {history.eras[index]}: {blocks} blocks
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-3 text-xs text-gray-500">
        <span>Era {history.eras[0]}</span>
        <span>Era {history.eras[history.eras.length - 1]}</span>
      </div>
    </div>
  );
}

export function ValidatorDetails({ validator, currentEra }: ValidatorDetailsProps) {
  const [history, setHistory] = useState<ValidatorHistory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      try {
        const response = await fetch(`/api/validators/${validator.address}/history?era=${currentEra}`);
        if (response.ok) {
          const data = await response.json();
          setHistory(data);
        }
      } catch (error) {
        console.error('Failed to fetch validator history:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [validator.address, currentEra]);

  return (
    <div className="p-6 border-t border-[#2a2a2a]">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stats Grid */}
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-4">Validator Details</h3>
          <div className="grid grid-cols-2 gap-3">
            <StatItem 
              icon={Users} 
              label="Nominators" 
              value={validator.nominatorCount.toString()} 
            />
            <StatItem 
              icon={Coins} 
              label="Own Stake" 
              value={`${validator.ownStake} AVAIL`} 
            />
            <StatItem 
              icon={Coins} 
              label="Nominated Stake" 
              value={`${validator.nominatedStake} AVAIL`} 
            />
            <StatItem 
              icon={Percent} 
              label="Commission Earned" 
              value={`${validator.commissionEarned} AVAIL`} 
            />
            <StatItem 
              icon={Award} 
              label="Own Reward" 
              value={`${validator.ownReward} AVAIL`} 
            />
            <StatItem 
              icon={Award} 
              label="Total Reward" 
              value={`${validator.totalReward} AVAIL`} 
            />
          </div>
          
          <div className="mt-4">
            <a
              href={`https://explorer.avail.so/?rpc=wss%3A%2F%2Fmainnet-rpc.avail.so%2Fws#/staking/query/${validator.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#5fb3fc]/20 text-[#5fb3fc] rounded-lg hover:bg-[#5fb3fc]/30 transition-colors text-sm"
            >
              Check Validator Stats
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Block History Chart */}
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-4">Block Production History</h3>
          <div className="bg-[#1a1a1a] rounded-lg p-4">
            <BlockHistoryChart history={history} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
}
