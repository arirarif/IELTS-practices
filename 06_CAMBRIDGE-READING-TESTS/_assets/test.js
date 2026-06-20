// shared logic for Cambridge reading test pages
const root=document.documentElement;
const themeBtn=document.getElementById('themeBtn');
if(themeBtn) themeBtn.onclick=()=>root.setAttribute('data-theme',root.getAttribute('data-theme')==='light'?'dark':'light');

let open=false;const ds=[...document.querySelectorAll('details')];
const revealAll=document.getElementById('revealAll');
if(revealAll) revealAll.onclick=()=>{open=!open;ds.forEach(d=>d.open=open);revealAll.textContent=open?'সব বন্ধ করো':'সব খোলো';};

// approx Academic Reading band table
function band(r){
  if(r>=39)return'9.0';if(r>=37)return'8.5';if(r>=35)return'8.0';if(r>=33)return'7.5';
  if(r>=30)return'7.0';if(r>=27)return'6.5';if(r>=23)return'6.0';if(r>=19)return'5.5';
  if(r>=15)return'5.0';if(r>=13)return'4.5';if(r>=10)return'4.0';return'<4';}
const rawEl=document.getElementById('raw'),bandEl=document.getElementById('band');
if(rawEl) rawEl.addEventListener('input',()=>{let v=parseInt(rawEl.value);if(isNaN(v)){bandEl.textContent='—';return;}v=Math.max(0,Math.min(40,v));bandEl.textContent=band(v);});

// PDF viewer (path from body data-pdf)
const PDF_SRC=document.body.getAttribute('data-pdf')||'';
const pdf=document.getElementById('pdf'),pg=document.getElementById('pg');
function goPage(){const n=Math.max(1,parseInt(pg.value)||1);pdf.src=PDF_SRC+'#page='+n+'&view=FitH';}
if(pdf&&pg){
  document.getElementById('goPg').onclick=goPage;
  pg.addEventListener('keydown',e=>{if(e.key==='Enter')goPage();});
  const on=document.getElementById('openNew');
  if(on) on.onclick=()=>window.open(PDF_SRC+'#page='+(parseInt(pg.value)||1),'_blank');
}
