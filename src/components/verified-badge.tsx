"use client";

import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  className?: string;
}

export function VerifiedBadge({ className }: VerifiedBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800",
        className
      )}
    >
      <ShieldCheck className="h-3.5 w-3.5" />
      <span>Zoe Verified</span>
    </div>
  );
}
