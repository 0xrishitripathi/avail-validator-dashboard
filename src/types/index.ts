export interface Validator {
  address: string;
  name: string;
  eraPoints: number;
  blocksProduced: number;
  totalStake: string;
  ownStake: string;
  nominatedStake: string;
  commissionRate: number;
  totalReward: string;
  commissionEarned: string;
  ownReward: string;
  nominatorCount: number;
  nodeVersion: string;
}

export interface EraData {
  era: number;
  currentEra: number;
  totalValidators: number;
  totalBlocks: number;
  totalStake: string;
  stakingRatio: string;
  apy: string;
  validators: Validator[];
}

export interface ValidatorHistory {
  eras: number[];
  blocks: number[];
}

export type SortField = 'name' | 'eraPoints' | 'blocksProduced' | 'totalStake' | 'commissionRate' | 'totalReward';
export type SortDirection = 'asc' | 'desc';
