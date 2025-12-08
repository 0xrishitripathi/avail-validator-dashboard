import { NextRequest, NextResponse } from 'next/server';
import { ApiPromise, WsProvider } from '@polkadot/api';
import type { EraData, Validator } from '@/types';
import fs from 'fs';
import path from 'path';

// Format large numbers in a readable way (e.g., 4.8B, 1.2M)
function formatLargeNumber(num: number): string {
  if (num >= 1e9) {
    return (num / 1e9).toFixed(2) + 'B';
  } else if (num >= 1e6) {
    return (num / 1e6).toFixed(2) + 'M';
  } else if (num >= 1e3) {
    return (num / 1e3).toFixed(2) + 'K';
  }
  return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

// Load validator info from CSV (names and telemetry)
interface ValidatorInfo {
  name: string;
  telemetry: string;
}

function loadValidatorInfo(): Map<string, ValidatorInfo> {
  const infoMap = new Map<string, ValidatorInfo>();
  try {
    const csvPath = path.join(process.cwd(), 'validatorinfo.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Parse CSV line (Address,Telemetry,Validator Name)
      const parts = line.split(',');
      if (parts.length >= 2) {
        const address = parts[0].trim();
        const telemetry = parts[1].trim();
        const validatorName = parts.length >= 3 ? parts[2].trim() : '';
        if (address) {
          infoMap.set(address, { name: validatorName, telemetry });
        }
      }
    }
  } catch (error) {
    console.error('Error loading validator info CSV:', error);
  }
  return infoMap;
}

// Always reload CSV data (no caching) so changes are picked up immediately
function getValidatorInfo(): Map<string, ValidatorInfo> {
  return loadValidatorInfo();
}

// Telemetry API types
interface TelemetryNode {
  node_name: string;
  network_id: string;
}

interface TelemetryImplementation {
  version: string;
  nodes: TelemetryNode[];
  count: number;
}

interface TelemetryResponse {
  implementations: TelemetryImplementation[];
}

// Cache for telemetry data
let telemetryCache: { data: Map<string, string>; timestamp: number } | null = null;
const TELEMETRY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Normalize string by removing emojis and special characters for matching
function normalizeForMatching(str: string): string {
  // Remove emojis and special unicode characters, keep alphanumeric and basic punctuation
  return str
    .toLowerCase()
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Remove emojis
    .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII characters
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchNodeVersions(): Promise<Map<string, string>> {
  // Check cache
  if (telemetryCache && Date.now() - telemetryCache.timestamp < TELEMETRY_CACHE_TTL) {
    return telemetryCache.data;
  }

  const nodeVersionMap = new Map<string, string>();
  
  try {
    const response = await fetch(
      'https://telemetry.avail.so:8000/node_list/0xb91746b45e0346cc2f815a520b9c6cb4d5c0902af848db0a80f85932d2e8276a',
      { next: { revalidate: 300 } }
    );
    
    if (response.ok) {
      const data: TelemetryResponse = await response.json();
      
      // Build a map of node_name -> version (both original and normalized)
      for (const impl of data.implementations) {
        for (const node of impl.nodes) {
          // Store with original lowercase key
          nodeVersionMap.set(node.node_name.toLowerCase(), impl.version);
          // Also store with normalized key for emoji handling
          const normalized = normalizeForMatching(node.node_name);
          if (normalized) {
            nodeVersionMap.set(normalized, impl.version);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error fetching telemetry data:', error);
  }
  
  // Cache the result
  telemetryCache = { data: nodeVersionMap, timestamp: Date.now() };
  
  return nodeVersionMap;
}

// Simple in-memory cache - reduced TTL for faster updates
const cache: Map<number, { data: EraData; timestamp: number }> = new Map();
const CACHE_TTL = 10 * 1000; // 10 seconds cache for faster CSV updates

let apiInstance: ApiPromise | null = null;

async function getApi(): Promise<ApiPromise> {
  if (apiInstance && apiInstance.isConnected) {
    return apiInstance;
  }
  
  const provider = new WsProvider('wss://mainnet-rpc.avail.so/ws');
  apiInstance = await ApiPromise.create({ provider });
  return apiInstance;
}

function formatBalance(amount: bigint | string | number): number {
  const value = BigInt(amount.toString());
  return Number(value) / 1e18;
}

function formatBalanceString(amount: bigint | string | number): string {
  const value = formatBalance(amount);
  return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const eraParam = searchParams.get('era');
  
  try {
    const api = await getApi();
    
    // Get current era from chain
    const currentEraResult = await api.query.staking.currentEra() as any;
    const currentEra = currentEraResult.unwrapOr(0);
    let currentEraNum = Number(currentEra.toString());
    
    // Check if the current era actually has data (era might be reported before it starts)
    // If no data exists for current era, use previous era
    if (!eraParam) {
      const testEraPoints = await api.query.staking.erasRewardPoints(currentEraNum);
      const testTotal = Number((testEraPoints as any).total.toString());
      if (testTotal === 0) {
        // Current era hasn't started yet, use previous era
        currentEraNum = currentEraNum - 1;
      }
    }
    
    const selectedEra = eraParam ? parseInt(eraParam) : currentEraNum;
    
    // Check cache
    const cached = cache.get(selectedEra);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }
    
    // Fetch era reward points
    const eraRewardPoints = await api.query.staking.erasRewardPoints(selectedEra);
    const individual = (eraRewardPoints as any).individual;
    
    // Fetch validator preferences (commission)
    const validatorPrefs = await api.query.staking.erasValidatorPrefs.entries(selectedEra);
    const prefsMap = new Map<string, number>();
    for (const [key, value] of validatorPrefs) {
      const address = (key.args[1] as any).toString();
      const commission = Number((value as any).commission.toString()) / 1e9;
      prefsMap.set(address, commission);
    }
    
    // Fetch staker overview
    const stakersOverview = await api.query.staking.erasStakersOverview.entries(selectedEra);
    const stakersMap = new Map<string, { total: bigint; own: bigint; nominatorCount: number }>();
    for (const [key, value] of stakersOverview) {
      const address = (key.args[1] as any).toString();
      const data = value as any;
      if (data.isSome) {
        const unwrapped = data.unwrap();
        stakersMap.set(address, {
          total: BigInt(unwrapped.total.toString()),
          own: BigInt(unwrapped.own.toString()),
          nominatorCount: Number(unwrapped.nominatorCount.toString())
        });
      }
    }
    
    // Fetch identities
    const identities = await api.query.identity.identityOf.entries();
    const identityMap = new Map<string, string>();
    for (const [key, value] of identities) {
      const address = (key.args[0] as any).toString();
      const data = value as any;
      if (data.isSome) {
        try {
          const unwrapped = data.unwrap();
          const info = unwrapped[0]?.info || unwrapped.info;
          if (info?.display?.isRaw) {
            const name = info.display.asRaw.toHuman();
            if (name) identityMap.set(address, name as string);
          }
        } catch {
          // Skip if identity parsing fails
        }
      }
    }
    
    // Fetch era validator reward
    const eraReward = await api.query.staking.erasValidatorReward(selectedEra) as any;
    const totalRewards = eraReward.isSome ? BigInt(eraReward.unwrap().toString()) : BigInt(0);
    
    // Calculate total era points
    const totalEraPoints = Number((eraRewardPoints as any).total.toString());
    
    // Fetch node versions from telemetry
    const nodeVersions = await fetchNodeVersions();
    const validatorInfo = getValidatorInfo();
    
    // Build a map of era points for quick lookup
    const eraPointsMap = new Map<string, number>();
    for (const [address, points] of individual.entries()) {
      eraPointsMap.set(address.toString(), Number(points.toString()));
    }
    
    // Build validators list from ALL validators in the active set (stakersMap)
    // This ensures we show all validators even if they haven't produced blocks yet
    const validators: Validator[] = [];
    
    for (const [addr, stakeInfo] of stakersMap.entries()) {
      const eraPoints = eraPointsMap.get(addr) || 0;
      const commission = prefsMap.get(addr) || 0;
      
      const totalStake = stakeInfo.total;
      const ownStake = stakeInfo.own;
      const nominatedStake = totalStake - ownStake;
      
      // Calculate rewards
      const pointsRatio = totalEraPoints > 0 ? eraPoints / totalEraPoints : 0;
      const validatorShare = Number(totalRewards) * pointsRatio / 1e18;
      const commissionEarned = validatorShare * commission;
      const remainingReward = validatorShare - commissionEarned;
      const ownReward = totalStake > 0 ? remainingReward * (Number(ownStake) / Number(totalStake)) : 0;
      const totalReward = commissionEarned + ownReward;
      
      // Get validator info from CSV
      const info = validatorInfo.get(addr);
      const validatorName = info?.name || identityMap.get(addr) || '';
      
      // Get node version by matching telemetry name
      let nodeVersion = '';
      if (info?.telemetry) {
        // Try original lowercase first, then normalized version
        nodeVersion = nodeVersions.get(info.telemetry.toLowerCase()) || 
                      nodeVersions.get(normalizeForMatching(info.telemetry)) || '';
      }
      
      validators.push({
        address: addr,
        name: validatorName,
        eraPoints,
        blocksProduced: Math.floor(eraPoints / 20),
        totalStake: formatBalanceString(totalStake),
        ownStake: formatBalanceString(ownStake),
        nominatedStake: formatBalanceString(nominatedStake),
        commissionRate: commission * 100,
        totalReward: totalReward.toLocaleString('en-US', { maximumFractionDigits: 0 }),
        commissionEarned: commissionEarned.toLocaleString('en-US', { maximumFractionDigits: 0 }),
        ownReward: ownReward.toLocaleString('en-US', { maximumFractionDigits: 0 }),
        nominatorCount: stakeInfo.nominatorCount,
        nodeVersion
      });
    }
    
    // Sort by total stake descending
    validators.sort((a, b) => {
      const stakeA = parseFloat(a.totalStake.replace(/,/g, ''));
      const stakeB = parseFloat(b.totalStake.replace(/,/g, ''));
      return stakeB - stakeA;
    });
    
    // Calculate summary stats
    const totalBlocks = validators.reduce((sum, v) => sum + v.blocksProduced, 0);
    const totalStakeSum = validators.reduce((sum, v) => sum + parseFloat(v.totalStake.replace(/,/g, '')), 0);
    
    // Fetch total issuance and calculate staking ratio
    const totalIssuance = await api.query.balances.totalIssuance();
    const totalIssuanceNum = Number(totalIssuance.toString()) / 1e18;
    const stakingRatio = totalIssuanceNum > 0 ? (totalStakeSum / totalIssuanceNum) * 100 : 0;
    
    // Calculate APY (using previous era reward)
    const prevEraReward = await api.query.staking.erasValidatorReward(selectedEra - 1) as any;
    let apy = 0;
    if (prevEraReward.isSome && totalStakeSum > 0) {
      const annualReward = Number(prevEraReward.unwrap().toString()) / 1e18 * 365;
      apy = (annualReward / totalStakeSum) * 100;
    }
    
    const result: EraData = {
      era: selectedEra,
      currentEra: currentEraNum,
      totalValidators: validators.length,
      totalBlocks,
      totalStake: formatLargeNumber(totalStakeSum),
      stakingRatio: stakingRatio.toFixed(2) + '%',
      apy: apy.toFixed(2) + '%',
      validators
    };
    
    // Cache the result
    cache.set(selectedEra, { data: result, timestamp: Date.now() });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching validators:', error);
    return NextResponse.json(
      { error: 'Failed to fetch validator data' },
      { status: 500 }
    );
  }
}
