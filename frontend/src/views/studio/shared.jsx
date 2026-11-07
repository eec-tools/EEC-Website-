"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiErrorDetail } from "@/lib/api";

export const CHANNELS = {
  linkedin_company: { label: "LinkedIn · EEC page", short: "LI", color: "#0A66C2" },
  linkedin_shirali: { label: "LinkedIn · Shirali (retired)", short: "LI", color: "#0A66C2", retired: true },
  instagram: { label: "Instagram", short: "IG", color: "#C13584" },
  facebook: { label: "Facebook", short: "FB", color: "#1877F2" },
};

// One colour per status, used the same way in lists, the calendar and pills:
// waiting amber, changing orange, approved or queued blue, posted green, failed red, everything finished grey.
export const STATUS = {
  pending: { label: "Waiting for approval", short: "Waiting", tone: "bg-amber-50 text-amber-800 border-amber-200", dot: "bg-amber-500" },
  changes_requested: { label: "Change requested", short: "Changing", tone: "bg-orange-50 text-orange-800 border-orange-200", dot: "bg-orange-500" },
  approved: { label: "Approved", short: "Approved", tone: "bg-sky-50 text-sky-800 border-sky-200", dot: "bg-sky-500" },
  scheduled: { label: "Queued in Buffer", short: "Queued", tone: "bg-sky-50 text-sky-800 border-sky-200", dot: "bg-sky-500" },
  posting: { label: "Sending", short: "Sending", tone: "bg-sky-50 text-sky-800 border-sky-200", dot: "bg-sky-500" },
  posted: { label: "Posted", short: "Posted", tone: "bg-emerald-50 text-emerald-800 border-emerald-200", dot: "bg-emerald-500" },
  missed: { label: "Missed", short: "Missed", tone: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" },
  failed: { label: "Failed", short: "Failed", tone: "bg-red-50 text-red-800 border-red-200", dot: "bg-red-500" },
  dropped: { label: "Dropped", short: "Dropped", tone: "bg-slate-100 text-slate-500 border-slate-200", dot: "bg-slate-300" },
};

export function fmtLocal(iso, tz, opts = {}) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: tz || "Asia/Kolkata",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    ...opts,
  }).format(new Date(iso));
}

export function localDateTime(iso, tz) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(new Date(iso))
      .map((x) => [x.type, x.value])
  );
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}

export async function call(method, url, body, { success } = {}) {
  try {
    const { data } = await api.request({ method, url, data: body });
    if (success) toast.success(success);
    return data;
  } catch (e) {
    toast.error(formatApiErrorDetail(e.response && e.response.data && e.response.data.detail) || e.message);
    throw e;
  }
}

export function Pill({ children, className = "" }) {
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}>{children}</span>;
}

export const FORMATS = {
  document: "Document carousel (PDF)",
  comparison: "Comparison infographic",
  number: "One-number infographic",
  market_update: "Market update",
  buyer_question: "A buyer asked us",
  checklist: "Specification checklist",
  calendar: "Season and trade fair calendar",
  service: "Service walkthrough",
  photo: "Photos from the field",
  video: "Short explainer video",
};

export const SEGMENTS = {
  importer_distributor: "Importers and distributors",
  retail_chain: "Retail and supermarket chains",
  small_store: "Small and independent stores",
  private_label: "Private-label brands and procurement",
  manufacturer: "Manufacturers and exporters",
};

export function StatusPill({ status, slotAt, post, short = false }) {
  const pill = (tone, label) => <Pill className={tone}>{label}</Pill>;
  const blue = "bg-sky-50 text-sky-800 border-sky-200";
  // A scheduled post whose time has passed is being published; the next check with Buffer confirms it.
  if (status === "scheduled" && slotAt && Date.parse(slotAt) < Date.now()) return pill(blue, short ? "Publishing" : "Publishing, confirming with Buffer");
  if (status === "approved" && post && !post.buffer_id && !post.error) return pill(blue, short ? "Approved" : "Approved, sending to Buffer");
  if (status === "pending" && post && post.change_request && post.change_request.state === "done") return pill("bg-emerald-50 text-emerald-800 border-emerald-200", short ? "Changed" : "Changed on your request");
  if (status === "changes_requested" && post && post.change_request && post.change_request.state === "failed") return pill("bg-red-50 text-red-800 border-red-200", short ? "Change failed" : "Change could not be made");
  const s = STATUS[status] || { label: status, short: status, tone: "bg-slate-100 text-slate-600 border-slate-200" };
  return pill(s.tone, short ? s.short : s.label);
}

