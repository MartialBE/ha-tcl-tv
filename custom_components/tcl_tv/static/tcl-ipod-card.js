/* Original UI; no external fonts, icon packs, analytics or network requests. */
const CARD_STYLE = `
  :host { display:block; --ink:#24232f; --muted:#6b6a78; --accent:#7f6fc6; --glass:rgba(255,255,255,.32); --line:rgba(255,255,255,.72);
    color:var(--ink); font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",sans-serif; }
  * { box-sizing:border-box; }
  button,input { font:inherit; }
  button { -webkit-tap-highlight-color:transparent; cursor:pointer; }
  button:disabled { cursor:default; opacity:.4; }
  button:focus-visible,input:focus-visible,.wheel:focus-visible { outline:2px solid var(--accent); outline-offset:3px; }
  svg { width:18px; height:18px; flex:none; }
  [data-repeat] { -webkit-touch-callout:none; user-select:none; -webkit-user-select:none; }

  /* Shell: phone is a single column; [wide] splits into deck + pad; [wide][tall] stacks them. */
  .shell { position:relative; isolation:isolate; overflow:clip; width:min(100%,440px); margin:0 auto; padding:16px 16px 14px; border-radius:32px; border:1px solid var(--line);
    display:flex; flex-direction:column; gap:12px;
    background:linear-gradient(140deg,rgba(255,255,255,.64),rgba(245,245,252,.32));
    backdrop-filter:blur(42px) saturate(1.3); -webkit-backdrop-filter:blur(42px) saturate(1.3);
    box-shadow:inset 0 1px 1px #fff,0 16px 44px rgba(49,43,70,.09),inset 0 -1px 1px rgba(255,255,255,.7); }
  .shell:before { content:""; position:absolute; z-index:-1; inset:0; pointer-events:none;
    background:radial-gradient(ellipse at 100% 0%,rgba(206,194,232,.5),transparent 55%),radial-gradient(ellipse at 0% 70%,rgba(183,216,211,.45),transparent 55%),radial-gradient(ellipse at 95% 100%,rgba(235,222,213,.35),transparent 45%); }
  .shell:after { content:""; position:absolute; inset:1px; border-radius:31px; border:1px solid rgba(255,255,255,.25); pointer-events:none; }
  .deck,.pad { display:flex; flex-direction:column; min-width:0; min-height:0; }
  .deck { gap:12px; }
  .pad { gap:14px; }

  /* Panel view: fill the viewport under the HA header instead of making the page scroll. */
  :host([fill]) { box-sizing:border-box; height:calc(100vh - var(--header-height,56px)); height:calc(100dvh - var(--header-height,56px) - var(--safe-area-inset-top,0px) - var(--safe-area-inset-bottom,0px));
    min-height:460px; padding:10px max(10px,env(safe-area-inset-right)) 10px max(10px,env(safe-area-inset-left)); }
  :host([fill]) .shell { height:100%; }
  :host([fill]) .pad { flex:1 1 0; }
  :host([fill]) .wheel-area { flex:1 1 0; container-type:size; }

  .topbar { display:flex; align-items:center; gap:10px; min-height:42px; }
  .status { display:flex; align-items:center; gap:6px; min-width:0; flex:none; max-width:45%; font-size:11px; color:var(--muted); }
  .status b { overflow:hidden; white-space:nowrap; text-overflow:ellipsis; color:var(--ink); font-size:13px; font-weight:600; }
  .status span { white-space:nowrap; }
  .led { width:6px; height:6px; flex:none; border-radius:50%; background:#95929c; }
  .led.on { background:#399273; box-shadow:0 0 0 3px rgba(74,153,120,.12); }
  .tabs { position:relative; flex:1; display:grid; grid-template-columns:1fr 1fr; padding:4px; border:1px solid rgba(255,255,255,.65); border-radius:16px;
    background:rgba(255,255,255,.2); box-shadow:inset 0 1px 3px rgba(111,103,128,.08); }
  .thumb { position:absolute; top:4px; bottom:4px; left:4px; width:calc(50% - 4px); border:1px solid var(--line); border-radius:12px; background:rgba(255,255,255,.66);
    box-shadow:0 3px 9px rgba(88,78,107,.1),inset 0 1px 1px white; transition:transform .32s cubic-bezier(.3,.8,.2,1); }
  .tabs[data-screen=apps] .thumb { transform:translateX(100%); }
  .tab { position:relative; display:flex; align-items:center; justify-content:center; gap:6px; height:34px; border:0; border-radius:12px; color:var(--muted); background:transparent; font-size:12px; font-weight:600; transition:color .2s; }
  .tab[aria-pressed=true] { color:var(--ink); }

  .panes { position:relative; height:184px; }
  .pane { height:100%; display:flex; flex-direction:column; min-height:0; }
  :host(:not([wide])) .pane:not(.active) { display:none; }
  :host(:not([wide])) .pane.active { animation:pane-in .26s cubic-bezier(.3,.8,.2,1); }
  @keyframes pane-in { from { opacity:0; transform:translateY(6px); } }
  .pane-title { display:none; align-items:baseline; justify-content:space-between; margin:0 2px 10px; font-size:13px; font-weight:600; letter-spacing:-.2px; }
  .pane-title small { color:var(--muted); font-size:11px; font-weight:500; }

  .keys { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; }
  .key { height:72px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:7px; border:1px solid var(--line); border-radius:18px; color:var(--ink); background:var(--glass);
    box-shadow:inset 0 1px 1px rgba(255,255,255,.7); font-size:11px; transition:transform .12s; }
  .key:active:not(:disabled),.app:active:not(:disabled),.transport button:active:not(:disabled),.vol button:active:not(:disabled) { transform:scale(.95); }
  .key.power svg { color:#b4545e; }
  .vol { display:grid; grid-template-columns:auto minmax(0,1fr) auto; grid-template-areas:"label label value" "minus slider plus"; align-items:center; gap:6px 10px; margin-top:14px; }
  .vol-label { grid-area:label; color:var(--muted); font-size:11px; margin-left:2px; }
  .volume-value { grid-area:value; justify-self:end; font-size:20px; font-weight:600; letter-spacing:-.6px; line-height:1; font-variant-numeric:tabular-nums; }
  .volume-value small { font-size:11px; font-weight:500; color:var(--muted); margin-left:2px; }
  .vol button { display:grid; place-items:center; width:42px; height:38px; border-radius:13px; border:1px solid var(--line); background:var(--glass); color:var(--ink); transition:transform .12s; }
  .vol [data-volume="-1"] { grid-area:minus; } .vol [data-volume="1"] { grid-area:plus; }
  input[type=range] { grid-area:slider; display:block; width:100%; margin:0; accent-color:var(--accent); height:26px; cursor:pointer; }

  .app-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:7px; }
  .app { min-width:0; height:68px; padding:7px 3px 5px; border-radius:18px; border:1px solid rgba(255,255,255,.5); color:var(--ink); background:var(--glass);
    backdrop-filter:blur(20px) saturate(1.25); -webkit-backdrop-filter:blur(20px) saturate(1.25);
    box-shadow:inset 0 1px 1px rgba(255,255,255,.85),0 3px 7px rgba(65,67,91,.04); transition:background .15s,box-shadow .15s,transform .12s; }
  .app-icon { display:grid; place-items:center; width:32px; height:32px; margin:0 auto 5px; border-radius:10px; background:var(--icon-bg); color:var(--icon-fg); font-size:13px; font-weight:700; letter-spacing:-.4px; box-shadow:inset 0 1px 1px rgba(255,255,255,.8); }
  .app-label { display:block; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; font-size:10px; font-weight:550; line-height:15px; }
  .pager { height:32px; margin-top:auto; display:flex; align-items:center; justify-content:space-between; gap:5px; }
  .pager button { display:grid; place-items:center; width:36px; height:30px; color:var(--ink); border:0; border-radius:12px; background:transparent; }
  .dots { display:flex; gap:6px; align-items:center; }
  .dot { width:4px; height:4px; border-radius:50%; background:rgba(114,104,137,.22); transition:width .25s; }
  .dot.active { width:13px; border-radius:5px; background:#8a80a0; }
  .empty { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; color:var(--muted); text-align:center; font-size:12px; line-height:1.7; }
  .empty svg { width:28px; height:28px; opacity:.65; }
  .feedback { min-height:15px; margin:-4px 0 0; color:var(--muted); font-size:10px; line-height:15px; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; text-align:center; }
  .feedback.error { color:#9d343e; }

  .wheel-area { display:grid; place-items:center; min-height:0; }
  .wheel { position:relative; width:min(100%,268px); aspect-ratio:1; border-radius:50%; border:1px solid var(--line); touch-action:none; user-select:none; -webkit-user-select:none; transition:opacity .3s;
    background:linear-gradient(150deg,rgba(255,255,255,.45),rgba(255,255,255,.09) 48%,rgba(255,255,255,.28));
    backdrop-filter:blur(20px) saturate(1.2); -webkit-backdrop-filter:blur(20px) saturate(1.2);
    box-shadow:inset 0 2px 2px rgba(255,255,255,.9),inset 0 -2px 5px rgba(255,255,255,.4),0 14px 30px rgba(61,61,86,.08); }
  :host([fill]) .wheel { width:min(100cqw,100cqh,440px); }
  .wheel:before { content:""; position:absolute; inset:5px; border-radius:50%; border:1px solid rgba(255,255,255,.35); pointer-events:none; }
  .shell.offline .wheel { opacity:.55; }
  /* A lit arc follows each direction press and each rotation step. */
  .glow { position:absolute; inset:-1px; border-radius:50%; pointer-events:none; opacity:0;
    background:conic-gradient(from calc(var(--at,0deg) - 38deg),transparent,rgba(127,111,198,.55) 38deg,transparent 76deg);
    -webkit-mask:radial-gradient(circle,transparent 61%,#000 63%,#000 70%,transparent 72%); mask:radial-gradient(circle,transparent 61%,#000 63%,#000 70%,transparent 72%); }
  .glow.on { animation:glow .55s ease-out; }
  @keyframes glow { 0% { opacity:1; } 100% { opacity:0; } }
  .wheel-center { position:absolute; left:50%; top:50%; width:35%; aspect-ratio:1; transform:translate(-50%,-50%); display:grid; place-items:center; border-radius:50%; border:1px solid var(--line); color:var(--ink);
    background:linear-gradient(135deg,rgba(255,255,255,.75),rgba(255,255,255,.18));
    backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px); transition:transform .12s;
    box-shadow:inset 0 1px 2px #fff,0 6px 14px rgba(80,69,103,.13); }
  .wheel-center svg { width:30%; height:auto; max-width:34px; }
  .wheel-center:active { transform:translate(-50%,-50%) scale(.95); }
  .wheel-center.on { animation:press .4s ease-out; }
  @keyframes press { 0% { box-shadow:inset 0 1px 2px #fff,0 0 0 0 rgba(127,111,198,.45); } 100% { box-shadow:inset 0 1px 2px #fff,0 0 0 18px rgba(127,111,198,0); } }
  .wheel-key { position:absolute; display:grid; place-items:center; border:0; color:var(--muted); background:transparent; }
  .wheel-key svg { width:38%; height:auto; max-width:30px; }
  .wheel-key:active { color:var(--ink); transform:scale(.91); }
  .wheel-up { top:4%; left:38%; width:24%; height:21%; }
  .wheel-down { bottom:4%; left:38%; width:24%; height:21%; }
  .wheel-left { left:4%; top:38%; width:21%; height:24%; }
  .wheel-right { right:4%; top:38%; width:21%; height:24%; }
  .transport { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:8px; }
  .transport button { display:flex; align-items:center; justify-content:center; min-height:46px; border:1px solid var(--line); border-radius:18px; color:var(--ink); background:var(--glass);
    box-shadow:inset 0 1px 1px #fff9,0 3px 10px #30304408; transition:transform .12s; }

  /* Tablet / desktop: deck (controls + every app) beside or above a large wheel. */
  :host([wide]) .shell { width:100%; max-width:1240px; display:grid; grid-template-columns:minmax(0,1.1fr) minmax(0,1fr); grid-template-areas:"deck pad"; gap:20px 36px; padding:26px 30px; }
  :host([wide][tall]) .shell { grid-template-columns:minmax(0,1fr); grid-template-rows:minmax(0,auto) minmax(380px,1fr); grid-template-areas:"deck" "pad"; }
  :host([wide]) .deck { grid-area:deck; gap:18px; }
  :host([wide]) .pad { grid-area:pad; justify-content:center; }
  :host([wide][fill]) .pad { flex:none; }
  :host([wide]) .tabs { display:none; }
  :host([wide]) .topbar { min-height:20px; }
  :host([wide]) .status { max-width:100%; }
  :host([wide]) .panes { height:auto; flex:1; min-height:0; display:flex; flex-direction:column; gap:18px; }
  :host([wide]) .pane { height:auto; }
  :host([wide]) .pane-title { display:flex; }
  :host([wide]) .pane-apps { flex:1; min-height:0; }
  :host([wide]) .app-grid { grid-template-columns:repeat(auto-fill,minmax(92px,1fr)); gap:10px; overflow-y:auto; min-height:0; padding:2px 2px 6px; margin:-2px; scrollbar-width:thin; }
  :host([wide]) .app { height:92px; border-radius:22px; }
  :host([wide]) .app-icon { width:42px; height:42px; border-radius:13px; font-size:16px; margin-bottom:7px; }
  :host([wide]) .app-label { font-size:11px; }
  :host([wide]) .key { height:82px; font-size:12px; }
  :host([wide]) .volume-value { font-size:24px; }
  :host([wide]) .wheel { width:min(100%,360px); }
  :host([wide][fill]) .wheel { width:min(100cqw,100cqh,480px); }
  :host([wide]) .transport { width:min(100%,480px); margin:0 auto; }
  :host([wide][tall]) .transport { width:min(100%,560px); }

  :host([dark]) { --ink:#f2f0f7; --muted:#bbb6c6; --accent:#a99be6; --glass:rgba(255,255,255,.065); --line:rgba(255,255,255,.24); }
  :host([dark]) .shell { background:linear-gradient(145deg,rgba(71,68,81,.74),rgba(36,40,48,.63)); box-shadow:inset 0 1px 1px #fff5,0 16px 40px #15132022; }
  :host([dark]) .shell:before { background:radial-gradient(ellipse at 100% 0%,#81749133,transparent 55%),radial-gradient(ellipse at 0% 70%,#6f989833,transparent 60%); }
  :host([dark]) .shell:after { border-color:#ffffff09; }
  :host([dark]) .thumb { background:rgba(255,255,255,.13); box-shadow:0 3px 9px #2222,inset 0 1px 1px #fff3; }
  :host([dark]) .app { border-color:#fff2; box-shadow:inset 0 1px 1px #fff2,0 3px 7px #0001; }
  :host([dark]) .tabs { border-color:#fff2; background:#ffffff08; }
  :host([dark]) .dot { background:#a99ebb55; } :host([dark]) .dot.active { background:#c1b3d6; }
  :host([dark]) .feedback.error { color:#ffb5bd; }
  :host([dark]) .key.power svg { color:#ff9aa5; }
  :host([dark]) .wheel { background:linear-gradient(145deg,#ffffff19,#ffffff04 50%,#ffffff12); box-shadow:inset 0 1px 2px #fff5,0 10px 30px #1518271a; }
  :host([dark]) .wheel:before { border-color:#ffffff12; }
  :host([dark]) .glow { background:conic-gradient(from calc(var(--at,0deg) - 38deg),transparent,rgba(190,176,255,.6) 38deg,transparent 76deg); }
  :host([dark]) .wheel-center { background:linear-gradient(145deg,#ffffff26,#ffffff08); box-shadow:inset 0 1px 1px #fff5,0 5px 20px #18212f22; }
  :host([dark]) .transport button,:host([dark]) .key { box-shadow:inset 0 1px 1px #fff2; }
  @media(max-width:360px) { .shell { padding:14px 12px 12px; border-radius:28px; } .key { height:66px; } }
  @media(prefers-reduced-motion:reduce) { .app,.thumb,.dot { transition:none; } .pane.active,.glow.on,.wheel-center.on { animation:none !important; } }
`;

