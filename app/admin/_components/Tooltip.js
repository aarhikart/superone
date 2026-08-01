"use client";

import React from "react";

export default function Tooltip({ children, content }) {
  return (
    <div className="group relative inline-flex items-center justify-center">
      {children}
      <div className="absolute bottom-full left-1/2 z-[9999] mb-2.5 -translate-x-1/2 scale-90 opacity-0 pointer-events-none group-hover:scale-100 group-hover:opacity-100 transition-all duration-150 origin-bottom">
        <div className="relative rounded-lg bg-slate-950/95 border border-sky-500/30 px-2.5 py-1.5 text-xs font-medium text-slate-100 shadow-xl whitespace-nowrap backdrop-blur-sm">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-slate-950/95" />
        </div>
      </div>
    </div>
  );
}
