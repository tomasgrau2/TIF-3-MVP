export interface DateParseResult {
  isValid: boolean;
  date: Date | null;
  format: string | null;
  error?: string;
}

export interface DateFormat {
  pattern: RegExp;
  format: string;
  parser: (matches: RegExpMatchArray) => Date | null;
}

// Date format patterns and parsers
const DATE_FORMATS: DateFormat[] = [
  // MM/YYYY format (e.g., 12/2024)
  {
    pattern: /^(\d{1,2})\/(\d{4})$/,
    format: 'MM/YYYY',
    parser: (matches) => {
      const month = parseInt(matches[1]) - 1; // 0-based month
      const year = parseInt(matches[2]);
      if (month >= 0 && month <= 11 && year >= 1900 && year <= 2100) {
        return new Date(year, month, 1);
      }
      return null;
    }
  },
  
  // MM.YYYY format (e.g., 12.2024)
  {
    pattern: /^(\d{1,2})\.(\d{4})$/,
    format: 'MM.YYYY',
    parser: (matches) => {
      const month = parseInt(matches[1]) - 1;
      const year = parseInt(matches[2]);
      if (month >= 0 && month <= 11 && year >= 1900 && year <= 2100) {
        return new Date(year, month, 1);
      }
      return null;
    }
  },
  
  // MM-YYYY format (e.g., 12-2024)
  {
    pattern: /^(\d{1,2})-(\d{4})$/,
    format: 'MM-YYYY',
    parser: (matches) => {
      const month = parseInt(matches[1]) - 1;
      const year = parseInt(matches[2]);
      if (month >= 0 && month <= 11 && year >= 1900 && year <= 2100) {
        return new Date(year, month, 1);
      }
      return null;
    }
  },
  
  // MM/YY format (e.g., 12/24)
  {
    pattern: /^(\d{1,2})\/(\d{2})$/,
    format: 'MM/YY',
    parser: (matches) => {
      const month = parseInt(matches[1]) - 1;
      const year = parseInt(matches[2]);
      // Para fechas de vencimiento, asumir años futuros cercanos
      // Años 00-99 se interpretan como 2000-2099
      const fullYear = 2000 + year;
      if (month >= 0 && month <= 11) {
        return new Date(fullYear, month, 1);
      }
      return null;
    }
  },
  
  // MM.YY format (e.g., 12.24)
  {
    pattern: /^(\d{1,2})\.(\d{2})$/,
    format: 'MM.YY',
    parser: (matches) => {
      const month = parseInt(matches[1]) - 1;
      const year = parseInt(matches[2]);
      // Para fechas de vencimiento, asumir años futuros cercanos
      // Años 00-99 se interpretan como 2000-2099
      const fullYear = 2000 + year;
      if (month >= 0 && month <= 11) {
        return new Date(fullYear, month, 1);
      }
      return null;
    }
  },
  
  // MM-YY format (e.g., 12-24)
  {
    pattern: /^(\d{1,2})-(\d{2})$/,
    format: 'MM-YY',
    parser: (matches) => {
      const month = parseInt(matches[1]) - 1;
      const year = parseInt(matches[2]);
      // Para fechas de vencimiento, asumir años futuros cercanos
      // Años 00-99 se interpretan como 2000-2099
      const fullYear = 2000 + year;
      if (month >= 0 && month <= 11) {
        return new Date(fullYear, month, 1);
      }
      return null;
    }
  },
  
  // DD/MM/YYYY format (e.g., 25/12/2024)
  {
    pattern: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    format: 'DD/MM/YYYY',
    parser: (matches) => {
      const day = parseInt(matches[1]);
      const month = parseInt(matches[2]) - 1;
      const year = parseInt(matches[3]);
      if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 1900 && year <= 2100) {
        const date = new Date(year, month, day);
        // Validate that the date is valid (handles leap years, etc.)
        if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) {
          return date;
        }
      }
      return null;
    }
  },
  
  // DD.MM.YYYY format (e.g., 25.12.2024)
  {
    pattern: /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/,
    format: 'DD.MM.YYYY',
    parser: (matches) => {
      const day = parseInt(matches[1]);
      const month = parseInt(matches[2]) - 1;
      const year = parseInt(matches[3]);
      if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 1900 && year <= 2100) {
        const date = new Date(year, month, day);
        if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) {
          return date;
        }
      }
      return null;
    }
  },
  
  // YYYY-MM-DD format (e.g., 2024-12-25)
  {
    pattern: /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    format: 'YYYY-MM-DD',
    parser: (matches) => {
      const year = parseInt(matches[1]);
      const month = parseInt(matches[2]) - 1;
      const day = parseInt(matches[3]);
      if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 1900 && year <= 2100) {
        const date = new Date(year, month, day);
        if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) {
          return date;
        }
      }
      return null;
    }
  }
];

