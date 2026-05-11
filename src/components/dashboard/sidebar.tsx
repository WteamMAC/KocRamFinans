"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { 
  LayoutDashboard, 
  Settings, 
  Wallet, 
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const routes = [
  {
    label: "Finansal Özet",
    icon: LayoutDashboard,
    href: "/dashboard",
    color: "text-sky-500",
  },
  {
    label: "Bilgileri Düzenle",
    icon: Settings,
    href: "/dashboard/settings",
    color: "text-slate-500",
  },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className={cn(
      "relative space-y-4 py-4 flex flex-col h-full bg-white border-r border-slate-200 transition-all duration-300",
      isCollapsed ? "w-20" : "w-72"
    )}>
      {/* Toggle Button */}
      <Button
        onClick={onToggle}
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-10 h-6 w-6 rounded-full border bg-white shadow-sm z-50 hover:bg-slate-50"
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>

      <div className="px-3 py-2 flex-1 overflow-hidden">
        <Link href="/dashboard" className={cn(
          "flex items-center mb-10 transition-all duration-300",
          isCollapsed ? "justify-center" : "px-3"
        )}>
          <div className="relative w-8 h-8 flex-shrink-0">
            <div className="absolute inset-0 bg-primary rounded-lg rotate-3 opacity-20"></div>
            <Wallet className="w-8 h-8 text-primary relative z-10" />
          </div>
          {!isCollapsed && (
            <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent ml-3 truncate">
              Finans Koç AI
            </h1>
          )}
        </Link>
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:bg-slate-50 rounded-lg transition-all duration-200",
                pathname === route.href ? "bg-slate-50 text-primary" : "text-slate-500",
                isCollapsed && "justify-center"
              )}
            >
              <div className={cn(
                "flex items-center flex-1",
                isCollapsed && "flex-none"
              )}>
                <route.icon className={cn("h-5 w-5 flex-shrink-0", route.color, !isCollapsed && "mr-3")} />
                {!isCollapsed && <span className="truncate">{route.label}</span>}
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div className={cn(
        "px-3 py-4 border-t border-slate-100 flex items-center transition-all duration-300",
        isCollapsed ? "justify-center" : "justify-between px-6"
      )}>
        <div className="flex items-center gap-3 overflow-hidden">
          <UserButton 
            appearance={{
              elements: {
                userButtonAvatarBox: "h-9 w-9"
              }
            }}
          />
          {!isCollapsed && (
            <div className="flex flex-col truncate">
              <p className="text-sm font-medium text-slate-900 truncate">Hesabım</p>
              <p className="text-xs text-slate-500 truncate">Profil ve Çıkış</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
