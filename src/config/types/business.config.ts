export const businessConfig = () => ({
  business: {
    maxEmployees: parseInt(process.env.BUSINESS_MAX_EMPLOYEES || '50', 10),
    maxProducts: parseInt(process.env.BUSINESS_MAX_PRODUCTS || '1000', 10),
  }
});