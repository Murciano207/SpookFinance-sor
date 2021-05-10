import { getCreate2Address } from '@ethersproject/address';
import { Contract } from '@ethersproject/contracts';
import { BaseProvider } from '@ethersproject/providers';
import { keccak256, pack } from '@ethersproject/solidity';
import { BigNumber } from './utils/bignumber';
import { BONE } from './bmath';

const CHAINS = {
    56: {
        reference: 'PancakeSwap',
        docs: 'https://github.com/pancakeswap/pancakeswap-sdk/blob/master/src/constants.ts',
        factory: '0xBCfCcbde45cE874adCB698cC183deBcF17952812',
        init_hash: '0xd0d4c4cd0848c93cb4fd1f498d7013ee6bfb25783ea21593d5834f5d250ece66',
        wnative: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    },
    
    137: {
        reference: 'QuickSwap',
        docs: 'https://github.com/QuickSwap/QuickSwap-sdk/blob/master/src/constants.ts',
        factory: '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32',
        init_hash: '0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f',
        wnative: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
    }
}

export function getAddress(ChainId: number, tokenA: string, tokenB: string): string {
    const tokens =
        tokenA.toLowerCase() < tokenB.toLowerCase()
            ? [tokenA, tokenB]
            : [tokenB, tokenA];

    let address = getCreate2Address(
        CHAINS[ChainId].factory,
        keccak256(
            ['bytes'],
            [pack(['address', 'address'], [tokens[0], tokens[1]])]
        ),
        CHAINS[ChainId].init_hash
    );

    return address;
}

export async function getOnChainReserves(
    PairAddr: string,
    provider: BaseProvider
): Promise<any[]> {
    const uniswapV2PairAbi = require('./abi/UniswapV2Pair.json');

    const pairContract = new Contract(PairAddr, uniswapV2PairAbi, provider);

    let [reserve0, reserve1, blockTimestamp] = await pairContract.getReserves();

    return [reserve0, reserve1];
}

export async function getTokenWeiPrice(
    ChainId: number,
    TokenAddr: string,
    provider: BaseProvider
): Promise<BigNumber> {
    const wnative = CHAINS[ChainId].wnative;
    if (TokenAddr.toLowerCase() === wnative.toLowerCase()){
        return new BigNumber(BONE);
    }

    let addr = getAddress(ChainId, wnative, TokenAddr);
    let [reserve0, reserve1] = await getOnChainReserves(addr, provider);

    const numerator = new BigNumber(reserve0.toString());
    const denominator = new BigNumber(reserve1.toString());

    const price1eth = numerator.div(denominator);
    return price1eth.times(BONE);
}

export function calculateTotalSwapCost(
    TokenPrice: BigNumber,
    SwapCost: BigNumber,
    GasPriceWei: BigNumber
): BigNumber {
    return GasPriceWei.times(SwapCost)
        .times(TokenPrice)
        .div(BONE);
}

export async function getCostOutputToken(
    TokenAddr: string,
    GasPriceWei: BigNumber,
    SwapGasCost: BigNumber,
    Provider: BaseProvider,
    ChainId: number = undefined
): Promise<BigNumber> {
    if (!ChainId) {
        let network = await Provider.getNetwork();
        ChainId = network.chainId;
    }
    
    let tokenPrice = new BigNumber(0);
    try {
        tokenPrice = await getTokenWeiPrice(ChainId, TokenAddr, Provider);
    } catch (err) {
        // console.log(err)
        // If no pool for provided address (or addr incorrect) then default to 0
        console.log('Error Getting Token Price. Defaulting to 0.');
    }

    let costOutputToken = calculateTotalSwapCost(
        tokenPrice,
        SwapGasCost,
        GasPriceWei
    );

    return costOutputToken;
}
