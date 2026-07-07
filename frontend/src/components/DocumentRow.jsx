import React, { useState } from "react";
import { FileText, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiErrorDetail } from "@/lib/api";

export default function DocumentRow({ doc, compact = false }) {
  const [loading, setLoading] = useState(false);

  const onView = async () => {
    if (!doc.file_id) {
      toast.error("This document has no file reference");
      return;
    }
    setLoading(true);
    const tab = window.open("", "_blank");
    if (tab) {
      tab.document.write(
        '<!doctype html><meta charset="utf-8"><title>Loading document…</title>' +
        '<style>body{font:14px system-ui;color:#3A4759;background:#FFFFFF;display:flex;' +
        'align-items:center;justify-content:center;height:100vh;margin:0}</style>' +
        '<p>Loading document from secure storage…</p>'
      );
    }
    try {
      const { data } = await api.get(`/files/${doc.file_id}/download`, {
        params: { redirect: false },
      });
      if (tab && !tab.closed) {
        tab.location.href = data.url;
      } else {
        window.location.href = data.url;
      }
    } catch (e) {
      if (tab && !tab.closed) tab.close();
      toast.error(formatApiErrorDetail(e.response?.data?.detail) || "Could not load document");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`flex items-center justify-between gap-4 ${compact ? "py-2 px-3" : "py-3 px-4"} border hairline bg-[#F5F9FC]`}
      data-testid={`doc-row-${doc.file_id || doc.path}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <FileText size={compact ? 14 : 16} className="text-[var(--eec-gold)] shrink-0" />
        <div className="min-w-0">
          <div className={`${compact ? "text-xs" : "text-sm"} text-[#012D76] truncate`}>
            {doc.original_filename || doc.path?.split("/").pop()}
          </div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#6B7280] mt-0.5">
            {doc.doc_type || "document"}
          </div>
        </div>
      </div>
      <button
        onClick={onView}
        disabled={loading || !doc.file_id}
        className={`inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.15em] font-medium text-[#012D76] border border-[#012D76]/25 hover:border-[#012D76] hover:bg-[#012D76]/5 disabled:opacity-40 disabled:cursor-not-allowed ${compact ? "px-2.5 py-1" : "px-3 py-1.5"} transition-colors shrink-0`}
        data-testid={`doc-view-${doc.file_id || doc.path}`}
      >
        {loading ? <Loader2 size={12} className="animate-spin" /> : <Eye size={12} />}
        {loading ? "Loading" : "View"}
      </button>
    </div>
  );
}
