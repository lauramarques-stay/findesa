import { useState, useRef, useCallback, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";

// ── Stay Brand Palette ─────────────────────────────────────────────────────────
const B = {
  orange:  "#ff561c",
  black:   "#000000",
  offwhite:"#f7f5f0",
  blue:    "#1e22aa",
  lavender:"#d7c9ff",
  lime:    "#e7ea7d",
  stone:   "#deddd9",
  bg:      "#080808",
  surface: "#111111",
  card:    "#161616",
  border:  "rgba(255,255,255,0.07)",
  muted:   "rgba(247,245,240,0.42)",
};

const BADGES = [
  { id:"first_upload",    icon:"📄", name:"Primeira Fatura",  desc:"Analisou a primeira fatura" },
  { id:"first_challenge", icon:"⚡", name:"Primeiro Passo",   desc:"Completou o 1º desafio" },
  { id:"century",         icon:"💯", name:"Centena",          desc:"Acumulou 100 pts",  threshold:100 },
  { id:"saver",           icon:"💰", name:"Poupador",         desc:"3 desafios completos", count:3 },
  { id:"champion",        icon:"🏆", name:"Campeão",          desc:"Acumulou 300 pts",  threshold:300 },
  { id:"streak",          icon:"🔥", name:"Em Chamas",        desc:"5 desafios completos", count:5 },
];

const CAT_COLOR = { Alimentação:B.orange, Delivery:B.lime, Streaming:B.lavender, Transporte:B.blue, Lazer:B.orange, Assinaturas:B.stone, Compras:B.offwhite, Saúde:B.lime, Outros:"#555" };
const CAT_ICON  = { Alimentação:"🍽️", Delivery:"🛵", Streaming:"📺", Transporte:"🚗", Lazer:"🎮", Assinaturas:"🔄", Compras:"🛒", Saúde:"💊", Outros:"📦" };

const LVL_NAME  = ["","Iniciante","Poupador","Mestre","Lendário"];
const LVL_EMOJI = ["","🌱","💡","🎯","👑"];
const LVL_MAX   = [100,300,600,1000];

const wait    = ms => new Promise(r => setTimeout(r, ms));
const toB64   = f  => new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result.split(",")[1]); r.onerror=rej; r.readAsDataURL(f); });
const readTxt = f  => new Promise((res,rej)=>{ const r=new FileReader(); r.onload=e=>res(e.target.result); r.onerror=rej; r.readAsText(f); });
const brl     = n  => "R$ "+Number(n||0).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2});

const CSS = `
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  html, body { background:${B.bg}; color:${B.offwhite}; font-family:'DM Sans',sans-serif; }
  ::selection { background:${B.orange}; color:#fff; }
  ::-webkit-scrollbar { width:4px; }
  ::-webkit-scrollbar-thumb { background:rgba(255,255,255,.12); border-radius:99px; }
  input::placeholder { color:rgba(247,245,240,.22); }
  @keyframes fadeUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
  @keyframes spinPulse { 0%{transform:rotate(0) scale(1)} 50%{transform:rotate(180deg) scale(1.14)} 100%{transform:rotate(360deg) scale(1)} }
  @keyframes barLoad { 0%{width:0} 60%{width:72%} 100%{width:100%} }
  @keyframes bounce  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
  @keyframes popIn   { from{opacity:0;transform:translateX(-50%) translateY(-18px) scale(.9)} to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)} }
`;

function Toast({ msg, emoji }) {
  return (
    <div style={{ position:"fixed", top:20, left:"50%", transform:"translateX(-50%)", background:B.orange, color:"#fff", padding:"11px 26px", borderRadius:99, fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:13, zIndex:9999, whiteSpace:"nowrap", boxShadow:`0 6px 36px ${B.orange}66`, animation:"popIn .38s cubic-bezier(.34,1.56,.64,1)" }}>
      {emoji} {msg}
    </div>
  );
}

function ProgressBar({ pct, color = B.orange, glow = false }) {
  return (
    <div style={{ background:"rgba(255,255,255,.07)", borderRadius:99, height:5, overflow:"hidden" }}>
      <div style={{ width:`${Math.min(100, pct||0)}%`, height:"100%", borderRadius:99, background:color, transition:"width .85s cubic-bezier(.34,1.56,.64,1)", boxShadow:glow?`0 0 12px ${color}99`:undefined }}/>
    </div>
  );
}

