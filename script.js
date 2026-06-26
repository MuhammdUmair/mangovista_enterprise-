/**
 * Mango Vista Order Form - JavaScript
 * Web App URL: https://script.google.com/macros/s/AKfycbxt6JQBzNskvbKtFYSKnpUbzxBmtR1_OhSnSIkgbwAfXYwnlErs5fx9Qa8hL7-j98U82Q/exec
 */

// CONFIGURATION
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxt6JQBzNskvbKtFYSKnpUbzxBmtR1_OhSnSIkgbwAfXYwnlErs5fx9Qa8hL7-j98U82Q/exec';
const PRICE_PER_BOX = 45;

// DOM REFERENCES
const nameInp = document.getElementById('name');
const phoneInp = document.getElementById('phone');
const addressInp = document.getElementById('address');
const areaSel = document.getElementById('area');
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
function getBoxes() { return parseInt(boxesInp.value) || 0; }

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
    const boxes = getBoxes();

    if (!name) { alert('Please enter your full name.'); nameInp.focus(); return false; }
    if (!phone) { alert('Phone number is required.'); phoneInp.focus(); return false; }
    if (!address) { alert('Address is required.'); addressInp.focus(); return false; }
    if (!area) { alert('Please select your area (Dubai / Sharjah).'); areaSel.focus(); return false; }
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
    const boxes = getBoxes();
    const total = boxes * PRICE_PER_BOX;
    const instructions = instructionsInp.value.trim() || '(none)';

    console.log('Order data:', { name, phone, address, area, boxes, total, instructions });

    // Update invoice fields
    document.getElementById("invName").innerText = name;
    document.getElementById("invPhone").innerText = phone;
    document.getElementById("invAddress").innerText = address;
    document.getElementById("invArea").innerText = area;
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
// DOWNLOAD PDF - IMPROVED VERSION WITH ALL ORDER DETAILS
// ============================================================
function downloadPDF() {
    // Get all form values
    const name = nameInp.value.trim() || "Not provided";
    const phone = phoneInp.value.trim() || "Not provided";
    const address = addressInp.value.trim() || "Not provided";
    const area = getArea() || "Not selected";
    const boxes = getBoxes() || 0;
    const total = boxes * PRICE_PER_BOX;
    const instructions = instructionsInp.value.trim() || "None";
    
    // Get current date and time for the invoice
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

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // ===== HEADER =====
    doc.setFontSize(24);
    doc.setTextColor(163, 92, 44); // Mango color
    doc.text("🥭 Mango Vista", 20, 30);
    
    doc.setFontSize(14);
    doc.setTextColor(100);
    doc.text("Order Invoice", 20, 42);
    
    doc.setDrawColor(200, 180, 160);
    doc.line(20, 48, 190, 48);

    // ===== ORDER DETAILS =====
    doc.setFontSize(12);
    doc.setTextColor(50);
    
    // Invoice number and date
    const invoiceNum = 'MV-' + now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0') + '-' + String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
    doc.text(`Invoice #: ${invoiceNum}`, 140, 30);
    doc.text(`Date: ${dateStr}`, 140, 40);
    doc.text(`Time: ${timeStr}`, 140, 48);

    // Customer Information Section
    doc.setFontSize(13);
    doc.setTextColor(163, 92, 44);
    doc.text("📋 CUSTOMER INFORMATION", 20, 65);
    
    doc.setFontSize(11);
    doc.setTextColor(50);
    doc.setDrawColor(220, 210, 200);
    doc.line(20, 70, 190, 70);
    
    const customerData = [
        ["Full Name", name],
        ["Phone Number", phone],
        ["Address", address],
        ["Area", area]
    ];
    
    let yPos = 80;
    customerData.forEach(([label, value]) => {
        doc.setTextColor(100);
        doc.text(`${label}:`, 20, yPos);
        doc.setTextColor(30);
        // Handle long text wrapping for address
        if (label === "Address" && value.length > 30) {
            const lines = doc.splitTextToSize(value, 120);
            doc.text(lines, 70, yPos);
            yPos += (lines.length * 6);
        } else {
            doc.text(value, 70, yPos);
            yPos += 7;
        }
    });

    // ===== ORDER SUMMARY =====
    yPos += 10;
    doc.setFontSize(13);
    doc.setTextColor(163, 92, 44);
    doc.text("🛒 ORDER SUMMARY", 20, yPos);
    yPos += 5;
    doc.setDrawColor(220, 210, 200);
    doc.line(20, yPos, 190, yPos);
    yPos += 8;

    // Table header
    doc.setFontSize(11);
    doc.setTextColor(80);
    doc.setFillColor(245, 240, 235);
    doc.rect(20, yPos - 4, 170, 8, 'F');
    
    doc.text("Item", 25, yPos);
    doc.text("Qty", 105, yPos);
    doc.text("Price", 140, yPos);
    doc.text("Total", 165, yPos);
    yPos += 8;
    
    doc.setDrawColor(230, 220, 210);
    doc.line(20, yPos, 190, yPos);
    yPos += 6;

    // Table row - Mango Boxes
    doc.setTextColor(50);
    doc.text(`Mango Boxes (45 AED each)`, 25, yPos);
    doc.text(`${boxes}`, 110, yPos);
    doc.text(`45 AED`, 138, yPos);
    doc.text(`${total} AED`, 160, yPos);
    yPos += 10;

    // Total line
    doc.setDrawColor(200, 180, 160);
    doc.line(20, yPos, 190, yPos);
    yPos += 6;
    
    doc.setFontSize(13);
    doc.setTextColor(163, 92, 44);
    doc.text(`TOTAL AMOUNT:`, 100, yPos);
    doc.setFontSize(15);
    doc.setTextColor(200, 50, 50);
    doc.text(`${total} AED`, 160, yPos);
    yPos += 12;

    // ===== DELIVERY INFO =====
    doc.setFontSize(11);
    doc.setTextColor(50);
    const deliveryMsg = area === "Dubai" ? 
        "✅ Dubai: Delivery within 1 day" : 
        "📦 Sharjah: Delivery on weekends only";
    doc.text(deliveryMsg, 20, yPos);
    yPos += 7;

    // ===== SPECIAL INSTRUCTIONS =====
    if (instructions !== "None" && instructions !== "") {
        doc.setTextColor(80);
        doc.text("📝 Special Instructions:", 20, yPos);
        yPos += 6;
        doc.setTextColor(50);
        const instrLines = doc.splitTextToSize(instructions, 160);
        doc.text(instrLines, 20, yPos);
        yPos += (instrLines.length * 6) + 5;
    }

    // ===== FOOTER =====
    yPos += 8;
    doc.setDrawColor(200, 180, 160);
    doc.line(20, yPos, 190, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Thank you for choosing Mango Vista!", 20, yPos);
    yPos += 6;
    doc.text("📞 For queries: +971 52 231 7016", 20, yPos);
    yPos += 6;
    doc.text("📍 Dubai (1 day delivery) · Sharjah (weekend delivery)", 20, yPos);

    // Add a small decorative footer
    yPos += 8;
    doc.setFontSize(8);
    doc.setTextColor(180);
    doc.text("This is a system-generated invoice. Please keep for your records.", 20, yPos);

    // ===== SAVE =====
    doc.save(`MangoVista_Invoice_${invoiceNum}.pdf`);
}

// Event listeners
areaSel.addEventListener('change', updateUI);

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
    updateUI();
    console.log('✅ Ready!');
});

// Expose functions globally
window.submitOrder = submitOrder;
window.downloadPDF = downloadPDF;
window.calculateTotal = calculateTotal;
window.updateUI = updateUI;
window.SCRIPT_URL = SCRIPT_URL;
