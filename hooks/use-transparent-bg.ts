"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * Makes the document background transparent so the iframe
 * doesn't paint an opaque rectangle on the host page.
 * Restores original styles on unmount (skipping the first
 * cleanup to avoid a flash during Strict-Mode double-mount).
 */
export function useTransparentBg() {
  const skipRef = useRef(true);

  useLayoutEffect(() => {
    const html = document.documentElement.style;
    const body = document.body.style;

    const prev = {
      htmlBg: html.background,
      bodyBg: body.background,
      htmlBgColor: html.backgroundColor,
      bodyBgColor: body.backgroundColor,
      htmlBgImg: html.backgroundImage,
      bodyBgImg: body.backgroundImage,
    };

    html.background = "transparent";
    body.background = "transparent";
    html.setProperty("background-color", "transparent", "important");
    body.setProperty("background-color", "transparent", "important");
    html.backgroundImage = "none";
    body.backgroundImage = "none";

    return () => {
      if (skipRef.current) {
        skipRef.current = false;
        return;
      }
      html.background = prev.htmlBg;
      body.background = prev.bodyBg;
      html.backgroundColor = prev.htmlBgColor;
      body.backgroundColor = prev.bodyBgColor;
      html.backgroundImage = prev.htmlBgImg;
      body.backgroundImage = prev.bodyBgImg;
    };
  }, []);
}
