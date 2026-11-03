"use client";

import { FormEvent, useEffect, useState } from "react";

type User = { accountId: string; email: string; name: string };
type Tab = "Overview" | "Bots" | "Activity" | "Profile";
type Strategy = { id: string; name: string; market: string; type: string; allocation: string; risk: string; icon: string };

const strategies: Strategy[] = [
  { id: "momentum", name: "Momentum Pulse", market: "BTC / USD", type: "Trend following", allocation: "$5,000", risk: "Low", icon: "bi-activity" },
  { id: "range", name: "Range Finder", market: "ETH / USD", type: "Mean reversion", allocation: "$2,500", risk: "Moderate", icon: "bi-soundwave" },
];

const chartBars = [38, 48, 41, 58, 52, 69, 61, 77, 68, 84, 74, 94];
const activity = [
  { market: "BTC / USD", action: "Simulated buy", amount: "$125.00", time: "10:42 AM", icon: "bi-arrow-down-left", tone: "positive" },
  { market: "ETH / USD", action: "Simulated sell", amount: "$84.20", time: "10:18 AM", icon: "bi-arrow-up-right", tone: "neutral" },
  { market: "BTC / USD", action: "Simulated buy", amount: "$96.50", time: "09:56 AM", icon: "bi-arrow-down-left", tone: "positive" },
  { market: "SOL / USD", action: "Strategy scan", amount: "No order", time: "09:30 AM", icon: "bi-search", tone: "neutral" },
];

const tabs: { name: Tab; icon: string }[] = [
  { name: "Overview", icon: "bi-grid-1x2" },
  { name: "Bots", icon: "bi-cpu" },
  { name: "Activity", icon: "bi-clock-history" },
  { name: "Profile", icon: "bi-person-circle" },
];

