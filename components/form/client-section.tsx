"use client";

/**
 * ClientSection — Form section for the invoice recipient (client).
 *
 * WHAT IT IS: A form that captures client company name, EIK, address, and MOL.
 * WHY IT EXISTS: Every Bulgarian invoice must have recipient details.
 * REAL WORLD ANALOGY: Like a Rolodex — flip to an existing client or add a new one.
 */

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useInvoiceStore } from "@/lib/store";
import { validateEIK } from "@/lib/eik-validator";
import { lookupCompanyByEIK } from "@/lib/eik-lookup";
import { useTranslations } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ClientSection() {
  const { t } = useTranslations();
  const client = useInvoiceStore((s) => s.client);
  const savedClients = useInvoiceStore((s) => s.savedClients);
  const setClient = useInvoiceStore((s) => s.setClient);
  const saveClient = useInvoiceStore((s) => s.saveClient);

  const [eikError, setEikError] = useState<string | null>(null);
  const [eikLoading, setEikLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  function handleClientSelect(value: string | null) {
    if (!value) return;
    if (value === "__new__") {
      setClient({ name: "", eik: "", address: "", mol: "" });
      setEikError(null);
      return;
    }
    const selected = savedClients.find((c) => c.id === value);
    if (selected) {
      setClient({
        id: selected.id,
        name: selected.name,
        eik: selected.eik,
        address: selected.address,
        mol: selected.mol,
      });
      setEikError(null);
    }
  }

  async function handleEikBlur() {
    if (!client.eik) {
      setEikError(null);
      return;
    }
    const result = validateEIK(client.eik);
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
      const data = await lookupCompanyByEIK(client.eik);
      if (data) {
        setClient({ name: data.name, address: data.address, mol: data.mol });
      }
    } finally {
      setEikLoading(false);
    }
  }

  function isClientComplete(): boolean {
    if (!client.name || !client.eik || !client.address || !client.mol) return false;
    return validateEIK(client.eik).valid;
  }

  function handleSaveClient() {
    try {
      saveClient(client);
      setSaveMessage(t.clientSaved);
      setTimeout(() => setSaveMessage(null), 3000);
    } catch {
      setSaveMessage(t.clientSaveError);
      setTimeout(() => setSaveMessage(null), 4000);
    }
  }

  return (
    <section className="rounded-lg border border-border p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">{t.client}</h3>

      {/* Saved client dropdown */}
      {savedClients.length > 0 && (
        <div className="space-y-1">
          <Label htmlFor="client-select">{t.selectClient}</Label>
          <Select value={client.id} onValueChange={(value) => handleClientSelect(value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t.selectClientPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {savedClients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name || t.noName}
                </SelectItem>
              ))}
              <SelectSeparator />
              <SelectItem value="__new__">{t.addNew}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Client Name */}
      <div className="space-y-1">
        <Label htmlFor="client-name">{t.clientName}</Label>
        <Input
          id="client-name"
          value={client.name}
          onChange={(e) => setClient({ name: e.target.value })}
          placeholder={t.clientNamePlaceholder}
          maxLength={200}
        />
      </div>

      {/* Client EIK */}
      <div className="space-y-1">
        <Label htmlFor="client-eik">{t.eik}</Label>
        <div className="relative">
          <Input
            id="client-eik"
            value={client.eik}
            onChange={(e) => {
              setClient({ eik: e.target.value });
              if (eikError) setEikError(null);
            }}
            onBlur={handleEikBlur}
            placeholder={t.eikPlaceholder}
            maxLength={9}
            aria-invalid={!!eikError}
          />
          {eikLoading && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              {t.eikSearching}
            </span>
          )}
        </div>
        {eikError && (
          <p className="text-xs text-destructive">{eikError}</p>
        )}
      </div>

      {/* Client Address */}
      <div className="space-y-1">
        <Label htmlFor="client-address">{t.clientAddress}</Label>
        <Input
          id="client-address"
          value={client.address}
          onChange={(e) => setClient({ address: e.target.value })}
          placeholder={t.clientAddressPlaceholder}
          maxLength={500}
        />
      </div>

      {/* Client MOL */}
      <div className="space-y-1">
        <Label htmlFor="client-mol">{t.clientMol}</Label>
        <Input
          id="client-mol"
          value={client.mol}
          onChange={(e) => setClient({ mol: e.target.value })}
          placeholder={t.clientMolPlaceholder}
          maxLength={200}
        />
      </div>

      {/* Save client button */}
      {isClientComplete() && (
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleSaveClient}
            className="text-xs text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
          >
            {t.saveClient}
          </button>
          {saveMessage && (
            <span className="text-xs text-muted-foreground">{saveMessage}</span>
          )}
        </div>
      )}
    </section>
  );
}
