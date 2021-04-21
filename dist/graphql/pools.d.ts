declare const _default: "\n{\n    pools(where: {\n        publicSwap: true,\n        active: true,\n        tokensCount_gt: 1\n    }) {\n        id\n        swapFee\n        totalWeight\n        tokens {\n            address\n            balance\n            decimals\n            denormWeight\n        }\n        tokensList\n    }\n}";
export default _default;
