import React from 'react';
import { useShop } from '@/context/ShopContext';
import { 
  Document, 
  Page, 
  View, 
  Text, 
  StyleSheet, 
  PDFDownloadLink, 
  BlobProvider,
  Font
} from '@react-pdf/renderer';

// Using built-in fonts for PDF generation
// Tamil fonts cause rendering issues, using English translations instead

// Function to convert number to words
const numberToWords = (num: number): string => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  if (num === 0) return 'Zero';
  
  const convert = (n: number): string => {
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  };
  
  return convert(num) + ' Only';
};

interface InvoiceItem {
  description: string;
  model?: string;
  imei1?: string;
  imei2?: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface InvoiceData {
  customerName: string;
  phone: string;
  billNo: string;
  date: string;
  items: InvoiceItem[];
  subtotal: number;
  gst: number;
  total: number;
  amountInWords: string;
  status?: string;
  isTaxInvoice?: boolean;
}

// CORPORATE PDF STYLES
const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica', backgroundColor: '#fff' },
  container: { border: '1.5 solid #000', flex: 1, display: 'flex', flexDirection: 'column' },
  
  // Header Section
  headerBar: { 
    backgroundColor: '#000', 
    color: '#fff', 
    textAlign: 'center', 
    padding: 6, 
    fontSize: 14, 
    fontWeight: 'bold', 
    textTransform: 'uppercase', 
    letterSpacing: 3 
  },
  
  topSection: { flexDirection: 'row', borderBottom: '1.5 solid #000', minHeight: 100 },
  shopInfo: { flex: 1.2, padding: 10, borderRight: '1.5 solid #000' },
  billInfo: { flex: 0.8, padding: 10, backgroundColor: '#f9f9f9' },
  
  shopTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  shopText: { fontSize: 9, marginBottom: 2, fontWeight: 'bold' },
  
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, fontSize: 10 },
  metaLabel: { fontWeight: 'bold', textTransform: 'uppercase' },
  
  // Customer Section
  customerBox: { flexDirection: 'row', borderBottom: '1.5 solid #000', padding: 10 },
  custDetail: { flex: 1 },
  custLabel: { fontSize: 8, color: '#666', textTransform: 'uppercase', marginBottom: 2 },
  custValue: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },

  // Table Section
  tableHeader: { 
    flexDirection: 'row', 
    backgroundColor: '#eee', 
    borderBottom: '1.5 solid #000', 
    fontWeight: 'bold', 
    fontSize: 9, 
    textTransform: 'uppercase' 
  },
  tableRow: { flexDirection: 'row', borderBottom: '0.5 solid #000', minHeight: 30, alignItems: 'center' },
  col1: { width: '8%', borderRight: '1.5 solid #000', textAlign: 'center', padding: 5, fontSize: 9 },
  col2: { width: '47%', borderRight: '1.5 solid #000', padding: 5, fontSize: 9 },
  col3: { width: '10%', borderRight: '1.5 solid #000', textAlign: 'center', padding: 5, fontSize: 9 },
  col4: { width: '17.5%', borderRight: '1.5 solid #000', textAlign: 'right', padding: 5, fontSize: 9 },
  col5: { width: '17.5%', textAlign: 'right', padding: 5, fontSize: 9, fontWeight: 'bold' },

  itemTitle: { fontSize: 10, fontWeight: 'bold' },
  itemSub: { fontSize: 8, color: '#444', marginTop: 2 },
  
  // Spacer to push footer down
  spacer: { flexGrow: 1, borderRight: '1.5 solid #000' },

  // Totals Section
  totalSection: { flexDirection: 'row', borderTop: '1.5 solid #000' },
  wordsArea: { flex: 1, padding: 10, borderRight: '1.5 solid #000', justifyContent: 'center' },
  summaryArea: { width: 180 },
  
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 5, borderBottom: '0.5 solid #000', fontSize: 9 },
  grandTotalBox: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 8, 
    backgroundColor: '#eee', 
    fontSize: 12, 
    fontWeight: 'bold' 
  },

  // Footer
  footer: { flexDirection: 'row', padding: 15, borderTop: '1.5 solid #000', alignItems: 'flex-end' },
  terms: { flex: 1, fontSize: 7, color: '#333' },
  sigBox: { width: 150, textAlign: 'center', fontSize: 9, fontWeight: 'bold' },
  sigLine: { borderTop: '1 solid #000', marginTop: 40, paddingTop: 5 }
});

