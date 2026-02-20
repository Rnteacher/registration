import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline";
}

export function Button({
  className,
  variant = "default",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition",
        variant === "default" && "bg-slate-900 text-white hover:bg-slate-800",
        variant === "outline" &&
          "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50",
        className
      )}
      {...props}
    />
  );
}
