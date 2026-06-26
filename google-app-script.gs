/**
 * Google Apps Script - Being Healthy Order Handler
 * 
 * Web App URL: https://script.google.com/macros/s/AKfycbx2ipkS3pI512EC3Q2AmUHciZENMFF0Xa3R5MWpP64dvk2pKeqUuZ1HWel7WKoM_WcX/exec
 * Sheet ID: 31_z1eRE3Fk_PaDj0oLFHnfvQeqGuyzbBhSoED-3MNc
 */

const SHEET_ID = '131_z1eRE3Fk_PaDj0oLFHnfvQeqGuyzbBhSoED-3MNc';

// ============================================================
// CORS Helper
// ============================================================
function corsResponse(data) {
    return ContentService
        .createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeader('Access-Control-Allow-Origin', '*')
        .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        .setHeader('Access-Control-Allow-Headers', 'Content-Type')
        .setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
}

// ============================================================
// DO OPTIONS
// ============================================================
function doOptions(e) {
    return corsResponse({ success: true });
}

// ============================================================
// DO POST - Handles BOTH order submission AND fruit fetching
// ============================================================
function doPost(e) {
    try {
        console.log('📥 doPost() called');
        
        let data;
        if (e.postData && e.postData.contents) {
            data = JSON.parse(e.postData.contents);
        } else if (e.parameter) {
            data = e.parameter;
        } else {
            throw new Error('No data received');
        }

        // ============================================================
        // If action is 'getFruits', return fruit config (NO CACHING)
        // ============================================================
        if (data.action === 'getFruits') {
            console.log('📋 Fetching fruits via POST (no cache)');
            return getFruitsConfig();
        }

        // ============================================================
        // Otherwise, it's an order submission
        // ============================================================
        console.log('📋 Processing order...');
        
        // Validate required fields
        const required = ['name', 'phone', 'address', 'state', 'fruit', 'boxes', 'total'];
        for (const field of required) {
            if (!data[field] && data[field] !== 0) {
                throw new Error('Missing required field: ' + field);
            }
        }

        let ss = SpreadsheetApp.openById(SHEET_ID);
        let sheet = ss.getSheetByName('Orders');
        
        if (!sheet) {
            sheet = ss.insertSheet('Orders');
            const headers = [
                'Timestamp', 'Customer Name', 'Phone Number', 'Address', 'Area',
                'Fruit Type', 'Price Per Box (AED)', 'Number of Boxes',
                'Total Amount (AED)', 'Special Instructions', 'Order Status'
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
        console.log('✅ Order saved');

        return corsResponse({
            success: true,
            message: 'Order saved successfully!'
        });

    } catch (error) {
        console.log('❌ ERROR:', error);
        return corsResponse({
            success: false,
            error: error.toString()
        });
    }
}

// ============================================================
// GET FRUITS CONFIG - Called via POST to avoid caching
// ============================================================
function getFruitsConfig() {
    try {
        console.log('📋 getFruitsConfig() called via POST');
        
        let ss = SpreadsheetApp.openById(SHEET_ID);
        let configSheet = ss.getSheetByName('FruitConfig');
        
        // Create sheet if it doesn't exist
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
            }
        }
        
        const lastRow = configSheet.getLastRow();
        if (lastRow < 2) {
            return corsResponse({ success: true, fruits: [] });
        }
        
        const data = configSheet.getRange(2, 1, lastRow - 1, 4).getValues();
        const fruits = [];
        
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const name = row[0] || '';
            const emoji = row[1] || '🍎';
            const active = String(row[2] || 'FALSE').trim().toUpperCase() === 'TRUE';
            const price = row[3] || 45;
            
            if (name) {
                fruits.push({
                    name: String(name).trim(),
                    emoji: String(emoji).trim(),
                    active: active,
                    price: Number(price) || 45
                });
            }
        }
        
        console.log(`📋 Loaded ${fruits.length} fruits`);
        
        return corsResponse({
            success: true,
            fruits: fruits,
            _timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.log('❌ Error:', error);
        return corsResponse({
            success: false,
            error: error.toString(),
            fruits: []
        });
    }
}

// ============================================================
// DO GET - Redirects to POST (for testing)
// ============================================================
function doGet(e) {
    // Redirect to POST for fruit fetching
    if (e && e.parameter && e.parameter.action === 'getFruits') {
        return getFruitsConfig();
    }
    return corsResponse({
        success: false,
        message: 'Use POST method. Action: getFruits'
    });
}

// ============================================================
// SETUP - Run once
// ============================================================
function setupAll() {
    console.log('🚀 Setting up...');
    let ss = SpreadsheetApp.openById(SHEET_ID);
    
    // Orders sheet
    let ordersSheet = ss.getSheetByName('Orders');
    if (!ordersSheet) ordersSheet = ss.insertSheet('Orders');
    ordersSheet.clear();
    const headers = [
        'Timestamp', 'Customer Name', 'Phone Number', 'Address', 'Area',
        'Fruit Type', 'Price Per Box (AED)', 'Number of Boxes',
        'Total Amount (AED)', 'Special Instructions', 'Order Status'
    ];
    ordersSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    ordersSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    ordersSheet.setFrozenRows(1);
    
    // Fruit Config sheet
    let configSheet = ss.getSheetByName('FruitConfig');
    if (!configSheet) configSheet = ss.insertSheet('FruitConfig');
    configSheet.clear();
    const configHeaders = ['Fruit Name', 'Emoji', 'Active (TRUE/FALSE)', 'Price (AED)'];
    configSheet.getRange(1, 1, 1, configHeaders.length).setValues([configHeaders]);
    configSheet.getRange(1, 1, 1, configHeaders.length).setFontWeight('bold');
    
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
    configSheet.getRange(2, 1, defaultFruits.length, 4).setValues(defaultFruits);
    configSheet.autoResizeColumns(1, 4);
    
    console.log('✅ Setup complete!');
}
