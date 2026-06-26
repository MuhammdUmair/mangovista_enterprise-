/**
 * Google Apps Script - Being Healthy Order Handler
 * Supports dynamic fruit configuration from sheet
 */

const SHEET_ID = '1GYDIpYphGIMduA-qtyM-WrotDhyKC69TWgKEYS2ELfI';

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
        'Fruit Type',
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

    const row = [
      timestamp,
      data.name || '',
      data.phone || '',
      data.address || '',
      data.state || data.area || '',
      data.fruit || 'Mango',
      data.boxes || 0,
      data.total || 0,
      data.instructions || '(none)',
      orderStatus
    ];

    sheet.appendRow(row);
    console.log('✅ Row appended');

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
    let ss = SpreadsheetApp.openById(SHEET_ID);
    let configSheet = ss.getSheetByName('FruitConfig');
    
    // If FruitConfig sheet doesn't exist, create it with default data
    if (!configSheet) {
      configSheet = ss.insertSheet('FruitConfig');
      const headers = ['Fruit Name', 'Emoji', 'Active (TRUE/FALSE)', 'Price (AED)'];
      configSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      configSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      
      const defaultFruits = [
        ['Mango', '🥭', 'TRUE', 45],
        ['Apple', '🍎', 'TRUE', 40],
        ['Banana', '🍌', 'TRUE', 35],
        ['Orange', '🍊', 'TRUE', 38],
        ['Strawberry', '🍓', 'FALSE', 50],
        ['Grapes', '🍇', 'TRUE', 42],
        ['Watermelon', '🍉', 'FALSE', 55],
        ['Pineapple', '🍍', 'TRUE', 48],
        ['Peach', '🍑', 'FALSE', 45],
        ['Cherry', '🍒', 'FALSE', 60]
      ];
      
      if (defaultFruits.length > 0) {
        configSheet.getRange(2, 1, defaultFruits.length, 4).setValues(defaultFruits);
      }
    }
    
    // Read fruit data
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
      const emoji = row[1] || '🍎';
      const active = String(row[2] || 'FALSE').toUpperCase() === 'TRUE';
      const price = row[3] || 45;
      
      if (name) {
        fruits.push({
          name: String(name).trim(),
          emoji: String(emoji).trim(),
          active: active,
          price: Number(price) || 45
        });
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
// SETUP FUNCTIONS - Run these once
// ============================================================

// Run this to set up the Orders sheet
function setupOrdersSheet() {
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
    'Number of Boxes',
    'Total Amount (AED)',
    'Special Instructions',
    'Order Status'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.getRange('A:A').setNumberFormat('yyyy-mm-dd hh:mm:ss');
  
  Logger.log('✅ Orders sheet setup complete!');
  Logger.log('📊 Sheet URL: ' + ss.getUrl());
  return ss.getUrl();
}

// Run this to set up the Fruit Config sheet
function setupFruitConfigSheet() {
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
    ['Mango', '🥭', 'TRUE', 45],
    ['Apple', '🍎', 'TRUE', 40],
    ['Banana', '🍌', 'TRUE', 35],
    ['Orange', '🍊', 'TRUE', 38],
    ['Strawberry', '🍓', 'FALSE', 50],
    ['Grapes', '🍇', 'TRUE', 42],
    ['Watermelon', '🍉', 'FALSE', 55],
    ['Pineapple', '🍍', 'TRUE', 48],
    ['Peach', '🍑', 'FALSE', 45],
    ['Cherry', '🍒', 'FALSE', 60]
  ];
  
  if (defaultFruits.length > 0) {
    configSheet.getRange(2, 1, defaultFruits.length, 4).setValues(defaultFruits);
  }
  
  // Auto-resize columns
  configSheet.autoResizeColumns(1, 4);
  
  Logger.log('✅ Fruit Config sheet setup complete!');
  Logger.log('📊 Sheet URL: ' + ss.getUrl());
  return ss.getUrl();
}

// Run this to set up everything
function setupAll() {
  setupOrdersSheet();
  setupFruitConfigSheet();
  Logger.log('🎉 All setup complete!');
}

// Test function
function testDoPost() {
  const testData = {
    name: 'Test Customer',
    phone: '+971 50 123 4567',
    address: 'Test Address, Dubai',
    state: 'Dubai',
    fruit: 'Mango',
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
