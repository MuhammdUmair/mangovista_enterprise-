/**
 * Google Apps Script - Being Healthy Order Handler
 * 
 * Web App URL: https://script.google.com/macros/s/AKfycbx2ipkS3pI512EC3Q2AmUHciZENMFF0Xa3R5MWpP64dvk2pKeqUuZ1HWel7WKoM_WcX/exec
 * Sheet ID: 31_z1eRE3Fk_PaDj0oLFHnfvQeqGuyzbBhSoED-3MNc
 */

const SHEET_ID = '131_z1eRE3Fk_PaDj0oLFHnfvQeqGuyzbBhSoED-3MNc';
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx2ipkS3pI512EC3Q2AmUHciZENMFF0Xa3R5MWpP64dvk2pKeqUuZ1HWel7WKoM_WcX/exec';

// ============================================================
// MAIN POST HANDLER
// ============================================================
function doPost(e) {
  try {
    console.log('📥 doPost() called');
    
    if (e.parameter && e.parameter.action === 'getFruits') {
      return getFruitsConfig();
    }
    
    let data;
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
      console.log('📋 Parsed JSON data:', JSON.stringify(data));
    } else if (e.parameter) {
      data = e.parameter;
      console.log('📋 Parameter data:', JSON.stringify(data));
    } else {
      throw new Error('No data received');
    }

    const required = ['name', 'phone', 'address', 'state', 'fruit', 'boxes', 'total'];
    for (const field of required) {
      if (!data[field] && data[field] !== 0) {
        throw new Error('Missing required field: ' + field);
      }
    }

    let ss = SpreadsheetApp.openById(SHEET_ID);
    console.log('📊 Spreadsheet opened successfully');

    let sheet = ss.getSheetByName('Orders');
    if (!sheet) {
      console.log('📝 Orders sheet not found, creating new one...');
      sheet = ss.insertSheet('Orders');
      const headers = [
        'Timestamp',
        'Customer Name',
        'Phone Number',
        'Address',
        'Area',
        'Fruit Type',
        'Price Per Box (AED)',
        'Number of Boxes',
        'Total Amount (AED)',
        'Special Instructions',
        'Order Status',
        'Invoice'  // <-- NEW COLUMN for invoice button
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      
      // Add checkbox in the Invoice column for all rows
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        const checkboxRange = sheet.getRange(2, 12, lastRow - 1, 1);
        checkboxRange.insertCheckboxes();
      }
      console.log('✅ Headers created with Invoice column');
    }

    const timestamp = new Date();
    const orderStatus = 'Pending';

    const row = [
      timestamp,
      data.name || '',
      data.phone || '',
      data.address || '',
      data.state || data.area || '',
      data.fruit || 'Mango (Sindhri)',
      data.pricePerBox || 45,
      data.boxes || 0,
      data.total || 0,
      data.instructions || '(none)',
      orderStatus,
      false  // Invoice checkbox default (unchecked)
    ];

    console.log('📝 Appending row:', JSON.stringify(row));

    sheet.appendRow(row);
    console.log('✅ Row appended, new row number:', sheet.getLastRow());

    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Order saved successfully!',
        timestamp: timestamp.toISOString(),
        rowAdded: sheet.getLastRow()
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.log('❌ ERROR:', error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================
// GET FRUITS CONFIGURATION FROM SHEET
// ============================================================
function getFruitsConfig() {
  try {
    console.log('📋 getFruitsConfig() called');
    let ss = SpreadsheetApp.openById(SHEET_ID);
    let configSheet = ss.getSheetByName('FruitConfig');
    
    if (!configSheet) {
      console.log('📝 Creating FruitConfig sheet...');
      configSheet = ss.insertSheet('FruitConfig');
      const headers = ['Fruit Name', 'Emoji', 'Active (TRUE/FALSE)', 'Price (AED)'];
      configSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      configSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      
      const defaultFruits = [
        ['Mango (Sindhri)', '🥭', 'TRUE', 55],
        ['Mango (Chonsa)', '🥭', 'TRUE', 70]
      ];
      
      if (defaultFruits.length > 0) {
        configSheet.getRange(2, 1, defaultFruits.length, 4).setValues(defaultFruits);
        console.log('✅ Default fruits added');
      }
    }
    
    const lastRow = configSheet.getLastRow();
    if (lastRow < 2) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true,
          fruits: []
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = configSheet.getRange(2, 1, lastRow - 1, 4).getValues();
    const fruits = [];
    
    data.forEach(row => {
      const name = row[0] || '';
      const emoji = row[1] || '🥭';
      const activeValue = String(row[2] || 'FALSE').trim().toUpperCase();
      const active = activeValue === 'TRUE' || activeValue === 'YES' || activeValue === '1';
      const price = row[3] || 45;
      
      if (name) {
        fruits.push({
          name: String(name).trim(),
          emoji: String(emoji).trim(),
          active: active,
          price: Number(price) || 45
        });
        console.log(`📦 Fruit: ${name}, Active: ${active}, Price: ${price}`);
      }
    });
    
    console.log(`📋 Loaded ${fruits.length} fruits from config`);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        fruits: fruits
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.log('❌ Error loading fruit config:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString(),
        fruits: []
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================
// ON EDIT - Detect Checkbox Click and Generate Invoice
// ============================================================
function onEdit(e) {
  const range = e.range;
  const sheet = range.getSheet();
  const sheetName = sheet.getName();
  
  // Only process Orders sheet
  if (sheetName !== 'Orders') return;
  
  const row = range.getRow();
  const col = range.getColumn();
  
  // Column L (12) is the Invoice column
  if (col !== 12) return;
  if (row < 2) return; // Skip header row
  
  // Check if checkbox was checked (TRUE)
  const value = range.getValue();
  if (value !== true) return;
  
  // Generate invoice for this row
  try {
    // Get row data
    const data = sheet.getRange(row, 1, 1, 12).getValues()[0];
    
    const name = data[1] || 'Not provided';
    const phone = data[2] || 'Not provided';
    const address = data[3] || 'Not provided';
    const area = data[4] || 'Not selected';
    const fruit = data[5] || 'Not selected';
    const price = Number(data[6]) || 45;
    const boxes = Number(data[7]) || 0;
    const total = Number(data[8]) || 0;
    const instructions = data[9] || 'None';
    const timestamp = data[0] || new Date();
    
    if (!name || name === 'Not provided') {
      SpreadsheetApp.getUi().alert('⚠️ This row has no customer data. Please select a valid order.');
      // Uncheck the checkbox
      range.setValue(false);
      return;
    }
    
    // Format date and time
    const dateObj = new Date(timestamp);
    const dateStr = dateObj.toLocaleDateString('en-GB');
    const timeStr = dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    
    // Generate invoice number
    const now = new Date();
    const invNum = 'BH-' + now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0') + '-' + String(now.getHours()).padStart(2,'0') + String(now.getMinutes()).padStart(2,'0') + '-' + String(row);
    
    // Create and download PDF
    const pdfUrl = createInvoicePDF(name, phone, address, area, fruit, boxes, price, total, instructions, dateStr, timeStr, invNum);
    
    // Update Order Status to "Invoice Generated"
    sheet.getRange(row, 11).setValue('Invoice Generated');
    
    // Uncheck the checkbox
    range.setValue(false);
    
    // Show success message
    SpreadsheetApp.getUi().alert('✅ Invoice generated successfully!\n\nInvoice #: ' + invNum + '\nPDF saved to your Drive.');
    
  } catch (error) {
    console.log('❌ Error generating invoice:', error);
    SpreadsheetApp.getUi().alert('❌ Error generating invoice: ' + error.toString());
    // Uncheck the checkbox
    range.setValue(false);
  }
}

// ============================================================
// CREATE INVOICE PDF AND SAVE TO DRIVE
// ============================================================
function createInvoicePDF(name, phone, address, area, fruit, boxes, price, total, instructions, dateStr, timeStr, invNum) {
  try {
    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Being Healthy Invoice</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 700px; margin: auto; }
            .header { border-bottom: 3px solid #2e7d32; padding-bottom: 15px; margin-bottom: 20px; }
            .header h1 { color: #2e7d32; margin: 0; font-size: 28px; }
            .header p { color: #666; margin: 5px 0; }
            .details { margin: 15px 0; }
            .details td { padding: 4px 10px; }
            .details .label { font-weight: bold; width: 130px; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th { background: #2e7d32; color: white; padding: 10px; text-align: left; }
            td { padding: 10px; border-bottom: 1px solid #ddd; }
            .total { font-size: 20px; font-weight: bold; color: #c0392b; text-align: right; }
            .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px; }
            .delivery { background: #e8f5e9; padding: 10px 15px; border-radius: 5px; margin: 10px 0; }
            .instructions { background: #f5f5f5; padding: 10px 15px; border-radius: 5px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🌿 Being Healthy</h1>
            <p>Fresh Fruits · Delivered with Care</p>
            <p><strong>Invoice #:</strong> ${invNum}</p>
            <p><strong>Date:</strong> ${dateStr} &nbsp;|&nbsp; <strong>Time:</strong> ${timeStr}</p>
          </div>

          <h3>📋 Customer Details</h3>
          <table class="details">
            <tr><td class="label">Full Name:</td><td>${name}</td></tr>
            <tr><td class="label">Phone:</td><td>${phone}</td></tr>
            <tr><td class="label">Address:</td><td>${address}</td></tr>
            <tr><td class="label">Area:</td><td>${area}</td></tr>
          </table>

          <h3>🛒 Order Summary</h3>
          <table>
            <thead>
              <tr><th>Item</th><th>Fruit</th><th>Qty</th><th>Price</th><th>Total</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>Fresh Fruit Boxes</td>
                <td>${fruit}</td>
                <td>${boxes}</td>
                <td>${price} AED</td>
                <td>${total} AED</td>
              </tr>
            </tbody>
          </table>
          <div class="total">Total: ${total} AED</div>

          <div class="delivery">
            <strong>🚚 Delivery:</strong> ${area === 'Dubai' ? 'Dubai: Delivery within 2 days (except Sunday)' : 'Sharjah: Delivery on weekends only'}
            <br>✨ Free delivery on all orders
          </div>
          
          ${instructions && instructions !== 'None' ? `<div class="instructions"><strong>📝 Special Instructions:</strong><br>${instructions}</div>` : ''}

          <div class="footer">
            <p>Thank you for choosing Being Healthy!</p>
            <p>Your trust in our fresh fruits means the world to us.</p>
            <p>📞 +971 52 231 7016 &nbsp;|&nbsp; 📧 info@beinghealthy.ae</p>
          </div>
        </body>
      </html>
    `;

    // Create blob and save as PDF
    const blob = Utilities.newBlob(htmlContent, 'text/html', 'temp.html');
    const pdfBlob = blob.getAs('application/pdf');
    
    // Save to Drive in a specific folder (optional)
    const folderName = 'Being Healthy Invoices';
    let folder = DriveApp.getFoldersByName(folderName);
    let parentFolder;
    
    if (folder.hasNext()) {
      parentFolder = folder.next();
    } else {
      parentFolder = DriveApp.createFolder(folderName);
    }
    
    const file = parentFolder.createFile(pdfBlob).setName('BeingHealthy_Invoice_' + invNum + '.pdf');
    
    console.log('✅ PDF saved to Drive:', file.getUrl());
    return file.getUrl();
    
  } catch (error) {
    console.log('❌ PDF Error:', error);
    throw error;
  }
}

// ============================================================
// SETUP FUNCTIONS
// ============================================================

function setupOrdersSheet() {
  console.log('📝 Setting up Orders sheet...');
  let ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName('Orders');
  
  if (!sheet) {
    sheet = ss.insertSheet('Orders');
  } else {
    sheet.clear();
  }
  
  const headers = [
    'Timestamp',
    'Customer Name',
    'Phone Number',
    'Address',
    'Area',
    'Fruit Type',
    'Price Per Box (AED)',
    'Number of Boxes',
    'Total Amount (AED)',
    'Special Instructions',
    'Order Status',
    'Invoice'  // <-- NEW COLUMN
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.getRange('A:A').setNumberFormat('yyyy-mm-dd hh:mm:ss');
  
  // Add checkbox in the Invoice column for all existing rows
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    const checkboxRange = sheet.getRange(2, 12, lastRow - 1, 1);
    checkboxRange.insertCheckboxes();
  }
  
  console.log('✅ Orders sheet setup complete!');
  console.log('📊 Sheet URL: ' + ss.getUrl());
  return ss.getUrl();
}

function setupFruitConfigSheet() {
  console.log('📝 Setting up FruitConfig sheet...');
  let ss = SpreadsheetApp.openById(SHEET_ID);
  let configSheet = ss.getSheetByName('FruitConfig');
  
  if (!configSheet) {
    configSheet = ss.insertSheet('FruitConfig');
  } else {
    configSheet.clear();
  }
  
  const headers = ['Fruit Name', 'Emoji', 'Active (TRUE/FALSE)', 'Price (AED)'];
  configSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  configSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  
  const defaultFruits = [
    ['Mango (Sindhri)', '🥭', 'TRUE', 55],
    ['Mango (Chonsa)', '🥭', 'TRUE', 70]
  ];
  
  if (defaultFruits.length > 0) {
    configSheet.getRange(2, 1, defaultFruits.length, 4).setValues(defaultFruits);
  }
  
  configSheet.autoResizeColumns(1, 4);
  
  console.log('✅ Fruit Config sheet setup complete!');
  console.log('📊 Sheet URL: ' + ss.getUrl());
  return ss.getUrl();
}

function setupAll() {
  console.log('🚀 Starting full setup...');
  setupOrdersSheet();
  setupFruitConfigSheet();
  console.log('🎉 All setup complete!');
}

// ============================================================
// TEST FUNCTIONS
// ============================================================

function testDoPost() {
  console.log('🧪 Running test...');
  const testData = {
    name: 'Test Customer',
    phone: '+971 50 123 4567',
    address: 'Test Address, Dubai',
    state: 'Dubai',
    fruit: 'Mango (Sindhri)',
    pricePerBox: 55,
    boxes: 2,
    total: 110,
    instructions: 'Test instruction - leave with security',
    timestamp: new Date().toISOString()
  };

  const event = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };

  try {
    const result = doPost(event);
    console.log('✅ Test result:', result.getContent());
    return result.getContent();
  } catch (error) {
    console.log('❌ Test ERROR:', error.toString());
    return 'Error: ' + error.toString();
  }
}
