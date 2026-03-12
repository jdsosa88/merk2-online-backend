export class MoneyUtils {
  /**
   * Convierte decimal a centavos (entero)
   * Ej: 10.99 → 1099
   */
  static decimalToCents(decimal: number): number {
    // Usar Math.round para evitar errores de punto flotante
    return Math.round(decimal * 100);
  }

  /**
   * Convierte centavos a decimal
   * Ej: 1099 → 10.99
   */
  static centsToDecimal(cents: number): number {
    return cents / 100;
  }

  /**
   * Suma valores monetarios (en centavos)
   */
  static sumCents(...amounts: number[]): number {
    return amounts.reduce((total, amount) => total + amount, 0);
  }

  /**
   * Multiplica precio por cantidad (en centavos)
   */
  static multiplyCents(priceInCents: number, quantity: number): number {
    return priceInCents * quantity;
  }

  /**
   * Calcula porcentaje de un valor (en centavos)
   */
  static calculatePercentage(amountInCents: number, percentage: number): number {
    return Math.round((amountInCents * percentage) / 100);
  }

  /**
 * Calcula el porciento dado un valor (en centavos) y el total (en centavos)
 */
  static calculatePercentageOfValue(valueInCents: number, totalAmountInCents: number): number {
    return Math.round((valueInCents / totalAmountInCents) * 100);
  }

  /**
   * Formatea centavos a string con formato monetario
   * Ej: 1099 → "$10.99"
   */
  static formatCents(cents: number, currencySymbol: string = '$'): string {
    const decimal = this.centsToDecimal(cents);
    return `${currencySymbol}${decimal.toFixed(2)}`;
  }

  /**
   * Valida que un número sea un valor monetario válido
   */
  static isValidMoney(amount: number): boolean {
    // Verificar que no sea NaN, infinito, y que tenga máximo 2 decimales
    if (!Number.isFinite(amount)) return false;

    // Verificar que no tenga más de 2 decimales
    const decimalPart = Math.abs(amount) - Math.floor(Math.abs(amount));
    const decimalPlaces = decimalPart.toString().length - 2;
    return decimalPlaces <= 2;
  }

  /**
   * Redondea a 2 decimales (para entrada de usuario)
   */
  static roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
  }
}