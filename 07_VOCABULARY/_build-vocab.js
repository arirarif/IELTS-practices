const fs=require('fs');const path=require('path');
const ROOT='C:/Users/arira/Desktop/IELTS/All_Practices/07_VOCABULARY';
let template=fs.readFileSync(path.join(ROOT,'Cam-11','Cam-11-Vocabulary.html'),'utf8');

const L=s=>s.split(/\r?\n/);
const splitEx=ex=>{ex=ex.trim();const m=ex.match(/^\*(.+?)\*\s*[—–-]\s*(.+)$/);if(m)return[m[1].trim(),m[2].trim()];return[ex.replace(/^\*|\*$/g,'').trim(),''];};
const dashEmpty=s=>{s=s.trim();return /^[—–-]/.test(s)?'':s;};

function parseWords(md){const rows=[];let cur=null,tag='';
  for(const ln of L(md)){
    let h=ln.match(/^##\s*Test\s*(\d+)\s*·\s*Passage\s*(\d+)/i);
    if(h){tag='T'+h[1]+'·P'+h[2];continue;}
    let w=ln.match(/^###\s+(.+?)\s+·\s+(\/[^/]*\/)/);
    if(w){const word=w[1].replace(/\s*\([^)]*\)\s*$/,'').trim();cur={r:[word,w[2].trim(),'','',tag,'','','','','','']};rows.push(cur.r);continue;}
    if(!cur)continue;let m;
    if(m=ln.match(/^\*\*বাংলা অর্থ:\*\*\s*(.+?)\s*·\s*\*\*বাংলায় উচ্চারণ:\*\*\s*(.+?)\s*$/)){cur.r[2]=m[1].trim();cur.r[3]=m[2].trim();}
    else if(m=ln.match(/^\-\s*\*\*Meaning \(EN\):\*\*\s*(.+)$/))cur.r[5]=m[1].trim();
    else if(m=ln.match(/^\-\s*\*\*Synonyms:\*\*\s*(.+)$/))cur.r[6]=dashEmpty(m[1]);
    else if(m=ln.match(/^\-\s*\*\*Antonyms:\*\*\s*(.+)$/))cur.r[7]=dashEmpty(m[1]);
    else if(m=ln.match(/^\-\s*\*\*Example:\*\*\s*(.+)$/)){const[a,b]=splitEx(m[1]);cur.r[8]=a;cur.r[9]=b;}
    else if(m=ln.match(/^\-\s*\*\*🧠 Note:\*\*\s*(.+)$/))cur.r[10]=m[1].trim();
  }return rows;}
function parsePhrases(md){const rows=[];let cur=null;
  for(const ln of L(md)){
    let h=ln.match(/^###\s+(.+?)\s*$/);
    if(h){cur=[h[1].trim(),'','','','',''];rows.push(cur);continue;}
    if(!cur)continue;let m;
    if(m=ln.match(/^\*\*অর্থ \(বাংলা\):\*\*\s*(.+?)\s*·\s*\*\*EN:\*\*\s*(.+?)\s*$/)){cur[1]=m[1].trim();cur[2]=m[2].trim();}
    else if(m=ln.match(/^\-\s*\*\*Example:\*\*\s*(.+)$/)){const[a,b]=splitEx(m[1]);cur[3]=a;cur[4]=b;}
    else if(m=ln.match(/^\-\s*\*\*🧠 Note:\*\*\s*(.+)$/))cur[5]=m[1].trim();
  }return rows;}
function parseColloc(md){const groups=[];let g=null;
  for(const ln of L(md)){
    let h=ln.match(/^##\s+(.+?)\s*$/);
    if(h){g=[h[1].trim(),[]];groups.push(g);continue;}
    if(!g)continue;
    let m=ln.match(/^\-\s*\*\*(.+?)\*\*\s*[—–-]\s*(.+?)\s*·\s*\*(.+?)\*\s*$/);
    if(m)g[1].push([m[1].trim(),m[2].trim(),m[3].replace(/^e\.g\.\s*/i,'').trim()]);
  }return groups.filter(x=>x[1].length);}
function parseSent(md){const rows=[];const lines=L(md);
  for(let i=0;i<lines.length;i++){
    let m=lines[i].match(/^\-\s*\*\*EN:\*\*\s*(.+)$/);if(!m)continue;
    let en=m[1].trim().replace(/^\*|\*$/g,'').trim(),bn='',note='';
    for(let j=i+1;j<Math.min(i+4,lines.length);j++){
      let b=lines[j].match(/^\s*\*\*BN:\*\*\s*(.+)$/);if(b)bn=b[1].trim();
      let n=lines[j].match(/^\s*\*\*🧠:\*\*\s*(.+)$/);if(n)note=n[1].trim();
    }rows.push([en,bn,note]);
  }return rows;}

const jsArr=(name,rows)=>'const '+name+'=[\n'+rows.map(r=>JSON.stringify(r)).join(',\n')+'\n];';
const START='const W=', ENDM='const grid=';
const idxS=template.indexOf(START), idxE=template.indexOf(ENDM);
if(idxS<0||idxE<0||idxE<idxS){console.error('markers not found');process.exit(1);}
const head=template.slice(0,idxS), tail=template.slice(idxE);

for(const N of process.argv.slice(2)){
  const dir=path.join(ROOT,'Cam-'+N);const rd=f=>fs.readFileSync(path.join(dir,f),'utf8');
  const W=parseWords(rd('01_WORDS.md')),ID=parsePhrases(rd('02_IDIOMS-PHRASES.md')),
        PH=parsePhrases(rd('03_PHRASAL-VERBS.md')),CO=parseColloc(rd('04_COLLOCATIONS-GROUP-WORDS.md')),
        SE=parseSent(rd('05_HIGH-FREQUENCY-SENTENCES.md'));
  const mid=jsArr('W',W)+'\n\n'+
    '// ===== IDIOMS & FIXED PHRASES =====\n'+jsArr('IDIOMS',ID)+'\n\n'+
    '// ===== PHRASAL VERBS =====\n'+jsArr('PHRASAL',PH)+'\n\n'+
    '// ===== COLLOCATIONS / GROUP WORDS =====\nconst COLLOC=[\n'+CO.map(g=>JSON.stringify(g)).join(',\n')+'\n];\n\n'+
    '// ===== HIGH-FREQUENCY SENTENCE FRAMES =====\n'+jsArr('SENT',SE)+'\n\n';
  let html=head+mid+tail;
  html=html.split('IELTS 11').join('IELTS '+N);
  html=html.replace(/~?১৫০ শব্দ/,W.length+' শব্দ');
  fs.writeFileSync(path.join(dir,'Cam-'+N+'-Vocabulary.html'),html);
  const colCount=CO.reduce((a,g)=>a+g[1].length,0);
  const emptyEN=W.filter(r=>!r[5]).length;
  console.log(`Cam-${N}: words ${W.length} | idioms ${ID.length} | phrasal ${PH.length} | colloc ${colCount}/${CO.length}th | sent ${SE.length} | emptyEN ${emptyEN}`);
}
