/* FTC Quest — app principal (módulo ES).
   Depende de data.js (conteúdo das trilhas) e placement.js (prova de nível), carregados antes. */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut }
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, collection, query, where,
  orderBy, limit, onSnapshot, getDocs, serverTimestamp, documentId }
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const fbApp = initializeApp(firebaseConfig);
const auth = getAuth(fbApp);
const db = getFirestore(fbApp);

/* ---------- Constantes ---------- */
const FL = []; U.forEach((u, i) => u.l.forEach((l, j) => FL.push({ l, id: i + "-" + j })));
const SW = ["#7cc8f5", "#f7a8c8", "#9ee3c0", "#c3b1f0", "#ffc99a"];
Object.assign(Q, {
  users: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M17 4a4 4 0 0 1 0 7M19 15a7 7 0 0 1 3 6",
  chat: "M4 5h16v11H9l-5 4z",
  user: "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  send: "M3 11l18-8-8 18-2-8z",
  copy: "M9 9h11v11H9zM5 15H4V4h11v1",
  edit: "M4 20h4L19 9l-4-4L4 16zM13 7l4 4",
  out: "M9 4H5v16h4M16 8l4 4-4 4M20 12H9"
});
const LEVELS = {
  iniciante: { n: "Iniciante", e: "🌱", start: 0 },
  intermediario: { n: "Intermediário", e: "⚡", start: 8 },
  avancado: { n: "Avançado", e: "🚀", start: 18 }
};
const ROOMS = [
  { id: "geral", n: "Sala geral", d: "Converse com todo mundo", e: "🌎" },
  { id: "iniciante", n: "Iniciantes", d: "Dúvidas de quem está começando", e: "🌱" },
  { id: "intermediario", n: "Intermediários", d: "Hardware, sensores e drive", e: "⚡" },
  { id: "avancado", n: "Avançados", d: "Pedro Pathing, PID e visão", e: "🚀" }
];
const KEYS = ["name", "nameLower", "photo", "friendCode", "level", "selfScore", "testPct", "onboarded",
  "xp", "streak", "last", "days", "done", "times", "accent", "mode"];
const DEF = () => ({ xp: 0, streak: 0, last: "", days: [], done: {}, times: {}, accent: SW[0], mode: "auto",
  level: "", selfScore: 0, testPct: 0, onboarded: false, name: "", photo: "", friendCode: "" });

/* ---------- Estado ---------- */
let S = DEF(), me = null, ready = false, loadErr = "", loginErr = "", RETAKE = false;
let V = "path", TI = 0, L = null, sheet = false;
let FR = [], REQ = [], OUT = new Set(), FP = {}, FSR = null, EN = false;
let CV = null, MSGS = [], convUnsub = null, convKey = "", sending = false;
let unsubs = [];

/* ---------- Utilitários ---------- */
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const app = document.getElementById("app");
const dk = (d = new Date()) => { const z = n => String(n).padStart(2, "0"); return d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate()); };
const ago = n => { const d = new Date(); d.setDate(d.getDate() - n); return dk(d); };
const effStreak = u => (u && (u.last === dk() || u.last === ago(1))) ? (u.streak || 0) : 0;
const okUrl = u => typeof u === "string" && /^https:\/\//.test(u);
const initials = n => (n || "?").trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();
const avatar = (url, name, s = 40) => okUrl(url)
  ? `<img class="av" src="${esc(url)}" alt="" width="${s}" height="${s}" referrerpolicy="no-referrer" style="width:${s}px;height:${s}px">`
  : `<span class="av ini" style="width:${s}px;height:${s}px;font-size:${Math.round(s * .4)}px">${esc(initials(name))}</span>`;