const InvoiceDocument = ({ data, shop }: { data: InvoiceData, shop: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.container}>
        <View style={styles.headerBar}>
          <Text>
            {data.status === 'delivered' ? 'TAX INVOICE' : 'SERVICE ESTIMATE / JOB SHEET'}
          </Text>
        </View>

        <View style={styles.topSection}>
          <View style={styles.shopInfo}>
            <Text style={styles.shopTitle}>MOBILE MART</Text>
            <Text style={styles.shopText}>140/4, Schwartz School Complex,</Text>
            <Text style={styles.shopText}>Gh Road, Ramanathapuram - 623 501</Text>
            <Text style={styles.shopText}>GSTIN: 33HAOPS0098K2ZZ</Text>
            <Text style={styles.shopText}>Contact: {shop?.phone || '94421 38895'}</Text>
          </View>
          <View style={styles.billInfo}>
            <View style={styles.metaRow}><Text style={styles.metaLabel}>Invoice No:</Text><Text>{data.billNo}</Text></View>
            <View style={styles.metaRow}><Text style={styles.metaLabel}>Date:</Text><Text>{data.date}</Text></View>
            <View style={styles.metaRow}><Text style={styles.metaLabel}>State:</Text><Text>Tamil Nadu (33)</Text></View>
          </View>
        </View>

        <View style={styles.customerBox}>
          <View style={styles.custDetail}>
            <Text style={styles.custLabel}>Bill To / Customer Details</Text>
            <Text style={styles.custValue}>{data.customerName}</Text>
            <Text style={{ fontSize: 10, marginTop: 2 }}>Contact: {data.phone}</Text>
            {data.status === 'delivered' && data.isTaxInvoice && (
              <Text style={{ fontSize: 10, marginTop: 2 }}>HSN Code: 9987</Text>
            )}
          </View>
        </View>

        <View style={{ flex: 1 }}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>S.No</Text>
            <Text style={styles.col2}>Description of Goods</Text>
            <Text style={styles.col3}>Qty</Text>
            <Text style={styles.col4}>Rate</Text>
            <Text style={styles.col5}>Amount</Text>
          </View>
          {data.items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.col1}>{i + 1}</Text>
              <View style={styles.col2}>
                <Text style={styles.itemTitle}>{item.description}</Text>
                <Text style={styles.itemSub}>
                  {item.model && `Model: ${item.model}`} {item.imei1 && `| IMEI: ${item.imei1}`}
                </Text>
              </View>
              <Text style={styles.col3}>{item.quantity}</Text>
              <Text style={styles.col4}>{item.rate.toFixed(2)}</Text>
              <Text style={[styles.col5, { fontWeight: 'bold' }]}>{item.amount.toFixed(2)}</Text>
            </View>
          ))}
          {/* Fills empty space to keep footer at bottom */}
          <View style={styles.spacer} />
        </View>

        <View style={styles.totalSection}>
          {data.status === 'delivered' && (
            <View style={styles.wordsArea}>
              <Text style={styles.custLabel}>Amount in Words</Text>
              <Text style={{ fontSize: 10, fontWeight: 'bold', fontStyle: 'italic', marginTop: 5 }}>
                {data.amountInWords || numberToWords(Math.round(data.total))}
              </Text>
            </View>
          )}
          <View style={styles.summaryArea}>
            <View style={styles.summaryRow}><Text>Subtotal</Text><Text>{data.subtotal.toFixed(2)}</Text></View>
            {data.status === 'delivered' && (
              <>
                <View style={styles.summaryRow}><Text>CGST (9%)</Text><Text>{(data.gst/2).toFixed(2)}</Text></View>
                <View style={styles.summaryRow}><Text>SGST (9%)</Text><Text>{(data.gst/2).toFixed(2)}</Text></View>
              </>
            )}
            <View style={styles.grandTotalBox}><Text>TOTAL</Text><Text>INR {data.total.toFixed(2)}</Text></View>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.terms}>
            <Text style={{ fontWeight: 'bold', marginBottom: 3 }}>TERMS & CONDITIONS:</Text>
            <Text>1. Sold goods cannot be returned or exchanged.</Text>
            <Text>2. For defects after sale, customers should directly contact authorized service centers.</Text>
            <Text>3. Damages due to water ingress and artificial negligence are not covered under warranty.</Text>
            <Text>4. Mobile phones have 1-year warranty, batteries/chargers have 6-month warranty.</Text>
          </View>
          <View style={styles.sigBox}>
            <Text>For MOBILE MART</Text>
            <View style={styles.sigLine}><Text>Authorised Signatory</Text></View>
          </View>
        </View>
      </View>
    </Page>
  </Document>
);

