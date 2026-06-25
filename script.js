window.onload=function(){
 let d=new Date();
 d.setDate(d.getDate()+1);
 document.getElementById('date').value=d.toISOString().split('T')[0];
};

function calculate(){
 let state=document.getElementById('state').value;
 let boxes=parseInt(document.getElementById('boxes').value);
 let price=parseFloat(document.getElementById('price').value);

 if(state==='Dubai' && boxes<2){
   alert('Minimum order for Dubai is 2 boxes');
   return;
 }

 if(state==='Sharjah' && boxes<3){
   alert('Minimum order for Sharjah is 3 boxes');
   return;
 }

 document.getElementById('total').innerText=boxes*price;
}

function downloadPDF(){
 calculate();
 const { jsPDF } = window.jspdf;
 const doc = new jsPDF();
 doc.text('Mango Vista Invoice',20,20);
 doc.text('Customer: '+document.getElementById('name').value,20,40);
 doc.text('Phone: '+document.getElementById('phone').value,20,50);
 doc.text('Total AED: '+document.getElementById('total').innerText,20,70);
 doc.text('Dubai orders: next day delivery.',20,90);
 doc.text('Outside Dubai: weekends only.',20,100);
 doc.save('invoice.pdf');
}
