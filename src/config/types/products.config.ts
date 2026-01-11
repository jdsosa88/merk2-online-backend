export const productsConfig = () => ({
  products: {
    maxImages: parseInt(process.env.PRODUCT_MAX_IMAGES || '10', 10),
  },
});