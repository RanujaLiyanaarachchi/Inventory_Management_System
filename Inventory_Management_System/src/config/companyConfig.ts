// Company Configuration
// Edit the details below to customize for your company

export interface CompanyConfig {
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  website?: string;
  taxId?: string;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    branch?: string;
  };
  softwareProvider: {
    name: string;
    phone: string;
    email?: string;
  };
  paymentTerms?: string;
  footerMessage?: string;
}

export const companyConfig: CompanyConfig = {
  // Your Company Information
  name: "ABC Company",           // ← Edit this
  address: "Your Business Address",    // ← Edit this
  city: "Your City, Country",          // ← Edit this
  phone: "Your Phone Number",          // ← Edit this
  email: "your@email.com",             // ← Edit this
  website: "www.yourwebsite.com",      // ← Edit this
  taxId: "Your Tax ID",                // ← Edit this
  
  // Bank Details
  bankDetails: {
    bankName: "Your Bank Name",        // ← Edit this
    accountNumber: "Your Account Number", // ← Edit this
    branch: "Your Branch Name"         // ← Edit this
  },
  
  // Payment Terms
  paymentTerms: "Net 30",              // ← Edit this
  
  // Footer Message
  footerMessage: "Thank you for your purchase", // ← Edit this
  
  // Software Provider Information (Keep this as is)
  softwareProvider: {
    name: "Shemailosoft (Pvt) Ltd.",
    phone: "077 266 6517 / 070 933 7777",
    email: "info@shemailosoft.com"
  }
};

// Helper functions for formatting
export const formatCompanyHeader = (config: CompanyConfig) => {
  return `
    <div class="company-info">
      <h2>${config.name}</h2>
      <p>${config.address}</p>
      <p>${config.city}</p>
      <p>Phone: ${config.phone}</p>
      <p>Email: ${config.email}</p>
      ${config.website ? `<p>Website: ${config.website}</p>` : ''}
      ${config.taxId ? `<p>Tax ID: ${config.taxId}</p>` : ''}
    </div>
  `;
};

export const formatBankDetails = (config: CompanyConfig) => {
  if (!config.bankDetails) return '';
  
  return `
    <div class="payment-info">
      <h3>Payment Information:</h3>
      <p>Bank: ${config.bankDetails.bankName}</p>
      <p>Account: ${config.bankDetails.accountNumber}</p>
      ${config.bankDetails.branch ? `<p>Branch: ${config.bankDetails.branch}</p>` : ''}
      ${config.paymentTerms ? `<p>Payment Terms: ${config.paymentTerms}</p>` : ''}
    </div>
  `;
};

export const formatFooter = (config: CompanyConfig) => {
  return `
    <div class="footer">
      <p>${config.footerMessage || 'Thank you for your purchase'}</p>
      <div style="margin-top: 8px; font-size: 10px; color: #9ca3af;">
        Software by ${config.softwareProvider.name}<br/>
        ${config.softwareProvider.phone}
        ${config.softwareProvider.email ? `<br/>${config.softwareProvider.email}` : ''}
      </div>
    </div>
  `;
};

export const formatDialogFooter = (config: CompanyConfig) => {
  return `
    <div className="mt-6 text-center text-xs text-muted-foreground">
      <div className="mt-2 text-[10px] text-muted-foreground/80">
        Software by ${config.softwareProvider.name}<br/>
        ${config.softwareProvider.phone}
        ${config.softwareProvider.email ? `<br/>${config.softwareProvider.email}` : ''}
      </div>
    </div>
  `;
};
