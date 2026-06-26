/**
 * Being Healthy Order Form - JavaScript
 * 
 * DEPLOYMENT INFO:
 * Web App URL: https://script.google.com/macros/s/AKfycbx2ipkS3pI512EC3Q2AmUHciZENMFF0Xa3R5MWpP64dvk2pKeqUuZ1HWel7WKoM_WcX/exec
 * Sheet ID: 31_z1eRE3Fk_PaDj0oLFHnfvQeqGuyzbBhSoED-3MNc
 */

// ============================================================
// CONFIGURATION
// ============================================================
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby5xBra9YNooUPvV-CnpvJDrCYABFHi9fXwNPr3CuvbaXtWCmji4KA9LSK90y0J5328/exec';
const ORDER_COOLDOWN = 3600000; // 1 hour in milliseconds
const REFRESH_INTERVAL = 60000; // 1 minute

let fruitPrices = {};
let lastOrderTime = 0;
let refreshTimer = null;
let isLoading = false;

// ============================================================
// DOM REFERENCES
// ============================================================
const nameInp = document.getElementById('name');
const phoneInp = document.getElementById('phone');
const addressInp = document.getElementById('address');
const areaSel = document.getElementById('area');
const fruitSel = document.getElementById('fruit');
const boxesInp = document.getElementById('boxes');
const totalDisplay = document.getElementById('totalDisplay');
const priceDisplay = document.getElementById('priceDisplay');
const deliveryMsg = document.getElementById('deliveryMessage');
const deliveryText = document.getElementById('deliveryText');
const instructionsInp = document.getElementById('instructions');
const thankYouDiv = document.getElementById('thankYouMessage');
const thankNameSpan = document.getElementById('thankName');
const invoicePreview = document.getElementById('invoicePreview');
const invoiceContent = document.getElementById('invoiceContent');
const submitBtn = document.getElementById('submitBtn');

function getArea() { return areaSel.value; }
function getFruit() { return fruitSel.value; }
function getBoxes() { return parseInt(boxesInp.value) || 0; }
function getFruitPrice() { return fruitPrices[getFruit()] || 45; }

// ============================================================
// SECURE INPUT SANITIZATION
// ============================================================
function sanitizeInput(input) {
    if (!input) return '';
    return String(input)
        .replace(/[<>]/g, '') // Remove < and >
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .trim();
}

function sanitizePhone(phone) {
    if (!phone) return '';
    // Allow only digits, +, spaces, and hyphens
    return String(phone).replace(/[^0-9+\s-]/g, '').trim();
}

// ============================================================
// LOAD FRUITS FROM GOOGLE SHEET WITH CACHE-BUSTING
// ============================================================
async function loadFruits() {
    if (isLoading) {
        console.log('⏳ Already loading, skipping...');
        return;
    }
    
    isLoading = true;
    
    try {
        // Add cache-busting timestamp
        const url = SCRIPT_URL + '?action=getFruits&t=' + Date.now();
        console.log('🔄 Loading fruits from:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
            }
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.status);
        }
        
        const data = await response.json();
        console.log('📦 Response data:', data);
        
        if (data.success && data.fruits && data.fruits.length > 0) {
            updateFruitDropdown(data.fruits);
        } else {
            console.warn('⚠️ No fruits from sheet, using fallback');
            setFallbackFruits();
        }
    } catch (error) {
        console.error('❌ Error loading fruits:', error);
        setFallbackFruits();
        // Show error to user
        if (fruitSel.options.length <= 1) {
            fruitSel.innerHTML = '<option value="">— Error loading fruits —</option>';
            totalDisplay.textContent = '0 AED';
        }
    } finally {
        isLoading = false;
    }
}

