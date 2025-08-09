import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, Timestamp, query, where, getDoc, orderBy, limit, startAfter } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBKjE2SmRvgQczTmcKZrEFD0pyjLBMD4gg",
  authDomain: "inventorypro-lk.firebaseapp.com",
  projectId: "inventorypro-lk",
  storageBucket: "inventorypro-lk.appspot.com",
  messagingSenderId: "594998429191",
  appId: "1:594998429191:web:518f4b7f88eb7c0a2d0ca2"
};

try {
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  
  console.log("Firebase connected successfully!");
  
  // Make db available globally if needed
  window.db = db;
  window.Timestamp = Timestamp;
  window.deleteDoc = deleteDoc;
  window.doc = doc;
  
} catch (error) {
  console.error("Firebase initialization error:", error);
  alert("Failed to connect to database. Please try again later.");
}

// Test function
async function testConnection() {
  try {
    const testCol = collection(db, 'test');
    await addDoc(testCol, { test: new Date().toISOString() });
    console.log("Database write successful!");
  } catch (error) {
    console.error("Database error:", error);
  }
}
testConnection();

// Initialize barcode scanner
function initBarcodeScanner() {
  $('#barcode').on('keypress', function(e) {
    // Detect barcode scanner input (typically ends with Enter key)
    if (e.which === 13) {
      const barcode = $(this).val().trim();
      if (barcode) {
        lookupProductByBarcode(barcode);
      }
      $(this).val('').focus(); // Clear the field for next scan
      return false; // Prevent form submission
    }
  });
}

// Product lookup by barcode
async function lookupProductByBarcode(barcode) {
  try {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('barcode', '==', barcode));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const product = querySnapshot.docs[0].data();
      $('#product-code').val(product.code);
      $('#product-name').val(product.name);
      $('#price').val(product.price);
      $('#available-qty').val(product.stock);
      $('#quantity').focus().select();
    } else {
      alert('Product not found for barcode: ' + barcode);
    }
  } catch (error) {
    console.error('Error looking up product:', error);
    alert('Error finding product');
  }
}

