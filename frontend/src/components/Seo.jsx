import { useEffect } from "react";

function setMeta(attr, key, value, selectorAttr = "name") {
  if (!value) return;
  let el = document.head.querySelector(`meta[${selectorAttr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(selectorAttr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
}

function setLink(rel, href, keyAttr = "rel") {
  if (!href) return;
  const selector = `link[${keyAttr}="${rel}"]`;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute(keyAttr, rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export default function Seo({
  title,
  description,
  canonical,
  robots,
  ogTitle,
  ogDescription,
  jsonLd,
  preloadImage,
}) {
  useEffect(() => {
    if (title) document.title = title;
    setMeta("description", "description", description);
    setMeta("robots", "robots", robots, "name");
    setMeta("og:title", "og:title", ogTitle || title, "property");
    setMeta("og:description", "og:description", ogDescription || description, "property");
    if (canonical) setMeta("og:url", "og:url", canonical, "property");
    setMeta("twitter:title", "twitter:title", ogTitle || title, "name");
    setMeta("twitter:description", "twitter:description", ogDescription || description, "name");
    if (canonical) setLink("canonical", canonical);

    let preloadEl = null;
    if (preloadImage) {
      preloadEl = document.head.querySelector(`link[data-seo-preload="${preloadImage}"]`);
      if (!preloadEl) {
        preloadEl = document.createElement("link");
        preloadEl.setAttribute("rel", "preload");
        preloadEl.setAttribute("as", "image");
        preloadEl.setAttribute("href", preloadImage);
        preloadEl.setAttribute("data-seo-preload", preloadImage);
        document.head.appendChild(preloadEl);
      }
    }

    const scriptIds = [];
    const payloads = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];
    payloads.forEach((payload, idx) => {
      const id = `jsonld-${title || "page"}-${idx}`;
      scriptIds.push(id);
      let script = document.getElementById(id);
      if (!script) {
        script = document.createElement("script");
        script.type = "application/ld+json";
        script.id = id;
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(payload);
    });

    return () => {
      scriptIds.forEach((id) => {
        const script = document.getElementById(id);
        if (script) script.remove();
      });
      if (preloadEl) preloadEl.remove();
    };
  }, [title, description, canonical, robots, ogTitle, ogDescription, jsonLd, preloadImage]);

  return null;
}