function updateFruitDropdown(fruits) {
    // Clear existing options
    fruitSel.innerHTML = '<option value="">— Select a fruit —</option>';
    fruitPrices = {};
    
    let hasActiveFruit = false;
    let activeCount = 0;
    
    fruits.forEach(fruit => {
        // Check if active (case insensitive)
        const isActive = String(fruit.active).toUpperCase() === 'TRUE' || 
                         String(fruit.active).toUpperCase() === 'YES' || 
                         String(fruit.active) === true;
        
        if (isActive && fruit.name) {
            const fruitName = sanitizeInput(fruit.name);
            const emoji = fruit.emoji || '🥭';
            const price = Number(fruit.price) || 45;
            
            const option = document.createElement('option');
            option.value = fruitName;
            option.textContent = emoji + ' ' + fruitName;
            fruitSel.appendChild(option);
            fruitPrices[fruitName] = price;
            hasActiveFruit = true;
            activeCount++;
            
            console.log(`✅ Added: ${fruitName} - ${price} AED`);
        } else {
            console.log(`⏸️ Skipped (inactive): ${fruit.name}`);
        }
    });
    
    console.log(`📊 Loaded ${activeCount} active fruits with prices:`, fruitPrices);
    
    // Auto-select first fruit if available
    if (hasActiveFruit && fruitSel.options.length > 1) {
        fruitSel.value = fruitSel.options[1].value;
        calculateTotal();
    } else if (!hasActiveFruit) {
        // No active fruits - show message
        fruitSel.innerHTML = '<option value="">— No fruits available —</option>';
        totalDisplay.textContent = '0 AED';
        if (priceDisplay) {
            priceDisplay.textContent = 'No fruits currently available';
        }
    }
}

function setFallbackFruits() {
    const fallback = [
        { name: 'Mango (Sindhri)', price: 45 }
    ];
    fruitSel.innerHTML = '<option value="">— Select a fruit —</option>';
    fallback.forEach(f => {
        const option = document.createElement('option');
        option.value = f.name;
        option.textContent = '🥭 ' + f.name;
        fruitSel.appendChild(option);
        fruitPrices[f.name] = f.price;
    });
    console.log('📋 Fallback fruits loaded:', fruitPrices);
}

// ============================================================
// REFRESH FRUITS MANUALLY
// ============================================================
function refreshFruits() {
    console.log('🔄 Manual refresh triggered');
    loadFruits();
}

// ============================================================
// UI UPDATE FUNCTIONS
// ============================================================
function updateUI() {
    const area = getArea();
    let boxes = getBoxes();

    if (area === 'Dubai') {
        deliveryMsg.style.display = 'block';
        deliveryText.textContent = 'Dubai: delivery within 2 days (except Sunday).';
        if (boxes > 0 && boxes < 2) {
            boxes = 2;
            boxesInp.value = 2;
            alert('Minimum order for Dubai is 2 boxes.');
        }
    } else if (area === 'Sharjah') {
        deliveryMsg.style.display = 'block';
        deliveryText.textContent = 'Sharjah: orders confirmed on weekends only.';
        if (boxes > 0 && boxes < 3) {
            boxes = 3;
            boxesInp.value = 3;
            alert('Minimum order for Sharjah is 3 boxes.');
        }
    } else {
        deliveryMsg.style.display = 'none';
    }

    calculateTotal();
}

function calculateTotal() {
    const area = getArea();
    let boxes = getBoxes();
    const price = getFruitPrice();
    const fruitName = getFruit() || 'No fruit selected';
    
    // Update price display
    if (priceDisplay) {
        if (fruitName && fruitName !== 'No fruit selected' && fruitName !== '— Loading fruits...') {
            priceDisplay.textContent = 'Price: ' + price + ' AED per box · minimums: Dubai 2, Sharjah 3';
        } else if (fruitName === '— Loading fruits...') {
            priceDisplay.textContent = 'Loading fruits...';
        } else {
            priceDisplay.textContent = 'Please select a fruit';
        }
    }
    
    if (boxes <= 0) { 
        totalDisplay.textContent = '0 AED'; 
        return; 
    }

    if (area === 'Dubai' && boxes < 2) {
        boxes = 2;
        boxesInp.value = 2;
    } else if (area === 'Sharjah' && boxes < 3) {
        boxes = 3;
        boxesInp.value = 3;
    }
    
    const total = boxes * price;
    totalDisplay.textContent = total + ' AED';
    return total;
}

