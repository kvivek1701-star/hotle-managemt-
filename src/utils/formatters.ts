/**
 * Utility functions for Indian Rupee (₹) currency formatting
 * Follows the Indian numbering system (Lakhs and Crores: 1,00,000.00)
 */

export const formatINR = (
  amount: number | string | undefined | null,
  options?: {
    showDecimals?: boolean;
    includeSymbol?: boolean;
  }
): string => {
  const numericAmount = typeof amount === 'number' ? amount : parseFloat(String(amount || 0));
  if (isNaN(numericAmount)) {
    return options?.includeSymbol !== false ? '₹0' : '0';
  }

  const showDecimals = options?.showDecimals ?? false;
  const includeSymbol = options?.includeSymbol ?? true;
  const symbol = includeSymbol ? '₹' : '';

  const formatted = numericAmount.toLocaleString('en-IN', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 2,
  });

  return `${symbol}${formatted}`;
};

/**
 * Converts a numeric amount to English words using Indian denomination (Rupees & Paise)
 */
export const numberToWordsINR = (amount: number): string => {
  const ones = [
    '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
    'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
    'seventeen', 'eighteen', 'nineteen',
  ];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  const num = Math.floor(Math.abs(amount));
  const decimalPart = Math.round((Math.abs(amount) - num) * 100);

  if (num === 0) {
    return decimalPart > 0 ? `Zero rupees and ${decimalPart}/100 paise only` : 'Zero rupees only';
  }

  const convertLessThanOneThousand = (n: number): string => {
    let current = '';
    if (n >= 100) {
      current += `${ones[Math.floor(n / 100)]} hundred `;
      n %= 100;
    }
    if (n >= 20) {
      current += `${tens[Math.floor(n / 10)]} `;
      n %= 10;
    }
    if (n > 0) {
      current += `${ones[n]} `;
    }
    return current.trim();
  };

  let words = '';
  let crore = Math.floor(num / 10000000);
  let lakh = Math.floor((num % 10000000) / 100000);
  let thousand = Math.floor((num % 100000) / 1000);
  let remainder = num % 1000;

  if (crore > 0) {
    words += `${convertLessThanOneThousand(crore)} crore `;
  }
  if (lakh > 0) {
    words += `${convertLessThanOneThousand(lakh)} lakh `;
  }
  if (thousand > 0) {
    words += `${convertLessThanOneThousand(thousand)} thousand `;
  }
  if (remainder > 0) {
    words += `${convertLessThanOneThousand(remainder)} `;
  }

  words = words.trim();
  const capitalized = words.charAt(0).toUpperCase() + words.slice(1);
  return `${capitalized} rupees ${decimalPart > 0 ? `and ${decimalPart}/100 paise` : 'only'}`;
};
