"use client";

import { useState } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="h-full relative">
      <div className={cn(
        "hidden h-full md:flex md:flex-col md:fixed md:inset-y-0 z-[80] bg-white transition-all duration-300 ease-in-out",
        isCollapsed ? "md:w-20" : "md:w-72"
      )}>
        <Sidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />
      </div>
      <main className={cn(
        "min-h-screen transition-all duration-300 ease-in-out",
        isCollapsed ? "md:pl-20" : "md:pl-72"
      )}>
        {children}
      </main>
    </div>
  );
}
