export default `
{
    pools(where: {
        publicSwap: true,
        active: true,
        tokensCount_gt: 1
    }) {
        id
        swapFee
        totalWeight
        tokens {
            address
            balance
            decimals
            denormWeight
        }
        tokensList
    }
}`;
