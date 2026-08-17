/**
 * Utility functions for validating and formatting Nepali Mobile Numbers
 * Rules:
 * 1. Must be exactly 10 digits
 * 2. Must start with 98, 97, or 96 (Nepal Telecom / Ncell / Smart Cell standard prefix)
 */

export interface PhoneValidationResult {
  isValid: boolean;
  message: string;
  cleanPhone: string;
}

export function cleanPhoneNumber(input: string): string {
  if (!input) return '';
  // Strip all non-digit characters
  let digits = input.replace(/\D/g, '');
  
  // Handle international prefix +977 or 977 if present
  if (digits.startsWith('977') && digits.length === 13) {
    digits = digits.slice(3);
  } else if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.slice(1);
  }
  
  return digits.slice(0, 10);
}

export function isValidNepaliPhoneNumber(phone: string): boolean {
  const clean = cleanPhoneNumber(phone);
  return /^(98|97|96)\d{8}$/.test(clean);
}

export function validateNepaliPhoneNumber(phone: string, isRequired = true): PhoneValidationResult {
  const clean = cleanPhoneNumber(phone);

  if (!clean) {
    if (isRequired) {
      return {
        isValid: false,
        message: 'Phone number is required.',
        cleanPhone: '',
      };
    }
    return {
      isValid: true,
      message: '',
      cleanPhone: '',
    };
  }

  if (clean.length < 10) {
    return {
      isValid: false,
      message: `Phone number must be exactly 10 digits (${clean.length}/10 entered).`,
      cleanPhone: clean,
    };
  }

  if (clean.length > 10) {
    return {
      isValid: false,
      message: 'Phone number cannot exceed 10 digits.',
      cleanPhone: clean.slice(0, 10),
    };
  }

  const prefix = clean.slice(0, 2);
  if (!['98', '97', '96'].includes(prefix)) {
    return {
      isValid: false,
      message: `Phone number must start with 98, 97, or 96 (starts with '${prefix}').`,
      cleanPhone: clean,
    };
  }

  return {
    isValid: true,
    message: '',
    cleanPhone: clean,
  };
}