// Print invoice function
async function printInvoice(invoiceId) {
  try {
    // First get the invoice data
    const invoiceDoc = await getDoc(doc(db, 'invoices', invoiceId));
    if (!invoiceDoc.exists()) {
      throw new Error('Invoice not found');
    }
    const invoiceData = invoiceDoc.data();
    
    // Open print window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoiceData.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
          .invoice-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
          .invoice-header h1 { margin: 0; font-size: 28px; color: #2c3e50; }
          .invoice-info { margin-bottom: 30px; display: flex; justify-content: space-between; }
          .info-block { flex: 1; }
          .info-block h3 { margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 5px; }
          .invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .invoice-table th { background-color: #f8f9fa; text-align: left; }
          .invoice-table th, .invoice-table td { border: 1px solid #ddd; padding: 10px; }
          .invoice-totals { float: right; width: 300px; margin-top: 20px; }
          .totals-table { width: 100%; border-collapse: collapse; }
          .totals-table td { padding: 8px; border-bottom: 1px solid #eee; }
          .totals-table tr.total-row td { font-weight: bold; border-top: 2px solid #333; border-bottom: none; }
          .footer { margin-top: 50px; text-align: center; font-size: 0.9em; color: #777; border-top: 1px solid #eee; padding-top: 20px; }
          .no-print { display: none; }
          @page { margin: 10mm; }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <h1>INVOICE</h1>
          <p>${invoiceData.invoiceNumber}</p>
          <p>Date: ${invoiceData.createdAt.toDate().toLocaleDateString()}</p>
        </div>
        
        <div class="invoice-info">
          <div class="info-block">
            <h3>Bill To</h3>
            <p><strong>${invoiceData.customerName || 'Customer'}</strong></p>
            <p>${invoiceData.customerPhone || ''}</p>
          </div>
          <div class="info-block" style="text-align: right;">
            <h3>Payment Method</h3>
            <p>${invoiceData.paymentMethod}</p>
          </div>
        </div>
        
        <table class="invoice-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Code</th>
              <th>Description</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Discount</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoiceData.items.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.productCode}</td>
                <td>${item.productName}</td>
                <td>${item.quantity}</td>
                <td>Rs ${item.price.toFixed(2)}</td>
                <td>${item.discountType === 'percentage' ? 
                     item.discountValue + '%' : 
                     'Rs ' + item.discountValue.toFixed(2)}</td>
                <td>Rs ${item.total.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="invoice-totals">
          <table class="totals-table">
            <tr>
              <td>Subtotal:</td>
              <td>Rs ${invoiceData.subtotal.toFixed(2)}</td>
            </tr>
            <tr class="total-row">
              <td>Total:</td>
              <td>Rs ${invoiceData.total.toFixed(2)}</td>
            </tr>
          </table>
        </div>
        
        <div class="footer">
          <p>Thank you for your business!</p>
          <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="no-print" style="margin-top: 30px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Print Invoice</button>
          <button onclick="window.close()" style="padding: 10px 20px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">Close</button>
        </div>
        
        <script>
          // Auto-print after a short delay
          setTimeout(() => {
            window.print();
          }, 300);
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  } catch (error) {
    console.error('Error printing invoice:', error);
    alert('Failed to print invoice');
  }
}

$(document).ready(function() {
  // Ensure modal is hidden on page load
  $('#invoice-modal').removeClass('active').css('display', 'none');
  console.log('Modal reset on page load'); // Debugging log

  // Initialize barcode scanner
  initBarcodeScanner();

  // Tab navigation
  $('.tab-btn').click(function() {
    const tabId = $(this).data('tab');
    $('.tab-btn').removeClass('active');
    $(this).addClass('active');
    $('.tab-content').removeClass('active');
    $(`#${tabId}`).addClass('active');
  });

  // Payment method selection
  $('#payment-method').change(function() {
    $('.payment-details').hide();
    const method = $(this).val();
    $(`#${method}-payment`).show();
  });

  // Cash received calculation
  $('#cash-received').on('input', function() {
    const total = parseFloat($('#total').text()) || 0;
    const received = parseFloat($(this).val()) || 0;
    const balance = received - total;
    $('#balance').val(balance.toFixed(2));
  });

  // Initialize buttons
  $('#add-product').click(addProductToInvoice);
  $('#generate-invoice').click(generateInvoice);
  $('#search-btn').click(loadInvoiceList);
  $('#search-invoice-btn').click(searchInvoiceForReturn);
  $('#process-return').click(processReturn);
  $('#cancel-return').click(cancelReturn);
  
  // Load initial invoice list
  loadInvoiceList();

  // Close modal when clicking X
  $('.close-modal').off('click').on('click', function() {
    console.log('Close button clicked'); // Debugging log
    $('#invoice-modal').removeClass('active').css('display', 'none'); // Ensure modal is hidden
    console.log('Modal closed'); // Debugging log
  });

  // Close modal when clicking outside content
  $(window).off('click').on('click', function(event) {
    if ($(event.target).is('#invoice-modal-overlay')) {
      console.log('Overlay clicked'); // Debugging log
      $('#invoice-modal').removeClass('active').css('display', 'none'); // Ensure modal is hidden
      console.log('Modal closed by clicking outside'); // Debugging log
    }
  });

  // Ensure modal visibility is toggled correctly
  function toggleModalVisibility(isVisible) {
    if (isVisible) {
      $('#invoice-modal').addClass('active').css('display', 'flex');
      console.log('Modal activated'); // Debugging log
    } else {
      $('#invoice-modal').removeClass('active').css('display', 'none');
      console.log('Modal deactivated'); // Debugging log
    }
  }

  // Example usage: toggleModalVisibility(true) to show, toggleModalVisibility(false) to hide

  // Add product to invoice
  function addProductToInvoice() {
    const productCode = $('#product-code').val();
    const productName = $('#product-name').val();
    const quantity = parseInt($('#quantity').val());
    const availableQty = parseInt($('#available-qty').val());
    const price = parseFloat($('#price').val());
    const discountType = $('#discount-type').val();
    const discountValue = parseFloat($('#discount-value').val()) || 0;

    if (!productCode || quantity <= 0 || quantity > availableQty) {
      alert('Invalid product or quantity');
      return;
    }

    // Calculate discounted price based on discount type
    let discountedPrice = price;
    if (discountType === 'percentage') {
      discountedPrice = price - (price * discountValue / 100);
    } else {
      discountedPrice = price - discountValue;
      if (discountedPrice < 0) discountedPrice = 0;
    }

    const total = quantity * discountedPrice;

    const row = `
      <tr data-code="${productCode}">
        <td>${$('#invoice-table tbody tr').length + 1}</td>
        <td>${productCode}</td>
        <td>${productName}</td>
        <td>${quantity}</td>
        <td>${price.toFixed(2)}</td>
        <td>${discountType === 'percentage' ? discountValue + '%' : 'Rs ' + discountValue.toFixed(2)}</td>
        <td>${total.toFixed(2)}</td>
        <td><button class="remove-item">Remove</button></td>
      </tr>`;
    $('#invoice-table tbody').append(row);
    calculateTotals();
    clearProductFields();

    $('.remove-item').off('click').click(function() {
      $(this).closest('tr').remove();
      renumberRows();
      calculateTotals();
    });
  }

  // Calculate invoice totals
  function calculateTotals() {
    let subtotal = 0;
    $('#invoice-table tbody tr').each(function() {
      subtotal += parseFloat($(this).find('td:eq(6)').text());
    });
    const total = subtotal;
    $('#subtotal').text(subtotal.toFixed(2));
    $('#total').text(total.toFixed(2));
  }

  // Renumber table rows
  function renumberRows() {
    $('#invoice-table tbody tr').each(function(index) {
      $(this).find('td:first').text(index + 1);
    });
  }

  // Clear product fields
  function clearProductFields() {
    $('#barcode').val('').focus();
    $('#product-code').val('');
    $('#product-name').val('');
    $('#available-qty').val('');
    $('#price').val('');
    $('#quantity').val(1);
    $('#discount-type').val('percentage');
    $('#discount-value').val(0);
  }

  // Generate new invoice
  async function generateInvoice() {
    const customerName = $('#customer-name').val();
    const customerPhone = $('#customer-phone').val();
    const paymentMethod = $('#payment-method').val();
    const items = [];

    $('#invoice-table tbody tr').each(function() {
      const discountText = $(this).find('td:eq(5)').text();
      const isPercentage = discountText.includes('%');
      const discountValue = parseFloat(discountText.replace('Rs ', '').replace('%', ''));
      
      items.push({
        productCode: $(this).data('code'),
        productName: $(this).find('td:eq(2)').text(),
        quantity: parseInt($(this).find('td:eq(3)').text()),
        price: parseFloat($(this).find('td:eq(4)').text()),
        discountType: isPercentage ? 'percentage' : 'fixed',
        discountValue: discountValue,
        total: parseFloat($(this).find('td:eq(6)').text())
      });
    });

    if (items.length === 0) {
      alert('No products added!');
      return;
    }

    const subtotal = parseFloat($('#subtotal').text());
    const total = subtotal;

    const invoiceNumber = 'INV-' + new Date().getFullYear().toString().substr(-2) + 
                         (new Date().getMonth()+1).toString().padStart(2, '0') + 
                         '-' + Math.floor(1000 + Math.random() * 9000);

    const invoiceData = {
      invoiceNumber,
      customerName,
      customerPhone,
      paymentMethod,
      subtotal,
      total,
      items,
      createdAt: Timestamp.now(),
      status: 'completed'
    };

    try {
      const docRef = await addDoc(collection(db, 'invoices'), invoiceData);
      alert(`Invoice ${invoiceNumber} created!`);
      
      // Print the invoice after creation
      await printInvoice(docRef.id);
      
      clearInvoiceForm();
      loadInvoiceList();
      $('.tab-btn[data-tab="invoice-list"]').click();
    } catch (e) {
      console.error('Error adding document: ', e);
      alert('Error creating invoice. Please try again.');
    }
  }

  // Clear invoice form
  function clearInvoiceForm() {
    $('#customer-name').val('');
    $('#customer-phone').val('');
    $('#invoice-table tbody').empty();
    $('#subtotal').text('0.00');
    $('#total').text('0.00');
    $('#cash-received').val('');
    $('#balance').val('');
  }

  // Load invoice list
  async function loadInvoiceList(lastVisible = null) {
    const tbody = $('#invoices-table tbody');
    tbody.empty();
    const searchTerm = $('#search-invoice').val().toLowerCase();
    const dateFrom = $('#date-from').val();
    const dateTo = $('#date-to').val();
    
    let q = query(collection(db, 'invoices'), orderBy('createdAt', 'desc'), limit(20));
    
    if (lastVisible) {
      q = query(q, startAfter(lastVisible));
    }
    
    const snapshot = await getDocs(q);
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const invoiceDate = data.createdAt.toDate();
      
      // Filter by search term
      const matchSearch = !searchTerm || 
        data.invoiceNumber.toLowerCase().includes(searchTerm) || 
        (data.customerName && data.customerName.toLowerCase().includes(searchTerm));
      
      // Filter by date range
      let matchDate = true;
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        matchDate = matchDate && invoiceDate >= fromDate;
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setDate(toDate.getDate() + 1); // Include the entire end date
        matchDate = matchDate && invoiceDate <= toDate;
      }
      
      if (matchSearch && matchDate) {
        const row = `
          <tr data-id="${doc.id}">
            <td>${data.invoiceNumber}</td>
            <td>${invoiceDate.toISOString().split('T')[0]}</td>
            <td>${data.customerName || '-'}</td>
            <td>Rs ${data.total.toFixed(2)}</td>
            <td>${data.paymentMethod}</td>
            <td>
              <button class="view-invoice" data-id="${doc.id}">View</button>
              <button class="print-invoice">Print</button>
              <button class="delete-invoice">Delete</button>
            </td>
          </tr>`;
        tbody.append(row);
      }
    });
    
    if (tbody.children().length === 0) {
      tbody.append('<tr><td colspan="6">No invoices found</td></tr>');
    } else if (snapshot.docs.length === 20) {
      // Add "Load More" button if there might be more results
      const lastDoc = snapshot.docs[snapshot.docs.length-1];
      tbody.append(`
        <tr>
          <td colspan="6" style="text-align: center;">
            <button id="load-more" data-last="${lastDoc.id}">Load More Invoices</button>
          </td>
        </tr>
      `);
      $('#load-more').click(() => loadInvoiceList(lastDoc));
    }
    
    // Add click handlers
    $('.view-invoice').off('click').on('click', function() {
      const invoiceId = $(this).data('id');
      console.log('View button clicked for invoice ID:', invoiceId); // Debugging log
      viewInvoiceDetails(invoiceId);
    });
    
    $('.print-invoice').off('click').on('click', function() {
      const invoiceId = $(this).closest('tr').data('id');
      printInvoice(invoiceId);
    });
    
    $('.delete-invoice').off('click').on('click', function() {
      const invoiceId = $(this).closest('tr').data('id');
      deleteInvoice(invoiceId);
    });
  }

  // View invoice details in modal
  async function viewInvoiceDetails(invoiceId) {
    try {
      console.log('Fetching details for invoice ID:', invoiceId); // Debugging log
      const invoiceDoc = await getDoc(doc(db, 'invoices', invoiceId));
      if (!invoiceDoc.exists()) {
        throw new Error('Invoice not found');
      }
      const invoiceData = invoiceDoc.data();
      console.log('Invoice data fetched:', invoiceData); // Debugging log
      
      // Format date
      const invoiceDate = invoiceData.createdAt.toDate();
      const formattedDate = invoiceDate.toLocaleDateString() + ' ' + invoiceDate.toLocaleTimeString();
      
      // Build items HTML
      let itemsHtml = `
        <table class="invoice-items-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Product Code</th>
              <th>Product Name</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Discount</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>`;
      invoiceData.items.forEach((item, index) => {
        itemsHtml += `
          <tr>
            <td>${index + 1}</td>
            <td>${item.productCode}</td>
            <td>${item.productName}</td>
            <td>${item.quantity}</td>
            <td>Rs ${item.price.toFixed(2)}</td>
            <td>${item.discountType === 'percentage' ? 
                 item.discountValue + '%' : 
                 'Rs ' + item.discountValue.toFixed(2)}</td>
            <td>Rs ${item.total.toFixed(2)}</td>
          </tr>`;
      });
      
      itemsHtml += `</tbody></table>`;
      
      // Build totals HTML
      let totalsHtml = `
        <div class="invoice-totals">
          <table>
            <tr>
              <td>Subtotal:</td>
              <td>Rs ${invoiceData.subtotal.toFixed(2)}</td>
            </tr>
            <tr class="total-row">
              <td>Total:</td>
              <td>Rs ${invoiceData.total.toFixed(2)}</td>
            </tr>
          </table>
        </div>`;
      
      // Build the complete modal content without footer buttons
      const modalContent = `
        <div class="invoice-details-grid">
          <div class="invoice-item">
            <strong>Invoice Number:</strong>
            <span>${invoiceData.invoiceNumber}</span>
          </div>
          <div class="invoice-item">
            <strong>Date:</strong>
            <span>${formattedDate}</span>
          </div>
          <div class="invoice-item">
            <strong>Customer:</strong>
            <span>${invoiceData.customerName || 'N/A'}</span>
          </div>
          <div class="invoice-item">
            <strong>Phone:</strong>
            <span>${invoiceData.customerPhone || 'N/A'}</span>
          </div>
          <div class="invoice-item">
            <strong>Payment Method:</strong>
            <span>${invoiceData.paymentMethod}</span>
          </div>
        </div>
        
        <h3>Items</h3>
        ${itemsHtml}
        
        ${totalsHtml}`;
      
      // Set modal content and show
      $('#modal-invoice-content').html(modalContent);
      $('#invoice-modal').addClass('active').css('display', 'flex'); // Force modal visibility
      console.log('Modal content set and modal activated'); // Debugging log

      // Check if modal is visible
      const isVisible = $('#invoice-modal').is(':visible');
      console.log('Modal visibility:', isVisible); // Debugging log
    } catch (error) {
      console.error('Error viewing invoice:', error);
      alert('Error loading invoice details');
    }
  }

  // Close modal when clicking X
  $('.close-modal').off('click').on('click', function() {
    console.log('Close button clicked'); // Debugging log
    $('#invoice-modal').removeClass('active'); // Ensure modal is hidden
    $('#invoice-modal').css('display', 'none'); // Force modal to hide
    console.log('Modal closed'); // Debugging log
  });

  // Close modal when clicking outside content
  $(window).off('click').on('click', function(event) {
    if ($(event.target).is('#invoice-modal-overlay')) {
      console.log('Overlay clicked'); // Debugging log
      $('#invoice-modal').removeClass('active'); // Ensure modal is hidden
      $('#invoice-modal').css('display', 'none'); // Force modal to hide
      console.log('Modal closed by clicking outside'); // Debugging log
    }
  });

  // Ensure modal visibility is toggled correctly
  function toggleModalVisibility(isVisible) {
    if (isVisible) {
      $('#invoice-modal').addClass('active').css('display', 'flex');
      console.log('Modal activated'); // Debugging log
    } else {
      $('#invoice-modal').removeClass('active').css('display', 'none');
      console.log('Modal deactivated'); // Debugging log
    }
  }

  // Example usage: toggleModalVisibility(true) to show, toggleModalVisibility(false) to hide

  // Delete invoice
  async function deleteInvoice(invoiceId) {
    if (confirm('Are you sure you want to delete this invoice?')) {
      try {
        await deleteDoc(doc(db, 'invoices', invoiceId));
        alert('Invoice deleted successfully');
        loadInvoiceList();
      } catch (error) {
        console.error('Error deleting invoice:', error);
        alert('Error deleting invoice');
      }
    }
  }

  // Search invoice for return
  async function searchInvoiceForReturn() {
    const invoiceNumber = $('#return-invoice-no').val().trim();
    if (!invoiceNumber) {
      alert('Please enter an invoice number');
      return;
    }
    
    try {
      const q = query(collection(db, 'invoices'), where('invoiceNumber', '==', invoiceNumber));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        displayInvoiceForReturn(doc.id, doc.data());
      } else {
        alert('Invoice not found');
      }
    } catch (error) {
      console.error('Error searching invoice:', error);
      alert('Error searching for invoice');
    }
  }

  // Display invoice for return
  function displayInvoiceForReturn(invoiceId, invoiceData) {
    $('#return-invoice-number').text(invoiceData.invoiceNumber);
    $('#return-invoice-date').text(invoiceData.createdAt.toDate().toLocaleDateString());
    $('#return-customer-name').text(invoiceData.customerName || 'N/A');
    $('#return-original-amount').text('Rs ' + invoiceData.total.toFixed(2));
    
    const tbody = $('#return-items-table tbody');
    tbody.empty();
    
    invoiceData.items.forEach(item => {
      const row = `
        <tr data-code="${item.productCode}">
          <td>${item.productCode}</td>
          <td>${item.productName}</td>
          <td>${item.quantity}</td>
          <td>Rs ${item.price.toFixed(2)}</td>
          <td><input type="number" min="0" max="${item.quantity}" value="0" class="return-qty"></td>
          <td>
            <select class="discount-type">
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </td>
          <td><input type="number" min="0" class="discount-value" value="0"></td>
          <td><input type="text" class="return-reason" placeholder="Reason"></td>
        </tr>`;
      tbody.append(row);
    });
    
    $('#invoice-details').show();
    
    // Update return summary when quantities change
    $('.return-qty').on('input', updateReturnSummary);
    $('.discount-value').on('input', updateReturnSummary);
  }

  // Update return summary
  function updateReturnSummary() {
    let totalItems = 0;
    let totalAmount = 0;
    
    $('#return-items-table tbody tr').each(function() {
      const originalQty = parseInt($(this).find('td:eq(2)').text());
      const returnQty = parseInt($(this).find('.return-qty').val()) || 0;
      const price = parseFloat($(this).find('td:eq(3)').text().replace('Rs ', ''));
      const discountType = $(this).find('.discount-type').val();
      const discountValue = parseFloat($(this).find('.discount-value').val()) || 0;
      
      if (returnQty > 0) {
        totalItems += returnQty;
        
        let itemTotal = returnQty * price;
        if (discountType === 'percentage') {
          itemTotal -= itemTotal * discountValue / 100;
        } else {
          itemTotal -= discountValue;
        }
        
        totalAmount += Math.max(0, itemTotal); // Ensure not negative
      }
    });
    
    $('#total-return-items').text(totalItems);
    $('#total-refund-amount').text('Rs ' + totalAmount.toFixed(2));
  }

  // Process return
  async function processReturn() {
    const invoiceNumber = $('#return-invoice-no').val();
    const returnDate = $('#return-date').val() || new Date().toISOString().split('T')[0];
    const primaryReason = $('#return-reason').val();
    const notes = $('#return-notes').val();
    const action = $('#return-action').val();
    
    if (!primaryReason) {
      alert('Please select a primary return reason');
      return;
    }
    
    const returnedItems = [];
    let anyItemsReturned = false;
    
    $('#return-items-table tbody tr').each(function() {
      const returnQty = parseInt($(this).find('.return-qty').val()) || 0;
      if (returnQty > 0) {
        anyItemsReturned = true;
        returnedItems.push({
          productCode: $(this).data('code'),
          productName: $(this).find('td:eq(1)').text(),
          originalQty: parseInt($(this).find('td:eq(2)').text()),
          returnQty: returnQty,
          price: parseFloat($(this).find('td:eq(3)').text().replace('Rs ', '')),
          discountType: $(this).find('.discount-type').val(),
          discountValue: parseFloat($(this).find('.discount-value').val()) || 0,
          reason: $(this).find('.return-reason').val() || 'No reason specified'
        });
      }
    });
    
    if (!anyItemsReturned) {
      alert('No items selected for return');
      return;
    }
    
    const totalRefund = parseFloat($('#total-refund-amount').text().replace('Rs ', ''));
    
    const returnData = {
      originalInvoice: invoiceNumber,
      returnDate: returnDate,
      primaryReason: primaryReason,
      notes: notes,
      action: action,
      returnedItems: returnedItems,
      totalRefund: totalRefund,
      processedAt: Timestamp.now(),
      status: 'processed'
    };
    
    try {
      await addDoc(collection(db, 'returns'), returnData);
      alert('Return processed successfully!');
      
      // Print return receipt
      printReturnReceipt(returnData);
      
      cancelReturn();
      $('.tab-btn[data-tab="invoice-list"]').click();
    } catch (error) {
      console.error('Error processing return:', error);
      alert('Error processing return');
    }
  }

  // Print return receipt
  async function printReturnReceipt(returnData) {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Return Receipt</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .header { text-align: center; margin-bottom: 20px; }
          .info { margin-bottom: 20px; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .items-table th { background-color: #f2f2f2; }
          .totals { float: right; width: 300px; }
          .footer { margin-top: 50px; text-align: center; font-size: 0.8em; }
          @media print {
            .no-print { display: none; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>RETURN RECEIPT</h1>
          <p>Original Invoice: ${returnData.originalInvoice}</p>
        </div>
        
        <div class="info">
          <p><strong>Date:</strong> ${returnData.returnDate}</p>
          <p><strong>Reason:</strong> ${returnData.primaryReason}</p>
          <p><strong>Action:</strong> ${returnData.action}</p>
          <p><strong>Notes:</strong> ${returnData.notes || 'N/A'}</p>
        </div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th>Product Code</th>
              <th>Product Name</th>
              <th>Qty Returned</th>
              <th>Refund Amount</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            ${returnData.returnedItems.map(item => `
              <tr>
                <td>${item.productCode}</td>
                <td>${item.productName}</td>
                <td>${item.returnQty}</td>
                <td>Rs ${(item.returnQty * item.price - 
                  (item.discountType === 'percentage' ? 
                   (item.returnQty * item.price * item.discountValue / 100) : 
                   item.discountValue)).toFixed(2)}</td>
                <td>${item.reason}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="totals">
          <table>
            <tr>
              <td><strong>Total Refund:</strong></td>
              <td>Rs ${returnData.totalRefund.toFixed(2)}</td>
            </tr>
          </table>
        </div>
        
        <div class="footer">
          <p>Thank you for your business!</p>
          <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="no-print" style="margin-top: 20px;">
          <button onclick="window.print()">Print Receipt</button>
          <button onclick="window.close()">Close</button>
        </div>
        
        <script>
          setTimeout(() => {
            window.print();
          }, 300);
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }

  // Cancel return
  function cancelReturn() {
    $('#return-invoice-no').val('');
    $('#return-date').val('');
    $('#invoice-details').hide();
    $('#return-items-table tbody').empty();
    $('#return-reason').val('');
    $('#return-notes').val('');
    $('#return-action').val('refund');
    $('#total-return-items').text('0');
    $('#total-refund-amount').text('Rs 0.00');
  }

  // Expose functions globally for dashboard integration
  window.loadInvoiceList = loadInvoiceList;
  window.searchInvoiceForReturn = searchInvoiceForReturn;
  window.processReturn = processReturn;
  window.cancelReturn = cancelReturn;
  window.addProductToInvoice = addProductToInvoice;
  window.generateInvoice = generateInvoice;
  
  console.log('✅ Invoice page functions exposed globally');
});