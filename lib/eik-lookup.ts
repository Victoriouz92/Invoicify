/**
 * EIK Company Lookup Module (Mock Implementation)
 *
 * WHAT IT IS: A function that attempts to fetch company data by EIK from
 * the Bulgarian Trade Registry (ТРРЮЛНЦ).
 * WHY IT EXISTS: To auto-fill company name, address, and MOL after a valid EIK
 * is entered — saving the user time and reducing typos.
 * REAL WORLD ANALOGY: Like typing a phone number and the contact name auto-fills.
 *
 * CURRENT STATE: This is a mock/skeleton implementation. The Bulgarian Trade
 * Registry (https://portal.registryagency.bg) does not have a free public API.
 * 
 * TO INTEGRATE A REAL API LATER:
 * - Option A: Use a CORS proxy to scrape from the Trade Registry portal
 * - Option B: Use papagal.bg API or similar Bulgarian company lookup service
 * - Option C: Use a paid commercial API (e.g., borgun.bg, companywall.bg)
 * 
 * Replace the body of lookupCompanyByEIK with the actual API call.
 */

export interface CompanyLookupResult {
  name: string;
  address: string;
  mol: string;
}

/**
 * Attempts to look up company data by EIK number.
 * 
 * @param eik - A valid 9-digit Bulgarian EIK number
 * @returns Company data if found, or null if not found / API unavailable
 */
export async function lookupCompanyByEIK(
  eik: string
): Promise<CompanyLookupResult | null> {
  // Simulate network delay to show the loading UX
  await new Promise((resolve) => setTimeout(resolve, 800));

  // TODO: Replace this with a real API call. Example integration:
  //
  // try {
  //   const response = await fetch(`https://api.example.bg/company/${eik}`);
  //   if (!response.ok) return null;
  //   const data = await response.json();
  //   return {
  //     name: data.companyName,
  //     address: data.registeredAddress,
  //     mol: data.representativeName,
  //   };
  // } catch {
  //   return null;
  // }

  // Mock: always return null (no data found)
  // This means fields stay empty for manual entry.
  return null;
}
