// Price per box
const PRICE_PER_BOX = 45;

// DOM references (cached for performance)
const nameInput = document.getElementById('name');
const phoneInput = document.getElementById('phone');
const addressInput = document.getElementById('address');
const areaSelect = document.getElementById('area');
const boxesInput = document.getElementById('boxes');
const totalDisplay = document.getElementById('totalAmount'); // hidden input in original, now we use a display span
const deliveryMsg = document.getElementById('deliveryMessage');
const instructionsInput = document.getElementById('instructions');
const invoiceDiv = document.getElementById('invoice');
const thankYouDiv = document.getElementById('thankYouMessage');
const thankNameSpan = document.getElementById('thankName');
const submitBtn = document.getElementById('submitBtn');

// Area selection – update delivery message & enforce minimums
function updateArea() {
    const area = areaSelect.value;

    // Show delivery message
    if (area === "Dubai") {
        deliveryMsg.style.display = "block";
        deliveryMsg.innerHTML =
            "✅ Orders within Dubai will be delivered within 1 day.";
        // Enforce minimum for Dubai
        let boxes = parseInt(boxesInput.value) || 0;
        if (boxes > 0 && boxes < 2) {
            boxesInput.value = 2;
            alert("Minimum order for Dubai is 2 boxes.");
        }
    } else if (area === "Sharjah") {
        deliveryMsg.style.display = "block";
        deliveryMsg.innerHTML =
            "📦 Orders in Sharjah will be delivered only on weekends.";
        let boxes = parseInt(boxesInput.value) || 0;
        if (boxes > 0 && boxes < 3) {
            boxesInput.value = 3;
            alert("Minimum order for Sharjah is 3 boxes.");
        }
    } else {
        deliveryMsg.style.display = "none";
    }

    calculateTotal();
}

// Calculate total amount with validation
function calculateTotal() {
    const area = areaSelect.value;
    let boxes = parseInt(boxesInput.value) || 0;

    // If no boxes or invalid, set to 0
    if (boxes < 0) boxes = 0;

    // Enforce minimums based on area (only if area is selected and boxes > 0)
    if (area === "Dubai" && boxes > 0 && boxes < 2) {
        alert("Minimum order for Dubai is 2 boxes.");
        boxes = 2;
        boxesInput.value = 2;
    } else if (area === "Sharjah" && boxes > 0 && boxes < 3) {
        alert("Minimum order for Sharjah is 3 boxes.");
        boxes = 3;
        boxesInput.value = 3;
    }

    // Calculate and display total
    const total = boxes * PRICE_PER_BOX;
    if (totalDisplay) {
        totalDisplay.value = total + " AED";
    }
    // Also update the total display div if it exists (for the enhanced UI)
    const totalDisplayDiv = document.getElementById('totalDisplay');
    if (totalDisplayDiv) {
        totalDisplayDiv.textContent = total + " AED";
    }
    return total;
}

// Validate all required fields (instructions are optional)
function validateForm() {
    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const address = addressInput.value.trim();
    const area = areaSelect.value;
    const boxes = parseInt(boxesInput.value) || 0;

    if (!name) {
        alert("Please enter your full name.");
        nameInput.focus();
        return false;
    }
    if (!phone) {
        alert("Phone number is required.");
        phoneInput.focus();
        return false;
    }
    if (!address) {
        alert("Address is required.");
        addressInput.focus();
        return false;
    }
    if (!area) {
        alert("Please select your area (Dubai or Sharjah).");
        areaSelect.focus();
        return false;
    }
    if (boxes < 1) {
        alert("Please enter the number of boxes (minimum 1).");
        boxesInput.focus();
        return false;
    }
    if (area === "Dubai" && boxes < 2) {
        alert("Minimum order for Dubai is 2 boxes.");
        boxesInput.focus();
        return false;
    }
    if (area === "Sharjah" && boxes < 3) {
        alert("Minimum order for Sharjah is 3 boxes.");
        boxesInput.focus();
        return false;
    }
    return true;
}

