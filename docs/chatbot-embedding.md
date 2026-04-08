# Chatbot Embedding Guide

This guide describes the cleanest way to embed the chatbot in different environments (plain HTML, React, Next.js) and deploy the loader through Cloudflare CDN.

## Recommended Architecture

Use a two-layer setup:

1. **Hosted chat UI** (this app): `https://chat.example.com/embed`
2. **Universal loader script** (vanilla JS): `https://cdn.example.com/chat-widget/v1/widget.js`

Why this is cleaner:

- The host site stays isolated from chatbot CSS and JS (iframe boundary).
- You get one integration path for all frameworks.
- Updating `widget.js` updates all consuming websites.
- You can version safely (`v1`, `v2`) without breaking old integrations.

## Existing Message Contract in This Repo

The embedded page sends:

```ts
{
  source: "rak-inc-chat",
  id: "rak-inc-chat",
  open: boolean
}
```

The host script listens for this to resize the iframe between closed and open states.

## Step 1 - Deploy the Chat UI

Deploy this project so `/embed` is publicly accessible:

- Example: `https://chat.example.com/embed`
- Ensure your backend API is reachable by this deployed app (`SALES_AGENT_API_ORIGIN` or `NEXT_PUBLIC_API_BASE_URL`).

## Step 2 - Use the Ready-Made Loader Script

This repository now includes a production-ready, versioned loader script:

- `public/chat-widget/v1/widget.js`

If this app is deployed, the script is available at:

- `https://<your-chat-domain>/chat-widget/v1/widget.js`

If you prefer Cloudflare CDN, upload the same file to:

- `https://cdn.example.com/chat-widget/v1/widget.js`

### Minimal required changes before production

In `widget.js`, set defaults to your production domains:

- `src` -> `https://chat.example.com/embed`
- `allowedOrigins` -> `["https://chat.example.com"]`

## Step 3 - Host Loader on Cloudflare CDN

You can host the loader with either **Cloudflare R2 + Custom Domain** or **Cloudflare Pages**.

### Option A: Cloudflare R2 + Custom Domain

1. Create an R2 bucket (for example `chat-widget-assets`).
2. Upload `public/chat-widget/v1/widget.js` from this repo to object key `chat-widget/v1/widget.js`.
3. Enable public access (or use signed/CDN access based on your policy).
4. Attach custom domain, for example `cdn.example.com`.
5. Final URL:
   - `https://cdn.example.com/chat-widget/v1/widget.js`

### Option B: Cloudflare Pages

1. Create a small static repo containing the versioned widget file from this repo.
2. Deploy with Cloudflare Pages.
3. Bind custom domain `cdn.example.com`.
4. Publish `widget.js` at:
   - `https://cdn.example.com/chat-widget/v1/widget.js`

### Quick CDN verification

After upload, open the script URL in browser and confirm it returns JS content:

- `https://cdn.example.com/chat-widget/v1/widget.js`

## Step 4 - Embed in Any Website

Canonical example files (kept in this repo):

- `examples/embedding/plain-html.html`
- `examples/embedding/react-chat-widget.tsx`
- `examples/embedding/next-app-router-chat-widget.tsx`
- `examples/embedding/next-pages-router-chat-widget.tsx`

### Plain HTML

```html
<script src="https://cdn.example.com/chat-widget/v1/widget.js" defer></script>
<script>
  window.addEventListener("DOMContentLoaded", function () {
    window.RakChatWidget.init({
      src: "https://chat.example.com/embed",
      messageId: "rak-inc-chat",
      closedSize: 64,
      openWidth: 420,
      openHeight: 820,
      right: 12,
      bottom: 12
    });
  });
</script>
```

### React

```tsx
import { useEffect } from "react";

export function ChatWidget() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.example.com/chat-widget/v1/widget.js";
    script.async = true;
    script.onload = () => {
      // @ts-ignore - global provided by widget.js
      window.RakChatWidget?.init({
        src: "https://chat.example.com/embed",
        messageId: "rak-inc-chat",
      });
    };
    document.body.appendChild(script);
    return () => {
      script.remove();
    };
  }, []);

  return null;
}
```

### Next.js (App Router)

```tsx
"use client";

import Script from "next/script";

export default function ChatWidget() {
  return (
    <>
      <Script
        src="https://cdn.example.com/chat-widget/v1/widget.js"
        strategy="afterInteractive"
        onLoad={() => {
          // @ts-ignore - global provided by widget.js
          window.RakChatWidget?.init({
            src: "https://chat.example.com/embed",
            messageId: "rak-inc-chat",
          });
        }}
      />
    </>
  );
}
```

## Security and Production Checklist

- Validate `event.origin` in `onMessage` (do not keep wildcard trust in production).
- Set CSP `frame-src` on host sites to allow only your chat domain.
- Set CSP `script-src` on host sites to allow only your CDN domain.
- Version immutable widget files (`v1`, `v2`) and avoid breaking changes in-place.
- Add cache headers on CDN:
  - `Cache-Control: public, max-age=31536000, immutable` for versioned paths.
- Keep a stable alias (optional) for latest:
  - `/chat-widget/latest/widget.js` -> points to latest stable version.

## Versioning and Rollout

- Publish new versions under a new path:
  - `.../v2/widget.js`
- Existing integrators remain on v1 until they choose to upgrade.
- This prevents accidental regressions across partner sites.

## Troubleshooting

- **Widget does not appear**:
  - Check browser console for blocked script/CSP errors.
  - Verify `widget.js` URL is reachable.
- **Widget stays button-sized after click**:
  - Ensure `messageId` in `init({...})` is `rak-inc-chat` (or matches the value used by `/embed`).
  - Ensure `allowedOrigins` includes the embed app origin exactly (scheme + host + port).
- **Chat opens but cannot send messages**:
  - Verify backend API origin and CORS/session configuration.
- **Resizing does not work**:
  - Confirm `/embed` sends the expected `postMessage` payload.
- **Works locally but not prod**:
  - Check `event.origin` checks and HTTPS mixed-content issues.

