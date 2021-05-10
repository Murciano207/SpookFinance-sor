"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCostOutputToken = exports.calculateTotalSwapCost = exports.getTokenWeiPrice = exports.getOnChainReserves = exports.getAddress = void 0;
const address_1 = require("@ethersproject/address");
const contracts_1 = require("@ethersproject/contracts");
const solidity_1 = require("@ethersproject/solidity");
const bignumber_1 = require("./utils/bignumber");
const bmath_1 = require("./bmath");
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
};
function getAddress(ChainId, tokenA, tokenB) {
    const tokens = tokenA.toLowerCase() < tokenB.toLowerCase()
        ? [tokenA, tokenB]
        : [tokenB, tokenA];
    let address = address_1.getCreate2Address(CHAINS[ChainId].factory, solidity_1.keccak256(['bytes'], [solidity_1.pack(['address', 'address'], [tokens[0], tokens[1]])]), CHAINS[ChainId].init_hash);
    return address;
}
exports.getAddress = getAddress;
function getOnChainReserves(PairAddr, provider) {
    return __awaiter(this, void 0, void 0, function* () {
        const uniswapV2PairAbi = require('./abi/UniswapV2Pair.json');
        const pairContract = new contracts_1.Contract(PairAddr, uniswapV2PairAbi, provider);
        let [reserve0, reserve1, blockTimestamp] = yield pairContract.getReserves();
        return [reserve0, reserve1];
    });
}
exports.getOnChainReserves = getOnChainReserves;
function getTokenWeiPrice(ChainId, TokenAddr, provider) {
    return __awaiter(this, void 0, void 0, function* () {
        const wnative = CHAINS[ChainId].wnative;
        if (TokenAddr.toLowerCase() === wnative.toLowerCase()) {
            return new bignumber_1.BigNumber(bmath_1.BONE);
        }
        let addr = getAddress(ChainId, wnative, TokenAddr);
        let [reserve0, reserve1] = yield getOnChainReserves(addr, provider);
        const numerator = new bignumber_1.BigNumber(reserve0.toString());
        const denominator = new bignumber_1.BigNumber(reserve1.toString());
        const price1eth = numerator.div(denominator);
        return price1eth.times(bmath_1.BONE);
    });
}
exports.getTokenWeiPrice = getTokenWeiPrice;
function calculateTotalSwapCost(TokenPrice, SwapCost, GasPriceWei) {
    return GasPriceWei.times(SwapCost)
        .times(TokenPrice)
        .div(bmath_1.BONE);
}
exports.calculateTotalSwapCost = calculateTotalSwapCost;
function getCostOutputToken(TokenAddr, GasPriceWei, SwapGasCost, Provider, ChainId = undefined) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!ChainId) {
            let network = yield Provider.getNetwork();
            ChainId = network.chainId;
        }
        let tokenPrice = new bignumber_1.BigNumber(0);
        try {
            tokenPrice = yield getTokenWeiPrice(ChainId, TokenAddr, Provider);
        }
        catch (err) {
            // console.log(err)
            // If no pool for provided address (or addr incorrect) then default to 0
            console.log('Error Getting Token Price. Defaulting to 0.');
        }
        let costOutputToken = calculateTotalSwapCost(tokenPrice, SwapGasCost, GasPriceWei);
        return costOutputToken;
    });
}
exports.getCostOutputToken = getCostOutputToken;