function ChallengeCard({ ch, onComplete, isDone }) {
  const [hov, setH] = useState(false);
  return (
    <div onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} style={{ background:isDone?"rgba(255,86,28,.1)":hov?"rgba(255,255,255,.055)":B.card, border:`1.5px solid ${isDone?B.orange+"55":hov?"rgba(255,255,255,.17)":B.border}`, borderRadius:20, padding:"20px 22px", marginBottom:13, transition:"all .2s ease", transform:hov&&!isDone?"translateY(-2px)":"none", position:"relative" }}>
      {isDone && <div style={{ position:"absolute", top:12, right:14, background:B.orange, color:"#fff", borderRadius:99, fontSize:10, fontWeight:800, padding:"3px 12px", fontFamily:"'Syne',sans-serif", letterSpacing:".7px" }}>✓ FEITO</div>}
      <div style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
        <span style={{ fontSize:34, flexShrink:0, lineHeight:1 }}>{ch.emoji}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:15, color:B.offwhite, marginBottom:5 }}>{ch.title}</div>
          <div style={{ fontSize:13, color:B.muted, lineHeight:1.65, marginBottom:12 }}>{ch.description}</div>
          <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
            <span style={{ background:B.orange, borderRadius:99, padding:"3px 13px", fontSize:11, fontWeight:800, color:"#fff", fontFamily:"'Syne',sans-serif" }}>⭐ +{ch.points} pts</span>
            <span style={{ fontSize:12, color:"rgba(255,255,255,.28)" }}>💰 ~{brl(ch.savings)}/mês</span>
          </div>
        </div>
      </div>
      {!isDone && (
        <button onClick={() => onComplete(ch)} style={{ marginTop:14, width:"100%", padding:"11px", background:hov?B.orange:"rgba(255,255,255,.05)", border:`1px solid ${hov?B.orange:B.border}`, borderRadius:12, color:"#fff", fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13, cursor:"pointer", transition:"all .2s" }}>
          {hov ? "🎯 Aceitar Desafio!" : "Marcar como completo"}
        </button>
      )}
    </div>
  );
}

function BadgeTile({ b, earned }) {
  return (
    <div style={{ background:earned?`${B.orange}14`:B.card, border:`1px solid ${earned?B.orange+"44":B.border}`, borderRadius:16, padding:"18px 10px", textAlign:"center", filter:earned?"none":"grayscale(1) opacity(.28)", transition:"all .3s" }}>
      <div style={{ fontSize:30, marginBottom:8 }}>{b.icon}</div>
      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:10, fontWeight:800, color:B.offwhite, letterSpacing:".5px" }}>{b.name}</div>
      <div style={{ fontSize:10, color:B.muted, marginTop:4, lineHeight:1.4 }}>{b.desc}</div>
    </div>
  );
}

