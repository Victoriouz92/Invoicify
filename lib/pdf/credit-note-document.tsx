/**
 * CreditNotePDF — React PDF document component for generating credit note PDFs.
 *
 * WHAT IT IS: A @react-pdf/renderer Document component that renders a credit note as a PDF.
 * WHY IT EXISTS: Credit notes look similar to invoices but have a different title
 *   ("КРЕДИТНО ИЗВЕСТИЕ"), a reference to the original invoice, and separate numbering.
 * REAL WORLD ANALOGY: Like a return receipt at a store — it references the original
 *   purchase receipt and shows what's being refunded.
 */

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { CompanyData, ClientData, LineItem, TotalsResult } from "@/lib/types";

/**
 * Register Roboto font (supports Cyrillic U+0400–U+04FF).
 * Files are in public/fonts/ and served by Next.js at /fonts/*.
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

/** Props needed to render a complete credit note PDF */
export interface CreditNotePDFProps {
  company: CompanyData;
  client: ClientData;
  creditNoteNumber: string;
  dateOfIssue: string;
  originalInvoiceNumber: string;
  originalInvoiceDate: string;
  lineItems: LineItem[];
  totals: TotalsResult;
  reason: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Roboto",
  },
  title: {
    fontSize: 18,
    marginBottom: 10,
    textAlign: "center",
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
  basis: {
    marginTop: 10,
    marginBottom: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: "#333",
  },
});

/**
 * The credit note PDF document component.
 * Used with `pdf(<CreditNotePDF {...props} />).toBlob()` to generate a PDF blob.
 */
export function CreditNotePDF({
  company,
  client,
  creditNoteNumber,
  dateOfIssue,
  originalInvoiceNumber,
  originalInvoiceDate,
  lineItems,
  totals,
  reason,
}: CreditNotePDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Title */}
        <Text style={styles.title}>
          КРЕДИТНО ИЗВЕСТИЕ № {creditNoteNumber}
        </Text>

        {/* Date */}
        <View style={styles.section}>
          <Text style={styles.text}>
            Дата на издаване: {dateOfIssue}
          </Text>
        </View>

        {/* Основание — Reference to original invoice */}
        <View style={styles.basis}>
          <Text style={styles.text}>
            Основание: Кредитно известие към фактура № {originalInvoiceNumber} от {originalInvoiceDate}
          </Text>
          {reason && (
            <Text style={styles.text}>
              Причина: {reason}
            </Text>
          )}
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

        {/* Issuer */}
        <View style={styles.section}>
          <Text style={styles.text}>Съставил: {company.mol}</Text>
        </View>
      </Page>
    </Document>
  );
}
