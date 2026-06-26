/**
 * Google Apps Script - Mango Vista Order Handler
 */

// CORRECT SHEET ID (extracted from your URL)
const SHEET_ID = '1GYDIpYphGIMduA-qtyM-WrotDhyKC69TWgKEYS2ELfI';

function doPost(e) {
  try {
    let data;
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      data = e.parameter;
    } else {
      throw new Error('No data received');
    }

    let ss = SpreadsheetApp.openById(SHEET_ID);
    let sheet = ss.getSheetByName('Orders');
    
    if (!sheet) {
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
    }

    const timestamp = new Date();
    const orderStatus = 'Pending';

    Logger.log(`Received order: ${JSON.stringify(data)}`);

    const row = [
      timestamp,
      data.name || '',
      data.phone || '',
      data.address || '',
      data.state || data.area || '',
      data.boxes || 0,
      data.total || 0,
      data.instructions || '(none)',
      orderStatus
    ];

    sheet.appendRow(row);

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

function setupSheet() {
  let ss = SpreadsheetApp.openById(SHEET_ID);
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
  sheet.getRange('A:A').setNumberFormat('yyyy-mm-dd hh:mm:ss');

  Logger.log(`Sheet setup complete. Spreadsheet URL: ${ss.getUrl()}`);
  return ss.getUrl();
}

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
