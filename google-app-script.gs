```javascript
const SHEET_ID = "YOUR_SHEET_ID";

function doPost(e) {

  try {

    const data = JSON.parse(e.postData.contents);

    if (data.action === "getProducts") {
      return getProducts();
    }

    if (data.action === "submitOrder") {
      return saveOrder(data);
    }

    return corsResponse({
      success: false,
      error: "Invalid action"
    });

  } catch (err) {

    return corsResponse({
      success: false,
      error: err.toString()
    });

  }
}

function getProducts() {

  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName("Products");

  const values = sheet.getDataRange().getValues();

  let products = [];

  for (let i = 1; i < values.length; i++) {

    const name = values[i][0];
    const emoji = values[i][1];
    const status = values[i][2];
    const price = values[i][3];

    if (status.toLowerCase() === "active") {

      products.push({
        name: name,
        emoji: emoji,
        price: price,
        active: true
      });

    }
  }

  return corsResponse({
    success: true,
    products: products
  });
}

function saveOrder(data) {

  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName("Orders");

  sheet.appendRow([
    new Date(),
    data.name,
    data.phone,
    data.product,
    data.quantity,
    data.total
  ]);

  return corsResponse({
    success: true
  });
}

function corsResponse(data) {

  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
```
