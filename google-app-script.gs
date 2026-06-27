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
    
    // Check if it's a GET request for fruit config
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

    // Validate required fields
    const required = ['name', 'phone', 'address', 'state', 'fruit', 'boxes', 'total'];
    for (const field of required) {
      if (!data[field] && data[field] !== 0) {
        throw new Error('Missing required field: ' + field);
      }
    }

    // Get the spreadsheet
    let ss = SpreadsheetApp.openById(SHEET_ID);
    console.log('📊 Spreadsheet opened successfully');

    // Get or create the Orders sheet
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
        'Order Status'
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      console.log('✅ Headers created');
    }

    // Prepare row data
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
      orderStatus
    ];

    console.log('📝 Appending row:', JSON.stringify(row));

    // Append row to sheet
    sheet.appendRow(row);
    console.log('✅ Row appended, new row number:', sheet.getLastRow());

    // Return success response
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
// GENERATE INVOICE PDF FROM SHEET ROW
// ============================================================
function generateInvoice() {
  try {
    console.log('📄 generateInvoice() called');
    
    // Get active spreadsheet and sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getActiveSheet();
    const row = sheet.getActiveRange().getRow();
    
    if (row < 2) {
      SpreadsheetApp.getUi().alert('⚠️ Please select a valid order row (row 1 is headers).');
      return;
    }
    
    // Get row data
    const data = sheet.getRange(row, 1, 1, 11).getValues()[0];
    
    // Column mapping
    const columns = {
      timestamp: 0,
      name: 1,
      phone: 2,
      address: 3,
      area: 4,
      fruit: 5,
      pricePerBox: 6,
      boxes: 7,
      total: 8,
      instructions: 9,
      status: 10
    };
    
    const name = data[columns.name] || 'Not provided';
    const phone = data[columns.phone] || 'Not provided';
    const address = data[columns.address] || 'Not provided';
    const area = data[columns.area] || 'Not selected';
    const fruit = data[columns.fruit] || 'Not selected';
    const boxes = Number(data[columns.boxes]) || 0;
    const price = Number(data[columns.pricePerBox]) || 45;
    const total = Number(data[columns.total]) || 0;
    const instructions = data[columns.instructions] || 'None';
    const timestamp = data[columns.timestamp] || new Date();
    
    if (!name || name === 'Not provided') {
      SpreadsheetApp.getUi().alert('⚠️ This row has no customer data. Please select a valid order.');
      return;
    }
    
    // Format date and time
    const dateObj = new Date(timestamp);
    const dateStr = dateObj.toLocaleDateString('en-GB');
    const timeStr = dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    
    // Generate invoice number
    const now = new Date();
    const invNum = 'BH-' + now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0') + '-' + String(now.getHours()).padStart(2,'0') + String(now.getMinutes()).padStart(2,'0') + '-' + String(row);
    
    // ============================================================
    // CREATE PDF USING jsPDF (via eval)
    // ============================================================
    // We'll use HtmlService to create the PDF
    const htmlOutput = HtmlService
      .createHtmlOutput(generateInvoiceHTML(name, phone, address, area, fruit, boxes, price, total, instructions, dateStr, timeStr, invNum))
      .setWidth(400)
      .setHeight(500);
    
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, '📄 Invoice Preview');
    
  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Error: ' + error.toString());
    console.log('❌ Error:', error);
  }
}

