import { NextRequest, NextResponse } from "next/server";
import { getWidgetCorsHeaders } from "@/lib/widget/cors";

export function GET(request: NextRequest) {
  const script = `
(function () {
  var currentScript = document.currentScript;
  var botId = currentScript && currentScript.getAttribute("data-harlo-bot");
  var organizationId = currentScript && (currentScript.getAttribute("data-harlo-organization") || currentScript.getAttribute("data-harlo-org"));
  var pageUrlOverride = currentScript && currentScript.getAttribute("data-harlo-page-url");
  if ((!botId && !organizationId) || document.getElementById("harlo-widget-root")) return;
  var baseUrl = new URL(currentScript.src).origin;
  var conversationStorageKey = "";
  var completedConversationStorageKey = "";
  var conversationId = "";
  var completedConversationId = "";
  var visitorId = window.localStorage.getItem("harlo:visitor");
  if (!visitorId) {
    visitorId = "visitor_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    window.localStorage.setItem("harlo:visitor", visitorId);
  }
  var messages = [];
  var config = null;
  var greetingMessage = "";
  var greetingNudgeShown = false;

  function getCurrentPageUrl() {
    return pageUrlOverride || window.location.href;
  }

  var root = document.createElement("div");
  root.id = "harlo-widget-root";
  root.style.visibility = "hidden";
  document.body.appendChild(root);

  var style = document.createElement("style");
  style.textContent = [
    "#harlo-widget-root,#harlo-widget-root *{box-sizing:border-box}",
    ".harlo-launcher{position:fixed;right:24px;bottom:24px;width:58px;height:58px;border-radius:999px;border:0;background:linear-gradient(135deg,var(--harlo-accent,#087f95),color-mix(in srgb,var(--harlo-accent,#087f95) 82%,#111827));color:var(--harlo-accent-text,#fff);box-shadow:none;z-index:2147483000;cursor:pointer;display:grid;place-items:center;transition:transform .18s ease,filter .18s ease}.harlo-launcher .harlo-icon{width:31px;height:31px;stroke-width:2.1}.harlo-launcher:hover{transform:translateY(-2px);filter:saturate(1.05) brightness(.98)}.harlo-launcher:active{transform:translateY(0) scale(.98)}",
    ".harlo-nudge{position:fixed;right:24px;bottom:104px;width:min(340px,calc(100vw - 32px));z-index:2147482999;display:none;border:1px solid #d7dde5;border-radius:16px;background:#fff;color:#111827;padding:16px;box-shadow:0 16px 38px rgba(15,23,42,.12);font-family:Inter,system-ui,-apple-system,sans-serif;overflow:visible;animation:harloNudgeIn .28s ease-out}.harlo-nudge[data-visible=true]{display:block}.harlo-nudge:after{content:'';position:absolute;bottom:-9px;width:16px;height:16px;background:#fff;border-right:1px solid #d7dde5;border-bottom:1px solid #d7dde5;transform:rotate(45deg);border-bottom-right-radius:4px}.harlo-nudge[data-side=right]:after{right:37px;left:auto}.harlo-nudge[data-side=left]:after{left:37px;right:auto}@keyframes harloNudgeIn{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}",
    ".harlo-nudge-text{border:0;background:transparent;color:#111827;padding:0;text-align:left;font:inherit;font-size:15px;font-weight:400;line-height:1.38;cursor:pointer;letter-spacing:0}.harlo-nudge-text:hover{color:#111827}.harlo-nudge-close{position:absolute;right:-7px;top:-7px;width:24px;height:24px;border:1px solid #d7dde5;border-radius:999px;background:#eef2f5;color:#5f6876;cursor:pointer;font-size:16px;line-height:1;display:grid;place-items:center;box-shadow:0 6px 14px rgba(15,23,42,.1);transition:background .16s ease,color .16s ease,transform .16s ease}.harlo-nudge-close:hover{background:#e2e8ee;color:#111827;transform:scale(1.03)}",
    ".harlo-icon{display:block;width:22px;height:22px;stroke:currentColor;fill:none;stroke-width:2.3;stroke-linecap:round;stroke-linejoin:round}.harlo-panel{position:fixed;right:24px;bottom:100px;width:min(410px,calc(100vw - 32px));height:min(650px,calc(100vh - 132px));border:1px solid rgba(226,232,238,.94);border-radius:22px;background:#fff;box-shadow:0 28px 80px rgba(15,23,42,.22),0 1px 0 rgba(255,255,255,.9) inset;z-index:2147483000;display:none;overflow:hidden;font-family:Inter,system-ui,-apple-system,sans-serif}.harlo-panel[data-open=true]{display:flex;flex-direction:column;animation:harloPanelIn .2s ease-out}@keyframes harloPanelIn{from{opacity:0;transform:translateY(10px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}",
    ".harlo-head{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:76px;padding:18px 18px;border-bottom:1px solid color-mix(in srgb,var(--harlo-accent-text,#fff) 16%,transparent);background:var(--harlo-accent,#087f95);color:var(--harlo-accent-text,#fff)}.harlo-head-inner{display:flex;align-items:center;gap:10px;min-width:0}.harlo-mark{width:42px;height:42px;display:grid;place-items:center;border-radius:14px;background:color-mix(in srgb,var(--harlo-accent-text,#fff) 16%,transparent);color:var(--harlo-accent-text,#fff);border:1px solid color-mix(in srgb,var(--harlo-accent-text,#fff) 35%,transparent);box-shadow:inset 0 1px 0 color-mix(in srgb,var(--harlo-accent-text,#fff) 22%,transparent),0 10px 24px rgba(15,23,42,.14);font-weight:800}.harlo-mark .harlo-icon{width:20px;height:20px}.harlo-title{font-weight:850;color:var(--harlo-accent-text,#fff);font-size:15px;letter-spacing:0}.harlo-subtitle{font-size:12px;color:color-mix(in srgb,var(--harlo-accent-text,#fff) 82%,transparent);margin-top:2px}.harlo-close{width:34px;height:34px;border:0;border-radius:999px;background:color-mix(in srgb,var(--harlo-accent-text,#fff) 14%,transparent);color:var(--harlo-accent-text,#fff);cursor:pointer;padding:0;display:grid;place-items:center;transition:background .16s ease,transform .16s ease}.harlo-close:hover{background:color-mix(in srgb,var(--harlo-accent-text,#fff) 22%,transparent);transform:scale(1.03)}.harlo-close::before{content:'';width:18px;height:2px;border-radius:999px;background:currentColor;opacity:.95}",
    ".harlo-body{flex:1;overflow:auto;padding:18px;background:linear-gradient(180deg,#fbfdff,#fff);color:#111827;font-size:14px;scrollbar-width:thin;scrollbar-color:#c8d5dc transparent}.harlo-body::-webkit-scrollbar{width:8px}.harlo-body::-webkit-scrollbar-thumb{background:#c8d5dc;border-radius:999px}.harlo-entry{margin:0 0 13px}.harlo-entry[data-role=user]{display:flex;flex-direction:column;align-items:flex-end}.harlo-entry[data-role=assistant]{display:block}.harlo-assistant-row{display:flex;align-items:flex-start;gap:10px;max-width:94%}.harlo-avatar{width:30px;height:30px;flex:0 0 30px;border-radius:10px;background:var(--harlo-accent,#087f95);color:var(--harlo-accent-text,#fff);display:grid;place-items:center;margin-top:2px;box-shadow:0 6px 14px rgba(15,23,42,.08)}.harlo-avatar .harlo-icon{width:15px;height:15px}.harlo-mark[data-has-logo=true],.harlo-avatar[data-has-logo=true]{background:#f4f4f4;color:var(--harlo-accent,#087f95);border:0;box-shadow:none}.harlo-logo-img{display:block;width:100%;height:100%;object-fit:contain;padding:5px}.harlo-avatar .harlo-logo-img{padding:4px}",
    ".harlo-message{display:table;width:fit-content;max-width:86%;padding:12px 13px;border-radius:16px;line-height:1.48;white-space:normal;box-shadow:0 1px 0 rgba(15,23,42,.04)}.harlo-message[data-role=assistant]{background:#f4f4f4;color:#111827;border:1px solid #e8edf1;border-top-left-radius:7px}.harlo-message[data-role=user]{margin-left:auto;background:linear-gradient(135deg,var(--harlo-accent,#087f95),color-mix(in srgb,var(--harlo-accent,#087f95) 82%,#111827));color:var(--harlo-accent-text,#fff);border-top-right-radius:7px;box-shadow:0 12px 26px color-mix(in srgb,var(--harlo-accent,#087f95) 18%,transparent)}.harlo-message[data-kind=billing-limit],.harlo-message[data-kind=billing-limit-sent]{display:block;width:auto;max-width:100%;padding:0;background:transparent;color:#111827;border:0;box-shadow:none}",
    ".harlo-limit-card{position:relative;overflow:hidden;border:1px solid color-mix(in srgb,var(--harlo-accent,#087f95) 24%,#e2e8ee);background:#fff;border-radius:16px;padding:14px;box-shadow:0 14px 34px rgba(15,23,42,.07)}.harlo-limit-card:before{content:'';position:absolute;left:0;right:0;top:0;height:4px;background:var(--harlo-accent,#087f95)}.harlo-limit-head{display:flex;align-items:center;gap:10px;margin:2px 0 10px}.harlo-limit-icon{width:30px;height:30px;border-radius:10px;display:grid;place-items:center;background:var(--harlo-accent,#087f95);color:var(--harlo-accent-text,#fff)}.harlo-limit-icon .harlo-icon{width:15px;height:15px;stroke-width:2.2}.harlo-limit-title{font-weight:800;color:#111827;font-size:14px;letter-spacing:0}.harlo-limit-copy{color:#4b5b68;font-size:13px;line-height:1.5;margin:0}.harlo-limit-note{display:inline-flex;align-items:center;gap:6px;margin-top:12px;border:0;border-radius:999px;background:color-mix(in srgb,var(--harlo-accent,#087f95) 10%,#fff);padding:6px 9px;color:var(--harlo-accent,#087f95);font-size:12px;font-weight:800}.harlo-limit-note:before{content:'';width:6px;height:6px;border-radius:999px;background:var(--harlo-accent,#087f95)}.harlo-message .harlo-limit-copy{margin:0}",
    ".harlo-message-time{font-size:11px;color:#7c8986;margin-top:5px}.harlo-entry[data-role=assistant] .harlo-message-time{margin-left:40px}.harlo-entry[data-role=user] .harlo-message-time{text-align:right;margin-right:2px}.harlo-typing{display:flex;align-items:center;gap:4px;min-width:34px;height:20px}.harlo-typing span{width:6px;height:6px;border-radius:999px;background:var(--harlo-accent,#087f95);opacity:.35;animation:harloTyping 1s infinite ease-in-out}.harlo-typing span:nth-child(2){animation-delay:.14s}.harlo-typing span:nth-child(3){animation-delay:.28s}@keyframes harloTyping{0%,80%,100%{transform:translateY(0);opacity:.35}40%{transform:translateY(-3px);opacity:1}}.harlo-message p{margin:0 0 8px}.harlo-message p:last-child{margin-bottom:0}.harlo-message ul{display:block;list-style-type:disc!important;list-style-position:outside!important;margin:7px 0 0 0!important;padding-left:22px!important}.harlo-message li{display:list-item!important;list-style-type:disc!important;margin:3px 0;padding-left:2px}",
    ".harlo-suggestions{display:none;background:#fff;padding:0 13px 2px}.harlo-suggestions[data-visible=true]{display:block}.harlo-suggestion-shell{display:grid;grid-template-columns:30px minmax(0,1fr) 30px;align-items:center;gap:7px}.harlo-suggestion-nav{width:30px;height:30px;border-radius:999px;border:1px solid #e2e8ee;background:#fff;color:#5f6876;display:grid;place-items:center;cursor:pointer;font-size:18px;line-height:1;box-shadow:0 2px 7px rgba(15,23,42,.05);transition:border-color .16s ease,color .16s ease,transform .16s ease}.harlo-suggestion-nav:hover{border-color:var(--harlo-accent,#087f95);color:var(--harlo-accent,#087f95);transform:translateY(-1px)}.harlo-prompts{display:flex;flex-wrap:nowrap;gap:8px;margin:0;padding:8px 0 6px;overflow-x:auto;scroll-behavior:smooth;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch}.harlo-prompts::-webkit-scrollbar{display:none}.harlo-prompt{flex:0 0 auto;max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;scroll-snap-align:start;border:1px solid #e2e8ee;background:#fff;border-radius:999px;padding:8px 11px;font-size:12px;font-weight:650;color:#111827;cursor:pointer;transition:border-color .16s ease,color .16s ease,box-shadow .16s ease}.harlo-prompt:hover{border-color:color-mix(in srgb,var(--harlo-accent,#087f95) 38%,#e2e8ee);color:var(--harlo-accent,#087f95);box-shadow:0 8px 18px rgba(15,23,42,.06)}.harlo-meta{font-size:11px;color:#5f6876;margin-top:8px}",
    ".harlo-input{display:flex;gap:9px;padding:12px 13px 9px;border-top:1px solid #edf2f5;background:#fff}.harlo-input input{flex:1;min-width:0;border:1px solid #dbe5ea;border-radius:14px;padding:12px 13px;font-size:14px;outline:none;background:#fbfdff;transition:border-color .16s ease,box-shadow .16s ease,background .16s ease}.harlo-input input:focus{border-color:var(--harlo-accent,#087f95);background:#fff;box-shadow:0 0 0 4px color-mix(in srgb,var(--harlo-accent,#087f95) 14%,transparent)}.harlo-input button{width:46px;height:44px;display:grid;place-items:center;border:0;border-radius:14px;background:linear-gradient(135deg,var(--harlo-accent,#087f95),color-mix(in srgb,var(--harlo-accent,#087f95) 82%,#111827));color:white;padding:0;cursor:pointer;box-shadow:0 12px 22px color-mix(in srgb,var(--harlo-accent,#087f95) 18%,transparent);transition:transform .16s ease,box-shadow .16s ease}.harlo-input button:hover{transform:translateY(-1px);box-shadow:0 16px 26px color-mix(in srgb,var(--harlo-accent,#087f95) 22%,transparent)}.harlo-input button .harlo-icon{width:18px;height:18px}.harlo-input button:disabled{opacity:.6;cursor:wait;transform:none}.harlo-powered{padding:0 13px 13px;background:#fff;text-align:center;font-size:11px;color:#7c8986}.harlo-powered strong{font-weight:850;color:#5f6876}",
    "@media(max-width:480px){.harlo-panel{right:12px;left:12px;bottom:90px;width:auto;height:min(640px,calc(100vh - 112px));border-radius:20px}.harlo-launcher{right:18px;bottom:18px;width:56px;height:56px}.harlo-launcher .harlo-icon{width:30px;height:30px}.harlo-nudge{right:12px;bottom:92px;width:min(320px,calc(100vw - 24px));padding:15px}.harlo-nudge-text{font-size:14px}.harlo-nudge[data-side=right]:after{right:36px}.harlo-nudge[data-side=left]:after{left:36px}}"
  ].join("");
  document.head.appendChild(style);

  var brandIcon = '<svg class="harlo-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0z"></path><path d="M20 3v4"></path><path d="M22 5h-4"></path><path d="M4 17v2"></path><path d="M5 18H3"></path></svg>';
  var messageIcon = '<svg class="harlo-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4.75 17.25 4 20l3.2-.86A8.5 8.5 0 1 0 3.5 12a8.46 8.46 0 0 0 1.25 5.25Z"></path><path d="M8.5 12h.01"></path><path d="M12 12h.01"></path><path d="M15.5 12h.01"></path></svg>';
  var chevronDownIcon = '<svg class="harlo-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>';
  var sendIcon = '<svg class="harlo-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z"></path><path d="M22 2 11 13"></path></svg>';
  var alertIcon = '<svg class="harlo-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>';
  root.innerHTML = '<section class="harlo-panel" aria-label="Harlo chat"><div class="harlo-head"><div class="harlo-head-inner"><div class="harlo-mark">' + brandIcon + '</div><div><div class="harlo-title">Ask Harlo</div><div class="harlo-subtitle">Usually replies instantly</div></div></div><button class="harlo-close" aria-label="Minimize chat"></button></div><div class="harlo-body"></div><div class="harlo-suggestions"></div><form class="harlo-input"><input aria-label="Message" placeholder="Ask a question..." autocomplete="off" /><button aria-label="Send message">' + sendIcon + '</button></form><div class="harlo-powered">Powered by <strong>Harlo</strong></div></section><div class="harlo-nudge" data-visible="false" data-side="right"><button class="harlo-nudge-text" type="button"></button><button class="harlo-nudge-close" type="button" aria-label="Dismiss greeting">&times;</button></div><button class="harlo-launcher" aria-label="Open Harlo chat">' + messageIcon + '</button>';

  var panel = root.querySelector(".harlo-panel");
  var launcher = root.querySelector(".harlo-launcher");
  var close = root.querySelector(".harlo-close");
  var body = root.querySelector(".harlo-body");
  var suggestions = root.querySelector(".harlo-suggestions");
  var form = root.querySelector(".harlo-input");
  var input = root.querySelector(".harlo-input input");
  var submit = root.querySelector(".harlo-input button");
  var title = root.querySelector(".harlo-title");
  var subtitle = root.querySelector(".harlo-subtitle");
  var mark = root.querySelector(".harlo-mark");
  var powered = root.querySelector(".harlo-powered");
  var nudge = root.querySelector(".harlo-nudge");
  var nudgeText = root.querySelector(".harlo-nudge-text");
  var nudgeClose = root.querySelector(".harlo-nudge-close");

  launcher.addEventListener("click", function () {
    var nextOpen = panel.getAttribute("data-open") === "true" ? "false" : "true";
    panel.setAttribute("data-open", nextOpen);
    updateLauncherIcon();
    hideGreetingNudge(false);
    if (nextOpen === "true") {
      input.focus();
    }
  });
  close.addEventListener("click", function () {
    panel.setAttribute("data-open", "false");
    updateLauncherIcon();
  });
  nudgeText.addEventListener("click", function () {
    hideGreetingNudge(false);
    panel.setAttribute("data-open", "true");
    updateLauncherIcon();
    input.focus();
  });
  nudgeClose.addEventListener("click", function () {
    hideGreetingNudge(true);
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var text = input.value.trim();
    if (!text) return;
    sendMessage(text);
  });

  function setPausedInput() {
    input.value = "";
    input.placeholder = "Assistant is paused";
    input.disabled = true;
    submit.disabled = true;
    suggestions.setAttribute("data-visible", "false");
    suggestions.innerHTML = "";
  }

  function setActiveInput() {
    input.disabled = false;
    submit.disabled = false;
    input.placeholder = "Ask a question...";
    input.focus();
  }

  function revealWidget() {
    root.style.visibility = "visible";
  }

  function setAccent(accent) {
    var color = accent || "#087f95";
    var textColor = readableTextColor(color);
    var accentGradient = "linear-gradient(135deg," + color + ",color-mix(in srgb," + color + " 82%,#111827))";
    root.style.setProperty("--harlo-accent", color);
    root.style.setProperty("--harlo-accent-text", textColor);
    launcher.style.color = textColor;
    submit.style.background = accentGradient;
    submit.style.color = textColor;
    if (getBrandLogoUrl()) {
      mark.style.background = "#f4f4f4";
      mark.style.color = color;
    } else {
      mark.style.background = color;
      mark.style.color = textColor;
    }
  }

  function updateLauncherIcon() {
    launcher.innerHTML = panel.getAttribute("data-open") === "true" ? chevronDownIcon : messageIcon;
  }

  function getBrandLogoUrl() {
    return config && typeof config.brandLogoUrl === "string" && config.brandLogoUrl ? config.brandLogoUrl : "";
  }

  function renderBrandMark(target) {
    var logoUrl = getBrandLogoUrl();
    target.innerHTML = "";

    if (!logoUrl) {
      target.removeAttribute("data-has-logo");
      target.innerHTML = brandIcon;
      return;
    }

    var image = document.createElement("img");
    image.className = "harlo-logo-img";
    image.alt = "";
    image.src = logoUrl;
    image.referrerPolicy = "no-referrer";
    image.addEventListener("error", function () {
      target.removeAttribute("data-has-logo");
      target.innerHTML = brandIcon;
    });
    target.setAttribute("data-has-logo", "true");
    target.appendChild(image);
  }

  function readableTextColor(color) {
    var value = String(color || "").replace("#", "");
    if (!/^[0-9a-f]{6}$/i.test(value)) return "#ffffff";
    var red = parseInt(value.slice(0, 2), 16);
    var green = parseInt(value.slice(2, 4), 16);
    var blue = parseInt(value.slice(4, 6), 16);
    var luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
    return luminance > 0.62 ? "#111827" : "#ffffff";
  }

  function getBusinessLabel() {
    return config && (config.businessName || config.name) ? (config.businessName || config.name) : "this business";
  }

  function defaultGreetingMessage() {
    return "👋 Hi! I can help answer questions about " + getBusinessLabel() + ".";
  }

  function setLauncherPosition(position) {
    var isLeft = position === "bottom-left";
    launcher.style.left = isLeft ? "24px" : "";
    launcher.style.right = isLeft ? "auto" : "24px";
    nudge.style.left = isLeft ? "24px" : "";
    nudge.style.right = isLeft ? "auto" : "24px";
    nudge.setAttribute("data-side", isLeft ? "left" : "right");
    panel.style.left = isLeft ? "24px" : "";
    panel.style.right = isLeft ? "auto" : "24px";
  }

  function getGreetingNudgeKey() {
    return botId ? "harlo:greeting-dismissed:" + botId : "";
  }

  function hasDismissedGreetingNudge() {
    var key = getGreetingNudgeKey();
    return key ? window.localStorage.getItem(key) === "true" : false;
  }

  function hideGreetingNudge(remember) {
    nudge.setAttribute("data-visible", "false");
    if (remember) {
      var key = getGreetingNudgeKey();
      if (key) window.localStorage.setItem(key, "true");
    }
  }

  function showGreetingNudge(message) {
    if (greetingNudgeShown) return;
    greetingNudgeShown = true;
    if (hasDismissedGreetingNudge() || panel.getAttribute("data-open") === "true") return;
    nudgeText.textContent = String(message || "").trim() || "👋 Hi! How can I help?";
    nudge.setAttribute("data-visible", "true");
  }

  function scheduleGreetingNudge(message) {
    window.setTimeout(function () {
      showGreetingNudge(message);
    }, 2600);
  }

  function render(scrollToBottom) {
    if (scrollToBottom === undefined) scrollToBottom = true;
    body.innerHTML = "";
    messages.forEach(function (message) {
      var entry = document.createElement("div");
      entry.className = "harlo-entry";
      entry.setAttribute("data-role", message.role);

      var bubble = document.createElement("div");
      bubble.className = "harlo-message";
      bubble.setAttribute("data-role", message.role);
      bubble.setAttribute("data-kind", message.kind || "message");
      bubble.appendChild(message.loading ? createTypingIndicator() : formatMessage(message.content, message.kind));

      if (message.role === "assistant") {
        var row = document.createElement("div");
        row.className = "harlo-assistant-row";
        var avatar = document.createElement("div");
        avatar.className = "harlo-avatar";
        renderBrandMark(avatar);
        row.appendChild(avatar);
        row.appendChild(bubble);
        entry.appendChild(row);
      } else {
        entry.appendChild(bubble);
      }

      if (!message.loading) {
        var time = document.createElement("div");
        time.className = "harlo-message-time";
        time.textContent = messageTime(message.createdAt);
        entry.appendChild(time);
      }

      body.appendChild(entry);
    });

    renderSuggestions();

    if (scrollToBottom) {
      body.scrollTop = body.scrollHeight;
    }
  }

  window.setInterval(function () {
    if (messages.length > 0) {
      render(false);
    }
  }, 15000);


  function renderSuggestions() {
    suggestions.innerHTML = "";
    var defaultPrompts = ["What services do you offer?", "How much does it cost?", "Can I book a consultation?"];
    var configuredPrompts = config && config.theme && Array.isArray(config.theme.welcomePrompts)
      ? config.theme.welcomePrompts.filter(function (prompt) { return typeof prompt === "string" && prompt.trim(); })
      : [];
    var promptsToShow = config && messages.length === 1
      ? (configuredPrompts.length ? configuredPrompts : defaultPrompts)
      : [];

    if (!promptsToShow.length) {
      suggestions.setAttribute("data-visible", "false");
      return;
    }

    suggestions.setAttribute("data-visible", "true");
    var shell = document.createElement("div");
    shell.className = "harlo-suggestion-shell";
    var previous = document.createElement("button");
    previous.className = "harlo-suggestion-nav";
    previous.type = "button";
    previous.setAttribute("aria-label", "Previous suggested questions");
    previous.textContent = "‹";
    var next = document.createElement("button");
    next.className = "harlo-suggestion-nav";
    next.type = "button";
    next.setAttribute("aria-label", "Next suggested questions");
    next.textContent = "›";
    var prompts = document.createElement("div");
    prompts.className = "harlo-prompts";
    prompts.setAttribute("aria-label", "Suggested questions");
    promptsToShow.forEach(function (prompt) {
      var button = document.createElement("button");
      button.className = "harlo-prompt";
      button.type = "button";
      button.textContent = prompt;
      button.addEventListener("click", function () {
        sendMessage(prompt);
      });
      prompts.appendChild(button);
    });
    previous.addEventListener("click", function () {
      prompts.scrollBy({ left: -Math.max(160, prompts.clientWidth - 34), behavior: "smooth" });
    });
    next.addEventListener("click", function () {
      prompts.scrollBy({ left: Math.max(160, prompts.clientWidth - 34), behavior: "smooth" });
    });
    shell.appendChild(previous);
    shell.appendChild(prompts);
    shell.appendChild(next);
    suggestions.appendChild(shell);
  }

  function addMessage(role, content, kind) {
    messages.push({ role: role, content: content, kind: kind || "message", createdAt: Date.now(), loading: false });
    render();
    return messages.length - 1;
  }

  function addLoadingMessage() {
    messages.push({ role: "assistant", content: "", createdAt: Date.now(), loading: true });
    render();
    return messages.length - 1;
  }

  function messageTime(createdAt) {
    var date = new Date(createdAt);
    var seconds = Math.max(0, Math.floor((Date.now() - createdAt) / 1000));
    if (seconds < 5) return "just now";
    if (seconds < 60) return seconds + "s ago";
    var sameDay = date.toDateString() === new Date().toDateString();
    if (sameDay) {
      return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" }) + " at " + date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  function updateMessage(index, content, kind) {
    if (!messages[index]) return;
    messages[index].content = content;
    if (kind) messages[index].kind = kind;
    messages[index].loading = false;
    render();
  }

  function getStoredCompletedConversationId() {
    if (!completedConversationStorageKey) return "";

    try {
      var raw = window.localStorage.getItem(completedConversationStorageKey);
      if (!raw) return "";
      var stored = JSON.parse(raw);
      var id = stored && typeof stored.id === "string" ? stored.id : "";
      var completedAt = stored && typeof stored.completedAt === "number" ? stored.completedAt : 0;
      var isRecent = completedAt && Date.now() - completedAt < 60 * 60 * 1000;
      return id && isRecent ? id : "";
    } catch (_) {
      return "";
    }
  }

  function storeCompletedConversationId(id) {
    completedConversationId = id || "";
    if (!completedConversationStorageKey || !completedConversationId) return;
    window.localStorage.setItem(completedConversationStorageKey, JSON.stringify({
      id: completedConversationId,
      completedAt: Date.now()
    }));
  }

  function clearCompletedConversationId() {
    completedConversationId = "";
    if (completedConversationStorageKey) {
      window.localStorage.removeItem(completedConversationStorageKey);
    }
  }

  function clearActiveConversationId() {
    conversationId = "";
    if (conversationStorageKey) {
      window.localStorage.removeItem(conversationStorageKey);
    } else if (botId) {
      window.localStorage.removeItem("harlo:conversation:" + botId);
    }
  }

  function isCloseoutMessage(text) {
    return /^(?:ok|okay|k|cool|great|perfect|sounds good|got it|thanks|thank you|thank u|thx|okay thanks|ok thanks|great thanks|perfect thanks|awesome thanks|appreciate it|bye|goodbye|all set|that'?s all|thats all)(?:[.!\s]*)$/i.test(
      String(text || "").trim()
    );
  }

  function createTypingIndicator() {
    var typing = document.createElement("div");
    typing.className = "harlo-typing";
    typing.setAttribute("aria-label", "Harlo is typing");
    typing.innerHTML = "<span></span><span></span><span></span>";
    return typing;
  }

  function revealAssistantMessage(content, done, kind) {
    var text = String(content || "");
    var index = addMessage("assistant", "", kind);
    var position = 0;

    function step() {
      var increment = Math.max(1, Math.ceil(text.length / 70));
      position = Math.min(text.length, position + increment);
      updateMessage(index, text.slice(0, position), kind);

      if (position < text.length) {
        window.setTimeout(step, 18);
        return;
      }

      if (done) done();
    }

    step();
  }

  function formatMessage(content, kind) {
    if (kind === "billing-limit" || kind === "billing-limit-sent") return formatBillingLimitMessage(content, kind);
    var wrapper = document.createElement("div");
    var lines = String(content || "").split("\\n").map(function (line) { return line.trim(); }).filter(Boolean);
    var list = null;

    lines.forEach(function (line, index) {
      var bullet = line.match(/^(?:[-*•]\\s+)(.+)$/);
      var nextLine = lines[index + 1] || "";
      var previousLine = lines[index - 1] || "";
      var looksLikeImplicitList =
        !/[.!?]$/.test(line) &&
        (
          /:\\s*$/.test(previousLine) ||
          Boolean(list) ||
          (/^(?:[A-Z][a-z]+(?:\\s+[a-z]+){0,4})(?::|\\s+starts\\s+at|\\s+-)/.test(line) && !/^(Sure|Hi|Hello|Thanks|If|I\\b|You\\b|Acme\\b)/.test(line)) ||
          (/^(?:Your|Preferred|Property)\\b/.test(line) && !/[.!?]$/.test(line))
        ) &&
        !/:\\s*$/.test(line) &&
        nextLine !== "";

      if (bullet || looksLikeImplicitList) {
        if (!list) {
          list = document.createElement("ul");
          wrapper.appendChild(list);
        }
        var item = document.createElement("li");
        item.textContent = bullet ? bullet[1] : line;
        list.appendChild(item);
        return;
      }

      list = null;
      var paragraph = document.createElement("p");
      paragraph.textContent = line;
      wrapper.appendChild(paragraph);
    });

    if (lines.length === 0) {
      wrapper.textContent = content;
    }

    return wrapper;
  }


  function formatBillingLimitMessage(content, kind) {
    var businessName = config && (config.businessName || config.name) ? (config.businessName || config.name) : "the business";
    var card = document.createElement("div");
    card.className = "harlo-limit-card";
    var head = document.createElement("div");
    head.className = "harlo-limit-head";
    var icon = document.createElement("div");
    icon.className = "harlo-limit-icon";
    icon.innerHTML = alertIcon;
    var titleText = document.createElement("div");
    titleText.className = "harlo-limit-title";
    titleText.textContent = "Assistant paused";
    head.appendChild(icon);
    head.appendChild(titleText);
    var copy = document.createElement("p");
    copy.className = "harlo-limit-copy";
    copy.textContent = String(content || "This assistant is temporarily paused. " + businessName + " has been notified and can help directly for now.");
    var note = document.createElement("div");
    note.className = "harlo-limit-note";
    note.textContent = kind === "billing-limit-sent" ? "Business notified" : "Contact the business directly";
    card.appendChild(head);
    card.appendChild(copy);
    card.appendChild(note);
    return card;
  }

  function sendMessage(text) {
    var closeoutOnly = isCloseoutMessage(text);
    var shouldAttachToCompletedConversation = !conversationId && completedConversationId && closeoutOnly;
    var outgoingConversationId = conversationId || (shouldAttachToCompletedConversation ? completedConversationId : "");

    if (!conversationId && !shouldAttachToCompletedConversation) {
      clearCompletedConversationId();
    }

    input.value = "";
    input.disabled = true;
    submit.disabled = true;
    addMessage("user", text);
    addLoadingMessage();

    function finish() {
      setActiveInput();
    }

    function pauseAfterMessage() {
      setPausedInput();
    }

    fetch(baseUrl + "/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        botId: botId,
        conversationId: outgoingConversationId || undefined,
        message: text,
        visitor: {
          anonymousId: visitorId,
          pageUrl: getCurrentPageUrl(),
          referrer: document.referrer
        }
      })
    })
      .then(function (response) { return response.json().then(function (json) { return { ok: response.ok, json: json }; }); })
      .then(function (result) {
        messages.pop();
        if (!result.ok) {
          revealAssistantMessage(result.json && result.json.error ? result.json.error : "Sorry, I could not answer that right now.", finish);
          return;
        }
        conversationId = result.json.conversationId;
        if (result.json.leadCaptured) {
          storeCompletedConversationId(result.json.conversationId);
          clearActiveConversationId();
        } else if (shouldAttachToCompletedConversation || closeoutOnly) {
          clearCompletedConversationId();
          clearActiveConversationId();
        } else if (conversationStorageKey && conversationId) {
          clearCompletedConversationId();
          window.localStorage.setItem(conversationStorageKey, conversationId);
        }
        if (result.json.billingLimitReached) {
          revealAssistantMessage(result.json.answer, pauseAfterMessage, result.json.billingAlertSent ? "billing-limit-sent" : "billing-limit");
          return;
        }
        revealAssistantMessage(result.json.answer, finish);
      })
      .catch(function () {
        messages.pop();
        revealAssistantMessage("Sorry, I could not answer that right now.", finish);
      });
  }

  var configUrl = new URL(baseUrl + "/api/widget/config");
  if (botId) configUrl.searchParams.set("botId", botId);
  if (organizationId) configUrl.searchParams.set("organizationId", organizationId);
  configUrl.searchParams.set("pageUrl", getCurrentPageUrl());

  fetch(configUrl.toString())
    .then(function (response) { return response.json().then(function (json) { return { ok: response.ok, json: json }; }); })
    .then(function (result) {
      if (!result.ok) {
        root.remove();
        return;
      }
      if (result.json && result.json.disabled) {
        root.remove();
        return;
      }
      config = result.json;
      botId = config.id || botId;
      conversationStorageKey = "harlo:conversation:" + botId;
      completedConversationStorageKey = "harlo:completed-conversation:" + botId;
      conversationId = window.localStorage.getItem(conversationStorageKey) || "";
      completedConversationId = getStoredCompletedConversationId();
      title.textContent = config.theme.title || config.name || "Ask Harlo";
      subtitle.textContent = "AI assistant for " + getBusinessLabel();
      setAccent(config.theme.accent);
      renderBrandMark(mark);
      setLauncherPosition(config.theme.launcherPosition);
      if (powered && config.removeBranding) powered.style.display = "none";
      greetingMessage = config.greeting || defaultGreetingMessage();
      addMessage("assistant", greetingMessage);
      revealWidget();
      scheduleGreetingNudge(greetingMessage);
    })
    .catch(function () {
      root.remove();
    });
})();`;

  return new NextResponse(script, {
    headers: {
      ...Object.fromEntries(getWidgetCorsHeaders(request)),
      "content-type": "application/javascript; charset=utf-8",
      "cache-control": "no-store, max-age=0"
    }
  });
}
