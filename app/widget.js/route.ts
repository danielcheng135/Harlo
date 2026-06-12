import { NextRequest, NextResponse } from "next/server";
import { getWidgetCorsHeaders } from "@/lib/widget/cors";

export function GET(request: NextRequest) {
  const script = `
(function () {
  var currentScript = document.currentScript;
  var botId = currentScript && currentScript.getAttribute("data-harlo-bot");
  var organizationId = currentScript && (currentScript.getAttribute("data-harlo-organization") || currentScript.getAttribute("data-harlo-org"));
  var pageUrlOverride = currentScript && currentScript.getAttribute("data-harlo-page-url");
  var suppressGreetingNudge = currentScript && currentScript.getAttribute("data-harlo-hide-greeting") === "true";
  if ((!botId && !organizationId) || document.getElementById("harlo-widget-root")) return;
  var baseUrl = new URL(currentScript.src).origin;
  var greetingNudgeScope = organizationId ? "organization:" + organizationId : "bot:" + botId;
  var greetingNudgeStorageKey = "harlo:greeting-dismissed:" + greetingNudgeScope;
  var greetingDismissals = window.__harloGreetingDismissals || {};
  window.__harloGreetingDismissals = greetingDismissals;
  if (!window.__harloGreetingReloadHandled) {
    window.__harloGreetingReloadHandled = true;
    var navigationEntries = window.performance && window.performance.getEntriesByType
      ? window.performance.getEntriesByType("navigation")
      : [];
    if (navigationEntries[0] && navigationEntries[0].type === "reload") {
      try {
        window.sessionStorage.removeItem(greetingNudgeStorageKey);
      } catch (error) {}
    }
  }
  try {
    if (window.sessionStorage.getItem(greetingNudgeStorageKey) === "true") {
      greetingDismissals[greetingNudgeScope] = true;
    }
  } catch (error) {}
  var conversationStorageKey = "";
  var completedConversationStorageKey = "";
  var launcherPositionStorageKey = "";
  var conversationId = "";
  var completedConversationId = "";
  var launcherPosition = "bottom-right";
  var launcherDrag = null;
  var suppressLauncherClick = false;
  var visitorId = window.localStorage.getItem("harlo:visitor");
  if (!visitorId) {
    visitorId = "visitor_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    window.localStorage.setItem("harlo:visitor", visitorId);
  }
  var messages = [];
  var config = null;
  var greetingMessage = "";
  var greetingNudgeShown = false;
  var greetingNudgeTimer = null;
  var activeMessageReveals = 0;
  var calendlyLoadPromise = null;
  var calendlyCssUrl = "https://assets.calendly.com/assets/external/widget.css";
  var calendlyScriptUrl = "https://assets.calendly.com/assets/external/widget.js";

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
    ".harlo-launcher{position:fixed;right:24px;bottom:24px;width:58px;height:58px;border-radius:999px;border:0;background:linear-gradient(135deg,var(--harlo-accent,#087f95),color-mix(in srgb,var(--harlo-accent,#087f95) 82%,#111827));color:var(--harlo-accent-text,#fff);box-shadow:none;z-index:2147483000;cursor:grab;display:grid;place-items:center;touch-action:none;user-select:none;-webkit-user-select:none;transition:transform .18s ease,filter .18s ease}.harlo-launcher .harlo-icon{width:31px;height:31px;stroke-width:2.1;pointer-events:none}.harlo-launcher:hover{transform:translateY(-2px);filter:saturate(1.05) brightness(.98)}.harlo-launcher:active{transform:translateY(0) scale(.98)}.harlo-launcher[data-dragging=true]{cursor:grabbing;transition:none;filter:saturate(1.05)}",
    ".harlo-nudge{position:fixed;right:24px;bottom:104px;width:min(340px,calc(100vw - 32px));z-index:2147482999;display:none;border:0;border-radius:16px;background:#fff;color:#111827;padding:16px;box-shadow:0 16px 38px rgba(15,23,42,.12);font-family:Inter,system-ui,-apple-system,sans-serif;overflow:visible;animation:harloNudgeIn .28s ease-out}.harlo-nudge[data-visible=true]{display:block}.harlo-nudge:after{content:'';position:absolute;bottom:-9px;width:16px;height:16px;background:#fff;transform:rotate(45deg);border-bottom-right-radius:4px}.harlo-nudge[data-side=right]:after{right:37px;left:auto}.harlo-nudge[data-side=left]:after{left:37px;right:auto}@keyframes harloNudgeIn{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}",
    ".harlo-nudge-text{border:0;background:transparent;color:#111827;padding:0;text-align:left;font:inherit;font-size:15px;font-weight:400;line-height:1.38;cursor:pointer;letter-spacing:0}.harlo-nudge-text:hover{color:#111827}.harlo-nudge-close{position:absolute;right:-7px;top:-7px;width:24px;height:24px;border:1px solid #d7dde5;border-radius:999px;background:#eef2f5;color:#5f6876;cursor:pointer;font-size:16px;line-height:1;display:grid;place-items:center;box-shadow:0 6px 14px rgba(15,23,42,.1);transition:background .16s ease,color .16s ease,transform .16s ease}.harlo-nudge-close:hover{background:#e2e8ee;color:#111827;transform:scale(1.03)}",
    ".harlo-icon{display:block;width:22px;height:22px;stroke:currentColor;fill:none;stroke-width:2.3;stroke-linecap:round;stroke-linejoin:round}.harlo-panel{position:fixed;right:24px;bottom:100px;width:min(410px,calc(100vw - 32px));height:min(650px,calc(100vh - 132px));border:0;border-radius:22px;background:#fff;box-shadow:0 28px 80px rgba(15,23,42,.22);z-index:2147483001;display:none;overflow:hidden;font-family:Inter,system-ui,-apple-system,sans-serif}.harlo-panel[data-open=true]{display:flex;flex-direction:column;animation:harloPanelIn .2s ease-out}@keyframes harloPanelIn{from{opacity:0;transform:translateY(10px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}",
    ".harlo-head{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:64px;padding:14px 19px;background:linear-gradient(180deg,color-mix(in srgb,var(--harlo-accent,#087f95) 88%,#fff) 0%,var(--harlo-accent,#087f95) 34%,var(--harlo-accent,#087f95) 100%);color:var(--harlo-accent-text,#fff)}.harlo-head-inner{display:flex;align-items:center;gap:9px;min-width:0}.harlo-mark{width:34px;height:34px;display:grid;place-items:center;border-radius:999px;background:color-mix(in srgb,var(--harlo-accent-text,#fff) 16%,transparent);color:var(--harlo-accent-text,#fff);border:1px solid color-mix(in srgb,var(--harlo-accent-text,#fff) 30%,transparent);font-weight:800;overflow:hidden}.harlo-mark .harlo-icon{width:17px;height:17px}.harlo-title{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500;color:var(--harlo-accent-text,#fff);font-size:15px;letter-spacing:0}.harlo-close{width:30px;height:30px;border:0;border-radius:999px;background:color-mix(in srgb,var(--harlo-accent-text,#fff) 13%,transparent);color:var(--harlo-accent-text,#fff);cursor:pointer;padding:0;display:grid;place-items:center;transition:background .16s ease,transform .16s ease}.harlo-close:hover{background:color-mix(in srgb,var(--harlo-accent-text,#fff) 22%,transparent);transform:scale(1.03)}.harlo-close::before{content:'';width:15px;height:2px;border-radius:999px;background:currentColor;opacity:.95}",
    ".harlo-body{flex:1;overflow:auto;padding:18px;background:linear-gradient(180deg,#fbfdff,#fff);color:#111827;font-size:14px;scrollbar-width:thin;scrollbar-color:#c8d5dc transparent}.harlo-body::-webkit-scrollbar{width:8px}.harlo-body::-webkit-scrollbar-thumb{background:#c8d5dc;border-radius:999px}.harlo-entry{margin:0 0 13px}.harlo-entry[data-role=user]{display:flex;flex-direction:column;align-items:flex-end}.harlo-entry[data-role=assistant]{display:block}.harlo-entry[data-continued=true]{margin-top:-7px}.harlo-assistant-row{display:flex;align-items:flex-start;max-width:94%}.harlo-logo-img{display:block;width:100%;height:100%;object-fit:contain;padding:5px}",
    ".harlo-message{display:table;width:fit-content;max-width:86%;padding:12px 13px;border:0;border-radius:16px;line-height:1.48;white-space:normal;box-shadow:none}.harlo-message[data-streaming=true]{overflow:hidden;will-change:width,height}.harlo-message[data-role=assistant]{background:#F4F4F5;color:#111827;border-top-left-radius:7px}.harlo-message[data-role=user]{margin-left:auto;background:linear-gradient(135deg,var(--harlo-accent,#087f95),color-mix(in srgb,var(--harlo-accent,#087f95) 82%,#111827));color:var(--harlo-accent-text,#fff);border-top-right-radius:7px;box-shadow:none}.harlo-message[data-kind=billing-limit],.harlo-message[data-kind=billing-limit-sent]{display:block;width:auto;max-width:100%;padding:0;background:transparent;color:#111827;border:0;box-shadow:none}",
    ".harlo-limit-card{position:relative;overflow:hidden;border:1px solid color-mix(in srgb,var(--harlo-accent,#087f95) 24%,#e2e8ee);background:#fff;border-radius:16px;padding:14px;box-shadow:none}.harlo-limit-card:before{content:'';position:absolute;left:0;right:0;top:0;height:4px;background:var(--harlo-accent,#087f95)}.harlo-limit-head{display:flex;align-items:center;gap:10px;margin:2px 0 10px}.harlo-limit-icon{width:30px;height:30px;border-radius:10px;display:grid;place-items:center;background:var(--harlo-accent,#087f95);color:var(--harlo-accent-text,#fff)}.harlo-limit-icon .harlo-icon{width:15px;height:15px;stroke-width:2.2}.harlo-limit-title{font-weight:800;color:#111827;font-size:14px;letter-spacing:0}.harlo-limit-copy{color:#4b5b68;font-size:13px;line-height:1.5;margin:0}.harlo-limit-note{display:inline-flex;align-items:center;gap:6px;margin-top:12px;border:0;border-radius:999px;background:color-mix(in srgb,var(--harlo-accent,#087f95) 10%,#fff);padding:6px 9px;color:var(--harlo-accent,#087f95);font-size:12px;font-weight:800}.harlo-limit-note:before{content:'';width:6px;height:6px;border-radius:999px;background:var(--harlo-accent,#087f95)}.harlo-message .harlo-limit-copy{margin:0}",
    ".harlo-message[data-kind=lead-form]{display:block;width:100%;max-width:100%;padding:0;background:transparent;border:0;box-shadow:none}.harlo-lead-card{position:relative;overflow:hidden;border:1px solid color-mix(in srgb,var(--harlo-accent,#087f95) 22%,#e2e8ee);border-radius:18px;background:#fff;box-shadow:none}.harlo-lead-card:before{content:'';position:absolute;inset:0 0 auto;height:4px;background:linear-gradient(90deg,var(--harlo-accent,#087f95),color-mix(in srgb,var(--harlo-accent,#087f95) 58%,#fff));}.harlo-lead-card[data-submitted=true]{opacity:.78}.harlo-lead-head{display:flex;gap:11px;padding:16px 16px 12px}.harlo-lead-icon{width:34px;height:34px;flex:0 0 34px;border-radius:12px;display:grid;place-items:center;background:color-mix(in srgb,var(--harlo-accent,#087f95) 10%,#fff);color:var(--harlo-accent,#087f95)}.harlo-lead-icon .harlo-icon{width:17px;height:17px;stroke-width:2.2}.harlo-lead-title{font-size:14px;font-weight:850;color:#111827;letter-spacing:0}.harlo-lead-copy{margin:3px 0 0;color:#5f6876;font-size:12.5px;line-height:1.45}.harlo-lead-fields{display:grid;gap:10px;padding:0 16px 14px}.harlo-lead-field{display:grid;gap:5px}.harlo-lead-label{display:flex;align-items:center;justify-content:space-between;gap:8px;color:#263445;font-size:12px;font-weight:800}.harlo-lead-required{color:var(--harlo-accent,#087f95);font-size:11px;font-weight:800}.harlo-lead-input{width:100%;min-height:42px;border:1px solid #dbe5ea;border-radius:12px;background:#fbfdff;color:#111827;font:inherit;font-size:14px;padding:10px 11px;outline:none;transition:border-color .16s ease,box-shadow .16s ease,background .16s ease}.harlo-lead-input:focus{border-color:var(--harlo-accent,#087f95);background:#fff;box-shadow:0 0 0 4px color-mix(in srgb,var(--harlo-accent,#087f95) 12%,transparent)}.harlo-lead-input[aria-invalid=true]{border-color:#ef4444;box-shadow:0 0 0 3px rgba(239,68,68,.1)}.harlo-lead-error{display:none;color:#dc2626;font-size:11px;font-weight:700}.harlo-lead-field[data-error=true] .harlo-lead-error{display:block}.harlo-lead-actions{padding:0 16px 16px}.harlo-lead-submit{width:100%;min-height:44px;border:0;border-radius:14px;background:linear-gradient(135deg,var(--harlo-accent,#087f95),color-mix(in srgb,var(--harlo-accent,#087f95) 82%,#111827));color:var(--harlo-accent-text,#fff);font-size:14px;font-weight:850;cursor:pointer;box-shadow:0 14px 28px color-mix(in srgb,var(--harlo-accent,#087f95) 18%,transparent);transition:transform .16s ease,box-shadow .16s ease}.harlo-lead-submit:hover{transform:translateY(-1px);box-shadow:0 18px 32px color-mix(in srgb,var(--harlo-accent,#087f95) 22%,transparent)}.harlo-lead-submit:disabled{cursor:default;opacity:.7;transform:none;box-shadow:none}.harlo-lead-note{margin:8px 0 0;text-align:center;color:#7c8986;font-size:11px;line-height:1.35}",
    ".harlo-message[data-kind=integration-actions]{display:block;width:100%;max-width:100%;padding:0;background:transparent;border:0;box-shadow:none}.harlo-action-stack{display:grid;gap:10px}.harlo-action-card{overflow:hidden;border:1px solid color-mix(in srgb,var(--harlo-accent,#087f95) 22%,#dbe5ea);border-radius:18px;background:#fff;box-shadow:none}.harlo-action-head{display:flex;gap:11px;padding:15px 15px 12px}.harlo-action-icon{width:36px;height:36px;flex:0 0 36px;border-radius:13px;display:grid;place-items:center;background:color-mix(in srgb,var(--harlo-accent,#087f95) 10%,#fff);color:var(--harlo-accent,#087f95)}.harlo-action-icon .harlo-icon{width:18px;height:18px;stroke-width:2.25}.harlo-action-title{font-size:14px;font-weight:850;color:#111827;letter-spacing:0}.harlo-action-copy{margin:3px 0 0;color:#5f6876;font-size:12.5px;line-height:1.45}.harlo-action-footer{display:grid;gap:8px;padding:0 15px 15px}.harlo-action-button{width:100%;min-height:44px;border:0;border-radius:14px;background:linear-gradient(135deg,var(--harlo-accent,#087f95),color-mix(in srgb,var(--harlo-accent,#087f95) 82%,#111827));color:var(--harlo-accent-text,#fff);font-size:14px;font-weight:850;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;box-shadow:0 14px 28px color-mix(in srgb,var(--harlo-accent,#087f95) 18%,transparent);transition:transform .16s ease,box-shadow .16s ease}.harlo-action-button:hover{transform:translateY(-1px);box-shadow:0 18px 32px color-mix(in srgb,var(--harlo-accent,#087f95) 22%,transparent)}.harlo-action-button .harlo-icon{width:16px;height:16px}.harlo-action-button:disabled{cursor:wait;opacity:.7;transform:none}.harlo-action-note{margin:0;text-align:center;color:#7c8986;font-size:11px;line-height:1.35}.harlo-booking-options{display:grid;gap:8px;padding:0 14px 10px}.harlo-booking-option{width:100%;min-height:58px;border:1px solid #dbe5ea;border-radius:14px;background:#fff;color:#111827;padding:10px 11px;display:flex;align-items:center;gap:10px;text-align:left;cursor:pointer;transition:border-color .16s ease,background .16s ease,transform .16s ease,box-shadow .16s ease}.harlo-booking-option:hover{border-color:var(--harlo-accent,#087f95);background:color-mix(in srgb,var(--harlo-accent,#087f95) 5%,#fff);box-shadow:0 8px 20px rgba(15,23,42,.06);transform:translateY(-1px)}.harlo-booking-option:disabled{cursor:wait;opacity:.7;transform:none}.harlo-booking-logo{width:28px;height:28px;flex:0 0 28px;display:grid;place-items:center}.harlo-booking-logo img{max-width:100%;max-height:100%;object-fit:contain}.harlo-booking-copy{min-width:0;flex:1}.harlo-booking-name{display:block;font-size:13px;font-weight:850;color:#111827;line-height:1.25;letter-spacing:0;white-space:normal}.harlo-booking-meta{display:block;margin-top:5px;color:#657386;font-size:11.5px;font-weight:700;line-height:1.25}.harlo-booking-chevron{width:18px;height:18px;flex:0 0 18px;color:#7c8986}.harlo-slot-list{display:grid;gap:8px;padding:0 15px 14px}.harlo-slot-button{width:100%;min-height:42px;border:1px solid #dbe5ea;border-radius:13px;background:#fbfdff;color:#111827;text-align:left;padding:9px 11px;font-size:13px;font-weight:800;cursor:pointer;transition:border-color .16s ease,background .16s ease,color .16s ease}.harlo-slot-button:hover,.harlo-slot-button[data-selected=true]{border-color:var(--harlo-accent,#087f95);background:color-mix(in srgb,var(--harlo-accent,#087f95) 8%,#fff);color:var(--harlo-accent,#087f95)}.harlo-book-form{display:none;gap:9px;padding:0 15px 15px}.harlo-action-card[data-selected=true] .harlo-book-form{display:grid}.harlo-book-input{width:100%;min-height:40px;border:1px solid #dbe5ea;border-radius:12px;background:#fbfdff;color:#111827;font:inherit;font-size:13px;padding:9px 10px;outline:none}.harlo-book-input:focus{border-color:var(--harlo-accent,#087f95);box-shadow:0 0 0 3px color-mix(in srgb,var(--harlo-accent,#087f95) 12%,transparent)}.harlo-book-status{min-height:17px;color:#5f6876;font-size:11px;font-weight:700;text-align:center}.harlo-book-status[data-error=true]{color:#dc2626}.harlo-book-links{display:flex;justify-content:center;gap:10px;flex-wrap:wrap}.harlo-book-links a{color:var(--harlo-accent,#087f95);font-size:12px;font-weight:800;text-decoration:none}",
    ".harlo-scheduler-modal{position:fixed;inset:0;z-index:2147483646;background:rgba(15,23,42,.56);display:grid;place-items:center;padding:24px;font-family:Inter,system-ui,-apple-system,sans-serif}.harlo-scheduler-dialog{position:relative;width:min(1060px,calc(100vw - 48px));height:min(760px,calc(100vh - 48px));border-radius:20px;overflow:hidden;background:#fff;box-shadow:0 32px 90px rgba(15,23,42,.35)}.harlo-scheduler-frame{width:100%;height:100%;border:0;background:#fff}.harlo-scheduler-close{position:absolute;right:12px;top:12px;width:38px;height:38px;border:0;border-radius:999px;background:rgba(17,24,39,.82);color:#fff;display:grid;place-items:center;cursor:pointer;z-index:2}.harlo-scheduler-close .harlo-icon{width:19px;height:19px}@media(max-width:768px){.harlo-scheduler-modal{padding:0}.harlo-scheduler-dialog{width:100vw;height:100vh;height:100dvh;border-radius:0}}",
    ".harlo-message-time{font-size:11px;color:#7c8986;margin-top:5px}.harlo-entry[data-role=assistant] .harlo-message-time{margin-left:0}.harlo-entry[data-kind=integration-actions] .harlo-message-time{margin-left:0}.harlo-entry[data-role=user] .harlo-message-time{text-align:right;margin-right:2px}.harlo-typing{display:flex;align-items:center;gap:4px;min-width:34px;height:20px}.harlo-typing span{width:6px;height:6px;border-radius:999px;background:var(--harlo-accent,#087f95);opacity:.35;animation:harloTyping 1s infinite ease-in-out}.harlo-typing span:nth-child(2){animation-delay:.14s}.harlo-typing span:nth-child(3){animation-delay:.28s}@keyframes harloTyping{0%,80%,100%{transform:translateY(0);opacity:.35}40%{transform:translateY(-3px);opacity:1}}.harlo-message p{margin:0 0 8px}.harlo-message p:last-child{margin-bottom:0}.harlo-message strong{font-weight:750}.harlo-message ul{display:block;list-style-type:disc!important;list-style-position:outside!important;margin:7px 0 0 0!important;padding-left:22px!important}.harlo-message li{display:list-item!important;list-style-type:disc!important;margin:3px 0;padding-left:2px}.harlo-message li::marker{color:#c4c4c7}",
    ".harlo-suggestions{display:none;width:100%;background:#fff;padding:0 18px 4px}.harlo-suggestions[data-visible=true]{display:block}.harlo-suggestion-stack{display:flex;flex-direction:column;align-items:flex-end;gap:10px;width:100%;margin:0;padding:12px 0 5px}.harlo-suggestion-row{display:flex;justify-content:flex-end;align-items:center;gap:10px;width:auto;max-width:100%;min-width:0}.harlo-prompt{display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;width:auto;max-width:100%;min-height:40px;border:1px solid #e5e7eb;background:#fff;border-radius:999px;padding:11px 16px;font-size:14px;font-weight:500;line-height:1.3;color:#1f2937;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer;box-shadow:0 1px 2px rgba(15,23,42,.04);transition:border-color .16s ease,color .16s ease,background .16s ease,box-shadow .16s ease,transform .16s ease}.harlo-prompt:hover{border-color:var(--harlo-accent,#087f95);background:var(--harlo-accent,#087f95);color:var(--harlo-accent-text,#fff);box-shadow:0 3px 8px rgba(15,23,42,.06);transform:translateY(-1px)}.harlo-meta{font-size:11px;color:#5f6876;margin-top:8px}",
    ".harlo-powered{display:flex;justify-content:center;padding:8px 18px;background:#fff}.harlo-powered-link{display:inline-flex;align-items:center;gap:6px;color:#A1A1A1;font-size:12px;font-weight:400;text-decoration:none}.harlo-powered-link:hover{color:#A1A1A1}.harlo-powered-logo{display:grid;width:17px;height:17px;place-items:center;border-radius:4px;background:#A1A1A1;color:#fff}.harlo-powered-logo .harlo-icon{width:10px;height:10px;stroke:currentColor;stroke-width:2.2}.harlo-powered-link strong{font-weight:500;color:inherit}.harlo-input{position:relative;display:flex;padding:6px 18px 16px;background:#fff}.harlo-input input{width:100%;min-width:0;min-height:45px;border:1px solid #e4e4e7;border-radius:999px;padding:10px 45px 10px 15px;font-size:13.5px;outline:none;background:#fff;box-shadow:0 4px 14px rgba(15,23,42,.09);transition:border-color .16s ease,box-shadow .16s ease}.harlo-input input:focus{border-color:var(--harlo-accent,#087f95);background:#fff;box-shadow:0 4px 14px rgba(15,23,42,.09)}.harlo-input button{position:absolute;right:28px;top:14.5px;width:28px;height:28px;display:grid;place-items:center;border:0;border-radius:999px;background:linear-gradient(135deg,var(--harlo-accent,#087f95),color-mix(in srgb,var(--harlo-accent,#087f95) 82%,#111827));color:white;padding:0;cursor:pointer;box-shadow:none;transition:transform .16s ease,filter .16s ease}.harlo-input button:hover{transform:translateY(-1px);filter:brightness(.98)}.harlo-input button .harlo-icon{width:14px;height:14px}.harlo-input button:disabled{opacity:.6;cursor:wait;transform:none}",
    "@media(max-width:768px){.harlo-launcher{right:max(16px,env(safe-area-inset-right));bottom:max(16px,env(safe-area-inset-bottom));width:56px;height:56px}.harlo-launcher .harlo-icon{width:30px;height:30px}.harlo-nudge{left:16px;right:16px;bottom:88px;width:auto;max-width:none;padding:14px 38px 14px 14px;border-radius:16px}.harlo-nudge-text{font-size:14px;line-height:1.4}.harlo-nudge-close{right:8px;top:8px}.harlo-nudge[data-side=right]:after{right:42px}.harlo-nudge[data-side=left]:after{left:42px}.harlo-panel{inset:0;width:100vw;height:100vh;height:100dvh;max-height:none;border:0;border-radius:0;box-shadow:none}.harlo-panel[data-open=true]{animation:harloPanelSheetIn .2s ease-out}.harlo-panel[data-open=true]~.harlo-launcher{display:none}.harlo-head{min-height:62px;padding:calc(13px + env(safe-area-inset-top)) 18px 13px}.harlo-mark{width:34px;height:34px;border-radius:999px}.harlo-close{width:32px;height:32px}.harlo-body{padding:14px;font-size:14px;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}.harlo-entry[data-continued=true]{margin-left:0}.harlo-assistant-row{max-width:100%}.harlo-message{max-width:90%;padding:11px 12px;border-radius:15px}.harlo-entry[data-role=assistant] .harlo-message-time{margin-left:0}.harlo-entry[data-kind=integration-actions] .harlo-message-time{margin-left:0}.harlo-suggestions{padding:0 16px 4px}.harlo-powered{padding:8px 16px}.harlo-input{padding:6px 16px max(15px,calc(env(safe-area-inset-bottom) + 3px))}.harlo-input input{font-size:16px;padding:10px 43px 10px 15px}.harlo-input button{right:26px;top:14.5px;width:28px;height:28px}}@keyframes harloPanelSheetIn{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}"
  ].join("");
  document.head.appendChild(style);

  var brandIcon = '<svg class="harlo-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0z"></path><path d="M20 3v4"></path><path d="M22 5h-4"></path><path d="M4 17v2"></path><path d="M5 18H3"></path></svg>';
  var messageIcon = '<svg class="harlo-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4.75 17.25 4 20l3.2-.86A8.5 8.5 0 1 0 3.5 12a8.46 8.46 0 0 0 1.25 5.25Z"></path><path d="M8.5 12h.01"></path><path d="M12 12h.01"></path><path d="M15.5 12h.01"></path></svg>';
  var chevronDownIcon = '<svg class="harlo-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>';
  var sendIcon = '<svg class="harlo-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 19V5"></path><path d="m5 12 7-7 7 7"></path></svg>';
  var alertIcon = '<svg class="harlo-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>';
  var mailIcon = '<svg class="harlo-icon" viewBox="0 0 24 24" aria-hidden="true"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a2 2 0 0 1-2.06 0L2 7"></path></svg>';
  var calendarIcon = '<svg class="harlo-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path></svg>';
  var externalLinkIcon = '<svg class="harlo-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg>';
  var chevronRightIcon = '<svg class="harlo-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"></path></svg>';
  var xIcon = '<svg class="harlo-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>';
  root.innerHTML = '<section class="harlo-panel" aria-label="Harlo chat"><div class="harlo-head"><div class="harlo-head-inner"><div class="harlo-mark">' + brandIcon + '</div><div class="harlo-title">Harlo AI Agent</div></div><button class="harlo-close" aria-label="Minimize chat"></button></div><div class="harlo-body"></div><div class="harlo-suggestions"></div><div class="harlo-powered"><a class="harlo-powered-link" href="https://harloai.co/" target="_blank" rel="noopener noreferrer" aria-label="Powered by Harlo"><span class="harlo-powered-logo">' + brandIcon + '</span><span>Powered by <strong>Harlo</strong></span></a></div><form class="harlo-input"><input aria-label="Message" placeholder="Ask a question..." autocomplete="off" /><button aria-label="Send message">' + sendIcon + '</button></form></section><div class="harlo-nudge" data-visible="false" data-side="right"><button class="harlo-nudge-text" type="button"></button><button class="harlo-nudge-close" type="button" aria-label="Dismiss greeting">&times;</button></div><button class="harlo-launcher" aria-label="Open Harlo chat">' + messageIcon + '</button>';

  var panel = root.querySelector(".harlo-panel");
  var launcher = root.querySelector(".harlo-launcher");
  var close = root.querySelector(".harlo-close");
  var body = root.querySelector(".harlo-body");
  var suggestions = root.querySelector(".harlo-suggestions");
  var form = root.querySelector(".harlo-input");
  var input = root.querySelector(".harlo-input input");
  var submit = root.querySelector(".harlo-input button");
  var title = root.querySelector(".harlo-title");
  var mark = root.querySelector(".harlo-mark");
  var powered = root.querySelector(".harlo-powered");
  var nudge = root.querySelector(".harlo-nudge");
  var nudgeText = root.querySelector(".harlo-nudge-text");
  var nudgeClose = root.querySelector(".harlo-nudge-close");

  launcher.addEventListener("click", function () {
    if (suppressLauncherClick) {
      suppressLauncherClick = false;
      return;
    }
    var nextOpen = panel.getAttribute("data-open") === "true" ? "false" : "true";
    panel.setAttribute("data-open", nextOpen);
    updateLauncherIcon();
    hideGreetingNudge();
    if (nextOpen === "true") {
      input.focus();
    }
  });
  close.addEventListener("click", function () {
    panel.setAttribute("data-open", "false");
    updateLauncherIcon();
  });
  nudgeText.addEventListener("click", function () {
    hideGreetingNudge();
    panel.setAttribute("data-open", "true");
    updateLauncherIcon();
    input.focus();
  });
  nudgeClose.addEventListener("click", function () {
    greetingDismissals[greetingNudgeScope] = true;
    try {
      window.sessionStorage.setItem(greetingNudgeStorageKey, "true");
    } catch (error) {}
    hideGreetingNudge();
  });
  launcher.addEventListener("pointerdown", startLauncherDrag);
  launcher.addEventListener("pointermove", moveLauncherDrag);
  launcher.addEventListener("pointerup", finishLauncherDrag);
  launcher.addEventListener("pointercancel", cancelLauncherDrag);
  window.addEventListener("resize", function () {
    setLauncherPosition(launcherPosition);
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

  function getWidgetTitle() {
    var businessName = getBusinessLabel();
    var configuredTitle = config && config.theme && typeof config.theme.title === "string" ? config.theme.title.trim() : "";
    var legacyDefault =
      configuredTitle === "Ask Harlo" ||
      configuredTitle === "Ask " + businessName ||
      configuredTitle === "Ask Harlo AI Agent" ||
      configuredTitle === "Ask " + businessName + " AI Agent";
    return !configuredTitle || legacyDefault ? businessName + " AI Agent" : configuredTitle;
  }

  function defaultGreetingMessage() {
    return "👋 Hi! I can help answer questions about " + getBusinessLabel() + ".";
  }

  function setLauncherPosition(position) {
    var isLeft = position === "bottom-left";
    var isMobile = window.matchMedia("(max-width: 768px)").matches;
    var leftOffset = isMobile ? "max(16px, env(safe-area-inset-left))" : "24px";
    var rightOffset = isMobile ? "max(16px, env(safe-area-inset-right))" : "24px";
    launcherPosition = isLeft ? "bottom-left" : "bottom-right";
    launcher.style.left = isLeft ? leftOffset : "auto";
    launcher.style.right = isLeft ? "auto" : rightOffset;
    nudge.setAttribute("data-side", isLeft ? "left" : "right");

    if (isMobile) {
      nudge.style.left = "";
      nudge.style.right = "";
      panel.style.left = "";
      panel.style.right = "";
      return;
    }

    nudge.style.left = isLeft ? leftOffset : "";
    nudge.style.right = isLeft ? "" : rightOffset;
    panel.style.left = isLeft ? leftOffset : "";
    panel.style.right = isLeft ? "" : rightOffset;
  }

  function startLauncherDrag(event) {
    if (event.button !== undefined && event.button !== 0) return;
    launcherDrag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      currentX: event.clientX,
      moved: false
    };
    launcher.setPointerCapture(event.pointerId);
  }

  function moveLauncherDrag(event) {
    if (!launcherDrag || launcherDrag.pointerId !== event.pointerId) return;
    launcherDrag.currentX = event.clientX;
    var deltaX = event.clientX - launcherDrag.startX;

    if (!launcherDrag.moved && Math.abs(deltaX) < 6) return;
    launcherDrag.moved = true;
    hideGreetingNudge();
    launcher.setAttribute("data-dragging", "true");
    launcher.style.transform = "translateX(" + deltaX + "px)";
  }

  function finishLauncherDrag(event) {
    if (!launcherDrag || launcherDrag.pointerId !== event.pointerId) return;
    var wasMoved = launcherDrag.moved;
    var finalX = launcherDrag.currentX;
    launcherDrag = null;
    launcher.removeAttribute("data-dragging");
    launcher.style.transform = "";

    if (launcher.hasPointerCapture(event.pointerId)) {
      launcher.releasePointerCapture(event.pointerId);
    }

    if (!wasMoved) return;
    suppressLauncherClick = true;
    window.setTimeout(function () {
      suppressLauncherClick = false;
    }, 0);
    setLauncherPosition(finalX < window.innerWidth / 2 ? "bottom-left" : "bottom-right");
    storeLauncherPosition();
  }

  function cancelLauncherDrag(event) {
    if (!launcherDrag || launcherDrag.pointerId !== event.pointerId) return;
    launcherDrag = null;
    launcher.removeAttribute("data-dragging");
    launcher.style.transform = "";
  }

  function storeLauncherPosition() {
    if (!launcherPositionStorageKey) return;
    try {
      window.localStorage.setItem(launcherPositionStorageKey, launcherPosition);
    } catch {}
  }

  function getStoredLauncherPosition() {
    if (!launcherPositionStorageKey) return "";
    try {
      var storedPosition = window.localStorage.getItem(launcherPositionStorageKey);
      return storedPosition === "bottom-left" || storedPosition === "bottom-right" ? storedPosition : "";
    } catch {
      return "";
    }
  }

  function hideGreetingNudge() {
    nudge.setAttribute("data-visible", "false");
    if (greetingNudgeTimer) {
      window.clearTimeout(greetingNudgeTimer);
      greetingNudgeTimer = null;
    }
  }

  function showGreetingNudge(message) {
    if (greetingNudgeShown) return;
    if (greetingDismissals[greetingNudgeScope]) return;
    if (panel.getAttribute("data-open") === "true") return;
    nudgeText.textContent = String(message || "").trim() || "👋 Hi! How can I help?";
    nudge.setAttribute("data-visible", "true");
    greetingNudgeShown = true;
  }

  function scheduleGreetingNudge(message, delay) {
    if (greetingNudgeShown) return;
    if (greetingDismissals[greetingNudgeScope]) return;
    if (greetingNudgeTimer) window.clearTimeout(greetingNudgeTimer);
    greetingNudgeTimer = window.setTimeout(function () {
      greetingNudgeTimer = null;
      showGreetingNudge(message);
    }, typeof delay === "number" ? delay : 2600);
  }

  function render(scrollToBottom) {
    if (scrollToBottom === undefined) scrollToBottom = true;
    body.innerHTML = "";
    messages.forEach(function (message, index) {
      var previousMessage = messages[index - 1] || null;
      var nextMessage = messages[index + 1] || null;
      var continuesAssistantGroup = message.role === "assistant" && previousMessage && previousMessage.role === "assistant";
      var hasNextAssistantMessage = message.role === "assistant" && nextMessage && nextMessage.role === "assistant";
      var entry = document.createElement("div");
      entry.className = "harlo-entry";
      entry.setAttribute("data-message-index", String(index));
      entry.setAttribute("data-role", message.role);
      entry.setAttribute("data-kind", message.kind || "message");
      if (continuesAssistantGroup) {
        entry.setAttribute("data-continued", "true");
      }

      var bubble = document.createElement("div");
      bubble.className = "harlo-message";
      bubble.setAttribute("data-role", message.role);
      bubble.setAttribute("data-kind", message.kind || "message");
      if (message.streaming) {
        bubble.setAttribute("data-streaming", "true");
      }
      bubble.appendChild(message.loading ? createTypingIndicator() : formatMessage(message.content, message.kind, message.payload));

      if (message.role === "assistant" && !continuesAssistantGroup) {
        var row = document.createElement("div");
        row.className = "harlo-assistant-row";
        row.appendChild(bubble);
        entry.appendChild(row);
      } else if (message.role === "assistant") {
        entry.appendChild(bubble);
      } else {
        entry.appendChild(bubble);
      }

      if (!message.loading && !message.streaming && !hasNextAssistantMessage) {
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
    if (messages.length > 0 && activeMessageReveals === 0) {
      render(false);
    }
  }, 15000);


  function renderSuggestions() {
    suggestions.innerHTML = "";
    var defaultPrompts = ["What services do you offer?", "What is " + getBusinessLabel() + "?", "Can I book a demo?"];
    var configuredPrompts = config && config.theme && Array.isArray(config.theme.welcomePrompts)
      ? config.theme.welcomePrompts
        .filter(function (prompt) { return typeof prompt === "string" && prompt.trim(); })
        .map(function (prompt) {
          var trimmed = prompt.trim();
          if (trimmed.toLowerCase() === "how much does it cost?") {
            return "What is " + getBusinessLabel() + "?";
          }
          return trimmed.toLowerCase() === "i want to book a demo" ? "Can I book a demo?" : prompt;
        })
      : [];
    var promptsToShow = config && messages.length === 1
      ? (configuredPrompts.length ? configuredPrompts : defaultPrompts)
      : [];
    promptsToShow = promptsToShow.slice(0, 4);

    if (!promptsToShow.length) {
      suggestions.setAttribute("data-visible", "false");
      return;
    }

    suggestions.setAttribute("data-visible", "true");
    var prompts = document.createElement("div");
    prompts.className = "harlo-suggestion-stack";
    prompts.setAttribute("aria-label", "Suggested questions");
    buildSuggestionRows(promptsToShow).forEach(function (row) {
      var rowElement = document.createElement("div");
      rowElement.className = "harlo-suggestion-row";
      rowElement.setAttribute("data-row-size", row.length > 1 ? "pair" : "single");
      row.forEach(function (prompt) {
        var button = document.createElement("button");
        button.className = "harlo-prompt";
        button.type = "button";
        button.textContent = prompt;
        button.addEventListener("click", function () {
          sendMessage(prompt);
        });
        rowElement.appendChild(button);
      });
      prompts.appendChild(rowElement);
    });
    suggestions.appendChild(prompts);
  }

  function buildSuggestionRows(promptsForRows) {
    var ordered = promptsForRows
      .map(function (prompt, index) {
        var text = String(prompt || "").trim();
        return {
          text: text,
          index: index,
          width: text.length
        };
      })
      .filter(function (item) { return item.text; })
      .sort(function (a, b) {
        if (a.width === b.width) return a.index - b.index;
        return a.width - b.width;
      })
      .map(function (item) { return item.text; });

    if (ordered.length <= 2) {
      return ordered.map(function (prompt) { return [prompt]; });
    }

    if (ordered.length === 3) {
      return [[ordered[0]], [ordered[1]], [ordered[2]]];
    }

    return [[ordered[2]], [ordered[3]], [ordered[0], ordered[1]]];
  }

  function addMessage(role, content, kind, payload) {
    messages.push({ role: role, content: content, kind: kind || "message", payload: payload || null, createdAt: Date.now(), loading: false });
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
    var text = normalizeAssistantText(content);
    var message = {
      role: "assistant",
      content: "",
      kind: kind || "message",
      payload: null,
      createdAt: Date.now(),
      loading: false,
      streaming: true
    };
    messages.push(message);
    render();
    activeMessageReveals += 1;

    var index = messages.length - 1;
    var bubble = root.querySelector('.harlo-entry[data-message-index="' + index + '"] .harlo-message');
    var positions = getStreamChunkPositions(text);
    var chunkIndex = 0;
    var resizeAnimation = null;

    if (!bubble || !positions.length) {
      finishStreamingMessage();
      return;
    }

    bubble.innerHTML = "";
    bubble.appendChild(formatMessage(text, kind));
    var finalBubbleWidth = bubble.getBoundingClientRect().width;
    bubble.style.width = finalBubbleWidth + "px";
    bubble.innerHTML = "";

    function revealNextChunk() {
      if (resizeAnimation) {
        resizeAnimation.cancel();
        resizeAnimation = null;
      }
      var shouldFollowContent = body.scrollHeight - body.scrollTop - body.clientHeight < 90;
      var previousHeight = bubble.getBoundingClientRect().height;
      message.content = text.slice(0, positions[chunkIndex]);
      bubble.innerHTML = "";
      bubble.appendChild(formatMessage(message.content, kind));
      var nextHeight = bubble.getBoundingClientRect().height;

      if (typeof bubble.animate === "function") {
        resizeAnimation = bubble.animate(
          [
            { height: previousHeight + "px" },
            { height: nextHeight + "px" }
          ],
          { duration: 150, easing: "cubic-bezier(.2,.8,.2,1)" }
        );
      }

      if (shouldFollowContent) {
        if (typeof body.scrollTo === "function") {
          body.scrollTo({ top: body.scrollHeight, behavior: "smooth" });
        } else {
          body.scrollTop = body.scrollHeight;
        }
      }
      chunkIndex += 1;

      if (chunkIndex < positions.length) {
        window.setTimeout(revealNextChunk, getStreamChunkDelay(message.content));
        return;
      }

      window.setTimeout(finishStreamingMessage, 160);
    }

    function finishStreamingMessage() {
      if (resizeAnimation) resizeAnimation.cancel();
      message.content = text;
      message.streaming = false;
      activeMessageReveals = Math.max(0, activeMessageReveals - 1);
      render();
      if (done) done();
    }

    revealNextChunk();
  }

  function getStreamChunkPositions(text) {
    var positions = [];
    var linePattern = /[^\\n]*(?:\\n|$)/g;
    var lineMatch;

    while ((lineMatch = linePattern.exec(text))) {
      var line = lineMatch[0];
      if (!line) break;
      var lineStart = lineMatch.index;
      var lineEnd = lineStart + line.length;
      var visibleLine = line.replace(/\\n$/, "");

      if (!visibleLine.trim() || /^\\s*[-*•]\\s+/.test(visibleLine)) {
        positions.push(lineEnd);
        continue;
      }

      var wordPattern = /\\S+(?:\\s+|$)/g;
      var wordMatch;
      var wordsInChunk = 0;

      while ((wordMatch = wordPattern.exec(line))) {
        wordsInChunk += 1;
        if (wordsInChunk === 3) {
          positions.push(lineStart + wordMatch.index + wordMatch[0].length);
          wordsInChunk = 0;
        }
      }

      if (positions[positions.length - 1] !== lineEnd) {
        positions.push(lineEnd);
      }
    }

    if (positions[positions.length - 1] !== text.length) {
      positions.push(text.length);
    }

    return positions.filter(function (position, index) {
      return position > 0 && (index === 0 || position > positions[index - 1]);
    });
  }

  function getStreamChunkDelay(revealedText) {
    var trimmed = String(revealedText || "").trimEnd();
    if (/\\n\\s*\\n$/.test(revealedText)) return 180;
    if (/[.!?]["')\\]]?$/.test(trimmed)) return 150;
    if (/[,;:]["')\\]]?$/.test(trimmed)) return 105;
    return 60;
  }

  function formatMessage(content, kind, payload) {
    if (kind === "billing-limit" || kind === "billing-limit-sent") return formatBillingLimitMessage(content, kind);
    if (kind === "lead-form") return formatLeadCaptureForm(payload);
    if (kind === "integration-actions") return formatIntegrationActions(payload);
    var wrapper = document.createElement("div");
    var lines = String(content || "").split("\\n").map(function (line) { return line.trim(); }).filter(Boolean);
    var list = null;

    lines.forEach(function (line, index) {
      var bullet = line.match(/^(?:[-*•](?:\\s+|$))(.*)$/);
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
        appendInlineFormatting(item, bullet ? bullet[1] : line);
        list.appendChild(item);
        return;
      }

      list = null;
      var paragraph = document.createElement("p");
      appendInlineFormatting(paragraph, line);
      wrapper.appendChild(paragraph);
    });

    if (lines.length === 0) {
      wrapper.textContent = content;
    }

    return wrapper;
  }

  function appendInlineFormatting(target, text) {
    var source = String(text || "");
    var pattern = /\\*\\*([^*]+)\\*\\*/g;
    var cursor = 0;
    var match;

    while ((match = pattern.exec(source))) {
      if (match.index > cursor) {
        target.appendChild(document.createTextNode(source.slice(cursor, match.index).replace(/\\*\\*/g, "")));
      }
      var strong = document.createElement("strong");
      strong.textContent = match[1];
      target.appendChild(strong);
      cursor = match.index + match[0].length;
    }

    if (cursor < source.length) {
      target.appendChild(document.createTextNode(source.slice(cursor).replace(/\\*\\*/g, "")));
    }
  }

  function normalizeAssistantText(content) {
    return String(content || "")
      .replace(/\\s*—\\s*/g, ", ")
      .replace(/[ \\t]+,\\s*,/g, ",");
  }

  function addLeadCaptureForm(formPayload) {
    if (!formPayload || !Array.isArray(formPayload.fields) || formPayload.fields.length === 0) return;
    addMessage("assistant", "", "lead-form", formPayload);
  }

  function addIntegrationActions(actions) {
    if (!Array.isArray(actions) || actions.length === 0) return;
    addMessage("assistant", "", "integration-actions", { actions: actions });
  }

  function formatIntegrationActions(payload) {
    var actions = payload && Array.isArray(payload.actions) ? payload.actions : [];
    var stack = document.createElement("div");
    stack.className = "harlo-action-stack";
    var bookingActions = actions.filter(function (action) {
      return action && action.type === "booking" && action.url;
    });

    if (bookingActions.length > 1) {
      stack.appendChild(formatBookingOptionsCard(bookingActions));
      return stack;
    }

    bookingActions.forEach(function (action) {
      var card = document.createElement("div");
      card.className = "harlo-action-card";
      var head = document.createElement("div");
      head.className = "harlo-action-head";
      var icon = document.createElement("div");
      icon.className = "harlo-action-icon";
      icon.innerHTML = calendarIcon;
      var copyWrap = document.createElement("div");
      var heading = document.createElement("div");
      heading.className = "harlo-action-title";
      heading.textContent = action.title || "Book a time";
      var copy = document.createElement("p");
      copy.className = "harlo-action-copy";
      copy.textContent = action.description || "Choose an available time that works for you.";
      copyWrap.appendChild(heading);
      copyWrap.appendChild(copy);
      head.appendChild(icon);
      head.appendChild(copyWrap);
      card.appendChild(head);

      if (action.url) {
        attachSchedulerButton(card, action);
      }

      stack.appendChild(card);
    });

    if (!stack.childNodes.length) {
      stack.textContent = "";
    }

    return stack;
  }

  function formatBookingOptionsCard(actions) {
    var provider = actions[0] && actions[0].provider;
    var card = document.createElement("div");
    card.className = "harlo-action-card";
    var head = document.createElement("div");
    head.className = "harlo-action-head";
    var icon = document.createElement("div");
    icon.className = "harlo-action-icon";
    icon.innerHTML = calendarIcon;
    var copyWrap = document.createElement("div");
    var heading = document.createElement("div");
    heading.className = "harlo-action-title";
    heading.textContent = "Book a time";
    var copy = document.createElement("p");
    copy.className = "harlo-action-copy";
    copy.textContent = "Choose a meeting type.";
    copyWrap.appendChild(heading);
    copyWrap.appendChild(copy);
    head.appendChild(icon);
    head.appendChild(copyWrap);
    card.appendChild(head);

    var list = document.createElement("div");
    list.className = "harlo-booking-options";
    actions.forEach(function (action) {
      list.appendChild(createBookingOptionButton(action));
    });
    card.appendChild(list);
    appendBookingProviderNote(card, provider);

    return card;
  }

  function createBookingOptionButton(action) {
    var button = document.createElement("button");
    button.className = "harlo-booking-option";
    button.type = "button";
    var logo = document.createElement("span");
    logo.className = "harlo-booking-logo";
    logo.appendChild(createProviderLogo(action.provider));
    var copy = document.createElement("span");
    copy.className = "harlo-booking-copy";
    var name = document.createElement("span");
    name.className = "harlo-booking-name";
    name.textContent = action.title || "Book a time";
    var meta = document.createElement("span");
    meta.className = "harlo-booking-meta";
    meta.textContent = getBookingMeta(action);
    copy.appendChild(name);
    copy.appendChild(meta);
    var chevron = document.createElement("span");
    chevron.className = "harlo-booking-chevron";
    chevron.innerHTML = chevronRightIcon;
    button.appendChild(logo);
    button.appendChild(copy);
    button.appendChild(chevron.firstChild);
    button.addEventListener("click", function () {
      button.disabled = true;
      openSchedulerPopup(action).catch(function () {
        window.open(action.url, "_blank", "noopener,noreferrer");
      }).finally(function () {
        button.disabled = false;
      });
    });

    return button;
  }

  function getBookingMeta(action) {
    var description = typeof action.description === "string" ? action.description : "";
    var duration = description.match(/\\b\\d+\\s*min\\b/i);

    return duration ? duration[0] : getBookingProviderName(action.provider);
  }

  function createProviderLogo(provider) {
    var img = document.createElement("img");
    img.alt = "";
    img.src = provider === "calcom"
      ? "https://www.google.com/s2/favicons?domain=cal.com&sz=128"
      : "https://www.google.com/s2/favicons?domain=calendly.com&sz=128";

    return img;
  }

  function getBookingProviderName(provider) {
    return provider === "calcom" ? "Cal.com" : "Calendly";
  }

  function appendBookingProviderNote(card, provider) {
    var footer = document.createElement("div");
    footer.className = "harlo-action-footer";
    var note = document.createElement("p");
    note.className = "harlo-action-note";
    note.textContent = "Powered by " + getBookingProviderName(provider);
    footer.appendChild(note);
    card.appendChild(footer);
  }

  function attachSchedulerButton(card, action) {
    var footer = document.createElement("div");
    footer.className = "harlo-action-footer";
    var button = document.createElement("button");
    button.className = "harlo-action-button";
    button.type = "button";
    button.textContent = action.buttonLabel || "Open scheduler";
    var buttonIcon = document.createElement("span");
    buttonIcon.innerHTML = externalLinkIcon;
    button.appendChild(buttonIcon.firstChild);
    var note = document.createElement("p");
    note.className = "harlo-action-note";
    note.textContent = action.provider === "calcom" ? "Powered by Cal.com" : "Powered by Calendly";
    footer.appendChild(button);
    footer.appendChild(note);
    card.appendChild(footer);

    button.addEventListener("click", function () {
      button.disabled = true;
      openSchedulerPopup(action).catch(function () {
        window.open(action.url, "_blank", "noopener,noreferrer");
      }).finally(function () {
        button.disabled = false;
      });
    });
  }

  function openSchedulerPopup(action) {
    if (action.provider === "calcom") {
      return openCalcomModal(action.url);
    }

    return openCalendlyPopup(action.url);
  }

  function openCalendlyPopup(url) {
    return loadCalendlyAssets().then(function () {
      if (!window.Calendly || !window.Calendly.initPopupWidget) throw new Error("Calendly popup unavailable.");
      panel.setAttribute("data-open", "false");
      updateLauncherIcon();
      window.Calendly.initPopupWidget({ url: url });
    });
  }

  function loadCalendlyAssets() {
    if (window.Calendly && window.Calendly.initPopupWidget) {
      return Promise.resolve();
    }

    if (calendlyLoadPromise) {
      return calendlyLoadPromise;
    }

    calendlyLoadPromise = new Promise(function (resolve, reject) {
      if (!document.querySelector('link[href="' + calendlyCssUrl + '"]')) {
        var stylesheet = document.createElement("link");
        stylesheet.href = calendlyCssUrl;
        stylesheet.rel = "stylesheet";
        document.head.appendChild(stylesheet);
      }

      var existing = document.querySelector('script[src="' + calendlyScriptUrl + '"]');
      if (existing) {
        existing.addEventListener("load", function () { resolve(); }, { once: true });
        existing.addEventListener("error", function () { reject(new Error("Calendly failed to load.")); }, { once: true });
        window.setTimeout(function () {
          if (window.Calendly && window.Calendly.initPopupWidget) resolve();
        }, 100);
        return;
      }

      var script = document.createElement("script");
      script.src = calendlyScriptUrl;
      script.async = true;
      script.addEventListener("load", function () { resolve(); }, { once: true });
      script.addEventListener("error", function () { reject(new Error("Calendly failed to load.")); }, { once: true });
      document.head.appendChild(script);
    });

    return calendlyLoadPromise;
  }

  function openCalcomModal(url) {
    return new Promise(function (resolve, reject) {
      if (!url) {
        reject(new Error("Cal.com scheduler URL is missing."));
        return;
      }

      var existing = document.querySelector(".harlo-scheduler-modal");
      if (existing) existing.remove();

      var modal = document.createElement("div");
      modal.className = "harlo-scheduler-modal";
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      var dialog = document.createElement("div");
      dialog.className = "harlo-scheduler-dialog";
      var close = document.createElement("button");
      close.className = "harlo-scheduler-close";
      close.type = "button";
      close.setAttribute("aria-label", "Close scheduler");
      close.innerHTML = xIcon;
      var frame = document.createElement("iframe");
      frame.className = "harlo-scheduler-frame";
      frame.title = "Cal.com scheduler";
      frame.src = url;
      frame.loading = "eager";
      dialog.appendChild(close);
      dialog.appendChild(frame);
      modal.appendChild(dialog);
      document.body.appendChild(modal);
      panel.setAttribute("data-open", "false");
      updateLauncherIcon();

      var closeModal = function () {
        modal.remove();
        document.removeEventListener("keydown", handleKeydown);
      };
      var handleKeydown = function (event) {
        if (event.key === "Escape") closeModal();
      };

      close.addEventListener("click", closeModal);
      modal.addEventListener("click", function (event) {
        if (event.target === modal) closeModal();
      });
      document.addEventListener("keydown", handleKeydown);
      resolve();
    });
  }

  function formatLeadCaptureForm(payload) {
    payload.values = payload.values && typeof payload.values === "object" ? payload.values : {};
    var card = document.createElement("form");
    card.className = "harlo-lead-card";
    card.noValidate = true;

    var head = document.createElement("div");
    head.className = "harlo-lead-head";
    var icon = document.createElement("div");
    icon.className = "harlo-lead-icon";
    icon.innerHTML = mailIcon;
    var copyWrap = document.createElement("div");
    var heading = document.createElement("div");
    heading.className = "harlo-lead-title";
    heading.textContent = payload.title || "Share your details";
    var copy = document.createElement("p");
    copy.className = "harlo-lead-copy";
    copy.textContent = payload.description || "Send these once and the team will have everything they need to follow up.";
    copyWrap.appendChild(heading);
    copyWrap.appendChild(copy);
    head.appendChild(icon);
    head.appendChild(copyWrap);
    card.appendChild(head);

    var fieldsWrap = document.createElement("div");
    fieldsWrap.className = "harlo-lead-fields";
    payload.fields.forEach(function (field) {
      var fieldWrap = document.createElement("label");
      fieldWrap.className = "harlo-lead-field";
      fieldWrap.setAttribute("data-key", field.key);

      var label = document.createElement("span");
      label.className = "harlo-lead-label";
      var labelText = document.createElement("span");
      labelText.textContent = field.label || field.prompt || "Detail";
      label.appendChild(labelText);
      if (field.required) {
        var required = document.createElement("span");
        required.className = "harlo-lead-required";
        required.textContent = "Required";
        label.appendChild(required);
      }

      var input = document.createElement("input");
      input.className = "harlo-lead-input";
      input.name = field.key;
      input.type = field.type === "email" ? "email" : field.type === "phone" ? "tel" : field.type === "date" ? "date" : "text";
      input.placeholder = field.prompt || field.label || "";
      input.required = field.required === true;
      input.autocomplete = getLeadAutocomplete(field);
      input.value = payload.values[field.key] || "";

      var error = document.createElement("span");
      error.className = "harlo-lead-error";
      error.textContent = field.type === "email" ? "Enter a valid email." : "This field is required.";

      input.addEventListener("input", function () {
        payload.values[field.key] = input.value;
        fieldWrap.removeAttribute("data-error");
        input.removeAttribute("aria-invalid");
      });

      fieldWrap.appendChild(label);
      fieldWrap.appendChild(input);
      fieldWrap.appendChild(error);
      fieldsWrap.appendChild(fieldWrap);
    });
    card.appendChild(fieldsWrap);

    var actions = document.createElement("div");
    actions.className = "harlo-lead-actions";
    var submitButton = document.createElement("button");
    submitButton.className = "harlo-lead-submit";
    submitButton.type = "submit";
    submitButton.textContent = "Send details";
    var note = document.createElement("p");
    note.className = "harlo-lead-note";
    note.textContent = "Your details will be shared with " + getBusinessLabel() + ".";
    actions.appendChild(submitButton);
    actions.appendChild(note);
    card.appendChild(actions);

    if (payload.submitted) {
      card.setAttribute("data-submitted", "true");
      submitButton.textContent = "Sent";
      Array.prototype.forEach.call(card.querySelectorAll("input,button"), function (element) {
        element.disabled = true;
      });
    }

    card.addEventListener("submit", function (event) {
      event.preventDefault();
      if (card.getAttribute("data-submitted") === "true") return;
      var details = [];
      var isValid = true;

      payload.fields.forEach(function (field) {
        var fieldWrap = card.querySelector('[data-key="' + cssEscape(field.key) + '"]');
        var input = fieldWrap && fieldWrap.querySelector("input");
        var value = input ? input.value.trim() : "";
        payload.values[field.key] = value;
        var invalidEmail = field.type === "email" && value && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value);
        var missingRequired = field.required === true && !value;

        if (missingRequired || invalidEmail) {
          isValid = false;
          if (fieldWrap) fieldWrap.setAttribute("data-error", "true");
          if (input) input.setAttribute("aria-invalid", "true");
          return;
        }

        if (value) {
          details.push((field.label || field.key) + ": " + formatLeadFormValue(field, value));
        }
      });

      if (!isValid || details.length === 0) return;

      payload.submitted = true;
      card.setAttribute("data-submitted", "true");
      Array.prototype.forEach.call(card.querySelectorAll("input,button"), function (element) {
        element.disabled = true;
      });
      submitButton.textContent = "Sending...";
      sendMessage("Lead capture details:\\n" + details.join("\\n"), { displayText: "I shared my details." });
    });

    return card;
  }

  function cssEscape(value) {
    if (window.CSS && typeof window.CSS.escape === "function") return window.CSS.escape(value);
    return String(value || "").replace(/[^a-zA-Z0-9_-]/g, "");
  }

  function getLeadAutocomplete(field) {
    if (field.key === "name") return "name";
    if (field.type === "email" || field.key === "email") return "email";
    if (field.type === "phone" || field.key === "phone") return "tel";
    if (field.key === "company") return "organization";
    return "off";
  }

  function formatLeadFormValue(field, value) {
    if (field.type === "date") {
      var date = String(value || "").match(/^(\\d{4})-(\\d{2})-(\\d{2})$/);
      if (date) return Number(date[2]) + "/" + Number(date[3]) + "/" + date[1];
    }

    return value;
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

  function sendMessage(text, options) {
    options = options || {};
    var closeoutOnly = isCloseoutMessage(text);
    var shouldAttachToCompletedConversation = !conversationId && completedConversationId && closeoutOnly;
    var outgoingConversationId = conversationId || (shouldAttachToCompletedConversation ? completedConversationId : "");

    if (!conversationId && !shouldAttachToCompletedConversation) {
      clearCompletedConversationId();
    }

    input.value = "";
    input.disabled = true;
    submit.disabled = true;
    addMessage("user", options.displayText || text);
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
          if (conversationStorageKey && conversationId) {
            window.localStorage.setItem(conversationStorageKey, conversationId);
          }
        } else if (shouldAttachToCompletedConversation || closeoutOnly) {
          clearCompletedConversationId();
          clearActiveConversationId();
        } else if (conversationStorageKey && conversationId) {
          if (completedConversationId && completedConversationId !== conversationId) {
            clearCompletedConversationId();
          }
          window.localStorage.setItem(conversationStorageKey, conversationId);
        }
        if (result.json.billingLimitReached) {
          revealAssistantMessage(result.json.answer, pauseAfterMessage, result.json.billingAlertSent ? "billing-limit-sent" : "billing-limit");
          return;
        }
        if (Array.isArray(result.json.widgetActions) && result.json.widgetActions.length > 0) {
          revealAssistantMessage(result.json.answer, function () {
            addIntegrationActions(result.json.widgetActions);
            finish();
          });
          return;
        }
        if (result.json.leadCaptureForm && !result.json.leadCaptured) {
          revealAssistantMessage(result.json.answer, function () {
            addLeadCaptureForm(result.json.leadCaptureForm);
            finish();
          });
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
      launcherPositionStorageKey = "harlo:launcher-position:" + botId;
      completedConversationId = getStoredCompletedConversationId();
      // The widget does not restore its transcript, so a reload should begin a
      // new visible conversation instead of silently continuing an old one.
      clearActiveConversationId();
      title.textContent = getWidgetTitle();
      setAccent(config.theme.accent);
      renderBrandMark(mark);
      setLauncherPosition(getStoredLauncherPosition() || config.theme.launcherPosition);
      if (powered && config.removeBranding) powered.style.display = "none";
      greetingMessage = config.greeting || defaultGreetingMessage();
      addMessage("assistant", greetingMessage);
      revealWidget();
      if (!suppressGreetingNudge) scheduleGreetingNudge(greetingMessage);
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
