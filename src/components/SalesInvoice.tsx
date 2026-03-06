import React from 'react';
import A4Invoice from './Invoice';

interface SalesInvoiceProps {
  billId: string;
  customerName: string;
  phone: string;
  date: string;
  itemName: string;
  totalAmount: number;
  paymentMode: string;
  downpayment?: number;
  financeProvider?: string;
  financeBalance?: number;
  shopName?: string;
}

const SalesInvoice: React.FC<SalesInvoiceProps> = ({
  billId,
  customerName,
  phone,
  date,
  itemName,
  totalAmount,
  paymentMode,
  downpayment,
  financeProvider,
  financeBalance,
  shopName = "Mobile Mart"
}) => {
  // Convert sale data to invoice format
  const invoiceData = {
    customerName,
    phone,
    billNo: billId,
    date,
    items: [
      {
        description: itemName,
        model: '', // Sales don't have model field in current schema
        quantity: 1,
        rate: totalAmount,
        amount: totalAmount
      }
    ],
    subtotal: totalAmount,
    gst: Math.round(totalAmount * 0.18),
    total: totalAmount + Math.round(totalAmount * 0.18),
    amountInWords: '', // Will be calculated in component
    shopName
  };

  return (
    <div className="print-mode">
      <A4Invoice {...invoiceData} />
      
      <style>{`
        @media print {
          .print-mode {
            background: white !important;
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 12.7mm !important;
            box-shadow: none !important;
            overflow: hidden !important;
          }
          
          /* Hide all app navigation and layout */
          .print-mode * {
            visibility: hidden;
          }
          
          /* Only show the invoice content */
          .print-mode > div,
          .print-mode > div > * {
            visibility: visible;
          }
          
          /* Ensure A4 exact dimensions */
          @page {
            size: A4;
            margin: 12.7mm;
          }
          
          body {
            margin: 0;
            padding: 0;
            background: white !important;
          }
          
          /* Hide sidebar, navigation, and any non-invoice elements */
          nav, header, footer, .sidebar, .bottom-nav, .app-layout {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default SalesInvoice;
