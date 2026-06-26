/**
 * Google Apps Script - Being Healthy Order Handler
 * 
 * Web App URL: https://script.google.com/macros/s/AKfycbx2ipkS3pI512EC3Q2AmUHciZENMFF0Xa3R5MWpP64dvk2pKeqUuZ1HWel7WKoM_WcX/exec
 * Sheet ID: 31_z1eRE3Fk_PaDj0oLFHnfvQeqGuyzbBhSoED-3MNc
 */

const SHEET_ID = '31_z1eRE3Fk_PaDj0oLFHnfvQeqGuyzbBhSoED-3MNc';

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
      data.fruit || 'Mango',
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
// GET FRUITS CONFIGURATION
// ============================================================
function getFruitsConfig() {
  try {
    console.log('📋 getFruitsConfig() called');
    let ss = SpreadsheetApp.openById(SHEET_ID);
    let configSheet = ss.getSheetByName('FruitConfig');
    
    // If FruitConfig sheet doesn't exist, create it with default data
    if (!configSheet) {
      console.log('📝 Creating FruitConfig sheet...');
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
        console.log('✅ Default fruits added');
      }
    }
    
    // Read fruit data
    const lastRow = configSheet.getLastRow();
    if (lastRow < 2) {
      console.log('⚠️ No fruit data found');
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
      // Convert to string and trim, then check for TRUE
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

// Run this to set up the Fruit Config sheet
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
  
  configSheet.autoResizeColumns(1, 4);
  
  console.log('✅ Fruit Config sheet setup complete!');
  console.log('📊 Sheet URL: ' + ss.getUrl());
  return ss.getUrl();
}

// Run this to set up everything at once
function setupAll() {
  console.log('🚀 Starting full setup...');
  setupOrdersSheet();
  setupFruitConfigSheet();
  console.log('🎉 All setup complete!');
}

// Test function to verify backend connection
function testDoPost() {
  console.log('🧪 Running test...');
  const testData = {
    name: 'Test Customer',
    phone: '+971 50 123 4567',
    address: 'Test Address, Dubai',
    state: 'Dubai',
    fruit: 'Orange',
    pricePerBox: 38,
    boxes: 3,
    total: 114,
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