// Generate invoice and submit to Google Sheet
function generateInvoice() {
    // Validate all required fields
    if (!validateForm()) return;

    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const address = addressInput.value.trim();
    const area = areaSelect.value;
    const boxes = parseInt(boxesInput.value) || 0;
    const total = boxes * PRICE_PER_BOX;
    const instructions = instructionsInput.value.trim() || "(none)";

    // Update invoice preview fields (original invoice div)
    document.getElementById("invName").innerText = name;
    document.getElementById("invPhone").innerText = phone;
    document.getElementById("invAddress").innerText = address;
    document.getElementById("invArea").innerText = area;
    document.getElementById("invBoxes").innerText = boxes;
    document.getElementById("invTotal").innerText = total + " AED";

    if (area === "Dubai") {
        document.getElementById("invDelivery").innerText =
            "Orders within Dubai will be delivered within 1 day.";
    } else {
        document.getElementById("invDelivery").innerText =
            "Orders outside Dubai will be delivered only on weekends.";
    }

    // Show the invoice
    if (invoiceDiv) {
        invoiceDiv.style.display = "block";
    }

    // Show thank you message
    if (thankYouDiv && thankNameSpan) {
        thankNameSpan.innerText = name;
        thankYouDiv.style.display = "block";
        thankYouDiv.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    // --- Submit to Google Sheet ---
    // ★★★ REPLACE WITH YOUR ACTUAL GOOGLE SCRIPT WEB APP URL ★★★
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw31D2mQe-IyxBxwYlPLzKrMoxFcJm0tNUyNX7_6ZTXQ05qh2g_Z-SHgppM3RH7mnIbkA/exec";

    const payload = {
        name: name,
        phone: phone,
        address: address,
        state: area,        // matches your Apps Script parameter
        boxes: boxes,
        total: total,
        instructions: instructions,
        timestamp: new Date().toISOString()
    };

    // Show loading state on submit button
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Submitting...';
    }

    fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    .then(() => {
        // Success (no-cors doesn't return data, but we assume it worked)
        console.log("Order submitted successfully.");
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = "✅ Place Order";
        }
    })
    .catch((err) => {
        alert("⚠️ There was a problem submitting your order. Please try again or contact us.");
        console.error("Submit error:", err);
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = "✅ Place Order";
        }
    });
}

// Download PDF invoice (using jsPDF)
function downloadPDF() {
    const name = nameInput.value.trim() || "Customer";
    const phone = phoneInput.value.trim() || "-";
    const address = addressInput.value.trim() || "-";
    const area = areaSelect.value || "-";
    const boxes = parseInt(boxesInput.value) || 0;
    const total = boxes * PRICE_PER_BOX;
    const instructions = instructionsInput.value.trim() || "(none)";

    if (boxes < 1) {
        alert("Please add at least 1 box before downloading the bill.");
        return;
    }
    if (!area || area === "") {
        alert("Please select your area first.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("🥭 Mango Vista · Invoice", 20, 30);
    doc.setFontSize(12);
    doc.text(`Name: ${name}`, 20, 50);
    doc.text(`Phone: ${phone}`, 20, 60);
    doc.text(`Address: ${address}`, 20, 70);
    doc.text(`Area: ${area}`, 20, 80);
    doc.text(`Boxes: ${boxes} (${PRICE_PER_BOX} AED/box)`, 20, 90);
    doc.text(`Total: ${total} AED`, 20, 100);
    doc.text(`Instructions: ${instructions}`, 20, 110);
    doc.text("Thank you for choosing Mango Vista!", 20, 140);
    doc.text("📞 +971 52 231 7016", 20, 155);
    doc.save("MangoVista_Order.pdf");
}

// Event listeners
document.addEventListener("DOMContentLoaded", function() {
    // Set default date (if date field exists)
    const dateInput = document.getElementById("date");
    if (dateInput) {
        let d = new Date();
        d.setDate(d.getDate() + 1);
        dateInput.value = d.toISOString().split("T")[0];
    }

    // Initial calculation
    calculateTotal();
});

// Attach event listeners
if (areaSelect) {
    areaSelect.addEventListener("change", updateArea);
}

if (boxesInput) {
    boxesInput.addEventListener("input", calculateTotal);
}

// Expose functions globally for inline onclick
window.updateArea = updateArea;
window.calculateTotal = calculateTotal;
window.generateInvoice = generateInvoice;
window.downloadPDF = downloadPDF;
