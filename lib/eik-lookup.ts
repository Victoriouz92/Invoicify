/**
 * EIK Company Lookup Module
 *
 * WHAT IT IS: A function that attempts to fetch company data by EIK number
 * from our server-side API route.
 * WHY IT EXISTS: To auto-fill company name, address, and MOL after a valid EIK
 * is entered — saving the user time and reducing typos.
 *
 * CURRENT STATUS: The Bulgarian Trade Registry does NOT expose a public JSON API.
 * Until a paid API service is integrated, this function will return null and
 * provide a link for manual lookup at the Trade Registry portal.
 *
 * REAL WORLD ANALOGY: Like trying to auto-fill an address from a ZIP code —
 * if the lookup service is down, you just type it yourself.
 */

export interface CompanyLookupResult {
  name: string;
  address: string;
  mol: string;
}

export interface LookupResponse {
  data: CompanyLookupResult | null;
  lookupUrl?: string;
  message?: string;
}

/**
 * Attempts to look up company data by EIK number.
 *
 * Returns null gracefully when the service is unavailable.
 * Also returns a URL where the user can manually look up the company.
 *
 * @param eik - A valid 9-digit Bulgarian EIK number
 * @returns Lookup result with data (if found) and manual lookup URL
 */
export async function lookupCompanyByEIK(
  eik: string
): Promise<LookupResponse> {
  try {
    const response = await fetch(`/api/eik-lookup?eik=${eik}`);
    const data = await response.json();

    // Service unavailable — return the manual lookup URL
    if (data.error === "service_unavailable") {
      return {
        data: null,
        lookupUrl: data.lookupUrl,
        message: data.message,
      };
    }

    // Any other error (invalid_eik, etc.)
    if (data.error || !response.ok) {
      return { data: null };
    }

    return {
      data: {
        name: data.name || "",
        address: data.address || "",
        mol: data.mol || "",
      },
    };
  } catch {
    // Network error, timeout, or any other failure
    return { data: null };
  }
}
