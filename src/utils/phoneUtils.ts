/**
 * Utility functions for handling and normalizing Nigerian and international phone numbers
 * for WhatsApp links and phone call dialer (tel:) links.
 */

/**
 * Normalizes phone number into WhatsApp-compatible format (e.g. "2348012345678").
 * Strips non-digits, converts leading local 0 to 234 country code.
 */
export function formatWhatsAppNumber(phone?: string | null): string | null {
  if (!phone) return null;
  const cleaned = phone.trim();
  if (!cleaned) return null;

  // Remove all non-numeric characters
  const digits = cleaned.replace(/\D/g, '');
  if (!digits || digits.length < 7) return null;

  // Nigerian number starting with local 0 (11 digits e.g. 08012345678)
  if (digits.length === 11 && digits.startsWith('0')) {
    return '234' + digits.substring(1);
  }

  // Nigerian number 10 digits without leading 0 e.g. 8012345678 or 7012345678
  if (digits.length === 10 && (digits.startsWith('7') || digits.startsWith('8') || digits.startsWith('9'))) {
    return '234' + digits;
  }

  // International format starting with 234
  if (digits.startsWith('234')) {
    return digits;
  }

  // General fallback for valid digit length
  return digits;
}

/**
 * Formats phone number for tel: links (e.g. "+2348012345678").
 */
export function formatCallNumber(phone?: string | null): string | null {
  if (!phone) return null;
  const cleaned = phone.trim();
  if (!cleaned) return null;

  const digits = cleaned.replace(/\D/g, '');
  if (!digits || digits.length < 7) return null;

  // If already starts with +
  if (cleaned.startsWith('+')) {
    return `+${digits}`;
  }

  // Nigerian 11-digit local number e.g. 08012345678
  if (digits.length === 11 && digits.startsWith('0')) {
    return `+234${digits.substring(1)}`;
  }

  // Nigerian 10-digit number e.g. 8012345678
  if (digits.length === 10 && (digits.startsWith('7') || digits.startsWith('8') || digits.startsWith('9'))) {
    return `+234${digits}`;
  }

  if (digits.startsWith('234')) {
    return `+${digits}`;
  }

  return `+${digits}`;
}

/**
 * Formats phone number for display (e.g. "+234 801 234 5678" or "0801 234 5678").
 */
export function formatDisplayPhone(phone?: string | null): string {
  if (!phone) return 'Not Provided';
  const cleaned = phone.trim();
  if (!cleaned) return 'Not Provided';
  return cleaned;
}