const genCode = () => { const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", r = crypto.getRandomValues(new Uint8Array(6)); return [...r].map(x => a[x % a.length]).join(""); };
const fname = f => (FP[f.uid] && FP[f.uid].name) || f.name || "Amigo";
const fphoto = f => (FP[f.uid] && FP[f.uid].photo) || f.photo || "";
let toastT;
function toast(m) {
  let t = document.getElementById("toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
  t.textContent = m; t.className = "show"; clearTimeout(toastT); toastT = setTimeout(() => t.className = "", 3800);
}

/* ---------- Salvar (local + nuvem) ---------- */
let saveT = null;
function save() {
  try { localStorage.setItem("ftcquest:" + (me ? me.uid : "anon"), JSON.stringify(S)); } catch (e) {}
  if (!me) return;
  clearTimeout(saveT); saveT = setTimeout(pushCloud, 700);
}
async function pushCloud() {
  if (!me) return; saveT = null;
  try {
    const d = {}; KEYS.forEach(k => d[k] = S[k]);
    d.nameLower = (S.name || "").toLowerCase(); d.updatedAt = serverTimestamp();
    await setDoc(doc(db, "users", me.uid), d, { merge: true });
  } catch (e) { console.error(e); toast("Não consegui sincronizar agora. Seu progresso continua salvo neste aparelho."); }
}
document.addEventListener("visibilitychange", () => { if (document.hidden && saveT) { clearTimeout(saveT); pushCloud(); } });

function legacy() { // progresso da versão antiga (só no navegador)
  try {
    const o = JSON.parse(localStorage.getItem("ftcquest") || "null"); if (!o) return null;
    let last = ""; if (o.last) { const d = new Date(o.last); if (!isNaN(d)) last = dk(d); }
    return { xp: +o.xp || 0, streak: +o.streak || 0, last, done: o.done || {}, times: o.times || {}, accent: o.accent || SW[0], mode: o.mode || "auto" };
  } catch (e) { return null; }
}

/* ---------- Login ---------- */
async function loadUser(u) {
  const ref = doc(db, "users", u.uid), snap = await getDoc(ref);
  if (snap.exists()) {
    S = { ...DEF(), ...snap.data() };
    S.times = S.times || {}; S.done = S.done || {}; S.days = S.days || [];
    let dirty = false;
    if (u.photoURL && S.photo !== u.photoURL) { S.photo = u.photoURL; dirty = true; }
    if (!S.friendCode) { S.friendCode = genCode(); dirty = true; }
    if (dirty) save();
  } else {
    S = { ...DEF(), ...(legacy() || {}), name: (u.displayName || "Piloto").slice(0, 40), photo: u.photoURL || "", friendCode: genCode() };
    const d = {}; KEYS.forEach(k => d[k] = S[k]);
    d.nameLower = S.name.toLowerCase(); d.createdAt = serverTimestamp(); d.updatedAt = serverTimestamp();
    await setDoc(ref, d);
    try { localStorage.removeItem("ftcquest"); } catch (e) {}
  }
}
function errMsg(e) {
  const c = e && e.code;
  if (c === "auth/unauthorized-domain") return `Este endereço (${location.hostname}) ainda não está autorizado. No Firebase vá em Authentication → Settings → Authorized domains e adicione-o.`;
  if (c === "auth/popup-blocked") return "O navegador bloqueou a janela de login. Libere pop-ups para este site e tente de novo.";
  if (c === "auth/popup-closed-by-user" || c === "auth/cancelled-popup-request") return "";
  if (c === "auth/operation-not-allowed") return "O login com Google ainda não foi ativado. No Firebase vá em Authentication → Sign-in method e ative o Google.";
  if (c === "auth/network-request-failed") return "Sem conexão. Verifique a internet e tente de novo.";
  return "Não foi possível entrar" + (c ? " (" + c + ")" : "") + ".";
}
async function signIn() {
  loginErr = "";
  try { await signInWithPopup(auth, new GoogleAuthProvider()); }
  catch (e) { loginErr = errMsg(e); render(); }
}
const GSVG = `<svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z"/><path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>`;

onAuthStateChanged(auth, async u => {
  stopAll(); me = u; ready = false; loadErr = ""; V = "path"; L = null; sheet = false; RETAKE = false; EN = false;
  if (!u) { S = DEF(); theme(); ready = true; render(); return; }
  render();
  try { await loadUser(u); listen(); }
  catch (e) { console.error(e); loadErr = "Não consegui carregar seu perfil (" + (e.code || e.message) + "). Confira se as regras do Firestore foram publicadas."; }
  ready = true; theme(); render();
});

/* ---------- Listeners em tempo real (amigos e pedidos) ---------- */
function stopAll() { unsubs.forEach(f => f()); unsubs = []; stopConv(); FR = []; REQ = []; OUT = new Set(); FP = {}; FSR = null; }
function listen() {
  unsubs.push(onSnapshot(collection(db, "users", me.uid, "friends"), sn => {
    FR = sn.docs.map(d => ({ uid: d.id, ...d.data() })); loadProfiles(); softRender();
  }, console.error));
  unsubs.push(onSnapshot(query(collection(db, "friendRequests"), where("to", "==", me.uid), where("status", "==", "pending")), sn => {
    REQ = sn.docs.map(d => ({ id: d.id, ...d.data() })); softRender();
  }, console.error));
  unsubs.push(onSnapshot(query(collection(db, "friendRequests"), where("from", "==", me.uid), where("status", "==", "pending")), sn => {
    OUT = new Set(sn.docs.map(d => d.data().to)); softRender();
  }, console.error));
}
async function loadProfiles() {
  const ids = FR.map(f => f.uid), np = {};
  for (let i = 0; i < ids.length; i += 30) {
    try { const sn = await getDocs(query(collection(db, "users"), where(documentId(), "in", ids.slice(i, i + 30)))); sn.forEach(d => np[d.id] = d.data()); }
    catch (e) { console.error(e); }
  }
  FP = np; softRender();
}
function softRender() {
  if (!me || !ready || L || sheet || !S.onboarded || RETAKE) return;
  const typing = document.activeElement && document.activeElement.tagName === "INPUT";
  if ((V === "friends" || V === "chat") && !typing) return render();
  const bd = document.getElementById("bd");
  if (bd) { bd.textContent = REQ.length; bd.hidden = !REQ.length; }
  else if (REQ.length && V !== "conv") render();
}

/* ---------- Tema (original) ---------- */
function theme(){const r=document.documentElement;
 S.mode==="auto"?r.removeAttribute("data-theme"):r.setAttribute("data-theme",S.mode);
 r.style.setProperty("--accent",S.accent);
 const n=parseInt(S.accent.slice(1),16),Lm=(.299*(n>>16)+.587*((n>>8)&255)+.114*(n&255))/255;
 r.style.setProperty("--on",Lm>.62?"#17405e":"#ffffff")}

/* ---------- Trilha, guias e tópicos (original) ---------- */
const cur=()=>FL.findIndex(f=>!S.done[f.id]);
function pathBody(){let h="",k=0;const c=cur();
 U.forEach((u,i)=>{h+=`<div class="hero"><b>${u.t}</b><span>${u.d}</span>${mascot(70)}</div><div class="path">`;
  u.l.forEach((l,j)=>{const idx=FL.findIndex(f=>f.id===i+"-"+j),d=S.done[i+"-"+j],cu=idx===c,lk=!d&&!cu,off=[0,40,0,-40][k++%4];
   h+=`<div class="nw" style="transform:translateX(${off}px)"><button class="node ${d?"done":lk?"lock":cu?"cur":""}" ${lk?"disabled":""} data-i="${idx}" aria-label="${l.n}">${cu?'<span class="bub">Começar</span>':""}${ic(d?"check":lk?"lock":"play",34)}</button><div class="lname">${l.n}</div></div>`});
  h+="</div>"});return h}
let GI=0,QF="";
function glist(){const q=QF.toLowerCase();let h="",c="";
 G.forEach((g,i)=>{if(q&&!(g.n+" "+g.d+" "+g.c+" "+g.s.map(x=>x[0]+" "+x[1]).join(" ")).toLowerCase().includes(q))return;
  if(g.c!==c){c=g.c;h+=`<div class="gh">${c}</div>`}
  h+=`<button class="row" data-gi="${i}"><span class="bx">${ic("code",24)}</span><div><b>${g.n}</b><small>${g.d} · ${g.s.length} passos</small></div>${ic("chev",20)}</button>`});
 return h||'<p class="sub">Nada encontrado. Tente outra palavra.</p>'}
function learnBody(){return `<h2 class="t">Aprender</h2><p class="sub">Guias passo a passo para fazer qualquer coisa no robô.</p><input class="sq" id="sq" type="search" placeholder="Buscar: motor, servo, erro, git..." value="${esc(QF)}" aria-label="Buscar guias"><div id="gl">${glist()}</div>`}
function guideBody(){const g=G[GI];
 return `<button class="back" id="bk">${ic("back",20)}Aprender</button><h2 class="t">${g.n}</h2><p class="sub">${g.d}</p>`+g.s.map((s,k)=>`<div class="sec"><div class="step"><span class="num">${k+1}</span><h3>${s[0]}</h3></div><p>${s[1]}</p>${s[2]?`<pre><code>${hl(s[2])}</code></pre>`:""}</div>`).join("")}
function topicBody(){const l=FL[TI].l;
 return `<button class="back" id="bk">${ic("back",20)}Trilha</button><h2 class="t">${l.n}</h2><p class="sub">${l.d}</p>`+l.s.map(s=>`<div class="sec"><h3>${s[0]}</h3><p>${s[1]}</p>${s[2]?`<pre><code>${hl(s[2])}</code></pre>`:""}</div>`).join("")+`<div style="height:20px"></div><button class="btn" id="pr">Praticar agora</button>`}

/* ---------- Tema: painel (original) ---------- */
function settings(){const m=[["auto","Auto"],["light","Claro"],["dark","Escuro"]];
 return `<div class="sheet" id="sh"><div class="panel"><h3>Personalizar tema</h3><h4>Modo</h4><div class="seg">${m.map(x=>`<button data-m="${x[0]}" class="${S.mode===x[0]?"on":""}">${x[1]}</button>`).join("")}</div>
 <h4>Cor de destaque</h4><div class="sw">${SW.map(c=>`<button data-c="${c}" class="${S.accent===c?"on":""}" style="background:${c}" aria-label="Cor ${c}"></button>`).join("")}<input type="color" id="cc" value="${S.accent}" aria-label="Cor personalizada"></div>
 <h4>Progresso</h4><button class="btn ghost" id="rs">Zerar progresso</button><div style="height:14px"></div><button class="btn" id="cl">Pronto</button></div></div>`}

/* ---------- Quiz (original, com sequência por dia) ---------- */
const shuf=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};

const QBASE=[
["Qual é a melhor forma de testar uma alteração no robô?","Mudar uma coisa por vez e testar","Mudar tudo ao mesmo tempo","Pular os testes","Aumentar a potência ao máximo","Testes pequenos ajudam a identificar a causa de cada resultado."],
["O que fazer se o robô apresentar um comportamento inesperado?","Parar com segurança e investigar","Continuar aumentando a potência","Ignorar o problema","Desconectar a bateria com o robô em movimento","Interrompa o teste e procure a causa antes de continuar."],
["Para que serve a telemetria durante os testes?","Mostrar valores e estados do robô","Aumentar a velocidade do motor","Substituir os sensores","Carregar a bateria","A telemetria ajuda a observar o que o código está lendo e fazendo."],
["Antes de testar motores e mecanismos, qual cuidado é recomendado?","Deixar rodas ou partes móveis suspensas e a área livre","Segurar a roda com a mão","Colocar o robô no chão perto de pessoas","Testar com potência máxima","O primeiro teste deve reduzir o risco de movimento inesperado."],
["Se um dispositivo não for encontrado pelo hardwareMap, o que conferir primeiro?","Nome e tipo na configuração do Driver Hub","Cor do cabo USB","Nome do projeto no GitHub","Tema do Android Studio","O nome e o tipo precisam corresponder à configuração."],
["Qual prática ajuda a encontrar erros mais rápido?","Isolar o problema e testar partes pequenas","Alterar várias classes ao mesmo tempo","Apagar as mensagens de erro","Desativar a telemetria","Testes isolados tornam a causa mais fácil de localizar."],
["Por que registrar os resultados dos testes?","Para comparar ajustes e repetir configurações boas","Para deixar o código maior","Para substituir os comentários","Para evitar testar novamente","Anotações ajudam a entender o que melhorou ou piorou."],
["O que deve acontecer quando o OpMode recebe STOP?","O código deve encerrar e os motores devem ficar seguros","O robô deve continuar até acabar a bateria","Aumentar a potência","Ignorar o comando","O STOP deve interromper o comportamento do robô com segurança."],
["Qual é uma boa prática ao alterar um código que já funciona?","Guardar uma versão estável antes da mudança","Apagar o backup","Mudar tudo sem registrar","Não compilar","Uma versão estável permite voltar atrás se algo der errado."],
["O que fazer depois de um teste bem-sucedido?","Anotar o resultado e validar novamente em condições reais","Assumir que nunca mais vai falhar","Remover todos os limites","Aumentar todas as potências","Um teste isolado não substitui validação completa."]
];
const QJAVA=[
["Qual tipo Java representa verdadeiro ou falso?","boolean","double","String","int","boolean representa true ou false."],
["Qual operador lógico representa E?","&&","||","!","=","&& só é verdadeiro quando as duas condições são verdadeiras."],
["Qual operador lógico representa OU?","||","&&","==","!=","|| é verdadeiro quando pelo menos uma condição é verdadeira."],
["Qual é a função de um método?","Agrupar instruções reutilizáveis","Guardar somente imagens","Ligar o Wi-Fi","Configurar portas físicas","Métodos organizam ações que podem ser chamadas quando necessário."],
["Em Java, índices de arrays começam em qual valor?","0","1","-1","10","O primeiro elemento de um array fica no índice zero."],
["O que significa null?","Ausência de referência a um objeto","Número zero","Texto vazio","Valor verdadeiro","null indica que não há objeto associado à referência."],
["Para comparar igualdade de valores primitivos, qual operador usar?","==","=","===","equals() sempre","== compara valores primitivos; = faz atribuição."],
["Qual estrutura permite escolher entre vários casos?","switch","while","new","import","switch seleciona um bloco com base no valor avaliado."]
];
const QMOTOR=[
["Qual faixa é válida para setPower() em um DcMotor?","De -1.0 até 1.0","De 0 até 255","De -100 até 100","Somente 0 ou 1","A potência do DcMotor usa valores entre -1 e 1."],
["O que getCurrentPosition() retorna em um motor com encoder?","A posição atual em ticks","A temperatura do motor","A tensão da bateria","A velocidade em km/h","O encoder conta ticks de rotação."],
["Por que configurar BRAKE ou FLOAT?","Definir o comportamento do motor quando a potência zera","Alterar o nome do motor","Zerar o encoder automaticamente","Mudar a porta USB","Essas opções definem como o motor se comporta sem potência."],
["O que deve ser feito antes de usar RUN_TO_POSITION?","Definir o alvo com setTargetPosition()","Chamar telemetry.update()","Desligar o Control Hub","Criar um novo Gamepad","O motor precisa saber qual posição deve alcançar."],
["Qual cuidado é essencial ao testar um mecanismo com motor?","Manter pessoas afastadas e limitar o movimento","Prender a peça com a mão","Ignorar os fins de curso","Usar sempre potência 1.0","Mecanismos podem se mover com força e devem ser testados com segurança."],
["O que é um encoder?","Sensor que conta a rotação do motor","Um tipo de bateria","Um controlador de servo","Uma câmera","Encoders medem o movimento em ticks."]
];
const QSENSOR=[
["Qual unidade é comum para medir distância com DistanceSensor?","Centímetros","Volts","Ticks","Graus","DistanceUnit.CM retorna centímetros."],
["O que isPressed() informa em um TouchSensor?","Se o botão está pressionado","A distância até a parede","A cor do objeto","A velocidade do motor","O método retorna o estado do botão de toque."],
["Por que validar uma leitura de sensor?","Para evitar decisões com valores inválidos ou inesperados","Para aumentar a resolução da tela","Para desligar o IMU","Para mudar o nome do hardware","Leituras precisam ser verificadas antes de controlar o robô."],
["O que é uma leitura ruidosa?","Uma medição que varia sem representar uma mudança real","Uma leitura sempre igual a zero","Um erro de compilação","Um nome de motor","Ruído é variação indesejada na medição."]
];
const QAUTO=[
["Por que um autônomo deve ter timeout?","Para não ficar preso esperando uma condição para sempre","Para aumentar o alcance do Wi-Fi","Para ignorar STOP","Para acelerar todos os motores","Timeout limita o tempo de espera e permite um plano seguro."],
["O que é uma máquina de estados?","Uma forma de dividir o programa em etapas nomeadas","Uma lista de motores","Uma configuração de câmera","Um tipo de encoder","Estados organizam o fluxo do programa em etapas claras."],
["O que deve acontecer se uma detecção necessária falhar?","Executar uma alternativa segura previamente testada","Continuar usando dados antigos sem validar","Aumentar a potência","Desativar o STOP","Um plano B evita que uma falha de sensor comprometa todo o autônomo."],
["Por que testar o autônomo por partes?","Para localizar falhas e validar cada etapa","Para evitar usar bateria","Para não precisar de telemetria","Para esconder erros","Testes em etapas isolam problemas e reduzem riscos."]
];
const QPATH=[
["O que é heading em uma pose?","A orientação angular do robô","A potência do motor","A distância da câmera","O número do OpMode","Heading representa a direção para a qual o robô aponta."],
["Por que atualizar o follower continuamente?","Para recalcular o controle durante o movimento","Para carregar a bateria","Para detectar o botão A","Para salvar no Git","O update mantém o seguidor corrigindo a trajetória."],
["O que fazer se a trajetória real não corresponde à planejada?","Conferir odometria, dimensões e parâmetros de localização","Aumentar toda potência sem medir","Apagar o ponto inicial","Ignorar o heading","A precisão depende de localização e calibração corretas."]
];
const QVISION=[
["Para que serve o VisionPortal?","Gerenciar a câmera e os processadores de visão","Controlar diretamente os motores","Armazenar commits","Medir tensão","VisionPortal conecta a câmera aos processadores de visão."],
["O que representa o ID de uma AprilTag?","O identificador do marcador detectado","A velocidade do robô","A porta do motor","O número de ticks","O ID permite distinguir uma tag de outra."],
["O que fazer quando nenhuma tag é detectada?","Usar uma alternativa segura e validar a detecção","Assumir que a tag é ID 0","Usar qualquer dado antigo","Parar de verificar STOP","A ausência de detecção precisa ser tratada explicitamente."]
];
const QGIT=[
["Qual comando registra uma versão no histórico local?","git commit","git push","git pull","git clone","commit cria um registro local."],
["Qual comando envia commits ao repositório remoto?","git push","git add","git status","git init","push envia os commits para o remoto."],
["Por que criar commits pequenos?","Facilitar revisão e recuperação de mudanças","Aumentar o tamanho do projeto","Evitar compilar","Substituir testes","Commits pequenos deixam o histórico mais claro."]
];
function quizFor(f){
 const base=f.l.q||[],track=U[Number(f.id.split("-")[0])],key=(track.t+" "+f.l.n+" "+f.l.d).toLowerCase();
 let pool=QBASE.slice();
 if(/java|vari.ve|condi|loop|m.todo|classe|array|opmode/.test(key))pool=pool.concat(QJAVA);
 if(/motor|encoder|servo|mecan|drive|bra.o|slide/.test(key))pool=pool.concat(QMOTOR);
 if(/sensor|imu|telemetry|gamepad|controle|calibra/.test(key))pool=pool.concat(QSENSOR);
 if(/aut.nomo|estrat.gia|estados|pid|seguran.a/.test(key))pool=pool.concat(QAUTO);
 if(/path|pose|odometria|pedro/.test(key))pool=pool.concat(QPATH);
 if(/vis.o|apriltag|c.mera|vision/.test(key))pool=pool.concat(QVISION);
 if(/git|github|vers.o|equipe/.test(key))pool=pool.concat(QGIT);
 const extra=shuf(pool).slice(0,Math.max(0,10-base.length));
 return [...base,...extra].slice(0,10);
}
function start(i){const f=FL[i];L={f,i:0,h:3,ok:0,startedAt:Date.now(),sel:null,chk:false,qs:shuf(quizFor(f)).map(x=>({q:x[0],a:x[1],o:shuf(x.slice(1,-1)),e:x[x.length-1]}))};render()}
const isCode=o=>/[(@_]|^[a-z]+\.[a-z]/.test(o);
function lesson(){const q=L.qs[L.i],ok=L.chk&&q.o[L.sel]===q.a;
 let h=`<div class="lt"><button class="ib" id="x" aria-label="Sair">${ic("x",20)}</button><div class="bar"><i style="width:${L.i/L.qs.length*100}%"></i></div><span class="hp">${ic("heart",22)}${L.h}</span></div><div class="sub" style="text-align:center">Questão ${L.i+1} de ${L.qs.length} · aprovação: 65% (7/10)</div><div class="q">${q.q}</div>`;
 h+=q.o.map((o,k)=>{let c="opt";if(L.chk){if(o===q.a)c+=" ok";else if(k===L.sel)c+=" bad"}else if(k===L.sel)c+=" sel";
  return `<button class="${c}" data-k="${k}" ${L.chk?"disabled":""}>${isCode(o)?`<code>${esc(o)}</code>`:esc(o)}</button>`}).join("");
 h+=`<div class="foot ${L.chk?ok?"ok":"bad":""}">${L.chk?`<div class="fb">${ic(ok?"check":"x",22)}<span><b>${ok?"Muito bem!":"Quase!"}</b> ${q.e}</span></div>`:""}<button class="btn" id="go" ${L.sel===null?"disabled":""}>${L.chk?"Continuar":"Verificar"}</button></div>`;
 app.innerHTML=h;
 app.querySelectorAll(".opt").forEach(b=>b.onclick=()=>{L.sel=+b.dataset.k;lesson()});
 document.getElementById("x").onclick=()=>{L=null;render()};
 document.getElementById("go").onclick=()=>{
  if(!L.chk){L.chk=true;ok?0:0;q.o[L.sel]===q.a?L.ok++:L.h=Math.max(0,L.h-1);lesson()}
  else{if(L.h<=0)return fin(false);L.i++;L.sel=null;L.chk=false;L.i>=L.qs.length?fin(L.ok/L.qs.length>=0.65):lesson()}}}
function fmtTime(ms){const sec=Math.max(0,Math.round(ms/1000)),m=Math.floor(sec/60),s=sec%60;return m?`${m} min ${s} s`:`${s} s`}
function trailTime(i){return U[i].l.reduce((sum,l,j)=>sum+(Number(S.times?.[i+"-"+j])||0),0)}
function playJingle(){try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const c=new C(),now=c.currentTime;[659,784,988,1319].forEach((hz,i)=>{const o=c.createOscillator(),g=c.createGain();o.type="sine";o.frequency.value=hz;g.gain.setValueAtTime(.0001,now+i*.13);g.gain.exponentialRampToValueAtTime(.12,now+i*.13+.025);g.gain.exponentialRampToValueAtTime(.0001,now+i*.13+.23);o.connect(g);g.connect(c.destination);o.start(now+i*.13);o.stop(now+i*.13+.25)});setTimeout(()=>c.close(),1100)}catch(e){}}
function fin(win){let h=`<div class="end">`;
 if(win){const t=dk();
  if(S.last!==t){S.streak=S.last===ago(1)?S.streak+1:1;S.last=t}
  S.days=[...new Set([...(S.days||[]),t])].slice(-60);
  S.xp+=L.ok*10;S.done[L.f.id]=1;S.times=S.times||{};S.times[L.f.id]=(Number(S.times[L.f.id])||0)+(Date.now()-L.startedAt);save();
  const trackIndex=U.findIndex(u=>u.l.some((_,j)=>`${U.indexOf(u)}-${j}`===L.f.id));
  const track=U[trackIndex],trackDone=track.l.every((_,j)=>S.done[trackIndex+"-"+j]);
  const next=FL[L.i+1];
  playJingle();
  if(trackDone){
   const total=U.reduce((sum,u,i)=>sum+trailTime(i),0);
   const faces=["🥳","🤩","😄","🦉💖","🎉","✨"];
   h+=`<div class="celebrate">${mascot(120)}<div class="spark">${faces[trackIndex%faces.length]}</div><h2>Trilha concluída!</h2><p>${track.t} completa! Você mandou muito bem!</p><div class="timecard">Tempo nesta trilha<b>${fmtTime(trailTime(trackIndex))}</b></div><div class="timecard">Tempo total em todas as trilhas<b>${fmtTime(total)}</b></div><p>+${L.ok*10} XP · ${L.ok} de ${L.qs.length} respostas certas</p></div>`;
  }else{
   h+=`<div class="celebrate">${mascot(110)}<div class="spark">✨🎊✨</div><h2>Fase concluída!</h2><p>+${L.ok*10} XP, ${L.ok} de ${L.qs.length} certas (${Math.round(L.ok/L.qs.length*100)}%)</p><div class="unlock">🔓 Próxima fase desbloqueada!</div><p>A corujinha está comemorando com você!</p></div>`;
  }}
 else h+=`<div style="color:var(--bad);display:grid;place-items:center">${ic("heart",90)}</div><h2>Quase lá! Vamos tentar novamente</h2><p>Você acertou ${L.ok} de ${L.qs.length} (${Math.round(L.ok/L.qs.length*100)}%). Precisa de pelo menos 65% — ou seja, 7 de 10 respostas — para desbloquear a próxima fase.</p>`;
 app.innerHTML=h+`<div style="height:24px"></div><button class="btn" id="b">${win?"Continuar":"Tentar de novo"}</button></div>`;
 document.getElementById("b").onclick=()=>{const f=L.f;L=null;V="path";win?render():start(FL.indexOf(f))}}

/* ---------- Nível: questionário + mini prova ---------- */
const newOB = () => ({ step: "intro", i: 0, self: [], qs: [], sel: null, ans: [], res: null });
let OB = newOB();
function pickTest() {
  const pk = (a, n, t) => shuf(a).slice(0, n).map(x => ({ t, q: x.q, a: x.o[0], o: shuf(x.o), e: x.e }));
  return [...pk(PL.e, 4, "e"), ...pk(PL.m, 3, "m"), ...pk(PL.h, 3, "h")];
}
function applyPlacement(level) {
  const to = LEVELS[level].start;
  U.forEach((u, i) => { if (i < to) u.l.forEach((_, j) => S.done[i + "-" + j] = 1); });
}
function finishTest() {
  const W = { e: 1, m: 1.5, h: 2 }, by = { e: [0, 0], m: [0, 0], h: [0, 0] };
  let got = 0, tot = 0;
  OB.qs.forEach((q, i) => { tot += W[q.t]; by[q.t][1]++; if (OB.ans[i]) { got += W[q.t]; by[q.t][0]++; } });
  const pct = got / tot, self = OB.self.reduce((a, b) => a + b, 0) / Math.max(1, OB.self.length), score = .8 * pct + .2 * self;
  let level = score < .4 ? "iniciante" : score < .7 ? "intermediario" : "avancado";
  if (level === "avancado" && by.h[0] === 0) level = "intermediario";
  OB.res = { level, pct, self, score, by, correct: OB.ans.filter(Boolean).length };
  S.level = level; S.selfScore = +self.toFixed(2); S.testPct = Math.round(pct * 100);
  applyPlacement(level); save(); OB.step = "result"; OB.sel = null; render();
}
function onboardView() {
  const total = SELF.length + 10, first = (S.name || "piloto").split(" ")[0];
  const top = n => `<div class="lt"><div class="bar"><i style="width:${n / total * 100}%"></i></div></div>`;
  let h = "";
  if (OB.step === "intro") {
    h = `<div class="end"><div class="celebrate">${mascot(120)}</div><h2>Olá, ${esc(first)}!</h2>
      <p>Vamos descobrir o seu nível com 3 perguntas rápidas e uma mini prova de 10 questões. Leva uns 3 minutos e a gente monta a trilha certa para você.</p>
      <div style="height:20px"></div><button class="btn" id="ob-go">Começar</button><div style="height:12px"></div>
      <button class="btn ghost" id="ob-skip">${RETAKE ? "Voltar" : "Pular e começar do zero"}</button></div>`;
  } else if (OB.step === "self" || OB.step === "test") {
    const self = OB.step === "self", q = self ? SELF[OB.i] : OB.qs[OB.i], opts = self ? q.o.map(x => x[0]) : q.o;
    h = top(self ? OB.i : SELF.length + OB.i) +
      `<div class="sub" style="text-align:center">${self ? "Sobre você" : "Mini prova"} · ${self ? OB.i + 1 + " de " + SELF.length : OB.i + 1 + " de " + OB.qs.length}</div><div class="q">${esc(q.q)}</div>` +
      opts.map((o, k) => `<button class="opt ${OB.sel === k ? "sel" : ""}" data-k="${k}">${!self && isCode(o) ? `<code>${esc(o)}</code>` : esc(o)}</button>`).join("") +
      `<div class="foot"><button class="btn" id="ob-next" ${OB.sel === null ? "disabled" : ""}>Continuar</button></div>`;
  } else {
    const r = OB.res, lv = LEVELS[r.level], st = LEVELS[r.level].start, tn = st === 0 ? "Começando do zero" : U[st].t;
    h = `<div class="end"><div class="celebrate">${mascot(110)}<div class="spark">${lv.e}</div><h2>Seu nível: ${lv.n}</h2>
      <p>Você acertou ${r.correct} de ${OB.qs.length} na mini prova.</p></div>
      <div class="timecard"><div class="tier"><span>Básico</span><b>${r.by.e[0]}/${r.by.e[1]}</b></div><div class="tier"><span>Intermediário</span><b>${r.by.m[0]}/${r.by.m[1]}</b></div><div class="tier"><span>Avançado</span><b>${r.by.h[0]}/${r.by.h[1]}</b></div></div>
      <div class="unlock">📍 Você começa em: ${esc(tn)}</div>
      <p>Você pode voltar às fases anteriores quando quiser.</p>
      <button class="btn" id="ob-end">Ir para a trilha</button></div>`;
  }
  app.innerHTML = h;
  const $ = id => document.getElementById(id);
  if ($("ob-go")) $("ob-go").onclick = () => { OB.step = "self"; OB.i = 0; OB.sel = null; render(); };
  if ($("ob-skip")) $("ob-skip").onclick = () => {
    if (!RETAKE) { S.level = "iniciante"; S.onboarded = true; save(); }
    RETAKE = false; OB = newOB(); render();
  };
  app.querySelectorAll(".opt").forEach(b => b.onclick = () => { OB.sel = +b.dataset.k; onboardView(); });
  if ($("ob-next")) $("ob-next").onclick = () => {
    if (OB.step === "self") {
      OB.self.push(SELF[OB.i].o[OB.sel][1]); OB.i++; OB.sel = null;
      if (OB.i >= SELF.length) { OB.step = "test"; OB.i = 0; OB.qs = pickTest(); OB.ans = []; }
      return render();
    }
    const q = OB.qs[OB.i]; OB.ans.push(q.o[OB.sel] === q.a); OB.i++; OB.sel = null;
    OB.i >= OB.qs.length ? finishTest() : render();
  };
  if ($("ob-end")) $("ob-end").onclick = () => { S.onboarded = true; RETAKE = false; OB = newOB(); V = "path"; save(); scrollTo(0, 0); render(); };
  scrollTo(0, 0);
}

/* ---------- Telas ---------- */
function weekStrip() {
  const days = new Set(S.days || []), names = ["D", "S", "T", "Q", "Q", "S", "S"];
  let h = '<div class="week">';
  for (let n = 6; n >= 0; n--) {
    const d = new Date(); d.setDate(d.getDate() - n); const on = days.has(dk(d));
    h += `<div class="wd ${on ? "on" : ""} ${n === 0 ? "today" : ""}"><span>${names[d.getDay()]}</span><i>${on ? ic("flame", 18) : ""}</i></div>`;
  }
  return h + "</div>";
}
function streakCard() {
  const n = effStreak(S), today = S.last === dk();
  return `<div class="card"><div class="streak"><div class="big">${ic("flame", 34)}<b>${n}</b></div>
    <div><b>${n === 1 ? "1 dia seguido" : n + " dias seguidos"}</b><small>${today ? "Você já treinou hoje! 🎉" : "Conclua uma fase hoje para manter a sequência."}</small></div></div>${weekStrip()}</div>`;
}
function friendsBody() {
  let h = `<h2 class="t">Amigos</h2><p class="sub">Treine junto e compare suas sequências.</p>
    <div class="card code"><div><small>Seu código de amigo</small><b>${esc(S.friendCode)}</b></div><button class="ib" id="cpy" aria-label="Copiar código">${ic("copy", 20)}</button></div>
    <div class="gh">Adicionar amigo</div><div class="addrow"><input class="sq" id="fs" placeholder="Código ou nome" maxlength="40" autocomplete="off"><button class="btn sm" id="fgo">Buscar</button></div><div id="fres">${fresHtml()}</div>`;
  if (REQ.length) h += `<div class="gh">Pedidos de amizade</div>` + REQ.map(r =>
    `<div class="row2">${avatar(r.fromPhoto, r.fromName, 44)}<div><b>${esc(r.fromName)}</b><small>quer ser seu amigo</small></div><button class="mini ok" data-acc="${esc(r.id)}">Aceitar</button><button class="mini no" data-rej="${esc(r.id)}">Recusar</button></div>`).join("");
  const rows = [{ uid: me.uid, name: S.name, photo: S.photo, xp: S.xp, streak: effStreak(S), level: S.level, me: 1 },
    ...FR.map(f => { const p = FP[f.uid] || {}; return { uid: f.uid, name: fname(f), photo: fphoto(f), xp: p.xp || 0, streak: effStreak(p), level: p.level || "" }; })]
    .sort((a, b) => b.xp - a.xp);
  h += `<div class="gh">Ranking de amigos</div>`;
  h += rows.map((r, i) => `<div class="row2"><span class="pos">${i + 1}</span>${avatar(r.photo, r.name, 44)}<div><b>${esc(r.name)}${r.me ? " (você)" : ""}</b>
    <small>${LEVELS[r.level] ? LEVELS[r.level].e + " " + LEVELS[r.level].n : "Sem nível"}</small></div>
    <span class="mt f">${ic("flame", 16)}${r.streak}</span><span class="mt s">${ic("star", 16)}${r.xp}</span>
    ${r.me ? "" : `<button class="ib sm" data-dm="${esc(r.uid)}" aria-label="Conversar">${ic("chat", 18)}</button><button class="ib sm" data-rm="${esc(r.uid)}" aria-label="Remover amigo">${ic("x", 16)}</button>`}</div>`).join("");
  if (!FR.length) h += `<p class="sub">Compartilhe seu código ou busque pelo nome para adicionar seus primeiros amigos.</p>`;
  return h;
}
function fresHtml() {
  if (FSR === null) return "";
  if (!FSR.length) return `<p class="sub">Ninguém encontrado. Confira o código ou o início do nome.</p>`;
  const fr = new Set(FR.map(f => f.uid));
  return FSR.map(u => `<div class="row2">${avatar(u.photo, u.name, 44)}<div><b>${esc(u.name)}</b><small>${LEVELS[u.level] ? LEVELS[u.level].e + " " + LEVELS[u.level].n : "Sem nível"}</small></div>
    ${fr.has(u.uid) ? `<span class="mt">Amigos</span>` : OUT.has(u.uid) ? `<span class="mt">Pendente</span>` : `<button class="mini ok" data-add="${esc(u.uid)}">Adicionar</button>`}</div>`).join("");
}
function paintFres() {
  const el = document.getElementById("fres"); if (!el) return;
  el.innerHTML = fresHtml();
  el.querySelectorAll("[data-add]").forEach(b => b.onclick = () => sendRequest(b.dataset.add));
}
async function searchFriends(raw) {
  const q = raw.trim(); if (!q) return;
  let docs = [];
  try {
    const code = q.toUpperCase().replace(/\s/g, "");
    if (/^[A-Z0-9]{6}$/.test(code)) docs = (await getDocs(query(collection(db, "users"), where("friendCode", "==", code), limit(1)))).docs;
    if (!docs.length) { const l = q.toLowerCase(); docs = (await getDocs(query(collection(db, "users"), where("nameLower", ">=", l), where("nameLower", "<=", l + "\uf8ff"), limit(10)))).docs; }
  } catch (e) { console.error(e); toast("Erro na busca: " + (e.code || e.message)); return; }
  FSR = docs.filter(d => d.id !== me.uid).map(d => ({ uid: d.id, ...d.data() })); paintFres();
}
async function sendRequest(uid) {
  const inc = REQ.find(r => r.from === uid); if (inc) return acceptReq(inc.id);
  const p = (FSR || []).find(x => x.uid === uid) || {};
  try {
    await setDoc(doc(db, "friendRequests", me.uid + "_" + uid), { from: me.uid, to: uid, fromName: S.name, fromPhoto: S.photo || "", status: "pending", at: serverTimestamp() });
    toast("Pedido enviado" + (p.name ? " para " + p.name : "") + "!");
  } catch (e) { console.error(e); toast("Não foi possível enviar (talvez já exista um pedido)."); }
}
async function acceptReq(id) {
  const r = REQ.find(x => x.id === id); if (!r) return;
  try {
    await updateDoc(doc(db, "friendRequests", r.id), { status: "accepted" });
    await setDoc(doc(db, "users", me.uid, "friends", r.from), { name: r.fromName, photo: r.fromPhoto || "", since: serverTimestamp() });
    await setDoc(doc(db, "users", r.from, "friends", me.uid), { name: S.name, photo: S.photo || "", since: serverTimestamp() });
    toast("Agora vocês são amigos! 🎉");
  } catch (e) { console.error(e); toast("Não consegui aceitar o pedido: " + (e.code || e.message)); }
}
async function rejectReq(id) { try { await deleteDoc(doc(db, "friendRequests", id)); } catch (e) { console.error(e); toast("Não consegui recusar o pedido."); } }
async function removeFriend(uid) {
  const f = FR.find(x => x.uid === uid); if (!f || !confirm("Remover " + fname(f) + " dos amigos?")) return;
  const tryDel = async ref => { try { await deleteDoc(ref); } catch (e) { /* já não existe */ } };
  await tryDel(doc(db, "users", me.uid, "friends", uid));
  await tryDel(doc(db, "users", uid, "friends", me.uid));
  await tryDel(doc(db, "friendRequests", me.uid + "_" + uid));
  await tryDel(doc(db, "friendRequests", uid + "_" + me.uid));
  toast("Amigo removido.");
}

/* ---------- Chat ---------- */
function chatBody() {
  let h = `<h2 class="t">Chat</h2><p class="sub">Converse com a comunidade e treine com seus amigos.</p><div class="gh">Salas</div>`;
  h += ROOMS.map(r => `<button class="row" data-room="${r.id}"><span class="bx emo">${r.e}</span><div><b>${r.n}</b><small>${S.level === r.id ? "Sua sala · " : ""}${r.d}</small></div>${ic("chev", 20)}</button>`).join("");
  h += `<div class="gh">Conversas com amigos</div>`;
  h += FR.length ? FR.map(f => `<button class="row" data-dm="${esc(f.uid)}">${avatar(fphoto(f), fname(f), 48)}<div><b>${esc(fname(f))}</b><small>Toque para conversar</small></div>${ic("chev", 20)}</button>`).join("")
    : `<p class="sub">Você ainda não tem amigos. Adicione na aba Amigos.</p>`;
  return h;
}
function openRoom(id) { const r = ROOMS.find(x => x.id === id); CV = { kind: "room", id, title: r.e + " " + r.n, back: "chat" }; V = "conv"; scrollTo(0, 0); render(); }
function openDM(uid) {
  const f = FR.find(x => x.uid === uid); if (!f) return;
  CV = { kind: "dm", id: [me.uid, uid].sort().join("_"), title: fname(f), av: avatar(fphoto(f), fname(f), 34), back: V === "friends" ? "friends" : "chat" };
  V = "conv"; scrollTo(0, 0); render();
}
function convBody() {
  return `<div class="chead"><button class="ib" id="cb" aria-label="Voltar">${ic("back", 20)}</button><div class="ctitle">${CV.av || ""}<span>${esc(CV.title)}</span></div></div>
    <div class="msgs" id="msgs"></div>
    <div class="comp"><div class="ci"><input class="sq" id="mi" maxlength="500" placeholder="Escreva uma mensagem" autocomplete="off"><button class="send" id="ms" aria-label="Enviar">${ic("send", 22)}</button></div></div>`;
}
const convCol = () => CV.kind === "room" ? collection(db, "rooms", CV.id, "messages") : collection(db, "chats", CV.id, "messages");
function stopConv() { if (convUnsub) { convUnsub(); convUnsub = null; } convKey = ""; MSGS = []; }
function startConv() {
  const key = CV.kind + ":" + CV.id;
  if (convUnsub && convKey === key) return paintMsgs(true);
  stopConv(); convKey = key;
  convUnsub = onSnapshot(query(convCol(), orderBy("at", "desc"), limit(60)), sn => {
    MSGS = sn.docs.map(d => ({ id: d.id, ...d.data({ serverTimestamps: "estimate" }) })).reverse(); paintMsgs(false);
  }, e => { console.error(e); toast("Não consegui abrir a conversa: " + (e.code || e.message)); });
}
let firstPaint = true;
function paintMsgs(force) {
  const el = document.getElementById("msgs"); if (!el) return;
  const near = innerHeight + scrollY >= document.body.scrollHeight - 160;
  el.innerHTML = MSGS.length ? MSGS.map(m => {
    const mine = m.from === me.uid, t = m.at && m.at.toDate ? m.at.toDate() : new Date();
    const hh = String(t.getHours()).padStart(2, "0") + ":" + String(t.getMinutes()).padStart(2, "0");
    return `<div class="msg ${mine ? "me" : ""}">${mine || CV.kind === "dm" ? "" : avatar(m.photo, m.name, 30)}<div class="bb">${!mine && CV.kind === "room" ? `<small class="who">${esc(m.name || "Piloto")}</small>` : ""}<span>${esc(m.text)}</span><i>${hh}</i></div></div>`;
  }).join("") : `<p class="sub" style="text-align:center;margin-top:40px">Nenhuma mensagem ainda. Diga oi! 👋</p>`;
  if (force || near || firstPaint) { scrollTo(0, document.body.scrollHeight); firstPaint = false; }
}
async function sendMsg() {
  const inp = document.getElementById("mi"); if (!inp || sending) return;
  const text = inp.value.trim().slice(0, 500); if (!text) return;
  sending = true; inp.value = "";
  try { await addDoc(convCol(), { from: me.uid, name: S.name, photo: S.photo || "", text, at: serverTimestamp() }); }
  catch (e) { console.error(e); inp.value = text; toast("Mensagem não enviada: " + (e.code || e.message)); }
  sending = false; inp.focus(); scrollTo(0, document.body.scrollHeight);
}

/* ---------- Perfil ---------- */
function profileBody() {
  const lv = LEVELS[S.level], done = Object.keys(S.done).length;
  return `<div class="pf">${avatar(S.photo, S.name, 96)}${EN
    ? `<input class="sq" id="nm" maxlength="40" value="${esc(S.name)}" style="margin-top:12px;text-align:center"><div class="two"><button class="btn ghost" id="nmc">Cancelar</button><button class="btn" id="nms">Salvar</button></div>`
    : `<h2 class="t" style="margin:12px 0 2px">${esc(S.name)}</h2><button class="lnk" id="nme">${ic("edit", 16)} Editar nome</button>`}
    <div class="lvl">${lv ? lv.e + " " + lv.n : "Sem nível ainda"}</div></div>
    <div class="stats"><div><b>${S.xp}</b><small>XP</small></div><div><b>${effStreak(S)}</b><small>Sequência</small></div><div><b>${FR.length}</b><small>Amigos</small></div><div><b>${done}</b><small>Fases</small></div></div>
    ${streakCard()}
    <div class="card code"><div><small>Seu código de amigo</small><b>${esc(S.friendCode)}</b></div><button class="ib" id="cpy" aria-label="Copiar código">${ic("copy", 20)}</button></div>
    <div style="height:8px"></div>
    <button class="btn ghost" id="rt">Refazer teste de nível</button><div style="height:14px"></div>
    <button class="btn ghost" id="th">Personalizar tema</button><div style="height:14px"></div>
    <button class="btn ghost" id="lo">${ic("out", 18)} Sair da conta</button>`;
}
function loginView() {
  app.innerHTML = `<div class="login"><div>${mascot(120)}</div><h1>FTC Quest</h1>
    <p>Aprenda Java, FTC e Pedro Pathing jogando. Entre para salvar o progresso, fazer amigos e manter sua sequência.</p>
    <button class="btn gbtn" id="gsign">${GSVG}<span>Entrar com Google</span></button><p class="err">${esc(loginErr)}</p></div>`;
  document.getElementById("gsign").onclick = signIn;
}
function errView() {
  app.innerHTML = `<div class="login"><div>${mascot(100)}</div><h1>Ops!</h1><p>${esc(loadErr)}</p>
    <button class="btn gbtn" id="rl">Tentar de novo</button><div style="height:10px"></div><button class="btn ghost gbtn" id="lo2">Sair da conta</button></div>`;
  document.getElementById("rl").onclick = () => location.reload();
  document.getElementById("lo2").onclick = () => signOut(auth);
}

/* ---------- Render e eventos ---------- */
function render() {
  if (!ready) { app.innerHTML = `<div class="login"><div>${mascot(90)}</div><p>Carregando…</p></div>`; return; }
  if (!me) return loginView();
  if (loadErr) return errView();
  if (!S.onboarded || RETAKE) return onboardView();
  if (L) return lesson();
  if (V !== "conv") stopConv();
  const b = V === "path" ? streakCard() + pathBody() : V === "learn" ? learnBody() : V === "guide" ? guideBody() : V === "topic" ? topicBody()
    : V === "friends" ? friendsBody() : V === "chat" ? chatBody() : V === "conv" ? convBody() : profileBody();
  const tabs = [["path", "route", "Trilha"], ["learn", "book", "Aprender"], ["friends", "users", "Amigos"], ["chat", "chat", "Chat"], ["profile", "user", "Perfil"]];
  const on = t => V === t || (V === "topic" && t === "path") || (V === "guide" && t === "learn");
  const head = V === "conv" ? "" : `<header class="top"><span class="brand">${mascot(34)}FTC Quest</span><span class="chip f">${ic("flame", 18)}${effStreak(S)}</span><span class="chip s">${ic("star", 18)}${S.xp}</span><button class="av-btn" data-t="profile" aria-label="Perfil">${avatar(S.photo, S.name, 36)}</button></header>`;
  const nav = V === "conv" ? "" : `<nav class="tabs">${tabs.map(t => `<button data-t="${t[0]}" class="${on(t[0]) ? "on" : ""}"><span class="ti">${ic(t[1], 24)}${t[0] === "friends" ? `<em class="bd" id="bd" ${REQ.length ? "" : "hidden"}>${REQ.length}</em>` : ""}</span><span>${t[2]}</span></button>`).join("")}</nav>`;
  app.innerHTML = head + b + nav + (sheet ? settings() : "");
  bind();
  if (V === "conv") startConv();
}
function copyCode() {
  const c = S.friendCode;
  (navigator.clipboard ? navigator.clipboard.writeText(c) : Promise.reject()).then(() => toast("Código copiado!"), () => toast("Seu código: " + c));
}
function bind() {
  const $ = id => document.getElementById(id);
  app.querySelectorAll("[data-t]").forEach(b => b.onclick = () => { V = b.dataset.t; EN = false; scrollTo(0, 0); render(); });
  app.querySelectorAll(".node:not(.lock)").forEach(b => b.onclick = () => { TI = +b.dataset.i; V = "topic"; scrollTo(0, 0); render(); });
  const bg = () => app.querySelectorAll("[data-gi]").forEach(b => b.onclick = () => { GI = +b.dataset.gi; V = "guide"; scrollTo(0, 0); render(); }); bg();
  const sq = $("sq"); if (sq) sq.oninput = () => { QF = sq.value; $("gl").innerHTML = glist(); bg(); };
  const bk = $("bk"), pr = $("pr");
  if (bk) bk.onclick = () => { V = V === "guide" ? "learn" : "path"; scrollTo(0, 0); render(); };
  if (pr) pr.onclick = () => start(TI);

  // amigos
  if ($("cpy")) $("cpy").onclick = copyCode;
  if ($("fgo")) {
    $("fgo").onclick = () => searchFriends($("fs").value);
    $("fs").onkeydown = e => { if (e.key === "Enter") searchFriends($("fs").value); };
    paintFres();
  }
  app.querySelectorAll("[data-acc]").forEach(b => b.onclick = () => acceptReq(b.dataset.acc));
  app.querySelectorAll("[data-rej]").forEach(b => b.onclick = () => rejectReq(b.dataset.rej));
  app.querySelectorAll("[data-rm]").forEach(b => b.onclick = () => removeFriend(b.dataset.rm));
  app.querySelectorAll("[data-dm]").forEach(b => b.onclick = () => openDM(b.dataset.dm));
  app.querySelectorAll("[data-room]").forEach(b => b.onclick = () => openRoom(b.dataset.room));

  // conversa
  if ($("cb")) $("cb").onclick = () => { V = CV.back || "chat"; firstPaint = true; scrollTo(0, 0); render(); };
  if ($("ms")) { $("ms").onclick = sendMsg; $("mi").onkeydown = e => { if (e.key === "Enter") sendMsg(); }; }

  // perfil
  if ($("nme")) $("nme").onclick = () => { EN = true; render(); $("nm").focus(); };
  if ($("nmc")) $("nmc").onclick = () => { EN = false; render(); };
  if ($("nms")) $("nms").onclick = () => {
    const v = $("nm").value.trim().slice(0, 40);
    if (!v) return toast("O nome não pode ficar vazio.");
    S.name = v; EN = false; save(); render();
  };
  if ($("rt")) $("rt").onclick = () => { RETAKE = true; OB = newOB(); scrollTo(0, 0); render(); };
  if ($("th")) $("th").onclick = () => { sheet = true; render(); };
  if ($("lo")) $("lo").onclick = () => signOut(auth);

  if (!sheet) return;
  const close = () => { sheet = false; render(); };
  $("cl").onclick = close;
  $("sh").onclick = e => { if (e.target.id === "sh") close(); };
  app.querySelectorAll("[data-m]").forEach(b => b.onclick = () => { S.mode = b.dataset.m; save(); theme(); render(); });
  app.querySelectorAll("[data-c]").forEach(b => b.onclick = () => { S.accent = b.dataset.c; save(); theme(); render(); });
  $("cc").oninput = e => { S.accent = e.target.value; save(); theme(); };
  $("cc").onchange = () => render();
  $("rs").onclick = () => {
    if (!confirm("Zerar XP, sequência e fases concluídas? Seu nível será mantido.")) return;
    S.xp = 0; S.streak = 0; S.last = ""; S.days = []; S.done = {}; S.times = {};
    if (LEVELS[S.level]) applyPlacement(S.level);
    save(); close();
  };
}
theme(); render();
