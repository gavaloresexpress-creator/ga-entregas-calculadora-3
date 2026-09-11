
'use strict';
if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('service-worker.js').then(r=>console.log('SW:',r.scope)).catch(e=>console.log('SW err:',e));});}
let deferredPrompt=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;document.getElementById('installBanner').style.display='block';});
function instalarApp(){if(!deferredPrompt)return;deferredPrompt.prompt();deferredPrompt.userChoice.then(c=>{if(c.outcome==='accepted')document.getElementById('installBanner').style.display='none';deferredPrompt=null;});}
window.addEventListener('appinstalled',()=>{document.getElementById('installBanner').style.display='none';deferredPrompt=null;});
const K={cfg:'ga_entregas_config',diario:'ga_diario_v2',comps:'ga_componentes_v2',custos:'ga_custos_extras_v2',odo:'ga_km_atual_v2'};
const uid=()=>Date.now().toString(36)+Math.random().toString(36).substr(2,5);
function pBR(s){if(!s)return 0;const n=parseFloat(String(s).trim().replace(/\./g,'').replace(',','.'));return isNaN(n)||n<0?0:n;}
function fR(v){return'R$ '+Number(v).toFixed(2).replace('.',',');}
function fRc(v){if(v>=1000)return'R$'+(v/1000).toFixed(1)+'k';return'R$'+Number(v).toFixed(0);}
function fData(s){if(!s)return'';const[y,m,d]=s.split('-');return d+'/'+m+'/'+y;}
function fDataCurta(s){if(!s)return'';const dt=new Date(s+'T12:00:00');const dias=['Dom','Seg','Ter','Qua','Qui','Sex','Sab'];return dias[dt.getDay()]+' '+s.slice(8,10)+'/'+s.slice(5,7);}
function hoje(){return new Date().toISOString().slice(0,10);}
function abrirModal(id){document.getElementById(id).classList.add('active');}
function fecharModal(id){document.getElementById(id).classList.remove('active');}
document.addEventListener('click',e=>{document.querySelectorAll('.modal-overlay.active').forEach(o=>{if(e.target===o)o.classList.remove('active');});});
let activeTab='calculadora';
function switchTab(tab){
  document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('panel-'+tab).classList.add('active');
  document.getElementById('nav-'+tab).classList.add('active');
  activeTab=tab;
  if(tab==='diario')renderDiario();
  if(tab==='manutencao')renderManutencao();
  if(tab==='analise')renderAnalise();
}
const defaultConfig={agendada:{km5:20,km10:25,km15:35,km20:50,kmMais20:3,kmMais40:4},avulsa:{fixa:7,porKm:3.5},intermunicipal:{porKm:4},adicionais:{retornoPct:60,condominio:5,riscoPct:5,esperaMin:0.7}};
let appConfig=JSON.parse(JSON.stringify(defaultConfig));
function carregarConfig(){
  try{const s=localStorage.getItem(K.cfg);if(s){const p=JSON.parse(s);appConfig={agendada:{...defaultConfig.agendada,...p.agendada},avulsa:{...defaultConfig.avulsa,...p.avulsa},intermunicipal:{...defaultConfig.intermunicipal,...p.intermunicipal},adicionais:{...defaultConfig.adicionais,...p.adicionais}};}}catch(e){appConfig=JSON.parse(JSON.stringify(defaultConfig));}
  atualizarLabels();
}
function atualizarInputsConfig(){
  document.getElementById('cfg_agendada_5').value=appConfig.agendada.km5;
  document.getElementById('cfg_agendada_10').value=appConfig.agendada.km10;
  document.getElementById('cfg_agendada_15').value=appConfig.agendada.km15;
  document.getElementById('cfg_agendada_20').value=appConfig.agendada.km20;
  document.getElementById('cfg_agendada_km').value=appConfig.agendada.kmMais20;
  document.getElementById('cfg_agendada_40_km').value=appConfig.agendada.kmMais40;
  document.getElementById('cfg_avulsa_fixa').value=appConfig.avulsa.fixa;
  document.getElementById('cfg_avulsa_km').value=appConfig.avulsa.porKm;
  document.getElementById('cfg_inter_km').value=appConfig.intermunicipal.porKm;
  document.getElementById('cfg_retorno_pct').value=appConfig.adicionais.retornoPct;
  document.getElementById('cfg_condominio').value=appConfig.adicionais.condominio;
  document.getElementById('cfg_risco_pct').value=appConfig.adicionais.riscoPct;
  document.getElementById('cfg_espera_min').value=appConfig.adicionais.esperaMin;
}
function atualizarLabels(){
  document.querySelector('#cardRetorno .option-desc').textContent='Bate e volta +'+appConfig.adicionais.retornoPct+'%';
  document.querySelector('#cardCondominio .option-desc').textContent='Horizontal +R$ '+appConfig.adicionais.condominio.toFixed(2).replace('.',',');
}
function salvarConfiguracoes(){
  appConfig.agendada.km5=parseFloat(document.getElementById('cfg_agendada_5').value)||0;
  appConfig.agendada.km10=parseFloat(document.getElementById('cfg_agendada_10').value)||0;
  appConfig.agendada.km15=parseFloat(document.getElementById('cfg_agendada_15').value)||0;
  appConfig.agendada.km20=parseFloat(document.getElementById('cfg_agendada_20').value)||0;
  appConfig.agendada.kmMais20=parseFloat(document.getElementById('cfg_agendada_km').value)||0;
  appConfig.agendada.kmMais40=parseFloat(document.getElementById('cfg_agendada_40_km').value)||0;
  appConfig.avulsa.fixa=parseFloat(document.getElementById('cfg_avulsa_fixa').value)||0;
  appConfig.avulsa.porKm=parseFloat(document.getElementById('cfg_avulsa_km').value)||0;
  appConfig.intermunicipal.porKm=parseFloat(document.getElementById('cfg_inter_km').value)||0;
  appConfig.adicionais.retornoPct=parseFloat(document.getElementById('cfg_retorno_pct').value)||0;
  appConfig.adicionais.condominio=parseFloat(document.getElementById('cfg_condominio').value)||0;
  appConfig.adicionais.riscoPct=parseFloat(document.getElementById('cfg_risco_pct').value)||0;
  appConfig.adicionais.esperaMin=parseFloat(document.getElementById('cfg_espera_min').value)||0;
  localStorage.setItem(K.cfg,JSON.stringify(appConfig));
  atualizarLabels();fecharModal('configModal');
  if(document.getElementById('painelResultado').style.display==='block')calcularCorrida();
}
function restaurarPadroes(){if(confirm('Restaurar valores originais?')){appConfig=JSON.parse(JSON.stringify(defaultConfig));atualizarInputsConfig();}}
function abrirConfiguracoes(){atualizarInputsConfig();abrirModal('configModal');}
let listaEntregas=[],ultimaEntregaCalc=null;
function adicionarEntregaAtual(){if(!ultimaEntregaCalc)return;listaEntregas.push(ultimaEntregaCalc);renderLista();document.getElementById('painelResultado').style.display='none';document.getElementById('distancia').value='';document.getElementById('distancia').focus();ultimaEntregaCalc=null;}
function removerEntrega(i){listaEntregas.splice(i,1);renderLista();}
function limparLista(){if(listaEntregas.length>0&&confirm('Limpar todas as entregas?')){listaEntregas=[];renderLista();}}
function renderLista(){
  const sec=document.getElementById('secaoListaEntregas'),cont=document.getElementById('containerListaEntregas'),tot=document.getElementById('valorTotalLista');
  if(!listaEntregas.length){sec.style.display='none';return;}
  sec.style.display='block';let html='',soma=0;
  listaEntregas.forEach((e,i)=>{soma+=e.total;html+='<div class="delivery-item"><div class="delivery-info"><span class="delivery-name">Entrega '+(i+1)+'</span><span class="delivery-desc">'+e.km.toFixed(1)+' km - '+e.svc+'</span></div><div style="display:flex;align-items:center;gap:7px"><span class="delivery-price">'+fR(e.total)+'</span><button class="btn-remove" onclick="removerEntrega('+i+')">x</button></div></div>';});
  cont.innerHTML=html;tot.innerText=fR(soma);
}
function atualizarCard(inp,card){document.getElementById(card).classList.toggle('checked',document.getElementById(inp).checked);}
function mostrarAviso(msg){const a=document.getElementById('avisoServico');if(msg){a.textContent=msg;a.style.display='block';}else a.style.display='none';}
function nomeServico(s){return{agendada:'Agendada',avulsa:'Avulsa / Emergencia',intermunicipal:'Intermunicipal'}[s]||s;}
function calcularCorrida(){
  mostrarAviso(null);document.getElementById('painelResultado').style.display='none';
  const km=parseFloat(document.getElementById('distancia').value);
  if(isNaN(km)||km<=0){mostrarAviso('Por favor, digite uma distancia valida em km!');document.getElementById('avisoServico').style.display='block';document.getElementById('distancia').focus();return;}
  const svc=document.getElementById('servico').value,ret=document.getElementById('retorno').checked,condo=document.getElementById('condominio').checked,nf=pBR(document.getElementById('valorNf').value),esp=Math.max(0,parseInt(document.getElementById('tempoEspera').value)||0);
  let base=0,aviso=null;
  if(svc==='agendada'){
    if(km>40){aviso=km.toFixed(1)+' km fora da faixa Agendada. Calculando como Intermunicipal.';base=km*appConfig.agendada.kmMais40;}
    else if(km<=5)base=appConfig.agendada.km5;
    else if(km<=10)base=appConfig.agendada.km10;
    else if(km<=15)base=appConfig.agendada.km15;
    else if(km<=20)base=appConfig.agendada.km20;
    else base=km*appConfig.agendada.kmMais20;
  }else if(svc==='avulsa'){base=km*appConfig.avulsa.porKm+appConfig.avulsa.fixa;}
  else{if(km<=40)aviso=km.toFixed(1)+' km abaixo de 40 km. Calculando como Intermunicipal.';base=km*appConfig.intermunicipal.porKm;}
  const aRet=ret?base*(appConfig.adicionais.retornoPct/100):0,aCondo=condo?appConfig.adicionais.condominio:0,aRisco=nf>500?nf*(appConfig.adicionais.riscoPct/100):0,aEsp=esp*appConfig.adicionais.esperaMin;
  const total=base+aRet+aCondo+aRisco+aEsp;
  ultimaEntregaCalc={km,svc:nomeServico(svc),total};
  if(aviso)mostrarAviso(aviso);
  document.getElementById('distanciaUsada').innerHTML=km.toFixed(1)+' km';
  document.getElementById('valorTotal').innerText=fR(total);
  let html=mL('Valor base ('+nomeServico(svc)+')',base);
  if(aRet>0)html+=mL('Retorno +'+appConfig.adicionais.retornoPct+'%',aRet);
  if(aCondo>0)html+=mL('Condominio horizontal',aCondo);
  if(aRisco>0)html+=mL('Taxa risco ('+appConfig.adicionais.riscoPct+'% NF)',aRisco);
  if(aEsp>0)html+=mL('Espera '+esp+'min',aEsp);
  html+='<div class="breakdown-row total-row"><span class="lbl">Total</span><span class="val">'+fR(total)+'</span></div>';
  document.getElementById('detalhamento').innerHTML=html;
  document.getElementById('painelResultado').style.display='block';
  document.getElementById('painelResultado').scrollIntoView({behavior:'smooth',block:'nearest'});
}
function mL(l,v){return'<div class="breakdown-row"><span class="lbl">'+l+'</span><span class="val">'+fR(v)+'</span></div>';}
document.getElementById('distancia').addEventListener('keydown',e=>{if(e.key==='Enter')calcularCorrida();});
let diario=[];
function carregarDiario(){try{diario=JSON.parse(localStorage.getItem(K.diario)||'[]');}catch{diario=[];}}
function salvarDiario(){localStorage.setItem(K.diario,JSON.stringify(diario));}
function registrarDia(){
  const data=document.getElementById('d-data').value;
  const km=parseFloat(document.getElementById('d-km').value);
  const ganho=pBR(document.getElementById('d-ganho').value);
  const litros=parseFloat(document.getElementById('d-litros').value)||0;
  const gas=pBR(document.getElementById('d-gas').value);
  if(!data){alert('Selecione a data!');return;}
  if(isNaN(km)||km<=0){alert('Informe os km rodados!');return;}
  if(ganho<=0){alert('Informe os ganhos do dia!');return;}
  const existe=diario.findIndex(r=>r.data===data);
  const reg={id:uid(),data,km,ganho,litros,gas};
  if(existe>=0){if(confirm('Ja existe registro para '+fData(data)+'. Substituir?')){diario[existe]={...reg,id:diario[existe].id};}else return;}
  else diario.unshift(reg);
  salvarDiario();renderDiario();
  document.getElementById('d-km').value='';document.getElementById('d-ganho').value='';
  document.getElementById('d-litros').value='';document.getElementById('d-gas').value='';
  document.getElementById('d-data').value=hoje();
}
function removerDia(id){if(!confirm('Remover este registro?'))return;diario=diario.filter(r=>r.id!==id);salvarDiario();renderDiario();}
function renderDiario(){
  const lim=new Date();lim.setDate(lim.getDate()-30);
  const rec=diario.filter(r=>new Date(r.data+'T12:00:00')>=lim);
  document.getElementById('sum-km').textContent=rec.reduce((a,r)=>a+r.km,0).toFixed(0);
  document.getElementById('sum-ganho').textContent=fRc(rec.reduce((a,r)=>a+r.ganho,0));
  document.getElementById('sum-gas').textContent=fRc(rec.reduce((a,r)=>a+r.gas,0));
  document.getElementById('diario-count').textContent=diario.length+' registro'+(diario.length!==1?'s':'');
  const cont=document.getElementById('diarioHistorico');
  if(!diario.length){cont.innerHTML='<div class="empty-state"><div class="empty-icon">📅</div><p>Nenhum dia registrado ainda.<br>Comece registrando o dia de hoje!</p></div>';return;}
  cont.innerHTML=diario.map(r=>{
    const liq=r.ganho-r.gas;const pct=r.ganho>0?(liq/r.ganho*100).toFixed(0):0;
    return '<div class="registro-dia"><div><div class="reg-data">'+fDataCurta(r.data)+'</div><div class="reg-km">🏍️ '+r.km.toFixed(1)+' km</div><div class="reg-ganho">💰 '+fR(r.ganho)+'</div>'+(r.gas>0?'<div class="reg-gas">⛽ '+fR(r.gas)+(r.litros>0?' - '+r.litros.toFixed(2)+'L':'')+'</div>':'')+'</div><div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px"><div class="reg-total">'+fR(liq)+'</div><div class="reg-margem">liquido - '+pct+'%</div><button class="btn-danger-ghost" onclick="removerDia('\''+r.id+'\')">🗑️</button></div></div>';
  }).join('');
}
const DEF_COMPS=[
  {id:'oleo_motor',nome:'Oleo do Motor',icon:'🛢️',duracaoKm:3000,custo:80,ultimoKm:0,ultimaData:null,hist:[],isDefault:true},
  {id:'pastilha_d',nome:'Pastilha Freio Dianteiro',icon:'🔴',duracaoKm:15000,custo:60,ultimoKm:0,ultimaData:null,hist:[],isDefault:true},
  {id:'pastilha_t',nome:'Pastilha Freio Traseiro',icon:'🔵',duracaoKm:10000,custo:50,ultimoKm:0,ultimaData:null,hist:[],isDefault:true},
  {id:'pneu_d',nome:'Pneu Dianteiro',icon:'⚫',duracaoKm:20000,custo:200,ultimoKm:0,ultimaData:null,hist:[],isDefault:true},
  {id:'pneu_t',nome:'Pneu Traseiro',icon:'⬛',duracaoKm:15000,custo:250,ultimoKm:0,ultimaData:null,hist:[],isDefault:true},
  {id:'relacao',nome:'Relacao (Corrente/Kit)',icon:'⛓️',duracaoKm:25000,custo:150,ultimoKm:0,ultimaData:null,hist:[],isDefault:true},
  {id:'filtro_ar',nome:'Filtro de Ar',icon:'💨',duracaoKm:8000,custo:40,ultimoKm:0,ultimaData:null,hist:[],isDefault:true},
  {id:'filtro_oleo',nome:'Filtro de Oleo',icon:'🔧',duracaoKm:5000,custo:30,ultimoKm:0,ultimaData:null,hist:[],isDefault:true},
];
const EMOJIS_C=['🔧','🛢️','⚙️','🔩','💨','⛓️','🔴','🔵','⚫','⬛','🟡','⚡','🌡️','💧','🪝','🔌','🛞','🏍️','⛽','🔑','🪛','🔋','🛠️','🔨'];
const EMOJIS_X=['💳','📋','🏦','📄','🛡️','🏛️','💰','🔖','📑','🧾','🏷️','💼','🪙','💵','📊','🔐','🚦','📝','🏠','⚡','🚗','🔒','📅','🎯'];
let comps=[],custosExtras=[],kmAtual=0;
function carregarManutencao(){
  try{const sv=JSON.parse(localStorage.getItem(K.comps)||'null');if(sv){const mp=Object.fromEntries(sv.map(c=>[c.id,c]));comps=DEF_COMPS.map(d=>({...d,...(mp[d.id]||{}),isDefault:true}));sv.filter(c=>!c.isDefault).forEach(c=>comps.push(c));}else comps=DEF_COMPS.map(c=>({...c}));}catch{comps=DEF_COMPS.map(c=>({...c}));}
  try{custosExtras=JSON.parse(localStorage.getItem(K.custos)||'[]');}catch{custosExtras=[];}
  kmAtual=parseInt(localStorage.getItem(K.odo)||'0')||0;
}
function salvarManutencao(){localStorage.setItem(K.comps,JSON.stringify(comps));localStorage.setItem(K.custos,JSON.stringify(custosExtras));localStorage.setItem(K.odo,String(kmAtual));}
function desgaste(c){const usado=Math.max(0,kmAtual-(c.ultimoKm||0));const pct=c.duracaoKm>0?Math.min(100,usado/c.duracaoKm*100):0;const rest=Math.max(0,c.duracaoKm-usado);return{usado,pct,rest};}
function renderManutencao(){
  document.getElementById('odo-display').innerHTML=kmAtual.toLocaleString('pt-BR')+' <small>km</small>';
  let alertas=0;
  const cont=document.getElementById('componentesContainer');
  cont.innerHTML=comps.map(c=>{
    const{usado,pct,rest}=desgaste(c);
    const isWarn=pct>=75&&pct<90,isDanger=pct>=90;
    if(isWarn||isDanger)alertas++;
    const wc=isDanger?'danger':isWarn?'warn':'ok';
    const cc=isDanger?'danger':isWarn?'warn':'';
    const sc=isDanger?'danger':isWarn?'warn':'ok';
    const st=isDanger?'⚠️ TROCAR JA! '+(rest>0?rest.toFixed(0)+' km restante':'Limite ultrapassado!'):isWarn?'⚠️ Trocar em breve - '+rest.toFixed(0)+' km rest.':c.ultimaData?'✅ '+usado.toFixed(0)+' km usados - '+rest.toFixed(0)+' km rest.':'Nunca registrado';
    return '<div class="comp-card '+cc+'"><div class="comp-head"><div class="comp-icon-box">'+c.icon+'</div><div class="comp-name-grp"><div class="comp-name">'+c.nome+'</div><div class="comp-sub">Troca a cada '+c.duracaoKm.toLocaleString('pt-BR')+' km - '+fR(c.custo)+'</div></div><div class="comp-acts"><button class="btn-ghost" onclick="abrirModalComp('\''+c.id+'\')">✏️</button>'+(c.isDefault?'':'<button class="btn-danger-ghost" onclick="deletarComp('\''+c.id+'\')">🗑️</button>')+'</div></div><div class="wear-lbl"><span>'+pct.toFixed(0)+'% usado</span><span>'+(c.ultimaData?'Ultima: '+fData(c.ultimaData):'Nunca trocado')+'</span></div><div class="wear-track"><div class="wear-fill '+wc+'" style="width:'+pct.toFixed(1)+'%"></div></div><div class="comp-foot"><div class="comp-status '+sc+'">'+st+'</div><button class="btn-troca" onclick="abrirTroca('\''+c.id+'\')">🔧 Registrar Troca</button></div></div>';
  }).join('');
  const badge=document.getElementById('badge-manut');
  if(alertas>0){badge.textContent=alertas;badge.classList.add('on');}else badge.classList.remove('on');
  const alertEl=document.getElementById('alerta-count');
  if(alertas>0){alertEl.textContent=alertas+' alerta'+(alertas>1?'s':'');alertEl.classList.add('alert');}else{alertEl.textContent='';alertEl.classList.remove('alert');}
  renderCustos();
}
function renderCustos(){
  const cont=document.getElementById('custosContainer');
  if(!custosExtras.length){cont.innerHTML='<div style="font-size:.76em;color:#555;padding:8px 0 4px">Nenhum custo extra cadastrado ainda.</div>';return;}
  const pl={mensal:'/mes',anual:'/ano',por_km:'/km'};
  cont.innerHTML=custosExtras.map(c=>{
    const detail={mensal:'Mensal',anual:'Anual ('+fR(c.valor/12)+'/mes)',por_km:'Por km rodado'}[c.periodo];
    return '<div class="custo-extra-card"><div class="ce-icon">'+c.icon+'</div><div class="ce-info"><div class="ce-name">'+c.nome+'</div><div class="ce-detail">'+detail+'</div></div><div><div class="ce-val">'+fR(c.valor)+'</div><div class="ce-per">'+(pl[c.periodo]||'')+'</div></div><div class="ce-acts"><button class="btn-ghost" onclick="abrirModalCusto('\''+c.id+'\')">✏️</button><button class="btn-danger-ghost" onclick="deletarCusto('\''+c.id+'\')">🗑️</button></div></div>';
  }).join('');
}
function abrirModalOdo(){document.getElementById('odo-input').value=kmAtual||'';abrirModal('odoModal');}
function salvarOdo(){const v=parseInt(document.getElementById('odo-input').value);if(isNaN(v)||v<0){alert('Informe um valor valido!');return;}kmAtual=v;salvarManutencao();fecharModal('odoModal');renderManutencao();}
function abrirTroca(id){
  const c=comps.find(x=>x.id===id);if(!c)return;
  document.getElementById('troca-comp-id').value=id;
  document.getElementById('troca-title').textContent='🔧 '+c.nome;
  document.getElementById('troca-km').value=kmAtual||'';
  document.getElementById('troca-data').value=hoje();
  document.getElementById('troca-custo').value=c.custo?String(c.custo).replace('.',','):'';
  document.getElementById('troca-obs').value='';
  const hist=c.hist||[];
  const hs=document.getElementById('troca-hist-section'),hl=document.getElementById('troca-hist-list');
  if(hist.length>0){hs.style.display='block';hl.innerHTML=hist.slice(-5).reverse().map(h=>'<div class="troca-hist-item"><span class="th-date">'+fData(h.data)+'</span><span class="th-km">'+((h.km||0).toLocaleString('pt-BR'))+' km</span><span class="th-custo">'+fR(h.custo||0)+'</span></div>').join('');}else hs.style.display='none';
  abrirModal('trocaModal');
}
function salvarTroca(){
  const id=document.getElementById('troca-comp-id').value,c=comps.find(x=>x.id===id);if(!c)return;
  const km=parseInt(document.getElementById('troca-km').value),data=document.getElementById('troca-data').value,custo=pBR(document.getElementById('troca-custo').value),obs=document.getElementById('troca-obs').value.trim();
  if(!data){alert('Informe a data!');return;}if(isNaN(km)||km<0){alert('Informe o km!');return;}
  c.ultimoKm=km;c.ultimaData=data;c.custo=custo||c.custo;
  if(!c.hist)c.hist=[];c.hist.push({data,km,custo,obs});
  if(km>kmAtual)kmAtual=km;
  salvarManutencao();fecharModal('trocaModal');renderManutencao();
}
function renderEmoji(gridId,hiddenId,emojis,sel){document.getElementById(gridId).innerHTML=emojis.map(e=>'<div class="emoji-opt'+(e===sel?' sel':'')+'" onclick="selEmoji('\''+gridId+'\','\''+hiddenId+'\','\''+e+'\',this)">'+e+'</div>').join('');}
function selEmoji(gridId,hiddenId,emoji,el){document.getElementById(gridId).querySelectorAll('.emoji-opt').forEach(o=>o.classList.remove('sel'));el.classList.add('sel');document.getElementById(hiddenId).value=emoji;}
function abrirModalComp(id){
  const c=id?comps.find(x=>x.id===id):null;
  document.getElementById('comp-edit-id').value=id||'';
  document.getElementById('comp-modal-title').textContent=c?'✏️ Editar: '+c.nome:'⚙️ Novo Componente';
  document.getElementById('comp-nome').value=c?c.nome:'';
  document.getElementById('comp-icon').value=c?c.icon:'🔩';
  document.getElementById('comp-duracao').value=c?c.duracaoKm:'';
  document.getElementById('comp-custo').value=c?String(c.custo).replace('.',','):'';
  renderEmoji('comp-emoji-grid','comp-icon',EMOJIS_C,c?c.icon:'🔩');
  const footer=document.getElementById('comp-modal-footer');
  if(c&&!c.isDefault)footer.innerHTML='<button class="btn-modal btn-delete" onclick="deletarComp('\''+c.id+'\')">Excluir</button><button class="btn-modal btn-save" onclick="salvarComp()">Salvar</button>';
  else footer.innerHTML='<button class="btn-modal btn-cancel" onclick="fecharModal(\'compModal\')">Cancelar</button><button class="btn-modal btn-save" onclick="salvarComp()">Salvar</button>';
  abrirModal('compModal');
}
function salvarComp(){
  const id=document.getElementById('comp-edit-id').value,nome=document.getElementById('comp-nome').value.trim(),icon=document.getElementById('comp-icon').value||'🔩',dur=parseInt(document.getElementById('comp-duracao').value)||0,custo=pBR(document.getElementById('comp-custo').value);
  if(!nome){alert('Informe o nome!');return;}if(dur<=0){alert('Informe a durabilidade!');return;}
  if(id){const i=comps.findIndex(c=>c.id===id);if(i>=0)Object.assign(comps[i],{nome,icon,duracaoKm:dur,custo});}
  else comps.push({id:uid(),nome,icon,duracaoKm:dur,custo,ultimoKm:0,ultimaData:null,hist:[],isDefault:false});
  salvarManutencao();fecharModal(\'compModal\');renderManutencao();
}
function deletarComp(id){if(!confirm('Excluir este componente?'))return;comps=comps.filter(c=>c.id!==id);salvarManutencao();fecharModal(\'compModal\');renderManutencao();}
function abrirModalCusto(id){
  const c=id?custosExtras.find(x=>x.id===id):null;
  document.getElementById('custo-edit-id').value=id||'';
  document.getElementById('custo-modal-title').textContent=c?'✏️ Editar Custo':'💳 Novo Custo';
  document.getElementById('custo-nome').value=c?c.nome:'';
  document.getElementById('custo-icon').value=c?c.icon:'💳';
  document.getElementById('custo-valor').value=c?String(c.valor).replace('.',','):'';
  document.getElementById('custo-periodo').value=c?c.periodo:'mensal';
  renderEmoji('custo-emoji-grid','custo-icon',EMOJIS_X,c?c.icon:'💳');
  const footer=document.getElementById('custo-modal-footer');
  if(c)footer.innerHTML='<button class="btn-modal btn-delete" onclick="deletarCusto('\''+id+'\');fecharModal(\'custoModal\')">Excluir</button><button class="btn-modal btn-save" onclick="salvarCusto()">Salvar</button>';
  else footer.innerHTML='<button class="btn-modal btn-cancel" onclick="fecharModal(\'custoModal\')">Cancelar</button><button class="btn-modal btn-save" onclick="salvarCusto()">Salvar</button>';
  abrirModal('custoModal');
}
function salvarCusto(){
  const id=document.getElementById('custo-edit-id').value,nome=document.getElementById('custo-nome').value.trim(),icon=document.getElementById('custo-icon').value||'💳',valor=pBR(document.getElementById('custo-valor').value),periodo=document.getElementById('custo-periodo').value;
  if(!nome){alert('Informe o nome!');return;}if(valor<=0){alert('Informe o valor!');return;}
  if(id){const i=custosExtras.findIndex(c=>c.id===id);if(i>=0)Object.assign(custosExtras[i],{nome,icon,valor,periodo});}
  else custosExtras.push({id:uid(),nome,icon,valor,periodo});
  salvarManutencao();fecharModal(\'custoModal\');renderManutencao();
}
function deletarCusto(id){if(!confirm('Remover este custo?'))return;custosExtras=custosExtras.filter(c=>c.id!==id);salvarManutencao();renderManutencao();}
let periodoDias=30;
function setPeriodo(d){periodoDias=d;document.querySelectorAll('.periodo-btn').forEach(b=>b.classList.remove('active'));document.getElementById('p'+d).classList.add('active');renderAnalise();}
function renderAnalise(){
  const cont=document.getElementById('analise-content');
  let recs=[...diario];
  if(periodoDias>0){const lim=new Date();lim.setDate(lim.getDate()-periodoDias);recs=recs.filter(r=>new Date(r.data+'T12:00:00')>=lim);}
  if(!recs.length){cont.innerHTML='<div class="analise-empty"><div class="ae-icon">📊</div><p>Sem dados para o periodo selecionado.<br>Registre dias na aba <strong>Diario</strong> para ver a analise.</p></div>';return;}
  const totalKm=recs.reduce((a,r)=>a+r.km,0);
  const totalRec=recs.reduce((a,r)=>a+r.ganho,0);
  const totalGas=recs.reduce((a,r)=>a+r.gas,0);
  const numDias=recs.length;
  const diasP=periodoDias>0?periodoDias:Math.max(1,Math.ceil((new Date()-new Date(recs[recs.length-1].data+'T12:00:00'))/(864e5))+1);
  const custoManutKm=comps.reduce((a,c)=>a+(c.duracaoKm>0?c.custo/c.duracaoKm:0),0);
  let custoFixoTotal=0,detFixo=[];
  custosExtras.forEach(c=>{let vp=0;if(c.periodo==='por_km')vp=c.valor*totalKm;else if(c.periodo==='mensal')vp=c.valor*(diasP/30);else if(c.periodo==='anual')vp=c.valor*(diasP/365);custoFixoTotal+=vp;detFixo.push({nome:c.nome,icon:c.icon,vp});});
  const cGasKm=totalKm>0?totalGas/totalKm:0,cManutTotal=custoManutKm*totalKm,cFixoKm=totalKm>0?custoFixoTotal/totalKm:0,cTotKm=cGasKm+custoManutKm+cFixoKm,recKm=totalKm>0?totalRec/totalKm:0,margKm=recKm-cTotKm,margPct=recKm>0?margKm/recKm*100:0,cTotReal=totalGas+cManutTotal+custoFixoTotal;
  cont.innerHTML=
    '<div class="kpi-grid">'+
    '<div class="kpi-card kpi-r"><div class="kpi-icon">💰</div><div class="kpi-val">'+fRc(totalRec)+'</div><div class="kpi-lbl">Receita Total</div></div>'+
    '<div class="kpi-card kpi-k"><div class="kpi-icon">🏍️</div><div class="kpi-val">'+totalKm.toFixed(0)+' km</div><div class="kpi-lbl">KM Rodados</div></div>'+
    '<div class="kpi-card kpi-g"><div class="kpi-icon">⛽</div><div class="kpi-val">'+fRc(totalGas)+'</div><div class="kpi-lbl">Gasto Gasolina</div></div>'+
    '<div class="kpi-card kpi-d"><div class="kpi-icon">📅</div><div class="kpi-val">'+numDias+'d</div><div class="kpi-lbl">Dias Trabalhados</div></div>'+
    '</div>'+
    '<div class="analise-box">'+
    '<div class="analise-box-title">📈 Produtividade</div>'+
    '<div class="cr"><span class="cr-lbl">📏 Media km/dia</span><span class="cr-val" style="color:#6ab4d4">'+(numDias>0?(totalKm/numDias).toFixed(1):0)+' km</span></div>'+
    '<div class="cr"><span class="cr-lbl">💰 Media ganhos/dia</span><span class="cr-val" style="color:#6dca8a">'+fR(numDias>0?totalRec/numDias:0)+'</span></div>'+
    '<div class="cr"><span class="cr-lbl">📊 Receita por km</span><span class="cr-val" style="color:#6dca8a">'+fR(recKm)+'/km</span></div>'+
    '</div>'+
    '<div class="analise-box">'+
    '<div class="analise-box-title">💸 Custo por KM</div>'+
    '<div class="cr"><span class="cr-lbl">⛽ Gasolina</span><span class="cr-val">'+fR(cGasKm)+'/km</span></div>'+
    '<div class="cr"><span class="cr-lbl">🔧 Manutencao (rateio)</span><span class="cr-val">'+fR(custoManutKm)+'/km</span></div>'+
    detFixo.map(d=>'<div class="cr" style="padding-left:4px"><span class="cr-lbl" style="font-size:.92em">'+d.icon+' '+d.nome+'</span><span class="cr-val" style="font-size:.92em">'+fR(totalKm>0?d.vp/totalKm:0)+'/km</span></div>').join('')+
    (custosExtras.length?'<div class="cr"><span class="cr-lbl">💳 Custos fixos</span><span class="cr-val">'+fR(cFixoKm)+'/km</span></div>':'')+
    '<div class="cr subtotal"><span class="cr-lbl">💥 Custo Total</span><span class="cr-val">'+fR(cTotKm)+'/km</span></div>'+
    '</div>'+
    '<div class="analise-box">'+
    '<div class="analise-box-title">📦 Totais no Periodo</div>'+
    '<div class="cr"><span class="cr-lbl">⛽ Total gasolina</span><span class="cr-val">'+fR(totalGas)+'</span></div>'+
    '<div class="cr"><span class="cr-lbl">🔧 Total manutencao (proj.)</span><span class="cr-val">'+fR(cManutTotal)+'</span></div>'+
    (custosExtras.length?'<div class="cr"><span class="cr-lbl">💳 Total custos fixos</span><span class="cr-val">'+fR(custoFixoTotal)+'</span></div>':'')+
    '<div class="cr subtotal"><span class="cr-lbl">💸 Total de Custos</span><span class="cr-val">'+fR(cTotReal)+'</span></div>'+
    '</div>'+
    '<div class="margem-box '+(margKm<0?'neg':'')+'">'+
    '<div class="margem-lbl">'+(margKm>=0?'✅ Margem Liquida por KM':'❌ Resultado por KM')+'</div>'+
    '<div class="margem-val">'+fR(margKm)+'/km</div>'+
    '<div class="margem-pct">'+margPct.toFixed(1)+'% de margem'+(totalKm>0?' - Lucro total: '+fR(margKm*totalKm):'')+'</div>'+
    '</div>'+
    (totalGas===0&&custosExtras.length===0?'<div class="tip-box">💡 Registre gastos de gasolina no Diario e adicione custos fixos (IPVA, seguro) na aba Manutencao para uma analise mais precisa.</div>':'')+
    '<div style="height:16px"></div>';
}
function updateBadge(){let n=comps.filter(c=>desgaste(c).pct>=75).length;const b=document.getElementById('badge-manut');if(n>0){b.textContent=n;b.classList.add('on');}else b.classList.remove('on');}
window.addEventListener('DOMContentLoaded',()=>{carregarConfig();carregarDiario();carregarManutencao();document.getElementById('d-data').value=hoje();updateBadge();document.getElementById('analise-content').innerHTML='<div class="analise-empty"><div class="ae-icon">📊</div><p>Va para a aba <strong>Diario</strong> e registre seus dias de trabalho para ver a analise aqui.</p></div>';});
