"use client";

/**
 * CompanySection — form fields for the user's own company information.
 *
 * WHAT IT IS: A form section where users enter their company details (name, EIK, address, etc.)
 * WHY IT EXISTS: Every Bulgarian invoice must include the issuer's company data.
 * REAL WORLD ANALOGY: Like the "From:" section on a paper invoice — who is sending it.
 */

import { useState, useCallback, useRef } from "react";
import { Loader2 } from "lucide-react";
import { useInvoiceStore } from "@/lib/store";
import { validateEIK } from "@/lib/eik-validator";
import { lookupCompanyByEIK } from "@/lib/eik-lookup";
import { useTranslations } from "@/lib/i18n";
import { ACCEPTED_LOGO_TYPES, VALIDATION_LIMITS } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CompanySection() {
  const { t } = useTranslations();
  const company = useInvoiceStore((s) => s.company);
  const setCompany = useInvoiceStore((s) => s.setCompany);

  const [eikError, setEikError] = useState<string | null>(null);
  const [eikLoading, setEikLoading] = useState(false);
  const [eikAutoFilled, setEikAutoFilled] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: string, value: string) => {
    setCompany({ [field]: value });
  };

  // EIK validation on blur + auto-fill attempt
  const handleEikBlur = async () => {
    if (!company.eik) {
      setEikError(null);
      return;
    }
    const result = validateEIK(company.eik);
    if (!result.valid) {
      const messages: Record<string, string> = {
        non_digits: t.eikNonDigits,
        wrong_length: t.eikWrongLength,
        invalid_checksum: t.eikInvalidChecksum,
      };
      setEikError(messages[result.error!] || t.eikInvalid);
      return;
    }
    setEikError(null);

    // Attempt EIK lookup for auto-fill
    setEikLoading(true);
    try {
      const result = await lookupCompanyByEIK(company.eik);
      if (result.data) {
        setCompany({ name: result.data.name, address: result.data.address, mol: result.data.mol });
        setEikAutoFilled(true);
        setTimeout(() => setEikAutoFilled(false), 4000);
      }
    } finally {
      setEikLoading(false);
    }
  };

  // Logo file validation and processing
  const processLogoFile = useCallback(
    (file: File) => {
      setLogoError(null);
      const accepted = ACCEPTED_LOGO_TYPES as readonly string[];
      if (!accepted.includes(file.type)) {
        setLogoError(t.logoInvalidType);
        return;
      }
      if (file.size > VALIDATION_LIMITS.maxLogoSizeBytes) {
        setLogoError(t.logoTooLarge);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setCompany({ logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    },
    [setCompany, t]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processLogoFile(file);
  };
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processLogoFile(file);
    e.target.value = "";
  };
  const handleRemoveLogo = () => {
    setCompany({ logo: null });
    setLogoError(null);
  };

  return (
    <section
      className="rounded-lg border border-border p-4 space-y-4"
      aria-labelledby="company-section-heading"
    >
      <h3 id="company-section-heading" className="text-sm font-semibold text-foreground">
        {t.myCompany}
      </h3>

      {/* Company Name */}
      <div className="space-y-1">
        <Label htmlFor="company-name">{t.companyName}</Label>
        <Input
          id="company-name"
          value={company.name}
          onChange={(e) => handleChange("name", e.target.value)}
          maxLength={VALIDATION_LIMITS.maxNameLength}
          placeholder={t.companyNamePlaceholder}
        />
      </div>

      {/* EIK */}
      <div className="space-y-1">
        <Label htmlFor="company-eik">{t.eik}</Label>
        <div className="relative">
          <Input
            id="company-eik"
            aria-invalid={!!eikError}
            value={company.eik}
            onChange={(e) => {
              handleChange("eik", e.target.value);
              if (eikError) setEikError(null);
            }}
            onBlur={handleEikBlur}
            maxLength={9}
            placeholder={t.eikPlaceholder}
          />
          {eikLoading && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              {t.eikSearching}
            </span>
          )}
        </div>
        {eikError && (
          <p className="text-xs text-destructive" role="alert">{eikError}</p>
        )}
        {eikAutoFilled && (
          <p className="text-xs text-green-600 dark:text-green-400">{t.eikAutoFilled}</p>
        )}
      </div>

      {/* Address */}
      <div className="space-y-1">
        <Label htmlFor="company-address">{t.address}</Label>
        <Input
          id="company-address"
          value={company.address}
          onChange={(e) => handleChange("address", e.target.value)}
          maxLength={VALIDATION_LIMITS.maxAddressLength}
          placeholder={t.addressPlaceholder}
        />
      </div>

      {/* MOL */}
      <div className="space-y-1">
        <Label htmlFor="company-mol">{t.mol}</Label>
        <Input
          id="company-mol"
          value={company.mol}
          onChange={(e) => handleChange("mol", e.target.value)}
          maxLength={VALIDATION_LIMITS.maxMolLength}
          placeholder={t.molPlaceholder}
        />
      </div>

      {/* IBAN */}
      <div className="space-y-1">
        <Label htmlFor="company-iban">{t.iban}</Label>
        <Input
          id="company-iban"
          value={company.iban}
          onChange={(e) => handleChange("iban", e.target.value)}
          placeholder={t.ibanPlaceholder}
        />
      </div>

      {/* VAT Number */}
      <div className="space-y-1">
        <Label htmlFor="company-vat">{t.vatNumber}</Label>
        <Input
          id="company-vat"
          value={company.vatNumber}
          onChange={(e) => handleChange("vatNumber", e.target.value)}
          placeholder={t.vatNumberPlaceholder}
        />
      </div>

      {/* VAT Reason — shown when vatNumber is empty */}
      {!company.vatNumber && (
        <div className="space-y-1">
          <Label htmlFor="company-vat-reason">{t.vatReason}</Label>
          <Input
            id="company-vat-reason"
            value={company.vatReason}
            onChange={(e) => handleChange("vatReason", e.target.value)}
            maxLength={VALIDATION_LIMITS.maxVatReasonLength}
            placeholder={t.vatReasonPlaceholder}
          />
        </div>
      )}

      {/* Logo Upload */}
      <div className="space-y-1">
        <Label>{t.companyLogo}</Label>
        {company.logo && (
          <div className="flex items-center gap-3">
            <img
              src={company.logo}
              alt="Company logo preview"
              className="rounded border border-border object-contain"
              style={{ maxWidth: 200, maxHeight: 200 }}
            />
            <button
              type="button"
              onClick={handleRemoveLogo}
              className="text-xs text-destructive hover:underline"
              aria-label={t.removeLogo}
            >
              {t.removeLogo}
            </button>
          </div>
        )}
        {!company.logo && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label={t.companyLogo}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors ${
              isDragging
                ? "border-ring bg-ring/10"
                : "border-border hover:border-ring/50"
            }`}
          >
            <p className="text-xs text-muted-foreground text-center">{t.logoDropText}</p>
            <p className="text-xs text-muted-foreground mt-1">{t.logoDropFormats}</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_LOGO_TYPES.join(",")}
          onChange={handleFileInputChange}
          className="hidden"
          aria-hidden="true"
        />
        {logoError && (
          <p className="text-xs text-destructive" role="alert">{logoError}</p>
        )}
      </div>
    </section>
  );
}
