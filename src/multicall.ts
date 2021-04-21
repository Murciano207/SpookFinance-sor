import { Contract } from '@ethersproject/contracts';
import { BaseProvider } from '@ethersproject/providers';
import { Pools, Pool, SubGraphPools, Token } from './types';
import * as bmath from './bmath';

export async function getAllPoolDataOnChain(
    pools: SubGraphPools,
    multiAddress: string,
    provider: BaseProvider
): Promise<Pools> {
    if (pools.pools.length === 0) {
        throw Error('There are no pools.');
    }

    const poolStateAbi = require('./abi/poolState.json');
    const contract = new Contract(multiAddress, poolStateAbi, provider);

    let addresses = [];
    let total = 0;

    for (let i = 0; i < pools.pools.length; i++) {
        let pool = pools.pools[i];

        addresses.push([pool.id]);
        total++;
        pool.tokens.forEach(token => {
            addresses[i].push(token.address);
            total += 2;
        });
    }

    let results = await contract.getPoolInfo(addresses, total);

    let j = 0;
    let onChainPools: Pools = { pools: [] };

    for (let i = 0; i < pools.pools.length; i++) {
        let tokens: Token[] = [];

        let poolSwapFee = bmath.bnum(results[j++]);
        let p: Pool = {
            id: pools.pools[i].id,
            swapFee: poolSwapFee,
            totalWeight: bmath.scale(
                bmath.bnum(pools.pools[i].totalWeight),
                18
            ),
            tokens: tokens,
            tokensList: pools.pools[i].tokensList,
        };

        pools.pools[i].tokens.forEach(token => {
            let tokenBalance = bmath.bnum(results[j++]);
            let tokenDenormWeight = bmath.bnum(results[j++]);

            p.tokens.push({
                address: token.address, 
                balance: tokenBalance,
                decimals: Number(token.decimals),
                denormWeight: tokenDenormWeight,
            });
        });
        onChainPools.pools.push(p);
    }
    return onChainPools;
}
