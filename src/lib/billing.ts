export function generateWhatsAppLink(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\D/g, "");
  const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
}

export function generateRepairBillMessage(data: {
  id?: string;
  customerName: string;
  deviceModel: string;
  issue: string;
  estimatedCost: number;
  status: string;
  isFinalBill?: boolean;
}) {
  const billType = data.isFinalBill ? "Final Bill" : "Service Slip";
  const costLabel = data.isFinalBill ? "Final Amount" : "Est. Cost";
  
  return `📱 *MOBILE MART — ${billType}*
━━━━━━━━━━━━━━━━━━
📋 Bill ID: ${data.id ?? "N/A"}
👤 Customer: ${data.customerName}
📱 Device: ${data.deviceModel}
🔧 Issue: ${data.issue}
💰 ${costLabel}: ₹${data.estimatedCost.toLocaleString("en-IN")}
📋 Status: ${data.status.replace("-", " ").toUpperCase()}
━━━━━━━━━━━━━━━━━━
💳 Pay via UPI: upi://pay?pa=test@upi&am=${data.estimatedCost}&cu=INR
━━━━━━━━━━━━━━━━━━
Thank you for choosing Mobile Mart! 🙏`;
}

export function generateSalesBillMessage(data: {
  id?: string;
  customerName: string;
  itemName: string;
  totalAmount: number;
  paymentMode: string;
  downpayment?: number;
  financeProvider?: string;
}) {
  let msg = `🛒 *MOBILE MART — Sales Invoice*
━━━━━━━━━━━━━━━━━━
📋 Bill ID: ${data.id ?? "N/A"}
👤 Customer: ${data.customerName}
📦 Item: ${data.itemName}
💰 Total: ₹${data.totalAmount.toLocaleString("en-IN")}
💳 Payment: ${data.paymentMode.toUpperCase()}`;

  if (data.paymentMode === "emi" && data.downpayment !== undefined) {
    const balance = data.totalAmount - data.downpayment;
    msg += `
⬇️ Downpayment: ₹${data.downpayment.toLocaleString("en-IN")}
🏦 Finance: ${data.financeProvider?.toUpperCase() ?? "N/A"}
📊 Balance: ₹${balance.toLocaleString("en-IN")}`;
  }

  msg += `
━━━━━━━━━━━━━━━━━━
💳 Pay via UPI: upi://pay?pa=merchant@upi&am=${data.totalAmount}&cu=INR
━━━━━━━━━━━━━━━━━━
Thank you for choosing Mobile Mart! 🙏`;
  return msg;
}

export function generateUpiUri(amount: number, upiId: string = "test@upi", name: string = "Mobile Mart") {
  return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR`;
}
