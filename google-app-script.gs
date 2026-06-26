/**
 * Google Apps Script - Mango Vista Order Handler
 * This script receives orders from the web form and saves them to Google Sheets
 */

// Configuration - CHANGE THIS TO YOUR SHEET ID
const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE'; // Replace with your actual Sheet ID

function doPost(e) {
  try {
    // Parse the incoming data
    let data;
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      // Fallback for form-encoded data
      data = e.parameter;
    } else {
      throw new Error('No data received');
    }

    // Get or create the spreadsheet
    let ss;
    if (SHEET_ID && SHEET_ID !== 'YOUR_GOOGLE_SHEET_ID_HERE') {
      ss = SpreadsheetApp.openById(SHEET_ID);
    } else {
      // If no sheet ID provided, create a new spreadsheet
      ss = SpreadsheetApp.create('Mango Vista Orders');
      const url = ss.getUrl();
      Logger.log(`New spreadsheet created: ${url}`);
    }

    // Get or create the Orders sheet
    let sheet = ss.getSheetByName('Orders');
    if (!sheet) {
      sheet = ss.insertSheet('Orders');
      // Add headers
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
    }

    // Prepare row data
    const timestamp = new Date();
    const orderStatus = 'Pending';

    // Log the received data for debugging
    Logger.log(`Received order: ${JSON.stringify(data)}`);

    // Create row with all fields
    const row = [
      timestamp,                          // Timestamp
      data.name || data.customerName || '', // Customer Name
      data.phone || '',                   // Phone Number
      data.address || '',                 // Address
      data.state || data.area || '',      // Area
      data.boxes || 0,                    // Number of Boxes
      data.total || 0,                    // Total Amount
      data.instructions || '(none)',      // Special Instructions
      orderStatus                         // Order Status
    ];

    // Append row to sheet
    sheet.appendRow(row);

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
    Logger.log(`Error: ${error.toString()}`);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Function to test the script (run this in the Apps Script editor)
function testDoPost() {
  const testData = {
    name: 'Test Customer',
    phone: '+971 50 123 4567',
    address: 'Test Address, Dubai',
    state: 'Dubai',
    boxes: 2,
    total: 90,
    instructions: 'Test instruction - leave with security'
  };

  const event = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };

  const result = doPost(event);
  Logger.log(`Test result: ${result.getContent()}`);
}

// Function to get the spreadsheet URL
function getSpreadsheetUrl() {
  let ss;
  if (SHEET_ID && SHEET_ID !== 'YOUR_GOOGLE_SHEET_ID_HERE') {
    ss = SpreadsheetApp.openById(SHEET_ID);
  } else {
    ss = SpreadsheetApp.create('Mango Vista Orders');
  }
  return ss.getUrl();
}

// Function to set up the sheet with headers (run this once)
function setupSheet() {
  let ss;
  if (SHEET_ID && SHEET_ID !== 'YOUR_GOOGLE_SHEET_ID_HERE') {
    ss = SpreadsheetApp.openById(SHEET_ID);
  } else {
    ss = SpreadsheetApp.create('Mango Vista Orders');
  }

  let sheet = ss.getSheetByName('Orders');
  if (!sheet) {
    sheet = ss.insertSheet('Orders');
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

  // Format the Timestamp column
  sheet.getRange('A:A').setNumberFormat('yyyy-mm-dd hh:mm:ss');

  Logger.log(`Sheet setup complete. Spreadsheet URL: ${ss.getUrl()}`);
  return ss.getUrl();
}
