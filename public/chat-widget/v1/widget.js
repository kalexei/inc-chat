;(function () {
  const DEFAULTS = {
    src: "https://chat.example.com/embed",
    messageId: "rak-inc-chat",
    iframeId: "rak-inc-chat-iframe",
    // Initial size before the first postMessage arrives.
    // The embed page sends exact dimensions via ResizeObserver so this is
    // only visible for the ~100ms it takes the page to load.
    initialSize: 90,
    right: 12,
    bottom: 12,
    zIndex: 2147483647,
    closeAnimationDelayMs: 280,
    // Lock this down in production, e.g. ["https://chat.example.com"].
    allowedOrigins: null,
  };

  let activeInstance = null;

  function clampSize(w, h, right, bottom) {
    const maxW = window.innerWidth - right - 4;
    const maxH = window.innerHeight - bottom - 4;
    return {
      w: Math.max(56, Math.min(w, maxW)),
      h: Math.max(56, Math.min(h, maxH)),
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
    if (existing) existing.remove();

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
      width: config.initialSize + "px",
      height: config.initialSize + "px",
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

    // Track the last applied size for window-resize re-clamping.
    let lastW = config.initialSize;
    let lastH = config.initialSize;
    // Dimensions waiting to be applied after the close animation.
    let pendingW = null;
    let pendingH = null;
    let closeTimer = null;
    let isOpen = false;

    function applySize(w, h) {
      const s = clampSize(w, h, config.right, config.bottom);
      lastW = s.w;
      lastH = s.h;
      iframe.style.width  = s.w + "px";
      iframe.style.height = s.h + "px";
    }

    function onMessage(event) {
      if (!isAllowedOrigin(event.origin, config.allowedOrigins)) return;

      const data = event.data || {};
      if (data.source !== "rak-inc-chat" || data.id !== config.messageId) return;
      if (typeof data.open !== "boolean") return;

      // Dimensions are required; old-format messages without them are ignored.
      if (typeof data.width !== "number" || typeof data.height !== "number") return;

      const wasOpen = isOpen;
      isOpen = data.open;

      if (data.open) {
        // Opening: cancel any pending close and expand immediately.
        if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; pendingW = null; pendingH = null; }
        applySize(data.width, data.height);
      } else if (wasOpen) {
        // Transitioning from open → closed: wait for the close animation,
        // but keep updating pendingW/H so we apply the freshest value.
        pendingW = data.width;
        pendingH = data.height;
        if (!closeTimer) {
          closeTimer = setTimeout(function () {
            closeTimer = null;
            if (pendingW !== null) {
              applySize(pendingW, pendingH);
              pendingW = null;
              pendingH = null;
            }
          }, config.closeAnimationDelayMs);
        }
      } else {
        // Already closed (e.g. bubble appeared/disappeared while closed).
        if (closeTimer) {
          // Close timer still running — update pending dims but don't restart timer.
          pendingW = data.width;
          pendingH = data.height;
        } else {
          applySize(data.width, data.height);
        }
      }
    }

    function onResize() {
      // Re-clamp to the latest known dims when the browser window is resized.
      const w = pendingW !== null ? pendingW : lastW;
      const h = pendingH !== null ? pendingH : lastH;
      applySize(w, h);
    }

    // Tell the embed page how much vertical space is available so it can
    // constrain the panel height and avoid being cropped by the viewport.
    function sendAvailHeight() {
      if (!iframe.contentWindow) return;
      var avail = window.innerHeight - config.bottom - 32; // 32px top safety margin
      iframe.contentWindow.postMessage(
        { source: "rak-inc-chat-host", availHeight: avail },
        "*"
      );
    }

    iframe.addEventListener("load", sendAvailHeight);

    var _onResize = onResize;
    onResize = function () {
      _onResize();
      sendAvailHeight();
    };

    window.addEventListener("message", onMessage);
    window.addEventListener("resize", onResize);

    return {
      destroy: function () {
        if (closeTimer) clearTimeout(closeTimer);
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
