
const $=id=>document.getElementById(id);
if(!window.THREE){$('loading').textContent='3Dの読み込みに失敗しました。再読み込みしてください';return}
const T=THREE;
