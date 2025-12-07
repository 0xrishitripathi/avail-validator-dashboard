import { NextRequest, NextResponse } from 'next/server';
import { ApiPromise, WsProvider } from '@polkadot/api';
import type { ValidatorHistory } from '@/types';

let apiInstance: ApiPromise | null = null;

async function getApi(): Promise<ApiPromise> {
  if (apiInstance && apiInstance.isConnected) {
    return apiInstance;
  }
  
  const provider = new WsProvider('wss://mainnet-rpc.avail.so/ws');
  apiInstance = await ApiPromise.create({ provider });
  return apiInstance;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;
  const searchParams = request.nextUrl.searchParams;
  const currentEra = parseInt(searchParams.get('era') || '0');
  
  try {
    const api = await getApi();
    
    const history: ValidatorHistory = {
      eras: [],
      blocks: []
    };
    
    const startEra = Math.max(0, currentEra - 20);
    
    // Fetch era points for the last 21 eras
    for (let era = startEra; era <= currentEra; era++) {
      try {
        const eraRewardPoints = await api.query.staking.erasRewardPoints(era);
        const individual = (eraRewardPoints as any).individual;
        
        for (const [addr, points] of individual.entries()) {
          if (addr.toString() === address) {
            const eraPoints = Number(points.toString());
            if (eraPoints > 0) {
              history.eras.push(era);
              history.blocks.push(Math.floor(eraPoints / 20));
            }
            break;
          }
        }
      } catch {
        // Skip failed era fetches
      }
    }
    
    return NextResponse.json(history);
  } catch (error) {
    console.error('Error fetching validator history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch validator history' },
      { status: 500 }
    );
  }
}
