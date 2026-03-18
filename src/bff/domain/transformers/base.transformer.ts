/**
 * Base transformer class for converting backend DTOs to frontend-friendly formats.
 * Transformers handle:
 * - Data formatting (dates, currencies, strings)
 * - Default values for missing fields
 * - Composition of related data
 */
export abstract class BaseTransformer<TInput, TOutput> {
  /**
   * Transform a single item
   */
  abstract transform(input: TInput): TOutput;

  /**
   * Transform an array of items
   */
  transformMany(inputs: TInput[]): TOutput[] {
    return inputs.map((input) => this.transform(input));
  }

  /**
   * Format a date to a human-readable string
   */
  protected formatDate(
    date: string | Date,
    options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  ): string {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString("en-US", options);
  }

  /**
   * Format a relative date (e.g., "Mar 2023")
   */
  protected formatRelativeDate(date: string | Date): string {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  }

  /**
   * Format a currency value
   */
  protected formatCurrency(
    amount: number,
    currency: string = "USD",
    locale: string = "en-US"
  ): string {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(amount);
  }

  /**
   * Format a number with thousand separators
   */
  protected formatNumber(
    num: number,
    locale: string = "en-US"
  ): string {
    return new Intl.NumberFormat(locale).format(num);
  }

  /**
   * Truncate a string to a maximum length
   */
  protected truncate(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength - 3) + "...";
  }

  /**
   * Capitalize first letter of each word
   */
  protected capitalize(str: string): string {
    return str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  /**
   * Convert status to display text
   */
  protected formatStatus(status: string): string {
    return this.capitalize(status.replace(/_/g, " "));
  }

  /**
   * Get a default value if the input is null/undefined
   */
  protected defaultValue<T>(value: T | null | undefined, defaultVal: T): T {
    return value ?? defaultVal;
  }
}