const ICON_PATHS = {
  apps: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  remote: '<rect x="7" y="2" width="10" height="20" rx="4"/><circle cx="12" cy="9" r="2"/><path d="M10 16h4"/>',
  mute: '<path d="M11 4 5 9H2v6h3l6 5zM16 9l6 6m0-6-6 6"/>',
  home: '<path d="m3 10 9-7 9 7v10H3zM9 20v-7h6v7"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  back: '<path d="m9 5-7 7 7 7M2 12h12a6 6 0 0 1 6 6"/>',
  power: '<path d="M12 2v10M6 5a9 9 0 1 0 12 0"/>',
  source: '<rect x="2" y="3" width="20" height="14" rx="3"/><path d="M8 21h8M12 17v4m-3-11 4 4-4 4M4 10h9"/>',
  left: '<path d="m15 5-7 7 7 7"/>',
  right: '<path d="m9 5 7 7-7 7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  up: '<path d="m5 15 7-7 7 7"/>',
  down: '<path d="m5 9 7 7 7-7"/>',
  check: '<path d="m6 12 4 4 8-8"/>',
  playback: '<path d="m4 4 10 8L4 20zM18 5v14M22 5v14"/>',
};
const icon = (name) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name] || ICON_PATHS.apps}</svg>`;
const esc = (text) => String(text ?? "").replace(/[&<>"']/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
const PALETTE = [["#ece4f8","#7e639a"],["#deeee8","#507e71"],["#f6e3df","#a3635c"],["#e0e7f7","#5b73a2"],["#f1e8d6","#927643"],["#e4e5ef","#6d6b88"]];
const PAGES = [["remote","遥控"],["apps","应用"]];
const PAGE_SIZE = 6;
// Card width from which the deck and the wheel sit side by side and every app is shown.
const WIDE = 640;
// Glow angle per direction key; conic-gradient 0deg points up.
const DIR_ANGLE = {up:0, right:90, down:180, left:270};
// Long-press cadence copies TCL's own phone remote (docs/protocol.md): the TV
// has no key-down/up message, a held key is just the same key resent.
const HOLD = {pad:{delay:300,every:300}, volume:{delay:300,every:200}};

class TclIpodCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode:"open"});
    this._screen = "remote";
    this._appPage = 0;
    this._busy = false;
    this._dial = null;
    this._signature = "";
    this._feedback = "";
    this._wide = false;
    this.shadowRoot.addEventListener("click", (event) => this._click(event));
    this.shadowRoot.addEventListener("keydown", (event) => this._key(event));
    this.shadowRoot.addEventListener("pointerdown", (event) => {
      const button = event.target.closest("button[data-repeat]");
      if (button && !button.disabled && event.isPrimary && event.button === 0) this._startHold(button, event.pointerId);
    });
    this.shadowRoot.addEventListener("contextmenu", (event) => {
      if (event.target.closest("[data-repeat]")) event.preventDefault();
    });
    this.shadowRoot.addEventListener("input", (event) => {
      if (event.target.matches('input[type="range"]')) {
        this.shadowRoot.querySelector(".volume-value").innerHTML = `${Number(event.target.value)}<small>%</small>`;
        this._adjusting = true;
      }
    });
    this.shadowRoot.addEventListener("change", (event) => {
      if (!event.target.matches('input[type="range"]')) return;
      this._adjusting = false;
      this._call("media_player", "volume_set", {volume_level:Number(event.target.value)/100});
    });
  }

  setConfig(config) {
    if (!config?.media_player?.startsWith("media_player.") || !config?.remote?.startsWith("remote.")) {
      throw new Error("Set media_player and remote to their respective entity IDs");
    }
    this._config = config;
    this._render(true);
  }

  set hass(hass) { this._hass = hass; this._render(); }
  // HA sets layout="panel" (older releases: isPanel) in a panel view; the card then fills the viewport.
  set layout(value) { this._layout = value; this.toggleAttribute("fill", value === "panel"); }
  get layout() { return this._layout; }
  set isPanel(value) { this._isPanel = value; if (value) this.toggleAttribute("fill", true); }
  get isPanel() { return this._isPanel; }
  disconnectedCallback() { this._stopHold(); }
  getCardSize() { return 12; }
  getGridOptions() { return {columns:12, rows:"auto", min_columns:12}; }
  _player() { return this._hass?.states[this._config?.media_player]; }
  _remote() { return this._hass?.states[this._config?.remote]; }
  _apps() { return this._player()?.attributes.source_list ?? []; }
  _online() { return this._player()?.state === "on" && this._remote()?.state === "on"; }

  _mount() {
    if (this.shadowRoot.querySelector(".shell")) return;
    this.shadowRoot.innerHTML = `<style>${CARD_STYLE}</style><div class="shell" role="group" aria-label="电视遥控器">
      <div class="deck">
        <div class="topbar"><nav class="tabs" aria-label="遥控器页面"><i class="thumb"></i>${PAGES.map(([key,label]) => `<button class="tab" data-tab="${key}">${icon(key)}${label}</button>`).join("")}</nav><span class="status"></span></div>
        <div class="panes"><section class="pane pane-remote"></section><section class="pane pane-apps"></section></div>
        <p class="feedback" role="status"></p>
      </div>
      <div class="pad">
        <div class="wheel-area"><div class="wheel" tabindex="0" role="group" aria-label="电视方向与确认" title="方向键可按住连发，绕圈发送上下">
          <i class="glow"></i>
          <button class="wheel-key wheel-up" data-action="up" data-repeat="pad" aria-label="上">${icon("up")}</button>
          <button class="wheel-key wheel-left" data-action="left" data-repeat="pad" aria-label="左">${icon("left")}</button>
          <button class="wheel-key wheel-right" data-action="right" data-repeat="pad" aria-label="右">${icon("right")}</button>
          <button class="wheel-key wheel-down" data-action="down" data-repeat="pad" aria-label="下">${icon("down")}</button>
          <button class="wheel-center" data-action="ok" aria-label="电视确认">${icon("check")}</button>
        </div></div>
        <div class="transport"><button data-key="back" aria-label="电视返回" title="返回">${icon("back")}</button><button data-key="home" aria-label="电视主页" title="主页">${icon("home")}</button><button data-key="playback" aria-label="电视播放暂停" title="播放 / 暂停">${icon("playback")}</button><button data-key="menu" aria-label="电视菜单" title="菜单">${icon("menu")}</button></div>
      </div>
    </div>`;
    // The host carries the available width (the narrow shell is capped), and in a panel view the height.
    new ResizeObserver(([entry]) => {
      const {width, height} = entry.contentRect;
      const wide = width >= WIDE;
      this.toggleAttribute("tall", wide && this.hasAttribute("fill") && height > width*1.15);
      if (wide === this._wide) return;
      this._wide = wide;
      this.toggleAttribute("wide", wide);
      this._render(true);
    }).observe(this);
    const wheel = this.shadowRoot.querySelector(".wheel");
    wheel.addEventListener("pointerdown", (event) => {
      if (!event.isPrimary || event.button !== 0 || event.target.closest(".wheel-center")) return;
      const r = wheel.getBoundingClientRect();
      const cx = r.left + r.width/2, cy = r.top + r.height/2;
      this._dial = {id:event.pointerId, angle:Math.atan2(event.clientY-cy,event.clientX-cx), carry:0, moved:false};
      // Preserve the button target for a tap; capture only after a rotation begins.
    });
    wheel.addEventListener("pointermove", (event) => {
      if (event.pointerId !== this._dial?.id) return;
      const r = wheel.getBoundingClientRect();
      const angle = Math.atan2(event.clientY-r.top-r.height/2,event.clientX-r.left-r.width/2);
      let delta = angle-this._dial.angle;
      if (delta > Math.PI) delta -= 2*Math.PI;
      if (delta < -Math.PI) delta += 2*Math.PI;
      this._dial.angle = angle;
      this._dial.carry += delta;
      if (Math.abs(this._dial.carry) < .3) return;
      const step = Math.sign(this._dial.carry);
      this._dial.carry -= step*.3;
      this._dial.moved = true;
      if (!wheel.hasPointerCapture(event.pointerId)) wheel.setPointerCapture(event.pointerId);
      this._stopHold();
      this._rotate(step, angle*180/Math.PI+90);
    });
    const stop = (event) => {
      if (event.pointerId !== this._dial?.id) return;
      if (this._dial.moved) this._suppressClick = performance.now()+350;
      this._dial = null;
      if (wheel.hasPointerCapture(event.pointerId)) wheel.releasePointerCapture(event.pointerId);
    };
    wheel.addEventListener("pointerup",stop);
    wheel.addEventListener("pointercancel",stop);
    // Touch implicitly captures the key under the finger; handing capture to the wheel
    // fires that key's lostpointercapture, which bubbles here and must not end the drag.
    wheel.addEventListener("lostpointercapture",(event) => { if (event.target === wheel) stop(event); });
    wheel.addEventListener("wheel",(event) => {
      event.preventDefault();
      if (performance.now()-(this._wheelAt ?? 0)<100 || !event.deltaY) return;
      this._wheelAt = performance.now();
      this._rotate(Math.sign(event.deltaY));
    },{passive:false});
  }

  _render(force = false) {
    if (!this._config || !this._hass) return;
    this._mount();
    const player = this._player(), remote = this._remote();
    const dark = this._hass.themes?.darkMode ?? window.matchMedia("(prefers-color-scheme: dark)").matches;
    this.toggleAttribute("dark",dark);
    const signature = JSON.stringify([player?.state,remote?.state,player?.attributes.volume_level,this._apps(),dark]);
    if (!force && (signature === this._signature || this._adjusting)) return;
    this._signature = signature;
    const root = this.shadowRoot, online = this._online();
    const focus = root.activeElement;
    const focusKey = focus?.dataset.app !== undefined ? `[data-app="${focus.dataset.app}"]` : null;
    const state = !player || !remote ? "实体未配置" : online ? "已连接" : player.state === "off" ? "离线" : "连接中";
    root.querySelector(".shell").classList.toggle("offline", !online);
    root.querySelector(".status").innerHTML = `${this._config.name ? `<b>${esc(this._config.name)}</b>` : ""}<i class="led ${online?"on":""}"></i><span>${state}</span>`;
    root.querySelector(".tabs").dataset.screen = this._screen;
    root.querySelectorAll(".tab").forEach((tab) => tab.setAttribute("aria-pressed", String(tab.dataset.tab === this._screen)));
    root.querySelectorAll(".pane").forEach((pane) => pane.classList.toggle("active", pane.classList.contains(`pane-${this._screen}`)));
    const disabled = online ? "" : "disabled";
    const volume = player?.attributes.volume_level;
    const pct = online && typeof volume==="number" ? Math.round(volume*100) : null;
    root.querySelector(".pane-remote").innerHTML = `<div class="keys"><button class="key power" data-action="power">${icon("power")}${player?.state==="on"?"关机":"唤醒"}</button><button class="key" data-key="mute" ${disabled}>${icon("mute")}静音</button><button class="key" data-key="source" ${disabled}>${icon("source")}信号源</button></div>
      <div class="vol"><span class="vol-label">音量</span><span class="volume-value">${pct ?? "—"}<small>%</small></span>
        <button data-volume="-1" data-repeat="volume" aria-label="降低音量" ${disabled}>${icon("minus")}</button>
        <input type="range" min="0" max="100" value="${pct ?? 0}" aria-label="电视音量" ${pct===null?"disabled":""}>
        <button data-volume="1" data-repeat="volume" aria-label="提高音量" ${disabled}>${icon("plus")}</button></div>`;
    root.querySelector(".pane-apps").innerHTML = this._appsPane(disabled);
    root.querySelectorAll(".transport [data-key]").forEach((button)=>{button.disabled=!online;});
    this._showFeedback();
    if (focusKey) root.querySelector(focusKey)?.focus({preventScroll:true});
  }

  _appsPane(disabled) {
    const apps = this._apps();
    let start = 0, shown = apps, pager = "";
    if (!this._wide) {
      const pages = Math.ceil(apps.length/PAGE_SIZE);
      this._appPage = Math.max(0,Math.min(this._appPage,pages-1));
      const page = this._appPage;
      start = page*PAGE_SIZE;
      shown = apps.slice(start,start+PAGE_SIZE);
      pager = `<div class="pager"><button data-page="-1" aria-label="上一页应用" ${page===0?"disabled":""}>${icon("left")}</button><span class="dots" aria-label="第 ${page+1} 页，共 ${pages} 页">${Array.from({length:pages},(_,i)=>`<i class="dot ${i===page?"active":""}"></i>`).join("")}</span><button data-page="1" aria-label="下一页应用" ${page+1>=pages?"disabled":""}>${icon("right")}</button></div>`;
    }
    const title = `<h2 class="pane-title">应用<small>${apps.length} 个</small></h2>`;
    if (!apps.length) return `${title}<div class="empty">${icon("apps")}<span>${this._online()?"正在读取应用列表":"电视连接后，应用会出现在这里"}</span></div>`;
    const tiles = shown.map((name,i) => {
      const index = start+i, [bg,fg] = PALETTE[index%PALETTE.length];
      const monogram = /^[a-z]/i.test(name) ? name.slice(0,2).toUpperCase() : Array.from(name)[0];
      return `<button class="app" data-app="${index}" data-source="${esc(name)}" aria-label="打开 ${esc(name)}" title="${esc(name)}" ${disabled}>
        <span class="app-icon" style="--icon-bg:${bg};--icon-fg:${fg}">${esc(monogram)}</span><span class="app-label">${esc(name)}</span></button>`;
    }).join("");
    return `${title}<div class="app-grid">${tiles}</div>${pager}`;
  }

  _navigate(page) {
    this._screen = page;
    this._feedback = "";
    this._error = false;
    this._render(true);
  }

  _click(event) {
    const button = event.target.closest("button");
    if (!button || button.disabled) return;
    // The click synthesized by releasing a drag or a held key was already handled.
    if ((button.closest(".wheel") || button.dataset.repeat) && performance.now() < (this._suppressClick ?? 0)) return;
    const data = button.dataset;
    if (data.tab) { this._haptic(); return this._navigate(data.tab); }
    // Only explicit app tiles launch apps. The TV pad never selects an app.
    if (data.app !== undefined) return this._launchApp(data.source);
    if (data.page) {
      const lastPage = Math.max(0,Math.ceil(this._apps().length/PAGE_SIZE)-1);
      this._appPage = Math.max(0,Math.min(lastPage,this._appPage+Number(data.page)));
      this._haptic();
      return this._render(true);
    }
    if (data.volume) return this._volume(Number(data.volume));
    if (data.key) return this._sendKey(data.key);
    if (data.action === "power") {
      if (!this._player() || !this._remote()) return this._message("请检查卡片的实体配置",true);
      return this._call("media_player",this._player().state==="on"?"turn_off":"turn_on",{},this._player().state==="on"?"已发送关机按键":"已发送唤醒包，等待电视连接");
    }
    if (data.action) this._sendKey(data.action);
  }

  _rotate(step, angle = DIR_ANGLE[step>0?"down":"up"]) {
    this._sendKey(step>0?"down":"up", angle);
  }

  _key(event) {
    if (event.target.matches("input")) return;
    if (event.key==="Escape") { event.preventDefault(); this._navigate("remote"); return; }
    if (!event.target.closest(".wheel")) return;
    const key = ({ArrowUp:"up",ArrowDown:"down",ArrowLeft:"left",ArrowRight:"right",Enter:"ok"})[event.key];
    if (!key) return;
    // Let native Enter activate a focused button once, never also send OK.
    if (event.key==="Enter" && event.target.closest("button")) return;
    event.preventDefault();
    this._sendKey(key);
  }

  // Holding a key resends it on TCL's cadence until release; a short tap stays a plain click.
  _startHold(button, pointerId) {
    this._stopHold();
    const kind = button.dataset.repeat, cadence = HOLD[kind];
    const step = Number(button.dataset.volume), key = button.dataset.action;
    const hold = {fired:false, timer:0};
    const tick = async () => {
      if (this._hold !== hold) return;
      // Offline: stop quietly; the release click reports the error once.
      if (!this._online()) return this._stopHold();
      hold.fired = true;
      const started = performance.now();
      await (kind === "volume" ? this._volume(step) : this._sendKey(key));
      if (this._hold === hold) hold.timer = setTimeout(tick, Math.max(0, cadence.every-(performance.now()-started)));
    };
    hold.release = (event) => { if (event.type === "blur" || event.pointerId === pointerId) this._stopHold(true); };
    for (const type of ["pointerup","pointercancel","blur"]) window.addEventListener(type, hold.release, true);
    hold.timer = setTimeout(tick, cadence.delay);
    this._hold = hold;
  }

  _stopHold(released = false) {
    const hold = this._hold;
    if (!hold) return;
    this._hold = null;
    clearTimeout(hold.timer);
    for (const type of ["pointerup","pointercancel","blur"]) window.removeEventListener(type, hold.release, true);
    if (released && hold.fired) this._suppressClick = performance.now()+350;
  }

  // HA forwards this event to the Companion app's native haptics, or to navigator.vibrate
  // in browsers where the user profile enables vibration.
  _haptic(type = "light") {
    this.dispatchEvent(new CustomEvent("haptic", {detail:type, bubbles:true, composed:true}));
  }

  // Light the wheel where the command went: an arc for directions, a ring for OK.
  _light(command, angle) {
    if (!this._online()) return;
    const target = this.shadowRoot.querySelector(command === "ok" ? ".wheel-center" : ".glow");
    if (!target || (command !== "ok" && angle === undefined)) return;
    if (angle !== undefined) target.style.setProperty("--at", `${angle}deg`);
    target.classList.remove("on");
    void target.offsetWidth;
    target.classList.add("on");
  }

  _launchApp(source) {
    if (source) this._call("media_player","select_source",{source},`已发送打开「${source}」`);
  }
  _volume(step) { return this._call("media_player",step>0?"volume_up":"volume_down"); }
  _sendKey(command, angle = DIR_ANGLE[command]) {
    this._light(command, angle);
    return this._call("remote","send_command",{command:[command]});
  }

  async _call(domain,service,data={},message="") {
    if (!this._hass) return;
    if (this._busy) {
      // Coalesce absolute slider changes: never lose the final thumb position.
      if (service === "volume_set") this._pendingVolume = data.volume_level;
      return;
    }
    if (service!=="turn_on" && !this._online()) { this._haptic("failure"); return this._message("电视未连接",true); }
    this._busy = true;
    this._haptic();
    try {
      await this._hass.callService(domain,service,{entity_id:this._config[domain],...data});
      this._message(message);
    } catch (error) {
      this._haptic("failure");
      this._message(error.message || "指令发送失败",true);
    } finally {
      this._busy = false;
      if (this._pendingVolume !== undefined) {
        const volume_level = this._pendingVolume;
        this._pendingVolume = undefined;
        this._call("media_player","volume_set",{volume_level});
      }
    }
  }
  _message(text,error=false) { this._feedback=text; this._error=error; this._showFeedback(); }
  _showFeedback() {
    const el=this.shadowRoot.querySelector(".feedback");
    if (!el) return;
    el.textContent=this._feedback;
    el.title=this._feedback;
    el.classList.toggle("error",!!this._error);
  }
}

if (!customElements.get("tcl-ipod-card")) {
  customElements.define("tcl-ipod-card",TclIpodCard);
  window.customCards = window.customCards || [];
  window.customCards.push({type:"tcl-ipod-card",name:"TCL Glass Remote",description:"Glass TV remote: click wheel, volume and app launcher; fills the screen in a panel view."});
}
