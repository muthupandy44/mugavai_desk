import React from 'react';
import A4Invoice from './Invoice';

interface ServiceInvoiceProps {
  billId: string;
  customerName: string;
  phone: string;
  date: string;
  deviceModel: string;
  issue: string;
  estimatedCost: number;
  status: string;
  isFinalBill?: boolean;
  finalAmount?: number;
  shopName?: string;
  imeiNumber?: string;
  taxableAmount?: number | null;
  gstAmount?: number | null;
  isTaxInvoice?: boolean;
}

const ServiceInvoice: React.FC<ServiceInvoiceProps> = ({
  billId,
  customerName,
  phone,
  date,
  deviceModel,
  issue,
  estimatedCost,
  status,
  isFinalBill,
  finalAmount,
  shopName = "Mobile Mart",
  imeiNumber,
  taxableAmount,
  gstAmount,
  isTaxInvoice = false
}) => {
  // Convert service data to invoice format
  const invoiceData = {
    customerName,
    phone,
    billNo: billId,
    date,
    items: [
      {
        description: `Service: ${issue}`,
        model: deviceModel,
        imei1: imeiNumber,
        quantity: 1,
        rate: isFinalBill ? (finalAmount || estimatedCost) : estimatedCost,
        amount: isFinalBill ? (finalAmount || estimatedCost) : estimatedCost
      }
    ],
    subtotal: taxableAmount || (isFinalBill ? (finalAmount || estimatedCost) : estimatedCost),
    gst: gstAmount || Math.round((isFinalBill ? (finalAmount || estimatedCost) : estimatedCost) * 0.18),
    total: (isFinalBill ? (finalAmount || estimatedCost) : estimatedCost) + (gstAmount || Math.round((isFinalBill ? (finalAmount || estimatedCost) : estimatedCost) * 0.18)),
    amountInWords: '', // Will be calculated in the component
    shopName,
    status,
    isTaxInvoice
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

export default ServiceInvoice;
