/**
 * Google Apps Script - Being Healthy Order Handler
 * 
 * Web App URL: https://script.google.com/macros/s/AKfycbx2ipkS3pI512EC3Q2AmUHciZENMFF0Xa3R5MWpP64dvk2pKeqUuZ1HWel7WKoM_WcX/exec
 * Sheet ID: 31_z1eRE3Fk_PaDj0oLFHnfvQeqGuyzbBhSoED-3MNc
 */

const SHEET_ID = '131_z1eRE3Fk_PaDj0oLFHnfvQeqGuyzbBhSoED-3MNc';

// ============================================================
// MAIN POST HANDLER
// ============================================================
function doPost(e) {
  try {
    console.log('📥 doPost() called');
    
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
      data.pricePerBox || 55,
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
// SETUP FUNCTIONS - Run these once in Apps Script
// ============================================================

// Run this to set up the Orders sheet
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

// Run this to set up everything at once
function setupAll() {
  console.log('🚀 Starting full setup...');
  setupOrdersSheet();
  console.log('🎉 All setup complete!');
}

// Test function
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
    total: 90,
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
