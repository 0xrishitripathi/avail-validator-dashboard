'use client';

import { Users, Blocks, Coins, TrendingUp, PieChart } from 'lucide-react';
import type { EraData } from '@/types';

interface StatsCardsProps {
  data: EraData | null;
  loading: boolean;
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  loading,
  accent = false 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string; 
  loading: boolean;
  accent?: boolean;
}) {
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3 sm:p-5 transition-smooth hover:border-[#3a3a3a]">
      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${
          accent ? 'bg-[#5fb3fc]/20' : 'bg-[#2a2a2a]'
        }`}>
          <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${accent ? 'text-[#5fb3fc]' : 'text-gray-400'}`} />
        </div>
        <span className="text-xs sm:text-sm text-gray-400">{label}</span>
      </div>
      {loading ? (
        <div className="h-6 sm:h-8 w-24 sm:w-32 skeleton rounded" />
      ) : (
        <p className={`text-lg sm:text-2xl font-semibold truncate ${accent ? 'text-[#5fb3fc]' : 'text-white'}`}>
          {value}
        </p>
      )}
    </div>
  );
}

export function StatsCards({ data, loading }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
      <StatCard
        icon={Users}
        label="Total Validators"
        value={data?.totalValidators.toString() || '0'}
        loading={loading}
      />
      <StatCard
        icon={Blocks}
        label="Blocks Produced"
        value={data?.totalBlocks.toLocaleString() || '0'}
        loading={loading}
      />
      <StatCard
        icon={Coins}
        label="Total Stake"
        value={data?.totalStake || '0'}
        loading={loading}
      />
      <StatCard
        icon={TrendingUp}
        label="APY"
        value={data?.apy || '0%'}
        loading={loading}
        accent
      />
      <StatCard
        icon={PieChart}
        label="Staking Ratio"
        value={data?.stakingRatio || '0%'}
        loading={loading}
      />
    </div>
  );
}
