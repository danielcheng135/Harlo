import { NextResponse } from "next/server";

export function GET() {
  const script = `
(function () {
  var currentScript = document.currentScript;
  var botId = currentScript && currentScript.getAttribute("data-harlo-bot");
  if (!botId || document.getElementById("harlo-widget-root")) return;
  var baseUrl = new URL(currentScript.src).origin;
  window.localStorage.removeItem("harlo:conversation:" + botId);
  var conversationId = "";
  var visitorId = window.localStorage.getItem("harlo:visitor");
  if (!visitorId) {
    visitorId = "visitor_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    window.localStorage.setItem("harlo:visitor", visitorId);
  }
  var messages = [];
  var config = null;

  var root = document.createElement("div");
  root.id = "harlo-widget-root";
  document.body.appendChild(root);

  var style = document.createElement("style");
  style.textContent = ".harlo-launcher{position:fixed;right:24px;bottom:24px;width:56px;height:56px;border-radius:999px;border:0;background:#111827;color:#fff;box-shadow:0 18px 45px rgba(15,23,42,.18);z-index:2147483000;cursor:pointer;display:grid;place-items:center}.harlo-icon{display:block;width:22px;height:22px;stroke:currentColor;fill:none;stroke-width:2.3;stroke-linecap:round;stroke-linejoin:round}.harlo-panel{position:fixed;right:24px;bottom:92px;width:min(390px,calc(100vw - 32px));height:min(620px,calc(100vh - 124px));border:1px solid #e2e8ee;border-radius:12px;background:#fff;box-shadow:0 18px 45px rgba(15,23,42,.16);z-index:2147483000;display:none;overflow:hidden;font-family:Inter,system-ui,-apple-system,sans-serif}.harlo-panel[data-open=true]{display:flex;flex-direction:column}.harlo-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px;border-bottom:1px solid #e2e8ee}.harlo-mark{width:38px;height:38px;display:grid;place-items:center;border-radius:10px;background:#e6f3f6;color:#087f95;font-weight:800}.harlo-mark .harlo-icon{width:20px;height:20px}.harlo-title{font-weight:800;color:#111827;font-size:14px}.harlo-subtitle{font-size:12px;color:#5f6876;margin-top:2px}.harlo-close{border:0;background:transparent;font-size:22px;line-height:1;color:#5f6876;cursor:pointer}.harlo-body{flex:1;overflow:auto;padding:16px;background:#f8fafc;color:#111827;font-size:14px}.harlo-message{display:table;width:fit-content;max-width:86%;padding:11px 12px;border-radius:10px;line-height:1.45;margin:0 0 10px;white-space:normal}.harlo-message[data-role=assistant]{background:var(--harlo-accent,#087f95);color:var(--harlo-accent-text,#fff)}.harlo-message[data-role=user]{margin-left:auto;background:#111827;color:#fff}.harlo-message[data-kind=billing-limit],.harlo-message[data-kind=billing-limit-sent]{display:block;width:auto;max-width:88%;padding:0;background:transparent;color:#111827}.harlo-limit-card{border:1px solid rgba(8,127,149,.16);background:linear-gradient(180deg,#ffffff 0%,#f8fbfc 100%);border-radius:14px;padding:14px;box-shadow:0 14px 34px rgba(15,23,42,.07)}.harlo-limit-head{display:flex;align-items:center;gap:10px;margin-bottom:9px}.harlo-limit-icon{width:28px;height:28px;border-radius:10px;display:grid;place-items:center;background:color-mix(in srgb,var(--harlo-accent,#087f95) 11%,#fff);color:var(--harlo-accent,#087f95)}.harlo-limit-icon .harlo-icon{width:15px;height:15px;stroke-width:2.2}.harlo-limit-title{font-weight:800;color:#111827;font-size:13px;letter-spacing:0}.harlo-limit-copy{color:#4b5b68;font-size:13px;line-height:1.45;margin:0}.harlo-limit-note{display:inline-flex;align-items:center;gap:6px;margin-top:11px;border:0;border-radius:999px;background:color-mix(in srgb,var(--harlo-accent,#087f95) 10%,#fff);padding:6px 9px;color:#087f95;font-size:12px;font-weight:800}.harlo-limit-note:before{content:'';width:6px;height:6px;border-radius:999px;background:var(--harlo-accent,#087f95)}.harlo-message .harlo-limit-copy{margin:0}.harlo-message-time{max-width:86%;font-size:11px;color:#7c8986;margin:-4px 0 10px 2px}.harlo-typing{display:flex;align-items:center;gap:4px;min-width:34px;height:20px}.harlo-typing span{width:6px;height:6px;border-radius:999px;background:var(--harlo-accent-text,#fff);opacity:.35;animation:harloTyping 1s infinite ease-in-out}.harlo-typing span:nth-child(2){animation-delay:.14s}.harlo-typing span:nth-child(3){animation-delay:.28s}@keyframes harloTyping{0%,80%,100%{transform:translateY(0);opacity:.35}40%{transform:translateY(-3px);opacity:1}}.harlo-message p{margin:0 0 8px}.harlo-message p:last-child{margin-bottom:0}.harlo-message ul{display:block;list-style-type:disc!important;list-style-position:outside!important;margin:7px 0 0 0!important;padding-left:22px!important}.harlo-message li{display:list-item!important;list-style-type:disc!important;margin:3px 0;padding-left:2px}.harlo-prompts{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.harlo-prompt{border:1px solid #e2e8ee;background:#fff;border-radius:999px;padding:7px 10px;font-size:12px;color:#111827;cursor:pointer}.harlo-meta{font-size:11px;color:#5f6876;margin-top:8px}.harlo-input{display:flex;gap:8px;padding:12px;border-top:1px solid #e2e8ee;background:#fff}.harlo-input input{flex:1;min-width:0;border:1px solid #e2e8ee;border-radius:8px;padding:10px;font-size:14px;outline:none}.harlo-input input:focus{border-color:var(--harlo-accent,#087f95)}.harlo-input button{width:46px;height:42px;display:grid;place-items:center;border:0;border-radius:8px;background:#087f95;color:white;padding:0;cursor:pointer}.harlo-input button .harlo-icon{width:18px;height:18px}.harlo-input button:disabled{opacity:.6;cursor:wait}@media(max-width:480px){.harlo-panel{right:12px;left:12px;bottom:84px;width:auto}.harlo-launcher{right:18px;bottom:18px}}";
  document.head.appendChild(style);

  var brandIcon = '<svg class="harlo-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0z"></path><path d="M20 3v4"></path><path d="M22 5h-4"></path><path d="M4 17v2"></path><path d="M5 18H3"></path></svg>';
  var messageIcon = '<svg class="harlo-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"></path></svg>';
  var sendIcon = '<svg class="harlo-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z"></path><path d="M22 2 11 13"></path></svg>';
  var alertIcon = '<svg class="harlo-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>';
  root.innerHTML = '<section class="harlo-panel" aria-label="Harlo chat"><div class="harlo-head"><div style="display:flex;align-items:center;gap:10px"><div class="harlo-mark">' + brandIcon + '</div><div><div class="harlo-title">Ask Harlo</div><div class="harlo-subtitle">Usually replies instantly</div></div></div><button class="harlo-close" aria-label="Close chat">×</button></div><div class="harlo-body"></div><form class="harlo-input"><input aria-label="Message" placeholder="Ask a question..." autocomplete="off" /><button aria-label="Send message">' + sendIcon + '</button></form></section><button class="harlo-launcher" aria-label="Open Harlo chat">' + messageIcon + '</button>';

  var panel = root.querySelector(".harlo-panel");
  var launcher = root.querySelector(".harlo-launcher");
  var close = root.querySelector(".harlo-close");
  var body = root.querySelector(".harlo-body");
  var form = root.querySelector(".harlo-input");
  var input = root.querySelector(".harlo-input input");
  var submit = root.querySelector(".harlo-input button");
  var title = root.querySelector(".harlo-title");
  var mark = root.querySelector(".harlo-mark");

  launcher.addEventListener("click", function () {
    var nextOpen = panel.getAttribute("data-open") === "true" ? "false" : "true";
    panel.setAttribute("data-open", nextOpen);
    if (nextOpen === "true") input.focus();
  });
  close.addEventListener("click", function () {
    panel.setAttribute("data-open", "false");
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var text = input.value.trim();
    if (!text) return;
    sendMessage(text);
  });

  function setAccent(accent) {
    var color = accent || "#087f95";
    var textColor = readableTextColor(color);
    root.style.setProperty("--harlo-accent", color);
    root.style.setProperty("--harlo-accent-text", textColor);
    launcher.style.background = color;
    launcher.style.color = textColor;
    submit.style.background = color;
    submit.style.color = textColor;
    mark.style.background = color;
    mark.style.color = textColor;
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

  function setLauncherPosition(position) {
    var isLeft = position === "bottom-left";
    launcher.style.left = isLeft ? "24px" : "";
    launcher.style.right = isLeft ? "auto" : "24px";
    panel.style.left = isLeft ? "24px" : "";
    panel.style.right = isLeft ? "auto" : "24px";
  }

  function render(scrollToBottom) {
    if (scrollToBottom === undefined) scrollToBottom = true;
    body.innerHTML = "";
    messages.forEach(function (message) {
      var bubble = document.createElement("div");
      bubble.className = "harlo-message";
      bubble.setAttribute("data-role", message.role);
      bubble.setAttribute("data-kind", message.kind || "message");
      bubble.appendChild(message.loading ? createTypingIndicator() : formatMessage(message.content, message.kind));
      body.appendChild(bubble);
      if (message.role === "assistant") {
        var time = document.createElement("div");
        time.className = "harlo-message-time";
        time.textContent = relativeTime(message.createdAt);
        body.appendChild(time);
      }
    });

    if (messages.length === 1 && config && config.theme && config.theme.welcomePrompts) {
      var prompts = document.createElement("div");
      prompts.className = "harlo-prompts";
      config.theme.welcomePrompts.forEach(function (prompt) {
        var button = document.createElement("button");
        button.className = "harlo-prompt";
        button.type = "button";
        button.textContent = prompt;
        button.addEventListener("click", function () {
          sendMessage(prompt);
        });
        prompts.appendChild(button);
      });
      body.appendChild(prompts);
    }

    if (scrollToBottom) {
      body.scrollTop = body.scrollHeight;
    }
  }

  window.setInterval(function () {
    if (messages.some(function (message) { return message.role === "assistant"; })) {
      render(false);
    }
  }, 15000);

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

  function relativeTime(createdAt) {
    var seconds = Math.max(0, Math.floor((Date.now() - createdAt) / 1000));
    if (seconds < 5) return "just now";
    if (seconds < 60) return seconds + "s ago";
    var minutes = Math.floor(seconds / 60);
    if (minutes < 60) return minutes + "m ago";
    var hours = Math.floor(minutes / 60);
    return hours + "h ago";
  }

  function updateMessage(index, content, kind) {
    if (!messages[index]) return;
    messages[index].content = content;
    if (kind) messages[index].kind = kind;
    messages[index].loading = false;
    render();
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
    var card = document.createElement("div");
    card.className = "harlo-limit-card";
    var head = document.createElement("div");
    head.className = "harlo-limit-head";
    var icon = document.createElement("div");
    icon.className = "harlo-limit-icon";
    icon.innerHTML = alertIcon;
    var titleText = document.createElement("div");
    titleText.className = "harlo-limit-title";
    titleText.textContent = "Temporarily unavailable";
    head.appendChild(icon);
    head.appendChild(titleText);
    var copy = document.createElement("p");
    copy.className = "harlo-limit-copy";
    copy.textContent = String(content || "The chatbot cannot reply right now. Please contact the business directly for help.");
    var note = document.createElement("div");
    note.className = "harlo-limit-note";
    note.textContent = kind === "billing-limit-sent" ? "Business notified" : "Contact the business directly";
    card.appendChild(head);
    card.appendChild(copy);
    card.appendChild(note);
    return card;
  }

  function sendMessage(text) {
    input.value = "";
    input.disabled = true;
    submit.disabled = true;
    addMessage("user", text);
    addLoadingMessage();

    function finish() {
      input.disabled = false;
      submit.disabled = false;
      input.focus();
    }

    fetch(baseUrl + "/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        botId: botId,
        conversationId: conversationId || undefined,
        message: text,
        visitor: {
          anonymousId: visitorId,
          pageUrl: window.location.href,
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
          conversationId = "";
          window.localStorage.removeItem("harlo:conversation:" + botId);
        }
        if (result.json.billingLimitReached) {
          revealAssistantMessage(result.json.answer, finish, result.json.billingAlertSent ? "billing-limit-sent" : "billing-limit");
          return;
        }
        revealAssistantMessage(result.json.answer, finish);
      })
      .catch(function () {
        messages.pop();
        revealAssistantMessage("Sorry, I could not answer that right now.", finish);
      });
  }

  fetch(baseUrl + "/api/widget/config?botId=" + encodeURIComponent(botId))
    .then(function (response) { return response.json().then(function (json) { return { ok: response.ok, json: json }; }); })
    .then(function (result) {
      if (!result.ok) {
        throw new Error(result.json && result.json.error ? result.json.error : "Widget unavailable.");
      }
      config = result.json;
      title.textContent = config.theme.title || config.name || "Ask Harlo";
      setAccent(config.theme.accent);
      setLauncherPosition(config.theme.launcherPosition);
      addMessage("assistant", config.greeting || "Hi, I can help answer questions about this business.");
    })
    .catch(function (error) {
      addMessage("assistant", error.message || "Harlo is unavailable right now.");
    });
})();`;

  return new NextResponse(script, {
    headers: {
      "content-type": "application/javascript; charset=utf-8",
      "cache-control": "no-store, max-age=0"
    }
  });
}
