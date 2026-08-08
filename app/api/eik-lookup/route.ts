/**
 * EIK Lookup API Route (Next.js Server-Side Proxy)
 *
 * WHAT IT IS: A server-side endpoint that attempts to fetch company data
 * by EIK number from publicly accessible Bulgarian sources.
 *
 * WHY IT EXISTS: To auto-fill company name, address, and MOL when the user
 * enters a valid EIK — saving time and reducing typos.
 *
 * CURRENT STATUS: The Bulgarian Trade Registry (portal.registryagency.bg)
 * does NOT expose a public JSON API. It's a Single Page Application that
 * returns HTML for all routes. There is no free, reliable, publicly accessible
 * API for EIK lookups without authentication or paid plans.
 *
 * WHAT THIS ROUTE DOES NOW:
 * 1. Validates the EIK input
 * 2. Returns a "service_unavailable" status with a link to the Trade Registry
 *    where the user can manually look up the company
 * 3. In the future, this can be connected to a paid API service or a
 *    custom scraping solution
 *
 * FALLBACK: The user can always fill fields manually. This feature is
 * a convenience, not a requirement.
 */

import { NextRequest, NextResponse } from "next/server";
import { validateEIK } from "@/lib/eik-validator";

export async function GET(request: NextRequest) {
  const eik = request.nextUrl.searchParams.get("eik");

  // Validate input
  if (!eik || !validateEIK(eik).valid) {
    return NextResponse.json({ error: "invalid_eik" }, { status: 400 });
  }

  // The Bulgarian Trade Registry does not expose a public JSON API.
  // Return a helpful response with a link for manual lookup.
  return NextResponse.json(
    {
      error: "service_unavailable",
      message: "Автоматичното търсене по ЕИК не е налично. Моля, попълнете данните ръчно.",
      lookupUrl: `https://portal.registryagency.bg/CR/Reports/VerificationPersonOrg?uic=${eik}`,
    },
    { status: 503 }
  );
}
