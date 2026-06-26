/**
 * Google Apps Script - Being Healthy Order Handler
 * 
 * Web App URL: https://script.google.com/macros/s/AKfycbx2ipkS3pI512EC3Q2AmUHciZENMFF0Xa3R5MWpP64dvk2pKeqUuZ1HWel7WKoM_WcX/exec
 * Sheet ID: 31_z1eRE3Fk_PaDj0oLFHnfvQeqGuyzbBhSoED-3MNc
 */

const SHEET_ID = '131_z1eRE3Fk_PaDj0oLFHnfvQeqGuyzbBhSoED-3MNc';

// ============================================================
// CORS Helper - Add proper headers
// ============================================================
function createCORSResponse(data) {
    return ContentService
        .createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeader('Access-Control-Allow-Origin', '*')
        .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        .setHeader('Access-Control-Allow-Headers', 'Content-Type')
        .setHeader('Access-Control-Max-Age', '86400');
}

// ============================================================
// DO OPTIONS - Handle preflight requests
// ============================================================
function doOptions(e) {
    return createCORSResponse({ success: true });
}

// ============================================================
// DO GET - Handles all GET requests
// ============================================================
function doGet(e) {
    console.log('📥 doGet() called');
    
    // Check if it's a request for fruit config
    if (e && e.parameter && e.parameter.action === 'getFruits') {
        return getFruitsConfig(e);
    }
    
    // Default response
    return createCORSResponse({
        success: false,
        message: 'Invalid action. Use ?action=getFruits'
    });
}

// ============================================================
// DO POST - Handles order submissions
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

        // Return success response with CORS headers
        return createCORSResponse({
            success: true,
            message: 'Order saved successfully!',
            timestamp: timestamp.toISOString(),
            rowAdded: sheet.getLastRow()
        });

    } catch (error) {
        console.log('❌ ERROR:', error.toString());
        return createCORSResponse({
            success: false,
            error: error.toString()
        });
    }
}

// ============================================================
// GET FRUITS CONFIGURATION
// ============================================================
function getFruitsConfig(e) {
    try {
        console.log('📋 getFruitsConfig() called');
        console.log('📋 Request parameters:', JSON.stringify(e ? e.parameter : {}));
        
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
        console.log('📊 FruitConfig last row:', lastRow);
        
        if (lastRow < 2) {
            console.log('⚠️ No fruit data found');
            return createCORSResponse({
                success: true,
                fruits: [],
                _timestamp: new Date().toISOString()
            });
        }
        
        const data = configSheet.getRange(2, 1, lastRow - 1, 4).getValues();
        const fruits = [];
        
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const name = row[0] || '';
            const emoji = row[1] || '🍎';
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
        }
        
        console.log(`📋 Loaded ${fruits.length} fruits from config`);
        
        // Return success response with CORS headers
        return createCORSResponse({
            success: true,
            fruits: fruits,
            _timestamp: new Date().toISOString(),
            _count: fruits.length
        });

    } catch (error) {
        console.log('❌ Error loading fruit config:', error);
        return createCORSResponse({
            success: false,
            error: error.toString(),
            fruits: [],
            _timestamp: new Date().toISOString()
        });
    }
}

// ============================================================
// SETUP FUNCTIONS - Run these once
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

// ============================================================
// TEST FUNCTION - Run this in Apps Script to test
// ============================================================
function testGetFruits() {
    console.log('🧪 Testing getFruits...');
    const result = getFruitsConfig({ parameter: { action: 'getFruits', t: Date.now() } });
    console.log('📊 Result:', result.getContent());
    return result.getContent();
}
