;(function () {
  const DEFAULTS = {
    src: "https://chat.example.com/embed",
    messageId: "rak-inc-chat",
    iframeId: "rak-inc-chat-iframe",
    closedSize: 64,
    openWidth: 420,
    openHeight: 820,
    right: 12,
    bottom: 12,
    zIndex: 2147483647,
    closeAnimationDelayMs: 280,
    // Lock this down in production, e.g. ["https://chat.example.com"].
    allowedOrigins: null,
  };

  let activeInstance = null;

  function clampSize(targetW, targetH, right, bottom) {
    const maxW = window.innerWidth - right - 4;
    const maxH = window.innerHeight - bottom - 4;

    return {
      w: Math.max(56, Math.min(targetW, maxW)),
      h: Math.max(56, Math.min(targetH, maxH)),
    };
  }

  function isAllowedOrigin(origin, allowedOrigins) {
    if (!Array.isArray(allowedOrigins) || allowedOrigins.length === 0) {
      return true;
    }

    return allowedOrigins.indexOf(origin) !== -1;
  }

  function createWidget(userConfig) {
    const config = Object.assign({}, DEFAULTS, userConfig || {});

    const existing = document.getElementById(config.iframeId);
    if (existing) {
      existing.remove();
    }

    const iframe = document.createElement("iframe");
    iframe.id = config.iframeId;
    iframe.title = "Innovation City Chatbot";
    iframe.src = config.src;
    iframe.loading = "lazy";
    iframe.allow = "clipboard-read; clipboard-write";

    Object.assign(iframe.style, {
      position: "fixed",
      right: config.right + "px",
      bottom: config.bottom + "px",
      width: config.closedSize + "px",
      height: config.closedSize + "px",
      border: "0",
      borderRadius: "0",
      background: "transparent",
      boxShadow: "none",
      overflow: "hidden",
      zIndex: String(config.zIndex),
      display: "block",
      padding: "0",
    });

    document.body.appendChild(iframe);

    let isOpen = false;
    let closeTimer = null;

    function applySize(open) {
      const targetW = open ? config.openWidth : config.closedSize;
      const targetH = open ? config.openHeight : config.closedSize;
      const next = clampSize(targetW, targetH, config.right, config.bottom);
      iframe.style.width = next.w + "px";
      iframe.style.height = next.h + "px";
    }

    function setOpen(open) {
      isOpen = !!open;
      if (closeTimer) window.clearTimeout(closeTimer);

      if (isOpen) {
        applySize(true);
        return;
      }

      closeTimer = window.setTimeout(function () {
        applySize(false);
      }, config.closeAnimationDelayMs);
    }

    function onMessage(event) {
      if (!isAllowedOrigin(event.origin, config.allowedOrigins)) {
        return;
      }

      const data = event.data || {};
      if (data.source !== "rak-inc-chat" || data.id !== config.messageId) return;
      if (typeof data.open !== "boolean") return;

      setOpen(data.open);
    }

    function onResize() {
      applySize(isOpen);
    }

    window.addEventListener("message", onMessage);
    window.addEventListener("resize", onResize);
    applySize(false);

    return {
      open: function () {
        setOpen(true);
      },
      close: function () {
        setOpen(false);
      },
      destroy: function () {
        if (closeTimer) window.clearTimeout(closeTimer);
        window.removeEventListener("message", onMessage);
        window.removeEventListener("resize", onResize);
        iframe.remove();
      },
    };
  }

  window.RakChatWidget = {
    init: function (config) {
      if (activeInstance && typeof activeInstance.destroy === "function") {
        activeInstance.destroy();
      }

      activeInstance = createWidget(config);
      return activeInstance;
    },
    destroy: function () {
      if (activeInstance && typeof activeInstance.destroy === "function") {
        activeInstance.destroy();
      }
      activeInstance = null;
    },
  };
})();

