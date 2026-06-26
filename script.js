/**
 * Being Healthy Order Form - JavaScript
 * 
 * DEPLOYMENT INFO:
 * Web App URL: https://script.google.com/macros/s/AKfycbyRRZr640zMiP0tdDbwPS8mHEG5GRBKlYs69YvhMoFh6byhcMRUED9TwFzjtyYSp9IP/exec
 * Deployment ID: AKfycbyRRZr640zMiP0tdDbwPS8mHEG5GRBKlYs69YvhMoFh6byhcMRUED9TwFzjtyYSp9IP
 * Sheet ID: 131_z1eRE3Fk_PaDj0oLFHnfvQeqGuyzbBhSoED-3MNc
 */

// CONFIGURATION - UPDATED WITH YOUR NEW SHEET
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyRRZr640zMiP0tdDbwPS8mHEG5GRBKlYs69YvhMoFh6byhcMRUED9TwFzjtyYSp9IP/exec';
const FRUIT_CONFIG_URL = SCRIPT_URL + '?action=getFruits';
const PRICE_PER_BOX = 45;

// DOM REFERENCES
const nameInp = document.getElementById('name');
const phoneInp = document.getElementById('phone');
const addressInp = document.getElementById('address');
const areaSel = document.getElementById('area');
const fruitSel = document.getElementById('fruit');
const boxesInp = document.getElementById('boxes');
const totalDisplay = document.getElementById('totalDisplay');
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

// ============================================================
// LOAD FRUITS FROM GOOGLE SHEET
// ============================================================
async function loadFruits() {
    try {
        console.log('🔄 Loading fruits from Google Sheet...');
        const response = await fetch(FRUIT_CONFIG_URL);
        const data = await response.json();
        
        if (data.success && data.fruits && data.fruits.length > 0) {
            // Clear existing options
            fruitSel.innerHTML = '<option value="">— Select a fruit —</option>';
            
            // Add fruits that are active
            data.fruits.forEach(fruit => {
                if (fruit.active !== false) {
                    const option = document.createElement('option');
                    option.value = fruit.name;
                    option.textContent = `${fruit.emoji || '🍎'} ${fruit.name}`;
                    fruitSel.appendChild(option);
                }
            });
            
            console.log(`✅ Loaded ${fruitSel.options.length - 1} active fruits`);
        } else {
            console.warn('⚠️ No fruits from sheet, using fallback');
            setFallbackFruits();
        }
    } catch (error) {
        console.error('❌ Error loading fruits:', error);
        setFallbackFruits();
    }
}

function setFallbackFruits() {
    const fallbackFruits = [
        'Mango', 'Apple', 'Banana', 'Orange', 
        'Strawberry', 'Grapes', 'Watermelon', 'Pineapple'
    ];
    fruitSel.innerHTML = '<option value="">— Select a fruit —</option>';
    fallbackFruits.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        fruitSel.appendChild(option);
    });
}

