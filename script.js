```javascript
const SCRIPT_URL =
"https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec";

let productPrices = {};

document.addEventListener("DOMContentLoaded", () => {
    loadProducts();

    const quantityInput = document.getElementById("quantity");
    const productSelect = document.getElementById("product");

    if (quantityInput) {
        quantityInput.addEventListener("input", updateTotal);
    }

    if (productSelect) {
        productSelect.addEventListener("change", updateTotal);
    }

    const form = document.getElementById("orderForm");

    if (form) {
        form.addEventListener("submit", submitOrder);
    }
});

function loadProducts() {

    fetch(SCRIPT_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            action: "getProducts"
        })
    })
    .then(response => response.json())
    .then(data => {

        const select = document.getElementById("product");

        select.innerHTML =
            '<option value="">Select Product</option>';

        data.products.forEach(product => {

            productPrices[product.name] = product.price;

            select.innerHTML += `
                <option value="${product.name}">
                    ${product.emoji} ${product.name}
                    - AED ${product.price}
                </option>
            `;
        });
    })
    .catch(error => {
        console.error(error);
    });
}

function updateTotal() {

    const product =
        document.getElementById("product").value;

    const quantity =
        Number(document.getElementById("quantity").value);

    const totalField =
        document.getElementById("total");

    if (!product || !quantity) {
        totalField.value = "";
        return;
    }

    const price = productPrices[product];

    const total = price * quantity;

    totalField.value = total + " AED";
}

function submitOrder(e) {

    e.preventDefault();

    const name =
        document.getElementById("name").value;

    const phone =
        document.getElementById("phone").value;

    const product =
        document.getElementById("product").value;

    const quantity =
        document.getElementById("quantity").value;

    const total =
        productPrices[product] * quantity;

    fetch(SCRIPT_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            action: "submitOrder",
            name: name,
            phone: phone,
            product: product,
            quantity: quantity,
            total: total
        })
    })
    .then(response => response.json())
    .then(data => {

        if (data.success) {

            alert("Order submitted successfully.");

            document
                .getElementById("orderForm")
                .reset();

            document
                .getElementById("total")
                .value = "";
        }
    })
    .catch(error => {
        console.error(error);
        alert("Error submitting order.");
    });
}
```
