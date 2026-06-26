/**
 * Google Apps Script - Being Healthy Order Handler
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

function doOptions(e) {
    return corsResponse({ success: true });
}

// ============================================================
// DO POST - Handles ALL requests (GET is redirected here)
// ============================================================
function doPost(e) {
    try {
        let data = JSON.parse(e.postData.contents);
        console.log('📥 Request:', data);
        
        // 🔥 If action is 'getFruits', return fruit data (NO CACHING)
        if (data.action === 'getFruits') {
            return getFruits();
        }
        
        // Otherwise, it's an order submission
        return saveOrder(data);
        
    } catch (error) {
        return corsResponse({ success: false, error: error.toString() });
    }
}

// ============================================================
// GET FRUITS - ALWAYS FRESH (called via POST)
// ============================================================
function getFruits() {
    try {
        let ss = SpreadsheetApp.openById(SHEET_ID);
        let sheet = ss.getSheetByName('FruitConfig');
        
        // Create default if missing
        if (!sheet) {
            sheet = ss.insertSheet('FruitConfig');
            const headers = ['Fruit Name', 'Emoji', 'Active (TRUE/FALSE)', 'Price (AED)'];
            sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
            sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
            
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
            sheet.getRange(2, 1, defaults.length, 4).setValues(defaults);
        }
        
        // 🔥 ALWAYS READ FRESH FROM SHEET
        const lastRow = sheet.getLastRow();
        if (lastRow < 2) {
            return corsResponse({ success: true, fruits: [] });
        }
        
        const data = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
        const fruits = [];
        
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const name = String(row[0] || '').trim();
            const emoji = String(row[1] || '🍎').trim();
            const active = String(row[2] || 'FALSE').trim().toUpperCase() === 'TRUE';
            const price = Number(row[3]) || 45;
            
            if (name) {
                fruits.push({ name, emoji, active, price });
            }
        }
        
        console.log(`📊 Loaded ${fruits.length} fruits`);
        
        return corsResponse({
            success: true,
            fruits: fruits,
            _timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        return corsResponse({ success: false, error: error.toString(), fruits: [] });
    }
}

// ============================================================
// SAVE ORDER
// ============================================================
function saveOrder(data) {
    try {
        let ss = SpreadsheetApp.openById(SHEET_ID);
        let sheet = ss.getSheetByName('Orders');
        
        if (!sheet) {
            sheet = ss.insertSheet('Orders');
            const headers = [
                'Timestamp', 'Customer Name', 'Phone Number', 'Address', 'Area',
                'Fruit Type', 'Price Per Box', 'Number of Boxes',
                'Total Amount', 'Special Instructions', 'Order Status'
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
            data.fruit || '',
            data.pricePerBox || 0,
            data.boxes || 0,
            data.total || 0,
            data.instructions || '',
            'Pending'
        ];
        
        sheet.appendRow(row);
        console.log('✅ Order saved');
        
        return corsResponse({ success: true, message: 'Order saved!' });
        
    } catch (error) {
        return corsResponse({ success: false, error: error.toString() });
    }
}

// ============================================================
// DO GET - Redirects to POST (for backward compatibility)
// ============================================================
function doGet(e) {
    // If someone uses GET, redirect to POST equivalent
    if (e && e.parameter && e.parameter.action === 'getFruits') {
        return getFruits();
    }
    return corsResponse({
        success: false,
        message: 'Use POST method with action: getFruits'
    });
}

// ============================================================
// SETUP - Run once
// ============================================================
function setupAll() {
    let ss = SpreadsheetApp.openById(SHEET_ID);
    
    // Orders
    let orders = ss.getSheetByName('Orders');
    if (!orders) orders = ss.insertSheet('Orders');
    orders.clear();
    const orderHeaders = [
        'Timestamp', 'Customer Name', 'Phone Number', 'Address', 'Area',
        'Fruit Type', 'Price Per Box', 'Number of Boxes',
        'Total Amount', 'Special Instructions', 'Order Status'
    ];
    orders.getRange(1, 1, 1, orderHeaders.length).setValues([orderHeaders]);
    orders.getRange(1, 1, 1, orderHeaders.length).setFontWeight('bold');
    orders.setFrozenRows(1);
    
    // Fruit Config
    let config = ss.getSheetByName('FruitConfig');
    if (!config) config = ss.insertSheet('FruitConfig');
    config.clear();
    const configHeaders = ['Fruit Name', 'Emoji', 'Active (TRUE/FALSE)', 'Price (AED)'];
    config.getRange(1, 1, 1, configHeaders.length).setValues([configHeaders]);
    config.getRange(1, 1, 1, configHeaders.length).setFontWeight('bold');
    
    const defaults = [
        ['Mango (Sindhri)', '🥭', 'TRUE', 45],
        ['Apple', '🍎', 'FALSE', 40],
        ['Banana', '🍌', 'FALSE', 35],
        ['Orange', '🍊', 'FALSE', 38],
        ['Strawberry', '🍓', 'FALSE', 50],
        ['Grapes', '🍇', 'FALSE', 42],
        ['Watermelon', '🍉', 'FALSE', 55],
        ['Pineapple', '🍍', 'FALSE', 48]
    ];
    config.getRange(2, 1, defaults.length, 4).setValues(defaults);
    config.autoResizeColumns(1, 4);
    
    console.log('✅ Setup complete!');
}
