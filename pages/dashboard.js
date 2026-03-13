import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";

const B = {
  orange:"#ff561c", bg:"#080808", card:"#161616", offwhite:"#f7f5f0",
  muted:"rgba(247,245,240,0.42)", border:"rgba(255,255,255,0.07)",
  blue:"#1e22aa", lavender:"#d7c9ff", lime:"#e7ea7d",
};
const brl = n => "R$ " + Number(n||0).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2});
const CSS = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  html,body{background:${B.bg};color:${B.offwhite};font-family:'Sora',sans-serif;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
`;

const BADGE_ICONS = { first_upload:"📄", first_challenge:"⚡", century:"💯", saver:"💰", champion:"🏆", streak:"🔥" };

export default function Dashboard() {
  const router = useRouter();
  const [user,     setUser]     = useState(null);
  const [profile,  setProfile]  = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [badges,   setBadges]   = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push("/login"); return; }
      setUser(data.user);
      loadData(data.user.id);
    });
  }, []);

  const loadData = async (uid) => {
    const [{ data: prof }, { data: invs }, { data: bdgs }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", uid).single(),
      supabase.from("invoices").select("*, completed_challenges(*)").eq("user_id", uid).order("created_at", { ascending: false }),
      supabase.from("earned_badges").select("*").eq("user_id", uid),
    ]);
    setProfile(prof);
    setInvoices(invs || []);
    setBadges(bdgs || []);
    setLoading(false);
  };

  const logout = async () => { await supabase.auth.signOut(); router.push("/login"); };

  if (loading) return (
    <div style={{ minHeight:"100vh", background:B.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <style>{CSS}</style>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:40, marginBottom:16 }}>⏳</div>
        <p style={{ color:B.muted }}>Carregando seu histórico…</p>
      </div>
    </div>
  );

  const totalSaved = invoices.reduce((acc, inv) => {
    const done = inv.completed_challenges?.map(c => c.challenge_id) || [];
    const chs  = inv.challenges || [];
    return acc + chs.filter(c => done.includes(c.id)).reduce((a,c) => a + c.savings, 0);
  }, 0);

  return (
    <>
      <Head>
        <title>Stay – Meu Histórico</title>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>
      </Head>
      <style>{CSS}</style>

      <div style={{ minHeight:"100vh", background:B.bg }}>
        {/* Header */}
        <header style={{ background:"rgba(8,8,8,.92)", backdropFilter:"blur(20px)", borderBottom:`1px solid ${B.border}`, padding:"13px 20px", position:"sticky", top:0, zIndex:100 }}>
          <div style={{ maxWidth:860, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <img src="/logo.png" alt="Stay" style={{ height:30 }}/>
            <div style={{ display:"flex", gap:12, alignItems:"center" }}>
              <button onClick={() => router.push("/")} style={{ padding:"8px 18px", background:"rgba(255,255,255,.07)", border:`1px solid ${B.border}`, borderRadius:10, color:B.offwhite, fontSize:13, fontWeight:600, cursor:"pointer" }}>
                + Nova Fatura
              </button>
              <button onClick={logout} style={{ padding:"8px 18px", background:"transparent", border:`1px solid ${B.border}`, borderRadius:10, color:B.muted, fontSize:13, cursor:"pointer" }}>
                Sair
              </button>
            </div>
          </div>
        </header>

        <main style={{ maxWidth:860, margin:"0 auto", padding:"28px 16px 70px" }}>
          {/* Saudação */}
          <div style={{ marginBottom:28, animation:"fadeUp .4s ease both" }}>
            <h1 style={{ fontFamily:"'Domine',serif", fontWeight:900, fontSize:28, marginBottom:4 }}>
              Olá, {profile?.name?.split(" ")[0] || "você"} 👋
            </h1>
            <p style={{ color:B.muted, fontSize:14 }}>Aqui está todo o seu histórico financeiro.</p>
          </div>

          {/* Stats gerais */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:24, animation:"fadeUp .4s .05s ease both" }}>
            {[
              { icon:"📊", label:"Faturas analisadas", val: invoices.length },
              { icon:"⭐", label:"Pontos totais",      val: `${profile?.points || 0} pts` },
              { icon:"💰", label:"Economia acumulada", val: brl(totalSaved) },
            ].map(s => (
              <div key={s.label} style={{ background:B.card, border:`1px solid ${B.border}`, borderRadius:16, padding:"16px 10px", textAlign:"center" }}>
                <div style={{ fontSize:24, marginBottom:6 }}>{s.icon}</div>
                <div style={{ fontFamily:"'Domine',serif", fontSize:16, fontWeight:900, marginBottom:3 }}>{s.val}</div>
                <div style={{ fontSize:10, color:B.muted, fontWeight:600 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Badges */}
          {badges.length > 0 && (
            <div style={{ background:B.card, border:`1px solid ${B.border}`, borderRadius:18, padding:"18px 20px", marginBottom:24, animation:"fadeUp .4s .1s ease both" }}>
              <div style={{ fontSize:11, fontWeight:800, color:B.muted, letterSpacing:"1px", textTransform:"uppercase", marginBottom:14, fontFamily:"'Domine',serif" }}>🏅 Badges conquistados</div>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                {badges.map(b => (
                  <div key={b.id} style={{ background:`${B.orange}15`, border:`1px solid ${B.orange}44`, borderRadius:12, padding:"8px 14px", display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:20 }}>{BADGE_ICONS[b.badge_id] || "🏅"}</span>
                    <span style={{ fontSize:12, fontWeight:700, fontFamily:"'Domine',serif" }}>{b.badge_id}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comparativo de gastos */}
          {invoices.length > 1 && (
            <div style={{ background:B.card, border:`1px solid ${B.border}`, borderRadius:18, padding:"18px 20px", marginBottom:24, animation:"fadeUp .4s .13s ease both" }}>
              <div style={{ fontSize:11, fontWeight:800, color:B.muted, letterSpacing:"1px", textTransform:"uppercase", marginBottom:18, fontFamily:"'Domine',serif" }}>📈 Comparativo de gastos</div>
              <div style={{ display:"flex", gap:8, alignItems:"flex-end", height:120 }}>
                {[...invoices].reverse().slice(-6).map((inv, i) => {
                  const max = Math.max(...invoices.map(x => x.total));
                  const pct = (inv.total / max) * 100;
                  return (
                    <div key={inv.id} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
                      <div style={{ fontSize:9, color:B.muted, fontWeight:700 }}>{brl(inv.total)}</div>
                      <div style={{ width:"100%", background:`${B.orange}${i===invoices.length-1?"ff":"66"}`, borderRadius:"6px 6px 0 0", height:`${pct}%`, minHeight:8, transition:"height .6s ease" }}/>
                      <div style={{ fontSize:9, color:B.muted, textAlign:"center", lineHeight:1.3 }}>{inv.month || "—"}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Lista de faturas */}
          <div style={{ animation:"fadeUp .4s .16s ease both" }}>
            <div style={{ fontSize:11, fontWeight:800, color:B.muted, letterSpacing:"1px", textTransform:"uppercase", marginBottom:14, fontFamily:"'Domine',serif" }}>📄 Faturas analisadas</div>

            {invoices.length === 0 ? (
              <div style={{ background:B.card, border:`1px solid ${B.border}`, borderRadius:18, padding:"40px 20px", textAlign:"center" }}>
                <div style={{ fontSize:42, marginBottom:14 }}>📂</div>
                <p style={{ color:B.muted, fontSize:14 }}>Nenhuma fatura analisada ainda.</p>
                <button onClick={() => router.push("/")} style={{ marginTop:16, padding:"11px 24px", background:B.orange, border:"none", borderRadius:12, color:"#fff", fontFamily:"'Domine',serif", fontWeight:800, fontSize:13, cursor:"pointer" }}>
                  Analisar primeira fatura
                </button>
              </div>
            ) : (
              invoices.map((inv, idx) => {
                const done = inv.completed_challenges?.length || 0;
                const total_chs = inv.challenges?.length || 0;
                const isOpen = selected === inv.id;
                return (
                  <div key={inv.id} style={{ background:B.card, border:`1px solid ${isOpen ? B.orange+"55" : B.border}`, borderRadius:18, marginBottom:12, overflow:"hidden", transition:"border .2s" }}>
                    <div onClick={() => setSelected(isOpen ? null : inv.id)} style={{ padding:"18px 20px", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div>
                        <div style={{ fontFamily:"'Domine',serif", fontWeight:800, fontSize:16, marginBottom:4 }}>{inv.month || "Fatura"}</div>
                        <div style={{ fontSize:12, color:B.muted }}>{done}/{total_chs} desafios completos · {new Date(inv.created_at).toLocaleDateString("pt-BR")}</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontFamily:"'Domine',serif", fontWeight:900, fontSize:17, color:B.orange }}>{brl(inv.total)}</div>
                        <div style={{ fontSize:12, color:B.muted, marginTop:2 }}>{isOpen ? "▲" : "▼"}</div>
                      </div>
                    </div>
                    {isOpen && (
                      <div style={{ padding:"0 20px 20px", borderTop:`1px solid ${B.border}` }}>
                        <div style={{ paddingTop:16, fontSize:13, color:B.muted, lineHeight:1.7 }}>
                          <strong style={{ color:B.offwhite }}>Principal vazamento:</strong> {inv.top_waste}
                        </div>
                        {inv.insights?.slice(0,2).map((ins, i) => (
                          <div key={i} style={{ display:"flex", gap:10, marginTop:10, padding:"10px 14px", background:"rgba(255,255,255,.04)", borderRadius:10 }}>
                            <span style={{ color:B.orange, fontWeight:800 }}>→</span>
                            <span style={{ fontSize:13, color:"rgba(247,245,240,.8)" }}>{ins}</span>
                          </div>
                        ))}
                        {inv.challenges?.map(ch => {
                          const isDone = inv.completed_challenges?.some(c => c.challenge_id === ch.id);
                          return (
                            <div key={ch.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", marginTop:8, background:isDone?`${B.orange}12`:"rgba(255,255,255,.03)", borderRadius:10, border:`1px solid ${isDone?B.orange+"33":B.border}` }}>
                              <span style={{ fontSize:13 }}>{ch.emoji} {ch.title}</span>
                              <span style={{ fontSize:11, fontWeight:800, color:isDone?B.orange:B.muted }}>{isDone?"✓ Feito":"+"+ch.points+" pts"}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </main>
      </div>
    </>
  );
}