// ============================================================
// FORM VALIDATION
// ============================================================
function validateForm() {
    const name = sanitizeInput(nameInp.value);
    const phone = sanitizePhone(phoneInp.value);
    const address = sanitizeInput(addressInp.value);
    const area = getArea();
    const fruit = getFruit();
    const boxes = getBoxes();

    if (!name) { alert('Please enter your full name.'); nameInp.focus(); return false; }
    if (name.length < 2) { alert('Name must be at least 2 characters.'); nameInp.focus(); return false; }
    
    if (!phone) { alert('Phone number is required.'); phoneInp.focus(); return false; }
    if (phone.length < 8) { alert('Please enter a valid phone number.'); phoneInp.focus(); return false; }
    
    if (!address) { alert('Address is required.'); addressInp.focus(); return false; }
    if (address.length < 5) { alert('Please enter a complete address.'); addressInp.focus(); return false; }
    
    if (!area) { alert('Please select your area.'); areaSel.focus(); return false; }
    if (!fruit) { alert('Please select a fruit.'); fruitSel.focus(); return false; }
    if (fruit === '— Loading fruits...' || fruit === '— No fruits available —') { 
        alert('Please wait for fruits to load or refresh.'); fruitSel.focus(); return false; 
    }
    if (boxes < 1) { alert('Please enter number of boxes.'); boxesInp.focus(); return false; }
    if (area === 'Dubai' && boxes < 2) { alert('Dubai minimum is 2 boxes.'); boxesInp.focus(); return false; }
    if (area === 'Sharjah' && boxes < 3) { alert('Sharjah minimum is 3 boxes.'); boxesInp.focus(); return false; }
    
    return true;
}

// ============================================================
// SUBMIT ORDER WITH COOLDOWN
// ============================================================
function submitOrder() {
    console.log('📤 submitOrder() called');
    
    // Check cooldown
    const now = Date.now();
    if (now - lastOrderTime < ORDER_COOLDOWN) {
        const remaining = Math.ceil((ORDER_COOLDOWN - (now - lastOrderTime)) / 60000);
        alert('⚠️ You can only place one order per hour. Please wait ' + remaining + ' minute(s).');
        return;
    }
    
    if (!validateForm()) return;

    // Sanitize all inputs
    const name = sanitizeInput(nameInp.value);
    const phone = sanitizePhone(phoneInp.value);
    const address = sanitizeInput(addressInp.value);
    const area = getArea();
    const fruit = getFruit();
    const boxes = getBoxes();
    const price = getFruitPrice();
    const total = boxes * price;
    const instructions = sanitizeInput(instructionsInp.value) || '(none)';

    console.log('📋 Order data:', { name, phone, address, area, fruit, price, boxes, total });

    // Update invoice fields
    document.getElementById("invName").innerText = name;
    document.getElementById("invPhone").innerText = phone;
    document.getElementById("invAddress").innerText = address;
    document.getElementById("invArea").innerText = area;
    document.getElementById("invFruit").innerText = fruit;
    document.getElementById("invBoxes").innerText = boxes;
    document.getElementById("invTotal").innerText = total + " AED";
    document.getElementById("invDelivery").innerText = area === "Dubai" ? 
        "Orders within Dubai will be delivered within 2 days (except Sunday)." : 
        "Orders outside Dubai will be delivered only on weekends.";

    // Show thank you
    thankNameSpan.innerText = name;
    thankYouDiv.style.display = 'block';
    thankYouDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Show invoice preview
    const areaMsg = area === 'Dubai' ? '✅ within 2 days (except Sunday)' : '📆 weekend only';
    invoiceContent.innerHTML = `
        <div class="row g-2 small">
            <div class="col-5 order-summary-label">Name</div><div class="col-7">${name}</div>
            <div class="col-5 order-summary-label">Phone</div><div class="col-7">${phone}</div>
            <div class="col-5 order-summary-label">Address</div><div class="col-7">${address}</div>
            <div class="col-5 order-summary-label">Area</div><div class="col-7">${area} ${areaMsg}</div>
            <div class="col-5 order-summary-label">Fruit</div><div class="col-7">${fruit}</div>
            <div class="col-5 order-summary-label">Price/Box</div><div class="col-7">${price} AED</div>
            <div class="col-5 order-summary-label">Boxes</div><div class="col-7">${boxes}</div>
            <div class="col-5 order-summary-label fw-bold">Total</div><div class="col-7 fw-bold">${total} AED</div>
            <div class="col-5 order-summary-label">Instructions</div><div class="col-7 text-break">${instructions}</div>
        </div>
    `;
    invoicePreview.style.display = 'block';

    // Submit to Google Sheet
    const payload = {
        name: name,
        phone: phone,
        address: address,
        state: area,
        fruit: fruit,
        pricePerBox: price,
        boxes: boxes,
        total: total,
        instructions: instructions,
        timestamp: new Date().toISOString()
    };

    console.log('📡 Sending payload to:', SCRIPT_URL);
    console.log('📦 Payload:', payload);

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Submitting...';

    fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { 
            "Content-Type": "application/json",
            "Cache-Control": "no-cache"
        },
        body: JSON.stringify(payload)
    })
    .then(() => {
        console.log("✅ Order submitted successfully.");
        lastOrderTime = Date.now(); // Update cooldown
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="bi bi-check2-circle me-1"></i> Place Order';
        
        // Refresh fruits after order
        setTimeout(loadFruits, 2000);
    })
    .catch((err) => {
        console.error("❌ Submit error:", err);
        alert("⚠️ There was a problem submitting your order. Please try again.");
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="bi bi-check2-circle me-1"></i> Place Order';
    });
}

