// Price per box
const PRICE_PER_BOX = 45;

// Area selection
function updateArea() {
    const area = document.getElementById("area").value;
    const deliveryMessage = document.getElementById("deliveryMessage");

    deliveryMessage.style.display = "block";

    if (area === "Dubai") {
        deliveryMessage.innerHTML =
            "Orders within Dubai will be delivered within 1 day.";
    }
    else if (area === "Sharjah") {
        deliveryMessage.innerHTML =
            "Orders outside Dubai will be delivered only on weekends.";
    }

    calculateTotal();
}

// Calculate total amount
function calculateTotal() {

    const area = document.getElementById("area").value;
    let boxes = parseInt(document.getElementById("boxes").value) || 0;

    // Minimum order validation
    if (area === "Dubai" && boxes > 0 && boxes < 2) {
        alert("Minimum order for Dubai is 2 boxes.");
        boxes = 2;
        document.getElementById("boxes").value = 2;
    }

    if (area === "Sharjah" && boxes > 0 && boxes < 3) {
        alert("Minimum order for Sharjah is 3 boxes.");
        boxes = 3;
        document.getElementById("boxes").value = 3;
    }

    // Total amount
    document.getElementById("totalAmount").value =
        (boxes * PRICE_PER_BOX) + " AED";
}

// Generate invoice
function generateInvoice() {

    const name = document.getElementById("name").value;
    const phone = document.getElementById("phone").value;
    const address = document.getElementById("address").value;
    const area = document.getElementById("area").value;
    const boxes = document.getElementById("boxes").value;
    const total = document.getElementById("totalAmount").value;

    if (
        name === "" ||
        phone === "" ||
        area === "" ||
        boxes === ""
    ) {
        alert("Please fill all required fields.");
        return;
    }

    document.getElementById("invName").innerText = name;
    document.getElementById("invPhone").innerText = phone;
    document.getElementById("invAddress").innerText = address;
    document.getElementById("invArea").innerText = area;
    document.getElementById("invBoxes").innerText = boxes;
    document.getElementById("invTotal").innerText = total;

    if (area === "Dubai") {
        document.getElementById("invDelivery").innerText =
            "Orders within Dubai will be delivered within 1 day.";
    } else {
        document.getElementById("invDelivery").innerText =
            "Orders outside Dubai will be delivered only on weekends.";
    }

    document.getElementById("invoice").style.display = "block";
}

// Event listeners
document.getElementById("area")
    .addEventListener("change", updateArea);

document.getElementById("boxes")
    .addEventListener("input", calculateTotal);