export default function App() {
  const router = useRouter();
  const [user,     setUser]     = useState(null);
  const [screen,   setScreen]   = useState("home");
  const [analysis, setAnalysis] = useState(null);
  const [invoiceId,setInvoiceId]= useState(null);
  const [loadStep, setLoadStep] = useState("");
  const [points,   setPoints]   = useState(0);
  const [done,     setDone]     = useState([]);
  const [earned,   setEarned]   = useState([]);
  const [tab,      setTab]      = useState("desafios");
  const [chat,     setChat]     = useState([]);
  const [input,    setInput]    = useState("");
  const [busy,     setBusy]     = useState(false);
  const [toast,    setToast]    = useState(null);
  const [drag,     setDrag]     = useState(false);
  const fileRef = useRef();
  const chatEnd = useRef();

  const level = points < 100 ? 1 : points < 300 ? 2 : points < 600 ? 3 : 4;

  // ── Carrega usuário logado ──────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user || null));
    supabase.auth.onAuthStateChange((_, session) => setUser(session?.user || null));
  }, []);

  useEffect(() => { chatEnd.current?.scrollIntoView({behavior:"smooth"}); }, [chat]);

  const ping = (msg, emoji="🎉", delay=0) => {
    setTimeout(() => { setToast({msg,emoji}); setTimeout(()=>setToast(null),2800); }, delay);
  };

  const logout = async () => { await supabase.auth.signOut(); setUser(null); };

  // ── Salva fatura no Supabase ────────────────────────────────────────────────
  const saveInvoice = async (data) => {
    if (!user) return null;
    const { data: inv } = await supabase.from("invoices").insert({
      user_id: user.id,
      month: data.month,
      total: data.total,
      top_waste: data.top_waste,
      categories: data.categories,
      insights: data.insights,
      challenges: data.challenges,
    }).select().single();
    return inv?.id || null;
  };

  // ── Salva desafio completo ──────────────────────────────────────────────────
  const saveChallenge = async (ch) => {
    if (!user || !invoiceId) return;
    await supabase.from("completed_challenges").insert({
      user_id: user.id,
      invoice_id: invoiceId,
      challenge_id: ch.id,
      points: ch.points,
    });
    // Atualiza pontos no perfil
    await supabase.rpc("increment_points", { uid: user.id, amt: ch.points }).catch(() =>
      supabase.from("profiles").update({ points: (points + ch.points) }).eq("id", user.id)
    );
  };

  // ── Salva badge ─────────────────────────────────────────────────────────────
  const saveBadge = async (badgeId) => {
    if (!user) return;
    await supabase.from("earned_badges").insert({ user_id: user.id, badge_id: badgeId }).catch(()=>{});
  };

  const grantBadge = useCallback((pts, doneList) => {
    setEarned(prev => {
      const next = [...prev]; let changed = false;
      BADGES.forEach(b => {
        if (next.includes(b.id)) return;
        if (b.threshold && pts >= b.threshold)        { next.push(b.id); saveBadge(b.id); changed = true; }
        if (b.count    && doneList.length >= b.count) { next.push(b.id); saveBadge(b.id); changed = true; }
      });
      if (changed) ping("Novo badge desbloqueado!", "🏅", 1100);
      return next;
    });
  }, [user, invoiceId]);

  // ── Upload handler ──────────────────────────────────────────────────────────
  const handleFile = async (file) => {
    if (!file) return;
    if (!user) { router.push("/login"); return; }
    setScreen("loading");
    try {
      setLoadStep("📂 Lendo arquivo…"); await wait(500);
      const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
      const body  = isPdf
        ? { base64: await toB64(file), mediaType:"application/pdf" }
        : { text: await readTxt(file) };

      setLoadStep("🤖 Stay IA analisando sua fatura…"); await wait(400);
      const res  = await fetch("/api/analyze", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
      if (!res.ok) throw new Error();
      const data = await res.json();

      setLoadStep("💾 Salvando no seu histórico…"); await wait(400);
      const invId = await saveInvoice(data);
      setInvoiceId(invId);

      setLoadStep("✨ Criando seus desafios personalizados…"); await wait(400);
      setAnalysis(data);
      setChat([{ role:"assistant", content:`Olá! 👋 Analisei sua fatura de **${data.month||"cartão"}**.\n\n**Principal vazamento:** ${data.top_waste}\n\nCriei ${data.challenges?.length||5} desafios baseados nos seus gastos reais. Bora economizar? 💪` }]);
      setScreen("results");
      setEarned(prev => prev.includes("first_upload") ? prev : (ping("Primeira fatura analisada!","📄"), saveBadge("first_upload"), [...prev,"first_upload"]));
    } catch {
      setScreen("home");
      ping("Erro ao processar. Tente novamente.","❌");
    }
  };

  const onDrop = useCallback(e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }, [user]);

  // ── Complete challenge ──────────────────────────────────────────────────────
  const complete = (ch) => {
    if (done.includes(ch.id)) return;
    const newDone = [...done, ch.id];
    const newPts  = points + ch.points;
    setDone(newDone); setPoints(newPts);
    saveChallenge(ch);
    ping(`+${ch.points} pontos! ${ch.emoji}`, "⭐");
    setEarned(prev => {
      const next = [...prev];
      if (!next.includes("first_challenge") && newDone.length === 1) { next.push("first_challenge"); saveBadge("first_challenge"); ping("Primeiro desafio! 🏅","🏅",1300); }
      return next;
    });
    grantBadge(newPts, newDone);
  };

  // ── Chat ────────────────────────────────────────────────────────────────────
  const sendChat = async () => {
    if (!input.trim() || busy) return;
    const msg  = input.trim(); setInput("");
    const next = [...chat, { role:"user", content:msg }];
    setChat(next); setBusy(true);
    try {
      const res  = await fetch("/api/chat", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ messages:next.map(m=>({role:m.role,content:m.content})), analysis, points, completedCount:done.length }) });
      const data = await res.json();
      setChat([...next, { role:"assistant", content:data.reply||"…" }]);
    } catch {
      setChat([...next, { role:"assistant", content:"Desculpe, tive um problema. 🙏" }]);
    } finally { setBusy(false); }
  };

  const reset = () => { setScreen("home"); setAnalysis(null); setChat([]); setDone([]); setPoints(0); setEarned([]); setInvoiceId(null); };

  // ════════════════════════════════════════════════════════════════════════════
  // LOADING
  // ════════════════════════════════════════════════════════════════════════════
  if (screen === "loading") return (
    <div style={{ minHeight:"100vh", background:B.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <style>{CSS}</style>
      <div style={{ textAlign:"center", color:B.offwhite }}>
        <img src="/logo.png" alt="Stay" style={{ height:42, margin:"0 auto 36px", display:"block" }}/>
        <div style={{ fontSize:60, marginBottom:18, animation:"spinPulse 2s linear infinite", display:"inline-block" }}>🔍</div>
        <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:900, marginBottom:10 }}>Analisando sua fatura…</h2>
        <p style={{ color:B.muted, fontSize:14, marginBottom:32 }}>{loadStep}</p>
        <div style={{ width:200, background:"rgba(255,255,255,.07)", borderRadius:99, height:4, margin:"0 auto", overflow:"hidden" }}>
          <div style={{ height:"100%", background:B.orange, borderRadius:99, animation:"barLoad 2.5s ease-in-out infinite" }}/>
        </div>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // RESULTS
  // ════════════════════════════════════════════════════════════════════════════
  if (screen === "results" && analysis) return (
    <div style={{ minHeight:"100vh", background:B.bg, color:B.offwhite }}>
      <style>{CSS}</style>
      {toast && <Toast {...toast}/>}
      <header style={{ background:"rgba(8,8,8,.92)", backdropFilter:"blur(20px)", borderBottom:`1px solid ${B.border}`, padding:"13px 20px", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ maxWidth:860, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <img src="/logo.png" alt="Stay" style={{ height:30 }}/>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            {user && (
              <button onClick={() => router.push("/dashboard")} style={{ padding:"8px 16px", background:"rgba(255,255,255,.07)", border:`1px solid ${B.border}`, borderRadius:10, color:B.offwhite, fontSize:12, fontWeight:600, cursor:"pointer" }}>
                📊 Histórico
              </button>
            )}
            <div style={{ textAlign:"right" }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:21, fontWeight:900, color:B.orange }}>⭐ {points} pts</div>
              <div style={{ fontSize:11, color:B.muted }}>{LVL_NAME[level]} {LVL_EMOJI[level]}</div>
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth:860, margin:"0 auto", padding:"22px 16px 70px" }}>
        <div style={{ background:B.card, border:`1px solid ${B.border}`, borderRadius:18, padding:"15px 20px", marginBottom:18 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8, fontSize:13 }}>
            <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800 }}>{LVL_NAME[level]} {LVL_EMOJI[level]}</span>
            <span style={{ color:B.muted }}>{points} / {LVL_MAX[level-1]} pts</span>
          </div>
          <ProgressBar pct={(points/LVL_MAX[level-1])*100} glow/>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:20 }}>
          {[
            { icon:"💸", label:"Total da Fatura", val: brl(analysis.total) },
            { icon:"🎯", label:"Desafios",         val: `${done.length}/${analysis.challenges?.length||5}` },
            { icon:"💰", label:"Economia/mês",     val: brl((analysis.challenges||[]).filter(c=>!done.includes(c.id)).reduce((a,c)=>a+c.savings,0)) },
          ].map(s => (
            <div key={s.label} style={{ background:B.card, border:`1px solid ${B.border}`, borderRadius:16, padding:"15px 10px", textAlign:"center" }}>
              <div style={{ fontSize:24, marginBottom:5 }}>{s.icon}</div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:900, marginBottom:3 }}>{s.val}</div>
              <div style={{ fontSize:10, color:B.muted, fontWeight:600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display:"flex", gap:4, background:"rgba(0,0,0,.5)", borderRadius:14, padding:5, marginBottom:22 }}>
          {[["desafios","🎯 Desafios"],["análise","📊 Análise"],["chat","💬 Chat"],["badges","🏅 Badges"]].map(([k,lbl]) => (
            <button key={k} onClick={() => setTab(k)} style={{ flex:1, padding:"10px 4px", border:"none", borderRadius:10, background:tab===k?B.orange:"transparent", color:tab===k?"#fff":B.muted, fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:12, cursor:"pointer", transition:"all .18s" }}>{lbl}</button>
          ))}
        </div>

        {tab==="desafios" && <div>{analysis.challenges?.map(ch => (<ChallengeCard key={ch.id} ch={ch} onComplete={complete} isDone={done.includes(ch.id)}/>))}</div>}

        {tab==="análise" && (
          <div>
            <div style={{ background:`linear-gradient(135deg,${B.orange}20,${B.orange}08)`, border:`1.5px solid ${B.orange}50`, borderRadius:18, padding:"18px 20px", marginBottom:16 }}>
              <div style={{ fontSize:10, fontWeight:800, color:B.orange, letterSpacing:"1.2px", textTransform:"uppercase", marginBottom:7, fontFamily:"'Syne',sans-serif" }}>🚨 Principal Vazamento</div>
              <div style={{ fontSize:15, lineHeight:1.6, color:B.offwhite }}>{analysis.top_waste}</div>
            </div>
            <div style={{ background:B.card, border:`1px solid ${B.border}`, borderRadius:18, padding:"18px 20px", marginBottom:16 }}>
              <div style={{ fontSize:10, fontWeight:800, color:B.muted, letterSpacing:"1.2px", textTransform:"uppercase", marginBottom:14, fontFamily:"'Syne',sans-serif" }}>💡 Insights</div>
              {analysis.insights?.map((ins,i) => (
                <div key={i} style={{ display:"flex", gap:12, padding:"10px 14px", background:"rgba(255,255,255,.04)", borderRadius:11, marginBottom:8 }}>
                  <span style={{ color:B.orange, flexShrink:0, fontWeight:800 }}>→</span>
                  <span style={{ fontSize:13, color:"rgba(247,245,240,.8)", lineHeight:1.65 }}>{ins}</span>
                </div>
              ))}
            </div>
            <div style={{ background:B.card, border:`1px solid ${B.border}`, borderRadius:18, padding:"18px 20px" }}>
              <div style={{ fontSize:10, fontWeight:800, color:B.muted, letterSpacing:"1.2px", textTransform:"uppercase", marginBottom:18, fontFamily:"'Syne',sans-serif" }}>📊 Gastos por Categoria</div>
              {analysis.categories?.sort((a,b)=>b.amount-a.amount).map(cat => (
                <div key={cat.name} style={{ marginBottom:16 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6, alignItems:"center", flexWrap:"wrap", gap:4 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span>{CAT_ICON[cat.name]||"📦"}</span>
                      <span style={{ fontWeight:600, fontSize:14 }}>{cat.name}</span>
                      <span style={{ fontSize:11, color:B.muted }}>{cat.transactions}x</span>
                    </div>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:14 }}>{brl(cat.amount)}<span style={{ fontSize:11, color:B.muted, marginLeft:5 }}>{cat.percentage}%</span></div>
                  </div>
                  <ProgressBar pct={cat.percentage} color={CAT_COLOR[cat.name]||"#666"}/>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==="chat" && (
          <div style={{ background:B.card, border:`1px solid ${B.border}`, borderRadius:20, overflow:"hidden" }}>
            <div style={{ padding:"14px 18px", borderBottom:`1px solid ${B.border}`, background:"rgba(0,0,0,.35)" }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:14 }}>💬 Converse com a Stay IA</div>
              <div style={{ fontSize:12, color:B.muted }}>Ela conhece toda a sua fatura</div>
            </div>
            <div style={{ height:360, overflowY:"auto", padding:"16px 18px", display:"flex", flexDirection:"column", gap:12 }}>
              {chat.map((m,i) => (
                <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start" }}>
                  <div style={{ maxWidth:"82%", padding:"12px 15px", borderRadius:m.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px", background:m.role==="user"?B.orange:"rgba(255,255,255,.08)", fontSize:14, lineHeight:1.65, whiteSpace:"pre-wrap", color:"#fff" }}>
                    {m.content.replace(/\*\*(.*?)\*\*/g,"$1")}
                  </div>
                </div>
              ))}
              {busy && (
                <div style={{ display:"flex", gap:5, padding:"11px 15px", background:"rgba(255,255,255,.07)", borderRadius:"18px 18px 18px 4px", width:"fit-content" }}>
                  {[0,1,2].map(i=>(<div key={i} style={{ width:7, height:7, borderRadius:"50%", background:B.orange, animation:`bounce 1s infinite ${i*.18}s` }}/>))}
                </div>
              )}
              <div ref={chatEnd}/>
            </div>
            <div style={{ padding:"13px 18px", borderTop:`1px solid ${B.border}`, display:"flex", gap:10 }}>
              <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendChat()} placeholder="Pergunte sobre seus gastos…" style={{ flex:1, background:"rgba(255,255,255,.07)", border:`1px solid ${B.border}`, borderRadius:12, padding:"12px 16px", color:"#fff", fontSize:14, outline:"none" }}/>
              <button onClick={sendChat} disabled={busy} style={{ padding:"12px 20px", background:B.orange, border:"none", borderRadius:12, color:"#fff", fontWeight:700, fontSize:16, cursor:busy?"not-allowed":"pointer", opacity:busy?.6:1 }}>→</button>
            </div>
          </div>
        )}

        {tab==="badges" && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:11 }}>
              {BADGES.map(b => (<BadgeTile key={b.id} b={b} earned={earned.includes(b.id)}/>))}
            </div>
            <div style={{ textAlign:"center", marginTop:18, fontSize:13, color:B.muted }}>{earned.length}/{BADGES.length} badges desbloqueados</div>
          </div>
        )}

        <button onClick={reset} style={{ marginTop:26, width:"100%", padding:"13px", background:"transparent", border:`1px solid ${B.border}`, borderRadius:14, color:B.muted, fontSize:13, cursor:"pointer" }}>
          ← Analisar nova fatura
        </button>
      </main>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // HOME
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <>
      <Head>
        <title>Stay – Análise de Fatura</title>
        <meta name="viewport" content="width=device-width,initial-scale=1"/>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>
      </Head>
      <style>{CSS}</style>
      {toast && <Toast {...toast}/>}

      <div onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={onDrop}
        style={{ minHeight:"100vh", background:B.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"60px 20px", position:"relative", overflow:"hidden" }}>

        <div style={{ position:"absolute", top:"-5%", left:"50%", transform:"translateX(-50%)", width:700, height:700, background:`radial-gradient(circle, ${B.orange}1a 0%, transparent 62%)`, pointerEvents:"none" }}/>
        <div style={{ position:"absolute", inset:0, backgroundImage:`linear-gradient(rgba(255,255,255,.015) 1px,transparent 1px), linear-gradient(90deg,rgba(255,255,255,.015) 1px,transparent 1px)`, backgroundSize:"60px 60px", pointerEvents:"none" }}/>

        {/* Header com login */}
        <div style={{ position:"fixed", top:0, left:0, right:0, padding:"14px 24px", display:"flex", justifyContent:"space-between", alignItems:"center", zIndex:100, background:"rgba(8,8,8,.7)", backdropFilter:"blur(20px)", borderBottom:`1px solid ${B.border}` }}>
          <img src="/logo.png" alt="Stay" style={{ height:30 }}/>
          <div style={{ display:"flex", gap:10 }}>
            {user ? (
              <>
                <button onClick={() => router.push("/dashboard")} style={{ padding:"8px 18px", background:"rgba(255,255,255,.07)", border:`1px solid ${B.border}`, borderRadius:10, color:B.offwhite, fontSize:13, fontWeight:600, cursor:"pointer" }}>
                  📊 Meu Histórico
                </button>
                <button onClick={logout} style={{ padding:"8px 18px", background:"transparent", border:`1px solid ${B.border}`, borderRadius:10, color:B.muted, fontSize:13, cursor:"pointer" }}>
                  Sair
                </button>
              </>
            ) : (
              <>
                <button onClick={() => router.push("/login")} style={{ padding:"8px 18px", background:"transparent", border:`1px solid ${B.border}`, borderRadius:10, color:B.muted, fontSize:13, cursor:"pointer" }}>
                  Entrar
                </button>
                <button onClick={() => router.push("/login")} style={{ padding:"8px 18px", background:B.orange, border:"none", borderRadius:10, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                  Criar conta
                </button>
              </>
            )}
          </div>
        </div>

        <div style={{ position:"relative", zIndex:1, maxWidth:520, width:"100%", textAlign:"center", paddingTop:60 }}>
          <div style={{ animation:"fadeUp .45s ease both", marginBottom:38 }}>
            <img src="/logo.png" alt="Stay" style={{ height:54, margin:"0 auto", display:"block" }}/>
          </div>
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:"clamp(38px,8vw,64px)", letterSpacing:"-2.5px", lineHeight:1.0, marginBottom:18, animation:"fadeUp .45s .07s ease both" }}>
            Sua fatura,<br/><span style={{ color:B.orange }}>revelada.</span>
          </h1>
          <p style={{ fontSize:17, color:B.muted, lineHeight:1.75, maxWidth:400, margin:"0 auto 38px", animation:"fadeUp .45s .13s ease both" }}>
            A Stay IA lê sua fatura e mostra exatamente onde seu dinheiro vai — depois cria <strong style={{color:B.offwhite}}>desafios personalizados</strong> pra você economizar de verdade.
          </p>
          <div style={{ display:"flex", justifyContent:"center", gap:8, flexWrap:"wrap", marginBottom:38, animation:"fadeUp .45s .18s ease both" }}>
            {["📊 Análise por IA","🎯 Desafios sob medida","🏆 Gamificação","🔒 Privado"].map(t=>(
              <span key={t} style={{ background:"rgba(255,255,255,.055)", border:`1px solid ${B.border}`, borderRadius:99, padding:"6px 16px", fontSize:12, fontWeight:600, color:B.muted }}>{t}</span>
            ))}
          </div>

          {!user && (
            <div style={{ background:`${B.orange}12`, border:`1px solid ${B.orange}44`, borderRadius:16, padding:"14px 20px", marginBottom:28, fontSize:14, color:B.offwhite, animation:"fadeUp .45s .2s ease both" }}>
              💡 <strong>Crie uma conta grátis</strong> para salvar seu histórico e acompanhar sua evolução.
            </div>
          )}

          <div onClick={() => fileRef.current?.click()}
            style={{ border:`2px dashed ${drag?B.orange:"rgba(255,86,28,.32)"}`, borderRadius:24, padding:"54px 36px", cursor:"pointer", background:drag?`${B.orange}12`:"rgba(255,86,28,.04)", transition:"all .2s", animation:"fadeUp .45s .22s ease both" }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor=B.orange; e.currentTarget.style.background=`${B.orange}10`; }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor="rgba(255,86,28,.32)"; e.currentTarget.style.background="rgba(255,86,28,.04)"; }}
          >
            <div style={{ fontSize:46, marginBottom:14 }}>📂</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:900, marginBottom:8 }}>Arraste sua fatura aqui</div>
            <div style={{ fontSize:13, color:B.muted, marginBottom:22 }}>ou clique para selecionar</div>
            <div style={{ display:"flex", justifyContent:"center", gap:7 }}>
              {["PDF","CSV","XLS","TXT"].map(f=>(<span key={f} style={{ background:"rgba(255,255,255,.08)", border:`1px solid ${B.border}`, padding:"4px 13px", borderRadius:8, fontSize:11, fontWeight:700 }}>{f}</span>))}
            </div>
          </div>
          <input ref={fileRef} type="file" accept=".pdf,.csv,.xls,.xlsx,.txt" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])}/>

          <div style={{ display:"flex", justifyContent:"center", gap:38, marginTop:42, flexWrap:"wrap", animation:"fadeUp .45s .27s ease both" }}>
            {[["🔍","IA lê tudo"],["💡","Identifica vazamentos"],["🎯","Cria desafios"],["🏆","Você evolui"]].map(([icon,text])=>(
              <div key={text} style={{ textAlign:"center" }}>
                <div style={{ fontSize:24, marginBottom:6 }}>{icon}</div>
                <div style={{ fontSize:11, color:B.muted, fontWeight:600 }}>{text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