// ============================================================
// DOWNLOAD PDF - FINAL VERSION
// ============================================================
function downloadPDF() {
    const name = sanitizeInput(nameInp.value) || "Not provided";
    const phone = sanitizePhone(phoneInp.value) || "Not provided";
    const address = sanitizeInput(addressInp.value) || "Not provided";
    const area = getArea() || "Not selected";
    const fruit = getFruit() || "Not selected";
    const boxes = getBoxes() || 0;
    const price = getFruitPrice();
    const total = boxes * price;
    const instructions = sanitizeInput(instructionsInp.value) || "None";
    
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB');
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    if (boxes < 1) {
        alert("Please add at least 1 box.");
        return;
    }
    if (!getArea()) {
        alert("Please select your area.");
        return;
    }
    if (!getFruit() || getFruit() === '— Loading fruits...') {
        alert("Please select a fruit.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');

    // Header
    doc.setFontSize(24);
    doc.setTextColor(46, 125, 50);
    doc.text("Being Healthy", 20, 30);
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text("Fresh Fruits - Delivered with Care", 20, 40);
    
    const invNum = 'BH-' + now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0') + '-' + String(now.getHours()).padStart(2,'0') + String(now.getMinutes()).padStart(2,'0');
    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text("Invoice: " + invNum, 140, 25);
    doc.text("Date: " + dateStr, 140, 32);
    doc.text("Time: " + timeStr, 140, 39);

    doc.setDrawColor(200, 185, 170);
    doc.line(20, 48, 190, 48);

    // Company Info
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text("Phone: +971 52 231 7016  |  Email: info@beinghealthy.ae", 20, 58);

    // Customer Details
    doc.setFontSize(14);
    doc.setTextColor(46, 125, 50);
    doc.text("Customer Details", 20, 75);
    doc.setDrawColor(200, 185, 170);
    doc.line(20, 79, 190, 79);

    doc.setFontSize(10);
    doc.setTextColor(60);
    let y = 90;
    
    doc.text("Full Name: " + name, 20, y); y += 7;
    doc.text("Phone: " + phone, 20, y); y += 7;
    
    doc.text("Address: ", 20, y);
    const addrLines = doc.splitTextToSize(address, 120);
    doc.text(addrLines, 55, y);
    y += (addrLines.length * 6) + 2;
    
    doc.text("Area: " + area, 20, y); y += 10;

    // Order Summary
    doc.setFontSize(14);
    doc.setTextColor(46, 125, 50);
    doc.text("Order Summary", 20, y);
    y += 5;
    doc.setDrawColor(200, 185, 170);
    doc.line(20, y, 190, y);
    y += 8;

    // Table Header
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(46, 125, 50);
    doc.rect(20, y-4, 170, 8, 'F');
    doc.text("Item", 25, y);
    doc.text("Fruit", 85, y);
    doc.text("Qty", 125, y);
    doc.text("Price", 150, y);
    doc.text("Total", 175, y);
    y += 8;

    // Table Row
    doc.setTextColor(50);
    doc.setFontSize(10);
    doc.text("Fresh " + fruit + " Boxes", 25, y);
    doc.text(fruit, 85, y);
    doc.text(String(boxes), 128, y);
    doc.text(price + " AED", 148, y);
    doc.text(total + " AED", 170, y);
    y += 10;

    // Total
    doc.setDrawColor(200, 185, 170);
    doc.line(20, y, 190, y);
    y += 6;
    doc.setFillColor(245, 242, 238);
    doc.rect(120, y-4, 70, 10, 'F');
    doc.setFontSize(12);
    doc.setTextColor(46, 125, 50);
    doc.text("TOTAL", 125, y+1);
    doc.setFontSize(14);
    doc.setTextColor(200, 50, 50);
    doc.text(total + " AED", 168, y+1, { align: 'right' });
    y += 14;

    // Delivery Info
    doc.setFillColor(235, 248, 235);
    doc.roundedRect(20, y, 170, 16, 3, 3, 'F');
    doc.setFontSize(10);
    doc.setTextColor(46, 125, 50);
    const delMsg = area === "Dubai" ? "Dubai: Delivery within 2 days (except Sunday)" : "Sharjah: Delivery on weekends only";
    doc.text(delMsg, 30, y+6);
    doc.setTextColor(80);
    doc.text("✨ Free delivery on all orders", 30, y+12);
    y += 22;

    // Special Instructions
    if (instructions !== "None" && instructions !== "") {
        doc.setFontSize(11);
        doc.setTextColor(46, 125, 50);
        doc.text("Special Instructions", 20, y);
        y += 6;
        doc.setFontSize(10);
        doc.setTextColor(60);
        const instrLines = doc.splitTextToSize(instructions, 160);
        doc.setFillColor(248, 246, 243);
        doc.roundedRect(20, y-2, 170, (instrLines.length * 6) + 6, 3, 3, 'F');
        doc.text(instrLines, 25, y+3);
        y += (instrLines.length * 6) + 12;
    }

    // Footer
    doc.setDrawColor(46, 125, 50);
    doc.line(20, y, 190, y);
    y += 8;
    doc.setFontSize(12);
    doc.setTextColor(46, 125, 50);
    doc.text("Thank you for choosing Being Healthy!", 20, y);
    y += 6;
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text("Your trust in our fresh fruits means the world to us.", 20, y);
    y += 8;
    doc.text("Phone: +971 52 231 7016  |  Email: info@beinghealthy.ae", 20, y);

    doc.save("BeingHealthy_Invoice_" + invNum + ".pdf");
}

// ============================================================
// START AUTO-REFRESH
// ============================================================
function startAutoRefresh() {
    if (refreshTimer) {
        clearInterval(refreshTimer);
    }
    refreshTimer = setInterval(function() {
        console.log('🔄 Auto-refreshing fruits (1m interval)...');
        loadFruits();
    }, REFRESH_INTERVAL);
}

function stopAutoRefresh() {
    if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = null;
        console.log('⏹️ Auto-refresh stopped');
    }
}

// ============================================================
// EVENT LISTENERS
// ============================================================
areaSel.addEventListener('change', updateUI);

fruitSel.addEventListener('change', function() {
    calculateTotal();
});

boxesInp.addEventListener('input', function() {
    const area = getArea();
    let val = parseInt(this.value) || 0;
    if (area === 'Dubai' && val < 2 && val > 0) {
        this.value = 2;
        alert('Dubai minimum is 2 boxes.');
    } else if (area === 'Sharjah' && val < 3 && val > 0) {
        this.value = 3;
        alert('Sharjah minimum is 3 boxes.');
    }
    calculateTotal();
});

submitBtn.addEventListener('click', submitOrder);

// Keyboard shortcut: Enter key submits
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.target.closest('#orderForm')) {
        e.preventDefault();
        submitOrder();
    }
});

// ============================================================
// INITIALIZATION
// ============================================================
window.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM loaded, initializing...');
    console.log('📡 SCRIPT_URL:', SCRIPT_URL);
    console.log('🔄 Refresh interval:', REFRESH_INTERVAL / 1000 + ' seconds');
    console.log('⏱️ Order cooldown:', ORDER_COOLDOWN / 60000 + ' minutes');
    
    // Load fruits
    loadFruits();
    updateUI();
    
    // Start auto-refresh
    startAutoRefresh();
    
    console.log('✅ Ready!');
});

// Clean up on page unload
window.addEventListener('beforeunload', function() {
    stopAutoRefresh();
});

// ============================================================
// EXPOSE FUNCTIONS GLOBALLY
// ============================================================
window.submitOrder = submitOrder;
window.downloadPDF = downloadPDF;
window.calculateTotal = calculateTotal;
window.updateUI = updateUI;
window.loadFruits = loadFruits;
window.refreshFruits = refreshFruits;
window.startAutoRefresh = startAutoRefresh;
window.stopAutoRefresh = stopAutoRefresh;
window.SCRIPT_URL = SCRIPT_URL;
