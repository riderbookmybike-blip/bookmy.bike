
export const calculateDealerPrice = (productId: string) => {
    return { sellingPrice: 85000, source: 'STANDARD' };
};

export const isProductEnabledForDealer = (productId: string) => {
    return true;
};
