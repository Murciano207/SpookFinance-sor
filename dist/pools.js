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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POOLS = void 0;
const isomorphic_fetch_1 = __importDefault(require("isomorphic-fetch"));
const bmath = __importStar(require("./bmath"));
const pools_1 = __importDefault(require("./graphql/pools"));
const CACHE_TTL = 60 * 1000;
class POOLS {
    getAllPublicSwapPools(URL) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.cache || Date.now() > this.timestamp + CACHE_TTL) {
                console.log('fetching pools from subgraph');
                const res = yield isomorphic_fetch_1.default(URL, {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ query: pools_1.default })
                });
                const { data } = yield res.json();
                this.cache = data;
                this.timestamp = Date.now();
            }
            return this.cache;
        });
    }
    formatPoolsBigNumber(pools) {
        return __awaiter(this, void 0, void 0, function* () {
            let onChainPools = { pools: [] };
            for (let i = 0; i < pools.pools.length; i++) {
                let tokens = [];
                let p = {
                    id: pools.pools[i].id,
                    swapFee: bmath.scale(bmath.bnum(pools.pools[i].swapFee), 18),
                    totalWeight: bmath.scale(bmath.bnum(pools.pools[i].totalWeight), 18),
                    tokens: tokens,
                    tokensList: pools.pools[i].tokensList,
                };
                pools.pools[i].tokens.forEach(token => {
                    let decimals = Number(token.decimals);
                    p.tokens.push({
                        address: token.address,
                        balance: bmath.scale(bmath.bnum(token.balance), decimals),
                        decimals: decimals,
                        denormWeight: bmath.scale(bmath.bnum(token.denormWeight), 18),
                    });
                });
                onChainPools.pools.push(p);
            }
            return onChainPools;
        });
    }
}
exports.POOLS = POOLS;
