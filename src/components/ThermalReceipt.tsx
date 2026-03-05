import { QRCodeSVG } from "qrcode.react";
import { generateUpiUri } from "@/lib/billing";
import { useShop } from "@/context/ShopContext";

interface ThermalReceiptProps {
  type: "service" | "sale";
  id: string;
  customerName: string;
  phone: string;
  date: string;
  // Service fields
  deviceModel?: string;
  issue?: string;
  estimatedCost?: number;
  finalAmount?: number;
  status?: string;
  isFinalBill?: boolean;
  // Sale fields
  itemName?: string;
  totalAmount?: number;
  paymentMode?: "cash" | "emi";
  downpayment?: number;
  financeProvider?: string;
  financeBalance?: number;
}

const ThermalReceipt = (props: ThermalReceiptProps) => {
  const { shop } = useShop();
  const amount = props.type === "service" ? (props.finalAmount ?? props.estimatedCost ?? 0) : (props.totalAmount ?? 0);
  const upiUri = generateUpiUri(amount);
  const isServiceSlip = props.type === "service" && !props.isFinalBill;
  const isFinalBill = props.type === "service" && props.isFinalBill;

  return (
    <div className="w-[320px] mx-auto bg-white text-gray-900 p-5 font-mono text-xs leading-relaxed" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
      {/* Bill Info */}
      <div className="text-center mb-3">
        <h1 className="text-lg font-bold tracking-wide" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
          {isServiceSlip ? "SERVICE SLIP" : isFinalBill ? "FINAL BILL" : shop?.name || "Mobile Shop"}
        </h1>
        <p className="text-[10px] text-gray-500 mt-0.5">Your Trusted Mobile Partner</p>
        <div className="border-b-2 border-dashed border-gray-300 my-3" />
      </div>

      {/* Bill Info */}
      <div className="flex justify-between mb-1">
        <span>Bill #:</span>
        <span className="font-bold">{props.id}</span>
      </div>
      <div className="flex justify-between mb-1">
        <span>Date:</span>
        <span>{props.date}</span>
      </div>
      <div className="flex justify-between mb-1">
        <span>Customer:</span>
        <span className="font-bold">{props.customerName}</span>
      </div>
      <div className="flex justify-between mb-1">
        <span>Phone:</span>
        <span>{props.phone}</span>
      </div>

      <div className="border-b-2 border-dashed border-gray-300 my-3" />

      {/* Service Details */}
      {props.type === "service" && (
        <>
          <div className="flex justify-between mb-1">
            <span>Device:</span>
            <span className="font-bold">{props.deviceModel}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Problem/Complaint:</span>
            <span className="text-right max-w-[160px]">{props.issue}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Status:</span>
            <span className="font-bold uppercase">{props.status?.replace("-", " ")}</span>
          </div>
          <div className="border-b-2 border-dashed border-gray-300 my-3" />
          <div className="flex justify-between text-sm font-bold">
            <span>{isFinalBill ? "FINAL AMOUNT:" : "ESTIMATED:"}</span>
            <span>
              {isServiceSlip && (props.estimatedCost ?? 0) === 0 
                ? "To Be Informed" 
                : `₹${(isFinalBill ? props.finalAmount : props.estimatedCost ?? 0).toLocaleString("en-IN")}`
              }
            </span>
          </div>
        </>
      )}

      {/* Sale Details */}
      {props.type === "sale" && (
        <>
          <div className="flex justify-between mb-1">
            <span>Item:</span>
            <span className="font-bold text-right max-w-[180px]">{props.itemName}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Payment:</span>
            <span className="font-bold uppercase">{props.paymentMode}</span>
          </div>
          <div className="border-b-2 border-dashed border-gray-300 my-3" />
          <div className="flex justify-between text-sm font-bold">
            <span>TOTAL:</span>
            <span>₹{(props.totalAmount ?? 0).toLocaleString("en-IN")}</span>
          </div>

          {/* EMI Box */}
          {props.paymentMode === "emi" && (
            <div className="mt-3 p-3 bg-gray-100 rounded-lg">
              <p className="font-bold text-[11px] mb-2 text-center">── EMI DETAILS ──</p>
              <div className="flex justify-between mb-1">
                <span>Downpayment:</span>
                <span>₹{(props.downpayment ?? 0).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Finance:</span>
                <span className="font-bold uppercase">{props.financeProvider}</span>
              </div>
              <div className="border-b border-dashed border-gray-300 my-2" />
              <div className="flex justify-between font-bold text-sm">
                <span>BALANCE:</span>
                <span>₹{(props.financeBalance ?? 0).toLocaleString("en-IN")}</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* UPI QR - Only show for Final Bill or Sale */}
      {(isFinalBill || props.type === "sale") && (
        <>
          <div className="border-b-2 border-dashed border-gray-300 my-3" />
          <div className="flex flex-col items-center space-y-2 py-2">
            <p className="text-[10px] font-bold">SCAN TO PAY VIA UPI</p>
            <QRCodeSVG value={upiUri} size={140} bgColor="#ffffff" fgColor="#000000" />
            <p className="text-[10px] text-gray-500">₹{amount.toLocaleString("en-IN")}</p>
          </div>
        </>
      )}

      <div className="border-b-2 border-dashed border-gray-300 my-3" />
      <p className="text-center text-[10px] text-gray-400">Thank you for visiting {shop?.name || "Mobile Shop"}!</p>
    </div>
  );
};

export default ThermalReceipt;
