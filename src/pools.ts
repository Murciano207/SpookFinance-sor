import fetch from 'isomorphic-fetch';
import { SubGraphPools, Pools, Pool, Token } from './types';
import * as bmath from './bmath';
import query from './graphql/pools';

const CACHE_TTL = 60 * 1000;

export class POOLS {
    cache: SubGraphPools;
    timestamp: number;

    async getAllPublicSwapPools(URL: string): Promise<SubGraphPools> {
        if (!this.cache || Date.now() > this.timestamp + CACHE_TTL) {
            console.log('fetching pools from subgraph');
            
            const res = await fetch(URL, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query: query }) 
            });

            const { data } = await res.json();
            this.cache = data;
            this.timestamp = Date.now();
        }

        return this.cache;
    }

    async formatPoolsBigNumber(pools: SubGraphPools): Promise<Pools> {
        let onChainPools: Pools = { pools: [] };

        for (let i = 0; i < pools.pools.length; i++) {
            let tokens: Token[] = [];

            let p: Pool = {
                id: pools.pools[i].id,
                swapFee: bmath.scale(bmath.bnum(pools.pools[i].swapFee), 18),
                totalWeight: bmath.scale(
                    bmath.bnum(pools.pools[i].totalWeight),
                    18
                ),
                tokens: tokens,
                tokensList: pools.pools[i].tokensList,
            };

            pools.pools[i].tokens.forEach(token => {
                let decimals = Number(token.decimals);

                p.tokens.push({
                    address: token.address,
                    balance: bmath.scale(bmath.bnum(token.balance), decimals),
                    decimals: decimals,
                    denormWeight: bmath.scale(
                        bmath.bnum(token.denormWeight),
                        18
                    ),
                });
            });
            onChainPools.pools.push(p);
        }

        return onChainPools;
    }
}
