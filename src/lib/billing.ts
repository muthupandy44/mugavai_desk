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
  shopName?: string;
}) {
  const shopName = data.shopName || "Mobile Shop";
  
  // Status-based messaging
  if (data.status === 'received') {
    return `📱 *${shopName.toUpperCase()} — Confirmation of Receipt*
━━━━━━━━━━━━━━━━━━
📋 Bill ID: ${data.id ?? "N/A"}
👤 Customer: ${data.customerName}
📱 Device: ${data.deviceModel}
🔧 Issue: ${data.issue}
📋 Status: RECEIVED
━━━━━━━━━━━━━━━━━━
Your device has been received and is under diagnosis.
We'll update you once the assessment is complete.
━━━━━━━━━━━━━━━━━━
Thank you for choosing ${shopName}! 🙏`;
  }
  
  if (data.status === 'ready') {
    return `📱 *${shopName.toUpperCase()} — Ready for Collection*
━━━━━━━━━━━━━━━━━━
📋 Bill ID: ${data.id ?? "N/A"}
👤 Customer: ${data.customerName}
📱 Device: ${data.deviceModel}
💰 Total: ₹${data.estimatedCost.toLocaleString("en-IN")}
📋 Status: READY FOR PICKUP
━━━━━━━━━━━━━━━━━━
Your ${data.deviceModel} is fixed and ready for pickup.
Total amount: ₹${data.estimatedCost.toLocaleString("en-IN")}
━━━━━━━━━━━━━━━━━━
💳 Pay via UPI: upi://pay?pa=test@upi&am=${data.estimatedCost}&cu=INR
━━━━━━━━━━━━━━━━━━
Thank you for choosing ${shopName}! 🙏`;
  }
  
  if (data.status === 'delivered') {
    return `📱 *${shopName.toUpperCase()} — Thank You*
━━━━━━━━━━━━━━━━━━
📋 Bill ID: ${data.id ?? "N/A"}
👤 Customer: ${data.customerName}
📱 Device: ${data.deviceModel}
💰 Total: ₹${data.estimatedCost.toLocaleString("en-IN")}
📋 Status: DELIVERED
━━━━━━━━━━━━━━━━━━
Your device has been delivered successfully!
Thank you for trusting ${shopName} with your repair.
━━━━━━━━━━━━━━━━━━
View your digital invoice online.
━━━━━━━━━━━━━━━━━━
Thank you for choosing ${shopName}! 🙏`;
  }
  
  // Default for in-progress
  const billType = data.isFinalBill ? "Final Bill" : "Service Slip";
  const costLabel = data.isFinalBill ? "Final Amount" : "Est. Cost";
  
  return `📱 *${shopName.toUpperCase()} — ${billType}*
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
Thank you for choosing ${shopName}! 🙏`;
}

export function generateSalesBillMessage(data: {
  id?: string;
  customerName: string;
  itemName: string;
  totalAmount: number;
  paymentMode: string;
  downpayment?: number;
  financeProvider?: string;
  shopName?: string;
}) {
  const shopName = data.shopName || "Mobile Shop";
  let msg = `🛒 *${shopName.toUpperCase()} — Sales Invoice*
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
Thank you for choosing ${shopName}! 🙏`;
  return msg;
}

export function generateUpiUri(amount: number, upiId: string = "test@upi", name: string = "Mobile Mart") {
  return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR`;
}
