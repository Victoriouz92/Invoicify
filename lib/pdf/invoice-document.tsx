/**
 * InvoicePDF — React PDF document component for generating invoice PDFs.
 *
 * WHAT IT IS: A @react-pdf/renderer Document component that renders the invoice as a PDF.
 * WHY IT EXISTS: This is the actual PDF template that gets converted to a downloadable file.
 * REAL WORLD ANALOGY: Like a print template — it defines exactly how the invoice looks on paper.
 *
 * NOTE: This is a placeholder structure. Task 10.1 will implement the full template
 * with all legally required fields, Cyrillic fonts, and proper layout.
 */

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { CompanyData, ClientData, InvoiceDetails, LineItem, TotalsResult } from "@/lib/types";

/**
 * Register Roboto font (supports Cyrillic U+0400–U+04FF).
 * Files are in public/fonts/ and served by Next.js at /fonts/*.
 * @react-pdf/renderer fetches these via HTTP during PDF generation.
 */
const fontBaseUrl = typeof window !== "undefined" 
  ? window.location.origin 
  : "http://localhost:3000";

Font.register({
  family: "Roboto",
  fonts: [
    {
      src: `${fontBaseUrl}/fonts/Roboto-Regular.ttf`,
      fontWeight: 400,
    },
    {
      src: `${fontBaseUrl}/fonts/Roboto-Bold.ttf`,
      fontWeight: 700,
    },
  ],
});

/** Props needed to render a complete invoice PDF */
export interface InvoicePDFProps {
  company: CompanyData;
  client: ClientData;
  invoiceDetails: InvoiceDetails;
  lineItems: LineItem[];
  totals: TotalsResult;
  label: "original" | "copy";
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Roboto",
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    marginBottom: 10,
    textAlign: "center",
  },
  label: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 20,
  },
  section: {
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  text: {
    marginBottom: 4,
  },
});

/**
 * The main PDF document component.
 * Used with `pdf(<InvoicePDF {...props} />).toBlob()` to generate a PDF blob.
 */
export function InvoicePDF({
  company,
  client,
  invoiceDetails,
  lineItems,
  totals,
  label,
}: InvoicePDFProps) {
  const labelText = label === "original" ? "Оригинал" : "Копие";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Label */}
        <Text style={styles.label}>{labelText}</Text>

        {/* Title */}
        <Text style={styles.title}>
          Фактура № {invoiceDetails.invoiceNumber}
        </Text>

        {/* Dates */}
        <View style={styles.section}>
          <Text style={styles.text}>
            Дата на издаване: {invoiceDetails.dateOfIssue}
          </Text>
          <Text style={styles.text}>
            Дата на данъчно събитие: {invoiceDetails.dateOfTaxEvent}
          </Text>
        </View>

        {/* Supplier */}
        <View style={styles.section}>
          <Text style={styles.text}>Доставчик: {company.name}</Text>
          <Text style={styles.text}>ЕИК: {company.eik}</Text>
          <Text style={styles.text}>Адрес: {company.address}</Text>
          <Text style={styles.text}>МОЛ: {company.mol}</Text>
          {company.vatNumber && (
            <Text style={styles.text}>ДДС №: {company.vatNumber}</Text>
          )}
          {!company.vatNumber && company.vatReason && (
            <Text style={styles.text}>
              Основание за неначисляване: {company.vatReason}
            </Text>
          )}
        </View>

        {/* Recipient */}
        <View style={styles.section}>
          <Text style={styles.text}>Получател: {client.name}</Text>
          <Text style={styles.text}>ЕИК: {client.eik}</Text>
          <Text style={styles.text}>Адрес: {client.address}</Text>
          <Text style={styles.text}>МОЛ: {client.mol}</Text>
        </View>

        {/* Line Items */}
        <View style={styles.section}>
          {lineItems.map((item, index) => (
            <View key={item.id} style={styles.row}>
              <Text>
                {index + 1}. {item.description}
              </Text>
              <Text>
                {item.quantity} x {item.unitPrice.toFixed(2)} ={" "}
                {item.lineTotal.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.section}>
          <Text style={styles.text}>
            Данъчна основа: {totals.taxBase.toFixed(2)} лв.
          </Text>
          {totals.vatAmount > 0 && (
            <Text style={styles.text}>
              ДДС (20%): {totals.vatAmount.toFixed(2)} лв.
            </Text>
          )}
          <Text style={styles.text}>
            Общо: {totals.grandTotal.toFixed(2)} лв.
          </Text>
          {totals.amountInWords && (
            <Text style={styles.text}>
              Словом: {totals.amountInWords}
            </Text>
          )}
        </View>

        {/* Payment method */}
        <View style={styles.section}>
          <Text style={styles.text}>
            Начин на плащане:{" "}
            {invoiceDetails.paymentMethod === "bank_transfer"
              ? "По банков път"
              : "В брой"}
          </Text>
          {company.iban && (
            <Text style={styles.text}>IBAN: {company.iban}</Text>
          )}
        </View>

        {/* Issuer */}
        <View style={styles.section}>
          <Text style={styles.text}>Съставил: {company.mol}</Text>
        </View>
      </Page>
    </Document>
  );
}
