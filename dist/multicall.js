"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.getAllPoolDataOnChain = void 0;
const contracts_1 = require("@ethersproject/contracts");
const bmath = __importStar(require("./bmath"));
function getAllPoolDataOnChain(pools, multiAddress, provider) {
    return __awaiter(this, void 0, void 0, function* () {
        if (pools.pools.length === 0) {
            throw Error('There are no pools.');
        }
        const poolStateAbi = require('./abi/poolState.json');
        const contract = new contracts_1.Contract(multiAddress, poolStateAbi, provider);
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
        let results = yield contract.getPoolInfo(addresses, total);
        let j = 0;
        let onChainPools = { pools: [] };
        for (let i = 0; i < pools.pools.length; i++) {
            let tokens = [];
            let poolSwapFee = bmath.bnum(results[j++]);
            let p = {
                id: pools.pools[i].id,
                swapFee: poolSwapFee,
                totalWeight: bmath.scale(bmath.bnum(pools.pools[i].totalWeight), 18),
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
    });
}
exports.getAllPoolDataOnChain = getAllPoolDataOnChain;
