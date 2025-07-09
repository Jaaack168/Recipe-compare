// UK Postcode validation and formatting utilities

// Standard UK postcode regex pattern
// Matches formats like: SW1A 1AA, M1 1AA, B33 8TH, W1A 0AX, EC1A 1BB
const UK_POSTCODE_REGEX = /^([A-Za-z][A-Ha-hJ-Yj-y]?[0-9][A-Za-z0-9]?) ?([0-9][A-Za-z]{2})$/;

// More comprehensive regex that handles all UK postcode formats
const FULL_UK_POSTCODE_REGEX = /^(([gG][iI][rR] {0,}0[aA]{2})|((([a-pr-uwyzA-PR-UWYZ][a-hk-yA-HK-Y]?[0-9][0-9]?)|(([a-pr-uwyzA-PR-UWYZ][0-9][a-hjkstuwA-HJKSTUW])|([a-pr-uwyzA-PR-UWYZ][a-hk-yA-HK-Y][0-9][abehmnprv-yABEHMNPRV-Y]))) {0,}[0-9][abd-hjlnp-uw-zABD-HJLNP-UW-Z]{2}))$/;

/**
 * Validates if a string is a valid UK postcode
 */
export const isValidUKPostcode = (postcode: string) => {
  const regex = /^([A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2})$/i;
  return regex.test(postcode.trim());
};

/**
 * Formats a UK postcode to the standard format (e.g., "cw73az" -> "CW7 3AZ")
 */
export function formatUKPostcode(postcode: string): string {
  if (!postcode) return '';
  
  // Remove all spaces and convert to uppercase
  const cleanPostcode = postcode.replace(/\s/g, '').toUpperCase();
  
  // Handle special case for GIR 0AA (Girobank)
  if (cleanPostcode === 'GIR0AA') {
    return 'GIR 0AA';
  }
  
  // Standard format: last 3 characters are the inward code, rest is outward code
  if (cleanPostcode.length >= 5 && cleanPostcode.length <= 7) {
    const inwardCode = cleanPostcode.slice(-3);
    const outwardCode = cleanPostcode.slice(0, -3);
    return `${outwardCode} ${inwardCode}`;
  }
  
  return postcode; // Return original if can't format
}

/**
 * Auto-formats postcode as user types (for real-time formatting)
 */
export function autoFormatPostcode(input: string): string {
  if (!input) return '';
  
  // Remove all spaces first
  const cleanInput = input.replace(/\s/g, '').toUpperCase();
  
  // Don't format if too short
  if (cleanInput.length < 4) {
    return cleanInput;
  }
  
  // Try to format if it looks like it could be complete
  if (cleanInput.length >= 5) {
    return formatUKPostcode(cleanInput);
  }
  
  return cleanInput;
}

/**
 * Gets a user-friendly error message for invalid postcodes
 */
export function getPostcodeError(postcode: string): string | null {
  if (!postcode) {
    return 'Please enter a postcode';
  }
  
  const cleanPostcode = postcode.replace(/\s/g, '');
  
  if (cleanPostcode.length < 5) {
    return 'Postcode is too short';
  }
  
  if (cleanPostcode.length > 7) {
    return 'Postcode is too long';
  }
  
  if (!isValidUKPostcode(postcode)) {
    return 'Please enter a valid UK postcode';
  }
  
  return null;
}

/**
 * Example valid UK postcodes for testing
 */
export const EXAMPLE_POSTCODES = [
  'SW1A 1AA', // Westminster
  'M1 1AA',   // Manchester
  'B33 8TH',  // Birmingham
  'W1A 0AX',  // Oxford Street
  'EC1A 1BB', // City of London
  'GIR 0AA'   // Girobank
]; 