export function ChannelBadge({ channel, iconOnly = false, size = "sm" }) {
  const c = CHANNELS[channel] || { label: channel, short: "?", color: "#64748b" };
  const box = size === "lg" ? "h-8 w-8 rounded-lg text-[12px]" : "h-5 w-5 rounded text-[10px]";
  const icon = (
    <span title={iconOnly ? c.label : undefined} className={`inline-flex flex-none items-center justify-center font-bold text-white ${box}`} style={{ background: c.color }}>
      {c.short}
    </span>
  );
  if (iconOnly) return icon;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#012D76]">
      {icon}
      {c.label}
    </span>
  );
}

export function Button({ children, variant = "primary", className = "", ...props }) {
  const base = "inline-flex min-h-[40px] items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0096D6] disabled:opacity-50 disabled:cursor-not-allowed sm:min-h-[36px]";
  const v = {
    primary: "bg-[#012D76] text-white hover:bg-[#011F54]",
    gold: "bg-[#A6831F] text-white hover:bg-[#8A6A16]",
    outline: "border border-[#D5DCE8] bg-white text-[#012D76] hover:bg-[#F5F9FC]",
    danger: "border border-red-200 bg-white text-red-700 hover:bg-red-50",
    ghost: "text-[#012D76] hover:bg-[#F5F9FC]",
  }[variant];
  return (
    <button type="button" className={`${base} ${v} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Kbd({ children, light = false }) {
  return <kbd className={`ml-1 hidden rounded border border-b-2 px-1 font-sans text-[10.5px] font-medium leading-4 sm:inline-block ${light ? "border-white/40 text-white/80" : "border-[#D5DCE8] bg-white text-[#6B7280]"}`}>{children}</kbd>;
}

// A number on a menu item: gold when it is for you, grey when it waits for someone else.
export function Count({ n, mine = true, title }) {
  if (!n) return null;
  return (
    <span title={title} className={`ml-auto min-w-[20px] rounded-full px-1.5 text-center text-[11px] font-semibold leading-5 ${mine ? "bg-[#A6831F] text-white" : "bg-white/15 text-[#DFE7F5]"}`}>
      {n}
    </span>
  );
}

// Confirmation inside the page (browser pop-ups are easy to miss and cannot be styled).
// const ask = useAsk(); const reason = await ask({ title, body, input: { placeholder, required }, confirm, danger });
// Resolves to true (or the typed text when there is an input), or null when cancelled.
const AskContext = React.createContext(null);
export function AskProvider({ children }) {
  const [q, setQ] = useState(null);
  const [text, setText] = useState("");
  const ask = React.useCallback(
    (opts) =>
      new Promise((resolve) => {
        setText((opts.input && opts.input.value) || "");
        setQ({ ...opts, resolve });
      }),
    []
  );
  const close = (v) => {
    if (q) q.resolve(v);
    setQ(null);
  };
  const first = React.useRef(null);
  React.useEffect(() => {
    if (!q) return undefined;
    if (first.current) first.current.focus();
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        q.resolve(null);
        setQ(null);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [q]);
  return (
    <AskContext.Provider value={ask}>
      {children}
      {q ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={q.title}>
          <button type="button" aria-label="Cancel" className="absolute inset-0 cursor-default bg-[#0F1B2D]/40" onClick={() => close(null)} />
          <form
            className="relative w-full max-w-md rounded-xl bg-white p-5 shadow-xl"
            onSubmit={(e) => {
              e.preventDefault();
              if (q.input && q.input.required && !text.trim()) return;
              close(q.input ? text.trim() : true);
            }}
          >
            <div className="text-base font-semibold text-[#0F1B2D]">{q.title}</div>
            {q.body ? <div className="mt-1.5 whitespace-pre-line text-sm text-[#44506A]">{q.body}</div> : null}
            {q.input ? (
              <textarea
                ref={first}
                rows={3}
                className="mt-3 w-full rounded-md border border-[#D5DCE8] px-3 py-2 text-sm focus:border-[#012D76] focus:outline-none"
                placeholder={q.input.placeholder || ""}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            ) : null}
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => close(null)}>
                Cancel
              </Button>
              <button
                type="submit"
                ref={q.input ? undefined : first}
                disabled={Boolean(q.input && q.input.required && !text.trim())}
                className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50 ${q.danger ? "bg-red-700 hover:bg-red-800" : "bg-[#012D76] hover:bg-[#011F54]"}`}
              >
                {q.confirm || "OK"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </AskContext.Provider>
  );
}
export function useAsk() {
  const ask = React.useContext(AskContext);
  // Outside the provider (should not happen) fall back to the browser's own dialogs.
  return ask || ((o) => Promise.resolve(o.input ? window.prompt(`${o.title}\n\n${o.body || ""}`) : window.confirm(`${o.title}\n\n${o.body || ""}`) || null));
}

export function Card({ children, className = "" }) {
  return <div className={`rounded-xl border border-[#E5EBF2] bg-white shadow-sm ${className}`}>{children}</div>;
}

export function Empty({ title, children, action }) {
  return (
    <Card className="p-8 text-center">
      <p className="font-semibold text-[#012D76]">{title}</p>
      {children ? <p className="mx-auto mt-1 max-w-md text-sm text-[#6B7280]">{children}</p> : null}
      {action ? <div className="mt-3 flex justify-center">{action}</div> : null}
    </Card>
  );
}

// Channels people can schedule or map. Retired channels still show on old posts.
export const ACTIVE_CHANNELS = Object.keys(CHANNELS).filter((k) => !CHANNELS[k].retired);

// Shows a post the way it will look on its channel.
export function Preview({ post }) {
  const [i, setI] = useState(0);
  const [more, setMore] = useState(false);
  const images = post.image_urls || [];
  const isVideo = (u) => /\.(mp4|mov)(\?|$)/i.test(u);
  const text = post.body || "";
  const cut = post.channel.startsWith("linkedin") ? 210 : 125;
  const shown = more || text.length <= cut ? text : `${text.slice(0, cut).trimEnd()}…`;
  const media = images.length ? (
    <div className="relative bg-[#0D1B40]">
      {isVideo(images[i]) ? (
        <video src={images[i]} controls className="mx-auto max-h-[440px] w-full object-contain">
          <track kind="captions" />
        </video>
      ) : (
        <img src={images[i]} alt={(post.alt || [])[i] || ""} className="mx-auto aspect-[4/5] w-full max-w-[360px] object-cover" loading="lazy" />
      )}
      {images.length > 1 ? (
        <>
          <button type="button" aria-label="Previous slide" disabled={i === 0} onClick={() => setI(i - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1.5 shadow disabled:opacity-30">
            <ChevronLeft size={18} />
          </button>
          <button type="button" aria-label="Next slide" disabled={i === images.length - 1} onClick={() => setI(i + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1.5 shadow disabled:opacity-30">
            <ChevronRight size={18} />
          </button>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
            {images.map((_, k) => (
              <span key={k} className={`h-1.5 w-1.5 rounded-full ${k === i ? "bg-white" : "bg-white/40"}`} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  ) : null;

  return (
    <div className="overflow-hidden rounded-lg border border-[#E5EBF2] bg-white">
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0D1B40] text-[10px] font-bold tracking-wider text-[#B8952A]">
          {post.channel === "linkedin_shirali" ? "SS" : "EEC"}
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-[#111827]">{post.channel === "linkedin_shirali" ? "Shirali Shetty" : "Elan Exports Consultancy"}</div>
          <div className="text-[11px] text-[#6B7280]">{CHANNELS[post.channel] ? CHANNELS[post.channel].label : post.channel}</div>
        </div>
      </div>
      {post.channel === "instagram" ? media : null}
      <div className="whitespace-pre-wrap break-words px-3 py-2 text-[14px] leading-relaxed text-[#111827]">
        {shown}
        {text.length > cut ? (
          <button type="button" className="ml-1 text-[#6B7280] hover:underline" onClick={() => setMore(!more)}>
            {more ? "show less" : "more"}
          </button>
        ) : null}
      </div>
      {post.channel !== "instagram" ? media : null}
      {images.length > 1 ? (
        <div className="flex gap-1.5 overflow-x-auto border-t border-[#EEF2F7] px-3 py-2" aria-label="Slides">
          {images.map((u, k) => (
            <button key={k} type="button" onClick={() => setI(k)} aria-label={`Slide ${k + 1}`} className={`h-12 w-10 flex-none overflow-hidden rounded border-2 ${k === i ? "border-[#012D76]" : "border-transparent opacity-70 hover:opacity-100"}`}>
              {isVideo(u) ? <span className="block h-full w-full bg-[#0D1B40]" /> : <img src={u} alt="" className="h-full w-full object-cover" loading="lazy" />}
            </button>
          ))}
        </div>
      ) : null}
      {post.document_url ? (
        <div className="flex items-center justify-between border-t border-[#EFF4F9] px-3 py-2 text-xs text-[#3A4759]">
          <span>LinkedIn document · {images.length} pages</span>
          <a href={post.document_url} target="_blank" rel="noreferrer" className="font-semibold text-[#0096D6] hover:underline">
            Open the PDF
          </a>
        </div>
      ) : null}
      {post.first_comment ? <div className="border-t border-[#EFF4F9] px-3 py-2 text-xs text-[#3A4759]">First comment: {post.first_comment}</div> : null}
    </div>
  );
}

export function ExtLink({ href, children }) {
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-[#0096D6] hover:underline">
      {children} <ExternalLink size={13} />
    </a>
  );
}