function updateUI() {
    const area = getArea();
    let boxes = getBoxes();

    if (area === 'Dubai') {
        deliveryMsg.style.display = 'block';
        deliveryText.textContent = 'Dubai: delivery within 1 day.';
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
    if (boxes <= 0) { totalDisplay.textContent = '0 AED'; return; }

    if (area === 'Dubai' && boxes < 2) {
        boxes = 2;
        boxesInp.value = 2;
    } else if (area === 'Sharjah' && boxes < 3) {
        boxes = 3;
        boxesInp.value = 3;
    }
    const total = boxes * PRICE_PER_BOX;
    totalDisplay.textContent = total + ' AED';
    return total;
}

function validateForm() {
    const name = nameInp.value.trim();
    const phone = phoneInp.value.trim();
    const address = addressInp.value.trim();
    const area = getArea();
    const fruit = getFruit();
    const boxes = getBoxes();

    if (!name) { alert('Please enter your full name.'); nameInp.focus(); return false; }
    if (!phone) { alert('Phone number is required.'); phoneInp.focus(); return false; }
    if (!address) { alert('Address is required.'); addressInp.focus(); return false; }
    if (!area) { alert('Please select your area (Dubai / Sharjah).'); areaSel.focus(); return false; }
    if (!fruit) { alert('Please select a fruit.'); fruitSel.focus(); return false; }
    if (boxes < 1) { alert('Please enter the number of boxes (minimum 1).'); boxesInp.focus(); return false; }
    if (area === 'Dubai' && boxes < 2) { alert('Dubai minimum is 2 boxes.'); boxesInp.focus(); return false; }
    if (area === 'Sharjah' && boxes < 3) { alert('Sharjah minimum is 3 boxes.'); boxesInp.focus(); return false; }
    return true;
}

function submitOrder() {
    console.log('submitOrder() called');
    
    if (!validateForm()) {
        console.log('Form validation failed');
        return;
    }

    const name = nameInp.value.trim();
    const phone = phoneInp.value.trim();
    const address = addressInp.value.trim();
    const area = getArea();
    const fruit = getFruit();
    const boxes = getBoxes();
    const total = boxes * PRICE_PER_BOX;
    const instructions = instructionsInp.value.trim() || '(none)';

    console.log('Order data:', { name, phone, address, area, fruit, boxes, total, instructions });

    // Update invoice fields
    document.getElementById("invName").innerText = name;
    document.getElementById("invPhone").innerText = phone;
    document.getElementById("invAddress").innerText = address;
    document.getElementById("invArea").innerText = area;
    document.getElementById("invFruit").innerText = fruit;
    document.getElementById("invBoxes").innerText = boxes;
    document.getElementById("invTotal").innerText = total + " AED";
    document.getElementById("invDelivery").innerText = area === "Dubai" ? 
        "Orders within Dubai will be delivered within 1 day." : 
        "Orders outside Dubai will be delivered only on weekends.";

    // Show thank you
    thankNameSpan.innerText = name;
    thankYouDiv.style.display = 'block';
    thankYouDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Show invoice preview
    const areaMsg = area === 'Dubai' ? '✅ within 1 day' : '📆 weekend only';
    invoiceContent.innerHTML = `
        <div class="row g-2 small">
            <div class="col-5 order-summary-label">Name</div><div class="col-7">${name}</div>
            <div class="col-5 order-summary-label">Phone</div><div class="col-7">${phone}</div>
            <div class="col-5 order-summary-label">Address</div><div class="col-7">${address}</div>
            <div class="col-5 order-summary-label">Area</div><div class="col-7">${area} ${areaMsg}</div>
            <div class="col-5 order-summary-label">Fruit</div><div class="col-7">${fruit}</div>
            <div class="col-5 order-summary-label">Boxes</div><div class="col-7">${boxes} (${PRICE_PER_BOX} AED/box)</div>
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
        boxes: boxes,
        total: total,
        instructions: instructions,
        timestamp: new Date().toISOString()
    };

    console.log('Sending payload to:', SCRIPT_URL);
    console.log('Payload:', payload);

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span> Submitting...';

    fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    .then(() => {
        console.log("✅ Order submitted successfully.");
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="bi bi-check2-circle me-1"></i> Place Order';
    })
    .catch((err) => {
        console.error("❌ Submit error:", err);
        alert("⚠️ There was a problem submitting your order. Please try again or contact us.\n\nError: " + err.message);
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="bi bi-check2-circle me-1"></i> Place Order';
    });
}

// ============================================================
// DOWNLOAD PDF - PROFESSIONAL INVOICE WITH UNIQUE DESIGN
// ============================================================
function downloadPDF() {
    // Get all form values
    const name = nameInp.value.trim() || "Not provided";
    const phone = phoneInp.value.trim() || "Not provided";
    const address = addressInp.value.trim() || "Not provided";
    const area = getArea() || "Not selected";
    const fruit = getFruit() || "Not selected";
    const boxes = getBoxes() || 0;
    const total = boxes * PRICE_PER_BOX;
    const instructions = instructionsInp.value.trim() || "None";
    
    // Get current date and time
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    const timeStr = now.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit'
    });

    // Validation
    if (boxes < 1) {
        alert("⚠️ Please add at least 1 box before downloading the bill.");
        return;
    }
    if (!getArea()) {
        alert("⚠️ Please select your area first.");
        return;
    }
    if (!getFruit()) {
        alert("⚠️ Please select a fruit.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;
    const pageHeight = 297;

    // ===== BACKGROUND =====
    doc.setFillColor(250, 248, 245);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // ===== TOP DECORATIVE BORDER =====
    doc.setFillColor(46, 125, 50);
    doc.rect(0, 0, pageWidth, 8, 'F');
    
    // ===== HEADER SECTION =====
    doc.setFontSize(28);
    doc.setTextColor(46, 125, 50);
    doc.setFont('helvetica', 'bold');
    doc.text("🌿 Being Healthy", 20, 30);
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    doc.text("Fresh Fruits · Delivered with Care", 20, 40);
    
    // Invoice details - right side
    doc.setFontSize(10);
    doc.setTextColor(80);
    const invoiceNum = 'BH-' + now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0') + '-' + String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
    doc.text(`Invoice #: ${invoiceNum}`, 140, 25);
    doc.text(`Date: ${dateStr}`, 140, 32);
    doc.text(`Time: ${timeStr}`, 140, 39);

    // Divider
    doc.setDrawColor(200, 185, 170);
    doc.line(20, 48, 190, 48);

    // ===== COMPANY INFO BOX =====
    doc.setFillColor(245, 242, 238);
    doc.roundedRect(20, 55, 170, 20, 3, 3, 'F');
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text("📞 +971 52 231 7016  |  📧 info@beinghealthy.ae  |  🌐 www.beinghealthy.ae", 30, 67);

    // ===== CUSTOMER INFORMATION =====
    doc.setFontSize(14);
    doc.setTextColor(46, 125, 50);
    doc.setFont('helvetica', 'bold');
    doc.text("📋 Customer Details", 20, 90);
    
    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.setFont('helvetica', 'normal');
    doc.setDrawColor(200, 185, 170);
    doc.line(20, 95, 190, 95);
    
    let yPos = 105;
    const customerData = [
        ["Full Name", name],
        ["Phone Number", phone],
        ["Delivery Address", address],
        ["Area", area]
    ];
    
    customerData.forEach(([label, value]) => {
        doc.setFillColor(248, 246, 243);
        doc.rect(20, yPos - 4, 55, 8, 'F');
        doc.setTextColor(100);
        doc.text(label + ":", 22, yPos);
        doc.setTextColor(40);
        if (label === "Delivery Address" && value.length > 35) {
            const lines = doc.splitTextToSize(value, 100);
            doc.text(lines, 80, yPos);
            yPos += (lines.length * 6);
        } else {
            doc.text(value, 80, yPos);
            yPos += 8;
        }
    });

    // ===== ORDER SUMMARY =====
    yPos += 10;
    doc.setFontSize(14);
    doc.setTextColor(46, 125, 50);
    doc.setFont('helvetica', 'bold');
    doc.text("🛒 Order Summary", 20, yPos);
    yPos += 5;
    doc.setDrawColor(200, 185, 170);
    doc.line(20, yPos, 190, yPos);
    yPos += 8;

    // Table header with green background
    doc.setFillColor(46, 125, 50);
    doc.rect(20, yPos - 4, 170, 9, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text("Item", 25, yPos + 1);
    doc.text("Fruit", 85, yPos + 1);
    doc.text("Qty", 125, yPos + 1);
    doc.text("Price", 150, yPos + 1);
    doc.text("Total", 175, yPos + 1);
    yPos += 8;

    // Table row
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(50);
    
    if (yPos % 2 === 0) {
        doc.setFillColor(248, 246, 243);
        doc.rect(20, yPos - 4, 170, 8, 'F');
    }
    doc.text(`Fresh ${fruit} Boxes`, 25, yPos);
    doc.text(fruit, 85, yPos);
    doc.text(`${boxes}`, 128, yPos);
    doc.text(`45 AED`, 148, yPos);
    doc.text(`${total} AED`, 170, yPos);
    yPos += 10;

    // Total line
    doc.setDrawColor(200, 185, 170);
    doc.line(20, yPos, 190, yPos);
    yPos += 6;
    
    doc.setFillColor(245, 242, 238);
    doc.rect(120, yPos - 4, 70, 12, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(46, 125, 50);
    doc.text("TOTAL", 125, yPos + 2);
    doc.setFontSize(14);
    doc.setTextColor(200, 50, 50);
    doc.text(`${total} AED`, 168, yPos + 2, { align: 'right' });
    yPos += 14;

    // ===== DELIVERY INFORMATION =====
    doc.setFillColor(235, 248, 235);
    doc.roundedRect(20, yPos, 170, 18, 3, 3, 'F');
    doc.setFontSize(10);
    doc.setTextColor(46, 125, 50);
    doc.setFont('helvetica', 'bold');
    const deliveryMsg = area === "Dubai" ? 
        "🚚 Dubai: Delivery within 1 day" : 
        "🚚 Sharjah: Delivery on weekends only";
    doc.text(deliveryMsg, 30, yPos + 6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80);
    doc.text("📦 Free delivery on orders above 100 AED", 30, yPos + 13);
    yPos += 24;

    // ===== SPECIAL INSTRUCTIONS =====
    if (instructions !== "None" && instructions !== "") {
        doc.setFontSize(11);
        doc.setTextColor(46, 125, 50);
        doc.setFont('helvetica', 'bold');
        doc.text("📝 Special Instructions", 20, yPos);
        yPos += 6;
        doc.setFontSize(10);
        doc.setTextColor(60);
        doc.setFont('helvetica', 'normal');
        const instrLines = doc.splitTextToSize(instructions, 160);
        doc.setFillColor(248, 246, 243);
        doc.roundedRect(20, yPos - 2, 170, (instrLines.length * 6) + 6, 3, 3, 'F');
        doc.text(instrLines, 25, yPos + 3);
        yPos += (instrLines.length * 6) + 12;
    }

    // ===== FOOTER =====
    doc.setDrawColor(46, 125, 50);
    doc.line(20, yPos, 190, yPos);
    yPos += 8;

    doc.setFontSize(12);
    doc.setTextColor(46, 125, 50);
    doc.setFont('helvetica', 'bold');
    doc.text("Thank you for choosing Being Healthy!", 20, yPos);
    yPos += 6;
    
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    doc.text("We appreciate your business and look forward to serving you again.", 20, yPos);
    yPos += 8;

    // Contact footer
    doc.setFillColor(245, 242, 238);
    doc.rect(0, pageHeight - 25, pageWidth, 25, 'F');
    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text("📞 +971 52 231 7016", 20, pageHeight - 12);
    doc.text("📧 info@beinghealthy.ae", 80, pageHeight - 12);
    doc.text("🌐 www.beinghealthy.ae", 140, pageHeight - 12);
    doc.text("📍 Dubai · Sharjah", 20, pageHeight - 4);

    // Bottom green bar
    doc.setFillColor(46, 125, 50);
    doc.rect(0, pageHeight - 2, pageWidth, 2, 'F');

    // ===== SAVE =====
    doc.save(`BeingHealthy_Invoice_${invoiceNum}.pdf`);
}

// Event listeners
areaSel.addEventListener('change', updateUI);
fruitSel.addEventListener('change', calculateTotal);

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

window.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM loaded, initializing...');
    console.log('📡 SCRIPT_URL:', SCRIPT_URL);
    loadFruits();
    updateUI();
    console.log('✅ Ready!');
});

// Expose functions globally
window.submitOrder = submitOrder;
window.downloadPDF = downloadPDF;
window.calculateTotal = calculateTotal;
window.updateUI = updateUI;
window.SCRIPT_URL = SCRIPT_URL;
