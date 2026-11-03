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

export const STATUS = {
  pending: { label: "Waiting for approval", tone: "bg-amber-50 text-amber-800 border-amber-200" },
  changes_requested: { label: "Sent back to writer", tone: "bg-orange-50 text-orange-800 border-orange-200" },
  approved: { label: "Approved", tone: "bg-sky-50 text-sky-800 border-sky-200" },
  scheduled: { label: "Scheduled", tone: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  posting: { label: "Sending", tone: "bg-sky-50 text-sky-800 border-sky-200" },
  posted: { label: "Posted", tone: "bg-emerald-100 text-emerald-900 border-emerald-300" },
  missed: { label: "Missed", tone: "bg-slate-100 text-slate-600 border-slate-200" },
  failed: { label: "Failed", tone: "bg-red-50 text-red-800 border-red-200" },
  dropped: { label: "Dropped", tone: "bg-slate-100 text-slate-500 border-slate-200" },
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

export function StatusPill({ status, slotAt }) {
  // A scheduled post whose time has passed is being published; the next check with Buffer confirms it.
  if (status === "scheduled" && slotAt && Date.parse(slotAt) < Date.now()) {
    return <Pill className="bg-sky-50 text-sky-800 border-sky-200">Publishing, confirming with Buffer</Pill>;
  }
  const s = STATUS[status] || { label: status, tone: "bg-slate-100 text-slate-600 border-slate-200" };
  return <Pill className={s.tone}>{s.label}</Pill>;
}

export function ChannelBadge({ channel }) {
  const c = CHANNELS[channel] || { label: channel, short: "?", color: "#64748b" };
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#012D76]">
      <span className="inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-white" style={{ background: c.color }}>
        {c.short}
      </span>
      {c.label}
    </span>
  );
}

export function Button({ children, variant = "primary", className = "", ...props }) {
  const base = "inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed";
  const v = {
    primary: "bg-[#012D76] text-white hover:bg-[#011F54]",
    gold: "bg-[#A6831F] text-white hover:bg-[#8A6A16]",
    outline: "border border-[#E5EBF2] bg-white text-[#012D76] hover:bg-[#F5F9FC]",
    danger: "border border-red-200 bg-white text-red-700 hover:bg-red-50",
    ghost: "text-[#012D76] hover:bg-[#F5F9FC]",
  }[variant];
  return (
    <button type="button" className={`${base} ${v} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Card({ children, className = "" }) {
  return <div className={`rounded-xl border border-[#E5EBF2] bg-white shadow-sm ${className}`}>{children}</div>;
}

export function Empty({ title, children }) {
  return (
    <Card className="p-8 text-center">
      <p className="font-semibold text-[#012D76]">{title}</p>
      {children ? <p className="mt-1 text-sm text-[#6B7280]">{children}</p> : null}
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
        <video src={images[i]} controls className="mx-auto max-h-[420px] w-full object-contain">
          <track kind="captions" />
        </video>
      ) : (
        <img src={images[i]} alt={(post.alt || [])[i] || ""} className="mx-auto aspect-[4/5] w-full max-w-[420px] object-cover" loading="lazy" />
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
