import { useState, useRef, useCallback, useEffect } from "react";
import Head from "next/head";

// ─── Constants ────────────────────────────────────────────────────────────────

const BADGE_DEFINITIONS = [
  { id: "first_upload",   icon: "📄", name: "Primeira Fatura",  desc: "Analisou a primeira fatura" },
  { id: "first_challenge",icon: "⚡", name: "Primeiro Passo",   desc: "Completou o 1º desafio" },
  { id: "century",        icon: "💯", name: "Centena",          desc: "Acumulou 100 pontos",  threshold: 100 },
  { id: "saver",          icon: "💰", name: "Poupador",         desc: "Completou 3 desafios", count: 3 },
  { id: "champion",       icon: "🏆", name: "Campeão",          desc: "Acumulou 300 pontos",  threshold: 300 },
  { id: "streak",         icon: "🔥", name: "Em Chamas",        desc: "Completou 5 desafios", count: 5 },
];

const CAT_COLORS = {
  Alimentação: "#FF6B6B", Delivery: "#FF8C42", Streaming: "#9B59B6",
  Transporte: "#3498DB",  Lazer: "#2ECC71",    Assinaturas: "#E74C3C",
  Compras: "#F39C12",     Saúde: "#1ABC9C",    Outros: "#95A5A6",
};
const CAT_ICONS = {
  Alimentação:"🍽️", Delivery:"🛵", Streaming:"📺", Transporte:"🚗",
  Lazer:"🎮", Assinaturas:"🔄", Compras:"🛒", Saúde:"💊", Outros:"📦",
};

const LEVEL_NAMES  = ["","Iniciante 🌱","Poupador 💡","Mestre 🎯","Lendário 👑"];
const LEVEL_THRESHOLDS = [100, 300, 600, 1000];

// ─── Small helpers ─────────────────────────────────────────────────────────────

function GradientText({ children, from = "#FF6B6B", via = "#FF8C42", to = "#F7DC6F" }) {
  return (
    <span style={{ background: `linear-gradient(135deg,${from},${via},${to})`,
      WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
      {children}
    </span>
  );
}

function Bar({ pct, color = "#FF6B6B", glow = false }) {
  return (
    <div style={{ background:"rgba(255,255,255,.1)", borderRadius:999, height:8, overflow:"hidden" }}>
      <div style={{ width:`${Math.min(100,pct)}%`, height:"100%", borderRadius:999,
        background:`linear-gradient(90deg,${color},${color}bb)`,
        transition:"width .8s cubic-bezier(.34,1.56,.64,1)",
        boxShadow: glow ? `0 0 12px ${color}` : "none" }} />
    </div>
  );
}

function Pill({ children, color = "rgba(255,255,255,.1)", textColor = "#fff", border = "rgba(255,255,255,.15)" }) {
  return (
    <span style={{ background:color, border:`1px solid ${border}`, borderRadius:999,
      padding:"5px 14px", fontSize:13, fontWeight:600, color:textColor }}>{children}</span>
  );
}

function Toast({ msg, emoji }) {
  return (
    <div style={{ position:"fixed", top:20, left:"50%", transform:"translateX(-50%)",
      background:"linear-gradient(135deg,#FF6B6B,#FF8C42)", borderRadius:999,
      padding:"12px 26px", fontWeight:700, fontSize:15, zIndex:1000,
      boxShadow:"0 8px 32px rgba(255,107,107,.45)", color:"#fff",
      animation:"slideDown .3s ease" }}>
      {emoji} {msg}
    </div>
  );
}

// ─── Challenge card ─────────────────────────────────────────────────────────

function ChallengeCard({ challenge, onComplete, done }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: done
        ? "linear-gradient(135deg,rgba(46,204,113,.15),rgba(26,188,156,.1))"
        : hov ? "rgba(255,255,255,.1)" : "rgba(255,255,255,.06)",
        border:`1.5px solid ${done?"rgba(46,204,113,.4)":hov?"rgba(255,255,255,.22)":"rgba(255,255,255,.1)"}`,
        borderRadius:20, padding:"20px 22px", transition:"all .25s",
        transform: hov && !done ? "translateY(-2px)" : "none",
        position:"relative", overflow:"hidden" }}>
      {done && (
        <div style={{ position:"absolute", top:12, right:14,
          background:"rgba(46,204,113,.9)", borderRadius:999,
          fontSize:11, fontWeight:700, color:"#fff", padding:"3px 10px" }}>✓ FEITO</div>
      )}
      <div style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
        <span style={{ fontSize:38, flexShrink:0 }}>{challenge.emoji}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:700, fontSize:15, color:"#fff", marginBottom:5 }}>{challenge.title}</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,.6)", lineHeight:1.55, marginBottom:10 }}>{challenge.description}</div>
          <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
            <span style={{ background:"linear-gradient(135deg,#F7DC6F,#F39C12)", borderRadius:999,
              padding:"4px 12px", fontSize:13, fontWeight:800, color:"#1a1a2e" }}>
              ⭐ +{challenge.points} pts
            </span>
            <span style={{ fontSize:12, color:"rgba(255,255,255,.4)" }}>
              💰 ~R$ {challenge.savings}/mês
            </span>
          </div>
        </div>
      </div>
      {!done && (
        <button onClick={() => onComplete(challenge)}
          style={{ marginTop:14, width:"100%", padding:"11px",
            background: hov ? "linear-gradient(135deg,#FF6B6B,#FF8C42)" : "rgba(255,255,255,.08)",
            border:"none", borderRadius:12, color:"#fff", fontWeight:700,
            fontSize:13, cursor:"pointer", transition:"all .2s" }}>
          {hov ? "🎯 Aceitar Desafio!" : "Marcar como completo"}
        </button>
      )}
    </div>
  );
}

