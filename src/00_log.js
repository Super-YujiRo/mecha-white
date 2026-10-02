// ================================================================ play log: a rolling record of what happened (actions, places, errors) so a bug report can be traced back
const PLOG={a:[],t0:performance.now(),n:0,errs:0};try{const o=localStorage.getItem('mw-log');if(o)localStorage.setItem('mw-log-prev',o)}catch(_){}
function plog(ev){try{const t=((performance.now()-PLOG.t0)/1000).toFixed(1);PLOG.a.push(t+'s '+ev);if(PLOG.a.length>500)PLOG.a.splice(0,PLOG.a.length-500);PLOG.n++}catch(_){}}
function plogErr(where,e){try{PLOG.errs++;const s=String(e&&e.stack||e).split('\n').slice(0,6).map(x=>x.trim()).join(' <- ');plog('!!ERROR ['+where+'] '+s);plogSave()}catch(_){}}
function plogText(){let head='めちゃホワイト プレイログ\nbuild '+BUILD+'\n'+(navigator.userAgent||'')+'\n';try{head+=plogState()+'\n'}catch(e){head+='state? '+e+'\n'}
  return head+'---\n'+PLOG.a.join('\n')}
function plogSave(){try{localStorage.setItem('mw-log',plogText().slice(-60000))}catch(_){}}
addEventListener('error',ev=>plogErr('window',ev.error||ev.message));
addEventListener('unhandledrejection',ev=>plogErr('promise',ev.reason));
setInterval(plogSave,5000);
// copy / download helpers shared by the title screen and the in-game menu
function plogCopy(prev){const t=prev?(localStorage.getItem('mw-log-prev')||'（前回のログはありません）'):plogText();
  const fallback=()=>{try{const b=new Blob([t],{type:'text/plain'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='mecha-white-log.txt';document.body.appendChild(a);a.click();a.remove()}catch(_){prompt('これをコピーして送ってください',t.slice(-8000))}};
  try{navigator.clipboard.writeText(t).then(()=>{try{toast('プレイログをコピーしました。チャットに貼り付けて送ってください','gold',true)}catch(_){alert('プレイログをコピーしました')}},fallback)}catch(_){fallback()}}
// one-click report: opens a prefilled GitHub issue (Claude reads the repo's issues), compacted to fit a URL
const LOG_REPO='https://github.com/Super-YujiRo/mecha-white/issues/new';
function plogSend(prev){let t=prev?localStorage.getItem('mw-log-prev'):plogText();if(!t){try{toast('前回のログはありません','cold',true)}catch(_){alert('前回のログはありません')}return}
  const [head,body='']=t.split('\n---\n');const L=body.split('\n');const imp=[],seen={};
  for(const l of L)if(/ERROR|breaker|LONG|contextlost|renderRecover|probe/.test(l)){const k=l.replace(/^[\d.]+s /,'').slice(0,90);if(seen[k])continue;seen[k]=1;imp.push(l.slice(0,400))}
  const enc=s=>encodeURIComponent(s).length,MAX=7200;let keyL=imp.slice(-30);const mk=tail=>head.slice(0,600)+'\n--- important ---\n'+keyL.join('\n')+'\n--- last ---\n'+tail.join('\n');
  while(keyL.length>4&&enc(mk([]))>MAX*.6)keyL.shift();let n=Math.min(L.length,120);while(n>5&&enc(mk(L.slice(-n)))>MAX)n=Math.floor(n*.85);
  const text='```\n'+mk(L.slice(-n)).slice(0,6000)+'\n```';const title='プレイログ '+(prev?'(前回) ':'')+new Date().toLocaleString('ja-JP');
  const url=LOG_REPO+'?title='+encodeURIComponent(title)+'&body='+encodeURIComponent(text);
  let w=null;try{w=window.open(url,'_blank');if(w)w.opener=null}catch(_){}
  try{toast(!w?'新しいタブで開けなかった時は「ログをコピー」で送ってね':'開いたページで「Create」を押せばClaudeに届きます','gold',true)}catch(_){}}
