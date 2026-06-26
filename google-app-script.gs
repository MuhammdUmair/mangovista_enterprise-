/**
 * Google Apps Script - Mango Vista Order Handler
 * 
 * DEPLOYMENT INFO:
 * Web App URL: https://script.google.com/macros/s/AKfycbxt6JQBzNskvbKtFYSKnpUbzxBmtR1_OhSnSIkgbwAfXYwnlErs5fx9Qa8hL7-j98U82Q/exec
 * Deployment ID: AKfycbxt6JQBzNskvbKtFYSKnpUbzxBmtR1_OhSnSIkgbwAfXYwnlErs5fx9Qa8hL7-j98U82Q
 */

// YOUR GOOGLE SHEET ID (extracted from your sheet URL)
const SHEET_ID = '1GYDIpYphGIMduA-qtyM-WrotDhyKC69TWgKEYS2ELfI';

function doPost(e) {
  try {
    console.log('📥 doPost() called');
    
    // Parse the incoming data
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
      data.name || data.customerName || '',
      data.phone || '',
      data.address || '',
      data.state || data.area || '',
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

/**
 * Run this function ONCE to set up your sheet with headers
 * In Apps Script editor: Click "Run" → "setupSheet"
 */
function setupSheet() {
  try {
    console.log('🔧 Running setupSheet()...');
    let ss = SpreadsheetApp.openById(SHEET_ID);
    console.log('📊 Spreadsheet opened:', ss.getUrl());
    
    let sheet = ss.getSheetByName('Orders');
    if (!sheet) {
      sheet = ss.insertSheet('Orders');
      console.log('📝 Created new Orders sheet');
    }

    const headers = [
      'Timestamp',
      'Customer Name',
      'Phone Number',
      'Address',
      'Area',
      'Number of Boxes',
      'Total Amount (AED)',
      'Special Instructions',
      'Order Status'
    ];

    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.getRange('A:A').setNumberFormat('yyyy-mm-dd hh:mm:ss');

    console.log('✅ Sheet setup complete!');
    console.log('🔗 Spreadsheet URL: ' + ss.getUrl());
    return ss.getUrl();
  } catch (error) {
    console.log('❌ setupSheet ERROR:', error.toString());
    throw error;
  }
}

/**
 * Test function - run this to verify your script works
 * In Apps Script editor: Click "Run" → "testDoPost"
 */
function testDoPost() {
  const testData = {
    name: 'Test Customer',
    phone: '+971 50 123 4567',
    address: 'Test Address, Dubai',
    state: 'Dubai',
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

/**
 * Helper function to get the spreadsheet URL
 */
function getSpreadsheetUrl() {
  try {
    let ss = SpreadsheetApp.openById(SHEET_ID);
    return ss.getUrl();
  } catch (error) {
    console.log('❌ Error getting spreadsheet URL:', error.toString());
    return null;
  }
}