// ─── Badge card ──────────────────────────────────────────────────────────────

function BadgeCard({ badge, earned }) {
  return (
    <div style={{ background: earned?"rgba(255,255,255,.12)":"rgba(255,255,255,.04)",
      border:`1px solid ${earned?"rgba(255,255,255,.25)":"rgba(255,255,255,.08)"}`,
      borderRadius:16, padding:"16px 12px", textAlign:"center",
      filter: earned?"none":"grayscale(1) opacity(.4)",
      transition:"all .3s", transform: earned?"scale(1)":"scale(.95)" }}>
      <div style={{ fontSize:34, marginBottom:6 }}>{badge.icon}</div>
      <div style={{ fontSize:11, fontWeight:700, color:"#fff", letterSpacing:".5px" }}>{badge.name}</div>
      <div style={{ fontSize:10, color:"rgba(255,255,255,.45)", marginTop:3 }}>{badge.desc}</div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Home() {
  const [screen, setScreen]           = useState("home");   // home | analyzing | results
  const [analysis, setAnalysis]       = useState(null);
  const [isLoading, setIsLoading]     = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [points, setPoints]           = useState(0);
  const [done, setDone]               = useState([]);        // completed challenge ids
  const [badges, setBadges]           = useState([]);
  const [tab, setTab]                 = useState("desafios");
  const [chat, setChat]               = useState([]);
  const [input, setInput]             = useState("");
  const [chatBusy, setChatBusy]       = useState(false);
  const [toast, setToast]             = useState(null);
  const fileRef  = useRef();
  const chatEnd  = useRef();

  const level = points < 100 ? 1 : points < 300 ? 2 : points < 600 ? 3 : 4;

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior:"smooth" }); }, [chat]);

  const notify = (msg, emoji = "🎉", delay = 0) => {
    setTimeout(() => {
      setToast({ msg, emoji });
      setTimeout(() => setToast(null), 2800);
    }, delay);
  };

  const awardBadges = useCallback((pts, doneList) => {
    setBadges(prev => {
      const next = [...prev];
      let changed = false;
      BADGE_DEFINITIONS.forEach(b => {
        if (next.includes(b.id)) return;
        if (b.threshold && pts >= b.threshold)         { next.push(b.id); changed = true; }
        if (b.count     && doneList.length >= b.count) { next.push(b.id); changed = true; }
      });
      if (changed) notify("Novo badge desbloqueado!", "🏅", 1400);
      return next;
    });
  }, []);

  // ── File upload ──────────────────────────────────────────────────────────────
  const handleFile = async (file) => {
    if (!file) return;
    setIsLoading(true);
    setScreen("analyzing");

    try {
      setLoadingStep("📂 Lendo seu arquivo…");
      await delay(500);

      const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
      let body;

      if (isPdf) {
        const b64 = await toBase64(file);
        body = { base64: b64, mediaType: "application/pdf" };
      } else {
        const text = await readText(file);
        body = { text };
      }

      setLoadingStep("🤖 IA analisando sua fatura…");
      await delay(400);

      const resp = await fetch("/api/analyze", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify(body),
      });

      if (!resp.ok) throw new Error("API error");
      const data = await resp.json();

      setLoadingStep("✨ Criando desafios personalizados…");
      await delay(600);

      setAnalysis(data);
      setChat([{ role:"assistant", content:
        `Olá! Analisei sua fatura de **${data.month || "cartão"}** e encontrei oportunidades incríveis! 👀\n\n` +
        `**Principal vazamento:** ${data.top_waste}\n\n` +
        `Criei **${data.challenges?.length || 5} desafios personalizados** baseados nos seus gastos reais. Vamos juntos transformar isso em economia de verdade! 💪\n\n` +
        `O que você quer saber mais sobre seus gastos?`
      }]);
      setScreen("results");

      setBadges(prev => {
        if (!prev.includes("first_upload")) {
          notify("Primeira fatura analisada!", "📄");
          return [...prev, "first_upload"];
        }
        return prev;
      });

    } catch (err) {
      console.error(err);
      setScreen("home");
      notify("Erro ao processar arquivo. Tente novamente.", "❌");
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  const handleDrop = useCallback(e => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  }, []);

  // ── Complete challenge ───────────────────────────────────────────────────────
  const complete = (ch) => {
    if (done.includes(ch.id)) return;
    const newDone   = [...done, ch.id];
    const newPoints = points + ch.points;
    setDone(newDone);
    setPoints(newPoints);
    notify(`+${ch.points} pontos! ${ch.emoji}`, "⭐");

    setBadges(prev => {
      const next = [...prev];
      if (!next.includes("first_challenge") && newDone.length === 1) {
        next.push("first_challenge");
        notify("Primeiro desafio concluído!", "🏅", 1400);
      }
      return next;
    });

    awardBadges(newPoints, newDone);
  };

  // ── Chat ─────────────────────────────────────────────────────────────────────
  const sendChat = async () => {
    if (!input.trim() || chatBusy) return;
    const userMsg = input.trim();
    setInput("");
    const next = [...chat, { role:"user", content:userMsg }];
    setChat(next);
    setChatBusy(true);
    try {
      const resp = await fetch("/api/chat", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          messages: next.map(m => ({ role:m.role, content:m.content })),
          analysis,
          points,
          completedCount: done.length,
        }),
      });
      const data = await resp.json();
      setChat([...next, { role:"assistant", content: data.reply || "…" }]);
    } catch {
      setChat([...next, { role:"assistant", content:"Desculpe, tive um problema. Tente novamente! 🙏" }]);
    } finally {
      setChatBusy(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <>
      <Head>
        <title>FinaDesafios – Consultora Financeira</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>💳</text></svg>" />
      </Head>

      <style>{`
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        body { background:#0f0c29; font-family:'Segoe UI',system-ui,sans-serif; color:#fff; }
        input::placeholder { color:rgba(255,255,255,.3); }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,.15); border-radius:999px; }
        @keyframes slideDown { from{opacity:0;transform:translateX(-50%) translateY(-20px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        @keyframes spin { 0%{transform:rotate(0deg) scale(1)} 50%{transform:rotate(180deg) scale(1.2)} 100%{transform:rotate(360deg) scale(1)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        @keyframes barLoad { 0%{width:0%} 60%{width:75%} 100%{width:100%} }
      `}</style>

      {toast && <Toast msg={toast.msg} emoji={toast.emoji} />}

      {/* ── ANALYZING ─────────────────────────────────────────────────── */}
      {screen === "analyzing" && (
        <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#0f0c29,#302b63,#24243e)",
          display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:80, marginBottom:24, display:"inline-block", animation:"spin 2.5s linear infinite" }}>🔍</div>
            <h2 style={{ fontSize:28, fontWeight:800, marginBottom:10 }}>Analisando sua fatura…</h2>
            <p style={{ color:"rgba(255,255,255,.55)", fontSize:15, marginBottom:32 }}>{loadingStep}</p>
            <div style={{ width:220, background:"rgba(255,255,255,.1)", borderRadius:999, height:6, margin:"0 auto", overflow:"hidden" }}>
              <div style={{ height:"100%", background:"linear-gradient(90deg,#FF6B6B,#FF8C42,#F7DC6F)",
                borderRadius:999, animation:"barLoad 2.5s ease-in-out infinite" }} />
            </div>
          </div>
        </div>
      )}

      {/* ── RESULTS ───────────────────────────────────────────────────── */}
      {screen === "results" && analysis && (
        <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#0f0c29,#302b63,#24243e)" }}>

          {/* Sticky header */}
          <header style={{ background:"rgba(0,0,0,.35)", backdropFilter:"blur(20px)",
            borderBottom:"1px solid rgba(255,255,255,.1)", padding:"14px 20px",
            position:"sticky", top:0, zIndex:100 }}>
            <div style={{ maxWidth:820, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:20, fontWeight:900, letterSpacing:"-.5px" }}>
                  <GradientText>💳 FinaDesafios</GradientText>
                </div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,.45)" }}>{analysis.month || "Fatura analisada"}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:24, fontWeight:900,
                  background:"linear-gradient(135deg,#F7DC6F,#F39C12)",
                  WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                  ⭐ {points} pts
                </div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,.45)" }}>{LEVEL_NAMES[level]}</div>
              </div>
            </div>
          </header>

          <main style={{ maxWidth:820, margin:"0 auto", padding:"24px 16px" }}>

            {/* Level bar */}
            <div style={{ background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.1)",
              borderRadius:20, padding:"16px 20px", marginBottom:22 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8, fontSize:13 }}>
                <span style={{ fontWeight:700 }}>{LEVEL_NAMES[level]}</span>
                <span style={{ color:"rgba(255,255,255,.45)" }}>{points} / {LEVEL_THRESHOLDS[level-1]} pts</span>
              </div>
              <Bar pct={(points / LEVEL_THRESHOLDS[level-1]) * 100} color="#F7DC6F" glow />
            </div>

            {/* Stats row */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:22 }}>
              {[
                { icon:"💸", label:"Total da Fatura",
                  val:`R$ ${analysis.total?.toLocaleString("pt-BR",{minimumFractionDigits:2})??"-"}` },
                { icon:"🎯", label:"Desafios",
                  val:`${done.length}/${analysis.challenges?.length??5}` },
                { icon:"💰", label:"Economia Possível",
                  val:`R$ ${(analysis.challenges??[])
                    .filter(c=>!done.includes(c.id))
                    .reduce((a,c)=>a+c.savings,0)
                    .toLocaleString("pt-BR")}/mês` },
              ].map(s=>(
                <div key={s.label} style={{ background:"rgba(255,255,255,.06)",
                  border:"1px solid rgba(255,255,255,.1)", borderRadius:16,
                  padding:"14px 10px", textAlign:"center" }}>
                  <div style={{ fontSize:28, marginBottom:5 }}>{s.icon}</div>
                  <div style={{ fontSize:15, fontWeight:800 }}>{s.val}</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,.4)", marginTop:3 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div style={{ display:"flex", gap:5, marginBottom:22,
              background:"rgba(0,0,0,.3)", borderRadius:14, padding:5 }}>
              {[["desafios","🎯 Desafios"],["análise","📊 Análise"],["chat","💬 Chat"],["badges","🏅 Badges"]].map(([k,label])=>(
                <button key={k} onClick={()=>setTab(k)} style={{
                  flex:1, padding:"10px 6px", border:"none", borderRadius:10,
                  background: tab===k ? "linear-gradient(135deg,#FF6B6B,#FF8C42)" : "transparent",
                  color:"#fff", fontWeight:700, fontSize:12, cursor:"pointer", transition:"all .2s" }}>
                  {label}
                </button>
              ))}
            </div>

            {/* ── Desafios ── */}
            {tab==="desafios" && (
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                {analysis.challenges?.map(c=>(
                  <ChallengeCard key={c.id} challenge={c} onComplete={complete} done={done.includes(c.id)} />
                ))}
              </div>
            )}

            {/* ── Análise ── */}
            {tab==="análise" && (
              <div>
                <div style={{ background:"linear-gradient(135deg,rgba(231,76,60,.2),rgba(255,107,107,.08))",
                  border:"1.5px solid rgba(231,76,60,.4)", borderRadius:20, padding:20, marginBottom:18 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"#FF6B6B", letterSpacing:"1px", marginBottom:6 }}>🚨 PRINCIPAL VAZAMENTO</div>
                  <div style={{ fontSize:16, fontWeight:700 }}>{analysis.top_waste}</div>
                </div>

                <div style={{ background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.1)",
                  borderRadius:20, padding:20, marginBottom:18 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,.45)", letterSpacing:"1px", marginBottom:14 }}>💡 INSIGHTS</div>
                  {analysis.insights?.map((ins,i)=>(
                    <div key={i} style={{ display:"flex", gap:12, marginBottom:12,
                      padding:"10px 14px", background:"rgba(255,255,255,.05)", borderRadius:12 }}>
                      <span style={{ opacity:.5, flexShrink:0 }}>→</span>
                      <span style={{ fontSize:14, color:"rgba(255,255,255,.85)", lineHeight:1.55 }}>{ins}</span>
                    </div>
                  ))}
                </div>

                <div style={{ background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.1)",
                  borderRadius:20, padding:20 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,.45)", letterSpacing:"1px", marginBottom:16 }}>📊 GASTOS POR CATEGORIA</div>
                  {analysis.categories?.sort((a,b)=>b.amount-a.amount).map(cat=>(
                    <div key={cat.name} style={{ marginBottom:16 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6, alignItems:"center", flexWrap:"wrap", gap:4 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <span>{CAT_ICONS[cat.name]||"📦"}</span>
                          <span style={{ fontWeight:600, fontSize:14 }}>{cat.name}</span>
                          <span style={{ fontSize:11, color:"rgba(255,255,255,.35)" }}>{cat.transactions} transações</span>
                        </div>
                        <div style={{ fontWeight:800, fontSize:15 }}>
                          R$ {cat.amount?.toLocaleString("pt-BR",{minimumFractionDigits:2})}
                          <span style={{ fontSize:11, color:"rgba(255,255,255,.35)", marginLeft:5 }}>{cat.percentage}%</span>
                        </div>
                      </div>
                      <Bar pct={cat.percentage} color={CAT_COLORS[cat.name]||"#95A5A6"} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Chat ── */}
            {tab==="chat" && (
              <div style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.1)",
                borderRadius:20, overflow:"hidden" }}>
                <div style={{ padding:"14px 18px", borderBottom:"1px solid rgba(255,255,255,.08)",
                  background:"rgba(0,0,0,.2)" }}>
                  <div style={{ fontWeight:700, fontSize:14 }}>💬 Converse com a Luna</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,.4)" }}>Sua consultora IA – já conhece toda a sua fatura</div>
                </div>
                <div style={{ height:360, overflowY:"auto", padding:"16px 18px",
                  display:"flex", flexDirection:"column", gap:12 }}>
                  {chat.map((m,i)=>(
                    <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start" }}>
                      <div style={{ maxWidth:"82%", padding:"12px 16px",
                        borderRadius: m.role==="user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                        background: m.role==="user"
                          ? "linear-gradient(135deg,#FF6B6B,#FF8C42)"
                          : "rgba(255,255,255,.1)",
                        fontSize:14, lineHeight:1.6, whiteSpace:"pre-wrap" }}>
                        {m.content.replace(/\*\*(.*?)\*\*/g,"$1")}
                      </div>
                    </div>
                  ))}
                  {chatBusy && (
                    <div style={{ display:"flex", gap:6, padding:"12px 16px",
                      background:"rgba(255,255,255,.08)", borderRadius:"18px 18px 18px 4px", width:"fit-content" }}>
                      {[0,1,2].map(i=>(
                        <div key={i} style={{ width:8, height:8, borderRadius:"50%",
                          background:"#FF6B6B", animation:`bounce 1s infinite ${i*.2}s` }} />
                      ))}
                    </div>
                  )}
                  <div ref={chatEnd} />
                </div>
                <div style={{ padding:"14px 18px", borderTop:"1px solid rgba(255,255,255,.08)",
                  display:"flex", gap:10 }}>
                  <input value={input} onChange={e=>setInput(e.target.value)}
                    onKeyDown={e=>e.key==="Enter"&&sendChat()}
                    placeholder="Pergunte sobre seus gastos…"
                    style={{ flex:1, background:"rgba(255,255,255,.08)", border:"1px solid rgba(255,255,255,.15)",
                      borderRadius:12, padding:"12px 16px", color:"#fff", fontSize:14, outline:"none" }} />
                  <button onClick={sendChat} disabled={chatBusy}
                    style={{ padding:"12px 20px",
                      background:"linear-gradient(135deg,#FF6B6B,#FF8C42)",
                      border:"none", borderRadius:12, color:"#fff", fontWeight:700,
                      cursor:chatBusy?"not-allowed":"pointer", fontSize:16 }}>→</button>
                </div>
              </div>
            )}

            {/* ── Badges ── */}
            {tab==="badges" && (
              <div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
                  {BADGE_DEFINITIONS.map(b=>(
                    <BadgeCard key={b.id} badge={b} earned={badges.includes(b.id)} />
                  ))}
                </div>
                <div style={{ textAlign:"center", marginTop:22, color:"rgba(255,255,255,.4)", fontSize:13 }}>
                  {badges.length}/{BADGE_DEFINITIONS.length} badges desbloqueados
                </div>
              </div>
            )}

            <button onClick={()=>{setScreen("home");setAnalysis(null);setChat([]);setDone([]);setPoints(0);setBadges([]);}}
              style={{ marginTop:28, width:"100%", padding:"13px",
                background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.12)",
                borderRadius:14, color:"rgba(255,255,255,.45)", fontSize:14, cursor:"pointer" }}>
              ← Analisar nova fatura
            </button>
          </main>
        </div>
      )}

      {/* ── HOME ──────────────────────────────────────────────────────── */}
      {screen === "home" && (
        <div onDragOver={e=>e.preventDefault()} onDrop={handleDrop}
          style={{ minHeight:"100vh", background:"linear-gradient(135deg,#0f0c29,#302b63,#24243e)",
            display:"flex", flexDirection:"column", alignItems:"center",
            justifyContent:"center", padding:"40px 20px" }}>

          <div style={{ textAlign:"center", maxWidth:540 }}>
            <div style={{ fontSize:76, marginBottom:18 }}>💳</div>
            <h1 style={{ fontSize:44, fontWeight:900, letterSpacing:"-1.5px", marginBottom:10, lineHeight:1.1 }}>
              <GradientText>FinaDesafios</GradientText>
            </h1>
            <p style={{ fontSize:18, color:"rgba(255,255,255,.65)", marginBottom:10, lineHeight:1.65 }}>
              Envie sua fatura, descubra seus <em>vazamentos</em> e ganhe pontos economizando de verdade.
            </p>
            <div style={{ display:"flex", justifyContent:"center", gap:10, marginBottom:38, flexWrap:"wrap" }}>
              {["📊 Análise por IA","🎯 Desafios sob medida","🏆 Gamificação"].map(t=>(
                <Pill key={t}>{t}</Pill>
              ))}
            </div>

            {/* Drop zone */}
            <div onClick={()=>fileRef.current?.click()}
              style={{ border:"2px dashed rgba(255,107,107,.5)", borderRadius:26,
                padding:"52px 36px", cursor:"pointer", transition:"all .25s",
                background:"rgba(255,107,107,.04)" }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(255,107,107,.9)";e.currentTarget.style.background="rgba(255,107,107,.1)"}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,107,107,.5)";e.currentTarget.style.background="rgba(255,107,107,.04)"}}>
              <div style={{ fontSize:50, marginBottom:14 }}>📂</div>
              <div style={{ fontSize:18, fontWeight:700, marginBottom:7 }}>Arraste sua fatura aqui</div>
              <div style={{ fontSize:14, color:"rgba(255,255,255,.4)", marginBottom:20 }}>ou clique para escolher o arquivo</div>
              <div style={{ display:"flex", justifyContent:"center", gap:8 }}>
                {["PDF","CSV","XLS","TXT"].map(f=>(
                  <span key={f} style={{ background:"rgba(255,255,255,.1)", padding:"4px 11px",
                    borderRadius:8, fontSize:12, fontWeight:700 }}>{f}</span>
                ))}
              </div>
            </div>
            <input ref={fileRef} type="file" accept=".pdf,.csv,.xls,.xlsx,.txt"
              style={{ display:"none" }} onChange={e=>handleFile(e.target.files[0])} />

            <div style={{ marginTop:36, display:"flex", justifyContent:"center", gap:36, flexWrap:"wrap" }}>
              {[["🔍","IA analisa tudo"],["💡","Desafios sob medida"],["🏆","Ganhe badges"]].map(([icon,text])=>(
                <div key={text} style={{ textAlign:"center" }}>
                  <div style={{ fontSize:28, marginBottom:5 }}>{icon}</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,.45)", fontWeight:600 }}>{text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function toBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = () => res(r.result.split(",")[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

function readText(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = e => res(e.target.result);
    r.onerror = rej;
    r.readAsText(file);
  });
}