// ============================================================
// GENERATE INVOICE HTML FOR PREVIEW
// ============================================================
function generateInvoiceHTML(name, phone, address, area, fruit, boxes, price, total, instructions, dateStr, timeStr, invNum) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <base target="_top">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
          .invoice-box {
            max-width: 600px;
            margin: auto;
            padding: 20px;
            border: 1px solid #eee;
            background: #fff;
            box-shadow: 0 0 10px rgba(0,0,0,0.15);
            font-size: 14px;
            line-height: 1.6;
          }
          .invoice-box h2 {
            color: #2e7d32;
            margin-top: 0;
          }
          .invoice-box .header {
            border-bottom: 2px solid #2e7d32;
            padding-bottom: 10px;
            margin-bottom: 15px;
          }
          .invoice-box .details {
            margin: 10px 0;
          }
          .invoice-box .details td {
            padding: 5px 10px;
          }
          .invoice-box .details .label {
            font-weight: bold;
            width: 120px;
          }
          .invoice-box table {
            width: 100%;
            border-collapse: collapse;
          }
          .invoice-box table th {
            background: #2e7d32;
            color: #fff;
            padding: 8px;
            text-align: left;
          }
          .invoice-box table td {
            padding: 8px;
            border-bottom: 1px solid #ddd;
          }
          .invoice-box .total {
            font-size: 18px;
            font-weight: bold;
            color: #c0392b;
            text-align: right;
            padding-top: 10px;
          }
          .invoice-box .footer {
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #666;
            font-size: 12px;
          }
          .btn-primary {
            background: #2e7d32;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            font-size: 14px;
            cursor: pointer;
            margin-top: 15px;
          }
          .btn-primary:hover { background: #1b5e20; }
          .btn-secondary {
            background: #ccc;
            color: #333;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            font-size: 14px;
            cursor: pointer;
            margin-top: 15px;
          }
          .btn-secondary:hover { background: #bbb; }
          .text-center { text-align: center; }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <div class="header">
            <h2>🌿 Being Healthy</h2>
            <p style="color: #666; margin-top: -5px;">Fresh Fruits · Delivered with Care</p>
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

          <p style="margin-top: 10px;">
            <strong>Delivery:</strong> ${area === 'Dubai' ? 'Dubai: Delivery within 2 days (except Sunday)' : 'Sharjah: Delivery on weekends only'}
          </p>
          <p style="color: #2e7d32;">✨ Free delivery on all orders</p>
          
          ${instructions && instructions !== 'None' ? `<p><strong>📝 Special Instructions:</strong><br>${instructions}</p>` : ''}

          <div class="footer">
            <p>Thank you for choosing Being Healthy!</p>
            <p>Your trust in our fresh fruits means the world to us.</p>
            <p>📞 +971 52 231 7016 &nbsp;|&nbsp; 📧 info@beinghealthy.ae</p>
          </div>

          <div class="text-center">
            <button class="btn-primary" onclick="downloadPDF()">📥 Download PDF</button>
            <button class="btn-secondary" onclick="google.script.host.close()">Close</button>
          </div>
        </div>

        <script>
          function downloadPDF() {
            // This will trigger the server-side PDF generation
            google.script.run
              .withSuccessHandler(function() {
                alert('✅ PDF downloaded successfully!');
              })
              .withFailureHandler(function(error) {
                alert('❌ Error: ' + error);
              })
              .createAndDownloadPDF('${name}', '${phone}', '${address}', '${area}', '${fruit}', '${boxes}', '${price}', '${total}', '${instructions}', '${dateStr}', '${timeStr}', '${invNum}');
          }
        </script>
      </body>
    </html>
  `;
}

// ============================================================
// CREATE AND DOWNLOAD PDF (Server-side)
// ============================================================
function createAndDownloadPDF(name, phone, address, area, fruit, boxes, price, total, instructions, dateStr, timeStr, invNum) {
  try {
    // Create a temporary HTML file with the invoice content
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

    // Create a blob and save as PDF
    const blob = Utilities.newBlob(htmlContent, 'text/html', 'temp.html');
    const pdfBlob = blob.getAs('application/pdf');
    
    // Save to Drive
    const folder = DriveApp.getRootFolder();
    const file = folder.createFile(pdfBlob).setName('BeingHealthy_Invoice_' + invNum + '.pdf');
    
    // Return the download URL
    return file.getUrl();
    
  } catch (error) {
    console.log('❌ PDF Error:', error);
    throw error;
  }
}

// ============================================================
// SETUP FUNCTIONS - Run these once in Apps Script
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
    'Order Status'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.getRange('A:A').setNumberFormat('yyyy-mm-dd hh:mm:ss');
  
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
// CREATE INVOICE BUTTON IN SHEET
// ============================================================
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  const menu = ui.createMenu('📄 Invoice');
  menu.addItem('Generate Invoice for Selected Row', 'generateInvoice');
  menu.addToUi();
}

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