/**
 * Parse a date string using multiple format patterns
 */
export function parseDate(dateString: string): DateParseResult {
  if (!dateString || typeof dateString !== 'string') {
    return {
      isValid: false,
      date: null,
      format: null,
      error: 'Invalid input: must be a non-empty string'
    };
  }

  const trimmedDate = dateString.trim();
  
  if (trimmedDate.length === 0) {
    return {
      isValid: false,
      date: null,
      format: null,
      error: 'Empty date string'
    };
  }

  // Try each format pattern
  for (const dateFormat of DATE_FORMATS) {
    const matches = trimmedDate.match(dateFormat.pattern);
    if (matches) {
      try {
        const parsedDate = dateFormat.parser(matches);
        if (parsedDate) {
          return {
            isValid: true,
            date: parsedDate,
            format: dateFormat.format
          };
        }
      } catch (error) {
        console.warn(`Error parsing date with format ${dateFormat.format}:`, error);
      }
    }
  }

  return {
    isValid: false,
    date: null,
    format: null,
    error: `Unrecognized date format. Supported formats: ${DATE_FORMATS.map(f => f.format).join(', ')}`
  };
}

/**
 * Format a date to a specific format string
 */
export function formatDate(date: Date, format: string): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const shortYear = String(year).slice(-2);

  switch (format) {
    case 'MM/YYYY':
      return `${month}/${year}`;
    case 'MM.YYYY':
      return `${month}.${year}`;
    case 'MM-YYYY':
      return `${month}-${year}`;
    case 'MM/YY':
      return `${month}/${shortYear}`;
    case 'MM.YY':
      return `${month}.${shortYear}`;
    case 'MM-YY':
      return `${month}-${shortYear}`;
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'DD.MM.YYYY':
      return `${day}.${month}.${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    default:
      return date.toISOString().split('T')[0]; // Default to YYYY-MM-DD
  }
}

/**
 * Get all supported date formats
 */
export function getSupportedFormats(): string[] {
  return DATE_FORMATS.map(format => format.format);
}

/**
 * Validate if a date string matches any supported format
 */
export function isValidDateFormat(dateString: string): boolean {
  return parseDate(dateString).isValid;
}

/**
 * Get format suggestions based on partial input
 */
export function getFormatSuggestions(partialInput: string): string[] {
  if (!partialInput || partialInput.length < 2) {
    return [];
  }

  const suggestions: string[] = [];
  
  // Check for common patterns in the input
  if (partialInput.includes('/')) {
    if (partialInput.match(/^\d{1,2}\/\d{0,2}$/)) {
      suggestions.push('MM/YY');
    } else if (partialInput.match(/^\d{1,2}\/\d{0,4}$/)) {
      suggestions.push('MM/YYYY');
    } else if (partialInput.match(/^\d{1,2}\/\d{1,2}\/\d{0,4}$/)) {
      suggestions.push('DD/MM/YYYY');
    }
  }
  
  if (partialInput.includes('.')) {
    if (partialInput.match(/^\d{1,2}\.\d{0,2}$/)) {
      suggestions.push('MM.YY');
    } else if (partialInput.match(/^\d{1,2}\.\d{0,4}$/)) {
      suggestions.push('MM.YYYY');
    } else if (partialInput.match(/^\d{1,2}\.\d{1,2}\.\d{0,4}$/)) {
      suggestions.push('DD.MM.YYYY');
    }
  }
  
  if (partialInput.includes('-')) {
    if (partialInput.match(/^\d{1,2}-\d{0,2}$/)) {
      suggestions.push('MM-YY');
    } else if (partialInput.match(/^\d{1,2}-\d{0,4}$/)) {
      suggestions.push('MM-YYYY');
    } else if (partialInput.match(/^\d{4}-\d{1,2}-\d{0,2}$/)) {
      suggestions.push('YYYY-MM-DD');
    }
  }

  return suggestions;
}

/**
 * Convert a date to a standardized format for storage
 */
export function toStandardFormat(date: Date): string {
  return formatDate(date, 'YYYY-MM-DD');
}

/**
 * Get a user-friendly display format for a date
 */
export function toDisplayFormat(date: Date): string {
  return formatDate(date, 'DD/MM/YYYY');
} 