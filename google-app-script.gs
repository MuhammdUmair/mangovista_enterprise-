/**
 * Google Apps Script - Being Healthy Order Handler
 * Sheet ID: 131_z1eRE3Fk_PaDj0oLFHnfvQeqGuyzbBhSoED-3MNc
 */

const SHEET_ID = '131_z1eRE3Fk_PaDj0oLFHnfvQeqGuyzbBhSoED-3MNc';

function doPost(e) {
  try {
    console.log('📥 doPost() called');
    
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
        'Price Per Box (AED)',
        'Number of Boxes',
        'Total Amount (AED)',
        'Special Instructions',
        'Order Status'
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    }

    const row = [
      new Date(),
      data.name || '',
      data.phone || '',
      data.address || '',
      data.state || data.area || '',
      data.fruit || 'Mango',
      data.pricePerBox || 45,
      data.boxes || 0,
      data.total || 0,
      data.instructions || '(none)',
      'Pending'
    ];

    sheet.appendRow(row);
    console.log('✅ Row appended');

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: 'Order saved!' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.log('❌ ERROR:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getFruitsConfig() {
  try {
    let ss = SpreadsheetApp.openById(SHEET_ID);
    let configSheet = ss.getSheetByName('FruitConfig');
    
    if (!configSheet) {
      configSheet = ss.insertSheet('FruitConfig');
      const headers = ['Fruit Name', 'Emoji', 'Active (TRUE/FALSE)', 'Price (AED)'];
      configSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      configSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      
      const defaults = [
        ['Mango', '🥭', 'TRUE', 45],
        ['Apple', '🍎', 'TRUE', 40],
        ['Banana', '🍌', 'TRUE', 35],
        ['Orange', '🍊', 'TRUE', 38],
        ['Strawberry', '🍓', 'FALSE', 50],
        ['Grapes', '🍇', 'TRUE', 42],
        ['Watermelon', '🍉', 'FALSE', 55],
        ['Pineapple', '🍍', 'TRUE', 48]
      ];
      configSheet.getRange(2, 1, defaults.length, 4).setValues(defaults);
    }
    
    const data = configSheet.getRange(2, 1, configSheet.getLastRow() - 1, 4).getValues();
    const fruits = [];
    
    data.forEach(row => {
      if (row[0]) {
        fruits.push({
          name: String(row[0]).trim(),
          emoji: String(row[1] || '🍎').trim(),
          active: String(row[2] || 'FALSE').toUpperCase() === 'TRUE',
          price: Number(row[3]) || 45
        });
      }
    });
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, fruits: fruits }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString(), fruits: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function setupAll() {
  let ss = SpreadsheetApp.openById(SHEET_ID);
  
  // Setup Orders
  let ordersSheet = ss.getSheetByName('Orders');
  if (!ordersSheet) ordersSheet = ss.insertSheet('Orders');
  ordersSheet.clear();
  const headers = ['Timestamp', 'Customer Name', 'Phone Number', 'Address', 'Area', 'Fruit Type', 'Price Per Box (AED)', 'Number of Boxes', 'Total Amount (AED)', 'Special Instructions', 'Order Status'];
  ordersSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  ordersSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  ordersSheet.setFrozenRows(1);
  
  // Setup FruitConfig
  let configSheet = ss.getSheetByName('FruitConfig');
  if (!configSheet) configSheet = ss.insertSheet('FruitConfig');
  configSheet.clear();
  const configHeaders = ['Fruit Name', 'Emoji', 'Active (TRUE/FALSE)', 'Price (AED)'];
  configSheet.getRange(1, 1, 1, configHeaders.length).setValues([configHeaders]);
  configSheet.getRange(1, 1, 1, configHeaders.length).setFontWeight('bold');
  
  const defaults = [
    ['Mango', '🥭', 'TRUE', 45],
    ['Apple', '🍎', 'TRUE', 40],
    ['Banana', '🍌', 'TRUE', 35],
    ['Orange', '🍊', 'TRUE', 38],
    ['Strawberry', '🍓', 'FALSE', 50],
    ['Grapes', '🍇', 'TRUE', 42],
    ['Watermelon', '🍉', 'FALSE', 55],
    ['Pineapple', '🍍', 'TRUE', 48]
  ];
  configSheet.getRange(2, 1, defaults.length, 4).setValues(defaults);
  configSheet.autoResizeColumns(1, 4);
  
  Logger.log('✅ Setup complete! Sheet: ' + ss.getUrl());
}
