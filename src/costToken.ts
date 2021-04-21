import { getCreate2Address } from '@ethersproject/address';
import { Contract } from '@ethersproject/contracts';
import { BaseProvider } from '@ethersproject/providers';
import { keccak256, pack } from '@ethersproject/solidity';
import { BigNumber } from './utils/bignumber';
import { BONE } from './bmath';

// PancakeSwap Factory & init code hash
// https://github.com/pancakeswap/pancakeswap-sdk/blob/master/src/constants.ts
const FACTORY_ADDRESS = '0xBCfCcbde45cE874adCB698cC183deBcF17952812';
const INIT_CODE_HASH = '0xd0d4c4cd0848c93cb4fd1f498d7013ee6bfb25783ea21593d5834f5d250ece66';

export function getAddress(tokenA: string, tokenB: string): string {
    const tokens =
        tokenA.toLowerCase() < tokenB.toLowerCase()
            ? [tokenA, tokenB]
            : [tokenB, tokenA];

    let address = getCreate2Address(
        FACTORY_ADDRESS,
        keccak256(
            ['bytes'],
            [pack(['address', 'address'], [tokens[0], tokens[1]])]
        ),
        INIT_CODE_HASH
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
    TokenAddr: string,
    provider: BaseProvider
): Promise<BigNumber> {
    const WBNB = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';
    if (TokenAddr.toLowerCase() === WBNB.toLowerCase()){
        return new BigNumber(BONE);
    }

    let addr = getAddress(WBNB, TokenAddr);
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
    // If not mainnet return 0 as UniSwap price unlikely to be correct?
    // Provider can be used to fetch token data (i.e. Decimals) via UniSwap SDK when Ethers V5 is used
    if (ChainId !== 56) return new BigNumber(0);
    let tokenPrice = new BigNumber(0);
    try {
        tokenPrice = await getTokenWeiPrice(TokenAddr, Provider);
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