const Invoice = (props: InvoiceData) => {
  const { shop } = useShop();

  // Debug: Check if props are received correctly
  console.log('Invoice props:', props);
  console.log('Shop data:', shop);

  // If no props provided, use sample data for testing
  const invoiceData = props || {
    customerName: 'Test Customer',
    phone: '9876543210',
    billNo: 'TEST-001',
    date: new Date().toLocaleDateString('en-IN'),
    items: [
      {
        description: 'Sample Mobile Phone',
        model: 'iPhone 13',
        quantity: 1,
        rate: 50000,
        amount: 50000
      }
    ],
    subtotal: 50000,
    gst: 9000,
    total: 59000,
    amountInWords: 'Fifty Nine Thousand Only'
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full border border-slate-200">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">M</div>
          <h2 className="text-2xl font-black text-slate-900">Mugavai Desk</h2>
          <p className="text-slate-500 font-medium">Official Invoice Portal</p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-500 font-bold uppercase text-xs">Invoice No</span>
            <span className="font-black text-slate-900">{invoiceData.billNo}</span>
          </div>
          <div className="flex justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-500 font-bold uppercase text-xs">Customer</span>
            <span className="font-black text-slate-900 uppercase">{invoiceData.customerName}</span>
          </div>
        </div>

        <div className="grid gap-3">
          <PDFDownloadLink
            document={<InvoiceDocument data={invoiceData} shop={shop} />}
            fileName={`Invoice_${invoiceData.billNo || 'Unknown'}.pdf`}
            className="w-full"
          >
            {({ loading, error }) => (
              <button disabled={loading || !!error} className="w-full bg-black text-white py-4 rounded-xl font-black shadow-xl active:scale-95 transition-all disabled:opacity-50">
                {loading ? 'GENERATING...' : error ? 'PDF ERROR' : '📄 DOWNLOAD OFFICIAL PDF'}
              </button>
            )}
          </PDFDownloadLink>

          <BlobProvider document={<InvoiceDocument data={invoiceData} shop={shop} />}>
            {({ url, loading, error }) => (
              <button
                disabled={loading || !!error || !url}
                onClick={() => {
                  if (url) {
                    console.log('Opening PDF URL:', url);
                    window.open(url, '_blank');
                  }
                }}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-black shadow-xl active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? 'GENERATING...' : error ? 'PREVIEW ERROR' : '👁️ LIVE PREVIEW'}
              </button>
            )}
          </BlobProvider>
        </div>
      </div>
    </div>
  );
};

export default Invoice;