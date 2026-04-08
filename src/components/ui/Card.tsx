import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-xl border-2 border-white bg-[#f6f6f6] p-[1.1rem] shadow-[0_-3px_6px_rgba(255,255,255,1),0_-1px_0px_rgba(255,255,255,1),0_8px_16px_rgba(0,0,0,0.12),0_3px_6px_rgba(0,0,0,0.08),1px_0_2px_rgba(0,0,0,0.03),-1px_0_2px_rgba(0,0,0,0.03)] ${className}`}
    >
      {children}
    </div>
  );
}
