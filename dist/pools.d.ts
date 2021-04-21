import { SubGraphPools, Pools } from './types';
export declare class POOLS {
    cache: SubGraphPools;
    timestamp: number;
    getAllPublicSwapPools(URL: string): Promise<SubGraphPools>;
    formatPoolsBigNumber(pools: SubGraphPools): Promise<Pools>;
}