export default function GSyncApp() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [tab, setTab] = useState<Tab>("Overview");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [botStates, setBotStates] = useState<Record<string, boolean>>({ momentum: true, range: false });
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then(async (response) => {
      if (response.ok) setUser(await response.json());
    }).catch(() => undefined).finally(() => setLoading(false));

    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    const handleInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };
    window.addEventListener("beforeinstallprompt", handleInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleInstall);
  }, []);

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`/api/auth/${registering ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          password: form.get("password"),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Something went wrong.");
      setUser(result);
      setTab("Overview");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to connect. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setTab("Overview");
  }

  async function installApp() {
    if (deferredPrompt) {
      (deferredPrompt as Event & { prompt: () => Promise<void> }).prompt();
      setDeferredPrompt(null);
    } else {
      setNotice("Open your browser menu and choose Add to Home Screen to install G-Sync.");
    }
  }

  function toggleBot(id: string) {
    setBotStates((current) => ({ ...current, [id]: !current[id] }));
  }

  const runningCount = Object.values(botStates).filter(Boolean).length;

  if (loading) return <main className="loading-screen"><span className="brand-mark">G</span></main>;

  if (!user) {
    return (
      <main className="auth-screen">
        <section className="auth-brand" aria-label="G-Sync">
          <div className="auth-logo">G-Sync<span>.</span></div>
          <p>ALGORITHMIC TRADING, IN SYNC</p>
        </section>
        <section className="auth-panel">
          <div className="panel-handle" />
          <h1>{registering ? "Create your account" : "Welcome back"}</h1>
          <p className="auth-subtitle">{registering ? "Your strategies, in one place." : "Your trading workspace is ready."}</p>
          <form onSubmit={submitAuth}>
            {registering && <label className="field-label">NAME<input className="form-control" name="name" placeholder="Alex Jameson" autoComplete="name" required /></label>}
            <label className="field-label">EMAIL<input className="form-control" name="email" type="email" placeholder="alex@email.com" autoComplete="email" required /></label>
            <label className="field-label">PASSWORD<input className="form-control" name="password" type="password" placeholder="At least 8 characters" autoComplete={registering ? "new-password" : "current-password"} minLength={8} required /></label>
            {notice && <p className="form-notice" role="alert">{notice}</p>}
            <button className="btn btn-market w-100" type="submit" disabled={busy}>{busy ? "Please wait..." : registering ? "Create Account" : "Sign In"}<i className="bi bi-arrow-right ms-2" /></button>
          </form>
          <p className="auth-switch">{registering ? "Already have an account?" : "New to G-Sync?"} <button type="button" onClick={() => { setRegistering(!registering); setNotice(""); }}>{registering ? "Sign in" : "Create account"}</button></p>
          <p className="auth-disclaimer">Trading involves risk. This preview uses simulated data only.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="market-shell">
      <header className="topbar">
        <div><p className="greeting">G-SYNC <span>·</span> PAPER MODE</p><h1>{tab === "Overview" ? `Hey, ${user.name.split(" ")[0]}` : tab}</h1></div>
        <button className="avatar-button" onClick={() => setTab("Profile")} aria-label="Open profile">{user.name.slice(0, 1).toUpperCase()}</button>
      </header>

      {tab === "Overview" && <>
        <section className="portfolio-panel">
          <div className="portfolio-head"><span>DEMO PORTFOLIO</span><button aria-label="Portfolio information" title="Simulated portfolio values"><i className="bi bi-info-circle" /></button></div>
          <div className="portfolio-value">$24,860<span>.50</span></div>
          <div className="portfolio-performance"><span className="change-pill"><i className="bi bi-arrow-up-right" /> 2.4%</span><span>+$584.20 today</span></div>
          <div className="chart-area" role="img" aria-label="Simulated portfolio trend over twelve periods">{chartBars.map((height, index) => <span key={index} style={{ height: `${height}%` }} className={index === chartBars.length - 1 ? "chart-bar current" : "chart-bar"} />)}</div>
          <div className="chart-labels"><span>9:00</span><span>11:00</span><span>1:00</span><span>3:00</span></div>
        </section>

        <section className="metric-row" aria-label="Demo portfolio metrics"><div><span>ACTIVE BOTS</span><strong>{runningCount}<small> / 2</small></strong></div><div><span>WIN RATE</span><strong>68<small>%</small></strong></div><div><span>RISK LEVEL</span><strong className="risk-low">Low</strong></div></section>

        <div className="section-heading"><h2>Your strategies</h2><button onClick={() => setTab("Bots")}>Manage <i className="bi bi-arrow-right" /></button></div>
        <section className="strategy-preview">
          <div className="strategy-icon"><i className="bi bi-activity" /></div>
          <div className="strategy-copy"><strong>Momentum Pulse</strong><span>BTC / USD · Trend following</span></div>
          <span className={`status-dot ${botStates.momentum ? "is-running" : ""}`} aria-label={botStates.momentum ? "Running in paper mode" : "Paused"} />
        </section>
        <div className="simulation-note"><i className="bi bi-shield-check" /><span>Paper trading only. No real orders or exchange connections.</span></div>
      </>}

      {tab === "Bots" && <section className="bots-view">
        <div className="view-intro"><span className="mode-tag"><i className="bi bi-circle-fill" /> PAPER TRADING</span><p>Manage your automated strategies. Controls here only change the local demo state.</p></div>
        {strategies.map((strategy) => <article className="bot-card" key={strategy.id}>
          <div className="bot-card-head"><div className="strategy-icon"><i className={`bi ${strategy.icon}`} /></div><div className="strategy-copy"><strong>{strategy.name}</strong><span>{strategy.market} · {strategy.type}</span></div><span className={`bot-state ${botStates[strategy.id] ? "running" : "paused"}`}>{botStates[strategy.id] ? "Running" : "Paused"}</span></div>
          <div className="bot-stats"><div><span>ALLOCATION</span><strong>{strategy.allocation}</strong></div><div><span>RISK</span><strong>{strategy.risk}</strong></div><div><span>MODE</span><strong>Simulated</strong></div></div>
          <button className={`bot-toggle ${botStates[strategy.id] ? "stop" : "start"}`} onClick={() => toggleBot(strategy.id)} aria-pressed={botStates[strategy.id]}><i className={`bi ${botStates[strategy.id] ? "bi-pause-fill" : "bi-play-fill"}`} />{botStates[strategy.id] ? "Pause demo bot" : "Start demo bot"}</button>
        </article>)}
        <div className="simulation-note"><i className="bi bi-shield-check" /><span>Demo controls only. Connecting an exchange and executing real trades is not configured.</span></div>
      </section>}

      {tab === "Activity" && <section className="activity-view">
        <div className="view-intro"><span className="mode-tag"><i className="bi bi-circle-fill" /> SIMULATED ACTIVITY</span><p>Example strategy events. These are not real transactions.</p></div>
        <div className="activity-list">{activity.map((item) => <article className="activity-row" key={`${item.market}-${item.time}`}><span className={`activity-icon ${item.tone}`}><i className={`bi ${item.icon}`} /></span><div className="activity-copy"><strong>{item.action}</strong><span>{item.market} · {item.time}</span></div><strong className="activity-amount">{item.amount}</strong></article>)}</div>
      </section>}

      {tab === "Profile" && <section className="account-view"><div className="profile-avatar">{user.name.slice(0, 1).toUpperCase()}</div><h2>{user.name}</h2><p>{user.email}</p><div className="account-id"><span>YOUR G-SYNC ACCOUNT ID</span><strong>{user.accountId}</strong></div><button className="profile-action" onClick={installApp}><i className="bi bi-phone" /> Install G-Sync <i className="bi bi-chevron-right" /></button><button className="profile-action signout-action" onClick={signOut}><i className="bi bi-box-arrow-right" /> Sign out <i className="bi bi-chevron-right" /></button>{notice && <p className="profile-notice" role="status">{notice}</p>}<p className="profile-disclaimer">Trading involves risk. Demo values are illustrative and do not represent actual performance.</p></section>}

      <nav className="bottom-nav" aria-label="Main navigation">{tabs.map((item) => <button key={item.name} className={tab === item.name ? "selected" : ""} onClick={() => setTab(item.name)}><i className={`bi ${item.icon}`} /><span>{item.name}</span></button>)}</nav>
    </main>
  );
}