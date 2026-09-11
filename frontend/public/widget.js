/**
 * AI Conversation & Sales Suite — Standalone Embeddable Web Widget
 * Version: 2.4.0 (Production Bundle)
 * 
 * Embed syntax:
 * <script 
 *   src="https://your-domain.com/widget.js" 
 *   data-tenant="org-default"
 *   data-color="#2563EB"
 *   data-position="bottom-right"
 *   data-title="Store Support & Sales AI">
 * </script>
 */
(function () {
  if (window.__AI_SALES_SUITE_WIDGET_LOADED__) return;
  window.__AI_SALES_SUITE_WIDGET_LOADED__ = true;

  // 1. Extract script configuration
  const currentScript =
    document.currentScript ||
    (function () {
      const scripts = document.getElementsByTagName("script");
      return scripts[scripts.length - 1];
    })();

  const scriptSrc = currentScript ? currentScript.src : "";
  let apiBaseUrl = "";
  try {
    const parsed = new URL(scriptSrc);
    apiBaseUrl = parsed.origin;
  } catch (e) {
    apiBaseUrl = window.location.origin;
  }

  const tenantId = (currentScript && currentScript.dataset.tenant) || "org-default";
  const brandColor = (currentScript && currentScript.dataset.color) || "#2563EB";
  const position = (currentScript && currentScript.dataset.position) || "bottom-right";
  const widgetTitle = (currentScript && currentScript.dataset.title) || "AI Support & Sales";
  const agentSubtitle = (currentScript && currentScript.dataset.subtitle) || "Replies instantaneously";

  // 2. State
  let isOpen = false;
  let isTyping = false;
  let messages = [
    {
      id: "w-welcome",
      sender: "agent",
      text: "Hello! Welcome to our store. How can I help you find products, track an order, or answer questions today?",
      time: "Just now"
    }
  ];

  // Try to load cached messages from sessionStorage
  try {
    const cached = sessionStorage.getItem(`ai_suite_msgs_${tenantId}`);
    if (cached) {
      messages = JSON.parse(cached);
    }
  } catch (e) {}

  function saveMessages() {
    try {
      sessionStorage.setItem(`ai_suite_msgs_${tenantId}`, JSON.stringify(messages));
    } catch (e) {}
  }

  // 3. Inject Styles
  const styleEl = document.createElement("style");
  styleEl.textContent = `
    #ai-suite-widget-container {
      position: fixed;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      box-sizing: border-box;
    }
    #ai-suite-widget-container * {
      box-sizing: border-box;
    }
    .ai-suite-pos-bottom-right {
      bottom: 24px;
      right: 24px;
    }
    .ai-suite-pos-bottom-left {
      bottom: 24px;
      left: 24px;
    }
    #ai-suite-launcher {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: ${brandColor};
      color: #ffffff;
      border: none;
      outline: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
      position: relative;
    }
    #ai-suite-launcher:hover {
      transform: scale(1.08);
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.22);
    }
    #ai-suite-launcher:active {
      transform: scale(0.95);
    }
    #ai-suite-badge {
      position: absolute;
      top: -2px;
      right: -2px;
      width: 14px;
      height: 14px;
      background: #10B981;
      border: 2.5px solid #FFFFFF;
      border-radius: 50%;
    }
    #ai-suite-chatbox {
      display: none;
      position: absolute;
      bottom: 76px;
      width: 380px;
      max-width: calc(100vw - 32px);
      height: 560px;
      max-height: calc(100vh - 110px);
      background: #FFFFFF;
      border-radius: 18px;
      box-shadow: 0 16px 40px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(15, 23, 42, 0.08);
      overflow: hidden;
      flex-direction: column;
      animation: aiSuiteSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .ai-suite-pos-bottom-right #ai-suite-chatbox {
      right: 0;
    }
    .ai-suite-pos-bottom-left #ai-suite-chatbox {
      left: 0;
    }
    @keyframes aiSuiteSlideUp {
      from { opacity: 0; transform: translateY(16px) scale(0.96); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    #ai-suite-header {
      background: ${brandColor};
      color: #FFFFFF;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    }
    #ai-suite-header-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    #ai-suite-header-avatar {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    #ai-suite-header-title {
      font-size: 14px;
      font-weight: 700;
      line-height: 1.2;
    }
    #ai-suite-header-sub {
      font-size: 11px;
      opacity: 0.85;
      display: flex;
      align-items: center;
      gap: 5px;
      margin-top: 3px;
    }
    .ai-suite-pulse-dot {
      width: 6px;
      height: 6px;
      background: #10B981;
      border-radius: 50%;
      display: inline-block;
    }
    #ai-suite-close-btn {
      background: transparent;
      border: none;
      color: #FFFFFF;
      font-size: 20px;
      cursor: pointer;
      opacity: 0.8;
      transition: opacity 0.15s ease;
      line-height: 1;
      padding: 4px;
    }
    #ai-suite-close-btn:hover {
      opacity: 1;
    }
    #ai-suite-chips-bar {
      background: #F8FAFC;
      padding: 8px 12px;
      display: flex;
      gap: 6px;
      overflow-x: auto;
      border-bottom: 1px solid #E2E8F0;
      white-space: nowrap;
      scrollbar-width: none;
    }
    #ai-suite-chips-bar::-webkit-scrollbar {
      display: none;
    }
    .ai-suite-chip {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      color: #334155;
      font-size: 11px;
      font-weight: 600;
      padding: 5px 10px;
      border-radius: 20px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .ai-suite-chip:hover {
      background: #EFF6FF;
      color: #1D4ED8;
      border-color: #BFDBFE;
    }
    #ai-suite-messages {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      background: #F8FAFC;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .ai-suite-msg {
      max-width: 82%;
      padding: 10px 14px;
      border-radius: 14px;
      font-size: 12.5px;
      line-height: 1.45;
      word-wrap: break-word;
    }
    .ai-suite-msg-agent {
      align-self: flex-start;
      background: #FFFFFF;
      color: #1E293B;
      border: 1px solid #E2E8F0;
      border-bottom-left-radius: 4px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04);
    }
    .ai-suite-msg-user {
      align-self: flex-end;
      background: ${brandColor};
      color: #FFFFFF;
      border-bottom-right-radius: 4px;
    }
    .ai-suite-msg-time {
      font-size: 9.5px;
      margin-top: 4px;
      opacity: 0.65;
    }
    .ai-suite-typing {
      align-self: flex-start;
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      padding: 8px 14px;
      border-radius: 14px;
      display: inline-flex;
      gap: 4px;
      align-items: center;
    }
    .ai-suite-typing-dot {
      width: 6px;
      height: 6px;
      background: ${brandColor};
      border-radius: 50%;
      animation: aiSuiteBounce 1.2s infinite ease-in-out;
    }
    .ai-suite-typing-dot:nth-child(2) { animation-delay: 0.2s; }
    .ai-suite-typing-dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes aiSuiteBounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }
    #ai-suite-input-form {
      padding: 12px 14px;
      background: #FFFFFF;
      border-top: 1px solid #E2E8F0;
      display: flex;
      gap: 8px;
      align-items: center;
    }
    #ai-suite-input {
      flex: 1;
      border: 1px solid #E2E8F0;
      background: #F8FAFC;
      border-radius: 10px;
      padding: 9px 12px;
      font-size: 12.5px;
      color: #1E293B;
      outline: none;
      transition: border-color 0.15s;
    }
    #ai-suite-input:focus {
      border-color: ${brandColor};
      background: #FFFFFF;
    }
    #ai-suite-send-btn {
      background: ${brandColor};
      color: #FFFFFF;
      border: none;
      border-radius: 10px;
      padding: 9px 14px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.15s;
    }
    #ai-suite-send-btn:hover {
      opacity: 0.9;
    }
    #ai-suite-footer-tag {
      text-align: center;
      padding: 4px 0 6px;
      background: #FFFFFF;
      font-size: 9.5px;
      color: #94A3B8;
      border-top: 1px solid #F1F5F9;
    }
  `;
  document.head.appendChild(styleEl);

  // 4. Create DOM
  const container = document.createElement("div");
  container.id = "ai-suite-widget-container";
  container.className = position === "bottom-left" ? "ai-suite-pos-bottom-left" : "ai-suite-pos-bottom-right";

  container.innerHTML = `
    <!-- Launcher Button -->
    <button id="ai-suite-launcher" aria-label="Open AI Chat Assistant">
      <svg id="ai-suite-icon-chat" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
      <svg id="ai-suite-icon-close" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display: none;">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
      <span id="ai-suite-badge"></span>
    </button>

    <!-- Chatbox Window -->
    <div id="ai-suite-chatbox">
      <!-- Header -->
      <div id="ai-suite-header">
        <div id="ai-suite-header-info">
          <div id="ai-suite-header-avatar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
            </svg>
          </div>
          <div>
            <div id="ai-suite-header-title">${widgetTitle}</div>
            <div id="ai-suite-header-sub">
              <span class="ai-suite-pulse-dot"></span>
              <span>${agentSubtitle}</span>
            </div>
          </div>
        </div>
        <button id="ai-suite-close-btn" aria-label="Close Chat">✕</button>
      </div>

      <!-- Quick Chips Bar -->
      <div id="ai-suite-chips-bar">
        <button class="ai-suite-chip" data-query="Where is my order #12345?">📦 Track order #12345</button>
        <button class="ai-suite-chip" data-query="What is your return policy?">🔄 Return policy</button>
        <button class="ai-suite-chip" data-query="What discount or promo do you have?">🏷️ Any discounts?</button>
      </div>

      <!-- Message History -->
      <div id="ai-suite-messages"></div>

      <!-- Input Form -->
      <form id="ai-suite-input-form">
        <input id="ai-suite-input" type="text" placeholder="Type a message or order inquiry..." autocomplete="off" />
        <button id="ai-suite-send-btn" type="submit">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </form>

      <!-- Footer Branding -->
      <div id="ai-suite-footer-tag">
        Powered by AI Conversation & Sales Suite
      </div>
    </div>
  `;

  document.body.appendChild(container);

  // 5. DOM References
  const launcher = container.querySelector("#ai-suite-launcher");
  const chatbox = container.querySelector("#ai-suite-chatbox");
  const iconChat = container.querySelector("#ai-suite-icon-chat");
  const iconClose = container.querySelector("#ai-suite-icon-close");
  const closeBtn = container.querySelector("#ai-suite-close-btn");
  const messagesEl = container.querySelector("#ai-suite-messages");
  const form = container.querySelector("#ai-suite-input-form");
  const input = container.querySelector("#ai-suite-input");
  const chipsBar = container.querySelector("#ai-suite-chips-bar");

  function renderMessages() {
    messagesEl.innerHTML = "";
    messages.forEach(function (m) {
      const el = document.createElement("div");
      el.className = "ai-suite-msg " + (m.sender === "agent" ? "ai-suite-msg-agent" : "ai-suite-msg-user");
      el.innerHTML = `
        <div>${m.text}</div>
        <div class="ai-suite-msg-time">${m.time}</div>
      `;
      messagesEl.appendChild(el);
    });

    if (isTyping) {
      const typingEl = document.createElement("div");
      typingEl.className = "ai-suite-typing";
      typingEl.innerHTML = `
        <span class="ai-suite-typing-dot"></span>
        <span class="ai-suite-typing-dot"></span>
        <span class="ai-suite-typing-dot"></span>
      `;
      messagesEl.appendChild(typingEl);
    }

    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function toggleChat(forceOpen) {
    isOpen = typeof forceOpen === "boolean" ? forceOpen : !isOpen;
    if (isOpen) {
      chatbox.style.display = "flex";
      iconChat.style.display = "none";
      iconClose.style.display = "block";
      renderMessages();
      setTimeout(() => input.focus(), 150);
    } else {
      chatbox.style.display = "none";
      iconChat.style.display = "block";
      iconClose.style.display = "none";
    }
  }

  launcher.addEventListener("click", () => toggleChat());
  closeBtn.addEventListener("click", () => toggleChat(false));

  chipsBar.addEventListener("click", function (e) {
    const chip = e.target.closest(".ai-suite-chip");
    if (chip && chip.dataset.query) {
      input.value = chip.dataset.query;
      form.dispatchEvent(new Event("submit"));
    }
  });

  async function handleSend(text) {
    if (!text.trim() || isTyping) return;

    const userMsg = {
      id: "u-" + Date.now(),
      sender: "user",
      text: text.trim(),
      time: "Just now"
    };

    messages.push(userMsg);
    saveMessages();
    input.value = "";
    isTyping = true;
    renderMessages();

    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Organization-Id": tenantId
        },
        body: JSON.stringify({
          message: text.trim(),
          conversationId: "conv-external-widget-" + tenantId,
          customerName: "Website Visitor",
          history: messages.slice(-6).map((m) => ({
            role: m.sender === "user" ? "user" : "assistant",
            content: m.text
          }))
        })
      });

      const data = await res.json();
      isTyping = false;

      const replyText =
        data.reply ||
        (data.success && data.reply) ||
        "I've received your inquiry! Our support team is processing your request.";

      messages.push({
        id: "a-" + Date.now(),
        sender: "agent",
        text: replyText,
        time: "Just now"
      });
      saveMessages();
      renderMessages();
    } catch (err) {
      isTyping = false;
      messages.push({
        id: "a-err-" + Date.now(),
        sender: "agent",
        text: "Thank you for reaching out! Our live assistant is online. Let me know if you have any questions about products, discounts, or orders.",
        time: "Just now"
      });
      saveMessages();
      renderMessages();
    }
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    handleSend(input.value);
  });

  // Initial Render
  renderMessages();
})();
