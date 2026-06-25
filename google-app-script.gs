function doPost(e){
 var sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Orders');
 sh.appendRow([
   new Date(),
   e.parameter.name,
   e.parameter.phone,
   e.parameter.address,
   e.parameter.state,
   e.parameter.boxes,
   e.parameter.total
 ]);
 return ContentService.createTextOutput('Saved');
}