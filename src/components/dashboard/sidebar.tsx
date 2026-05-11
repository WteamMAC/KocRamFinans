"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { 
  LayoutDashboard, 
  Settings, 
  Wallet, 
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const routes = [
  {
    label: "Finansal Özet",
    icon: LayoutDashboard,
    href: "/dashboard",
    color: "text-[#001b44]",
  },
  {
    label: "Varlıklarım",
    icon: TrendingUp,
    href: "/dashboard/assets",
    color: "text-[#735c00]",
  },
  {
    label: "Bilgileri Düzenle",
    icon: Settings,
    href: "/dashboard/settings",
    color: "text-[#434750]",
  },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  hideToggle?: boolean;
}

export function Sidebar({ isCollapsed, onToggle, hideToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className={cn(
      "relative space-y-4 py-4 flex flex-col h-full bg-white border-r border-[#c4c6d2]/30 transition-all duration-300 shadow-sm",
      isCollapsed ? "w-20" : "w-72"
    )}>
      {/* Toggle Button */}
      {!hideToggle && (
        <Button
          onClick={onToggle}
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-10 h-6 w-6 rounded-full border border-[#c4c6d2]/30 bg-white shadow-sm z-50 hover:bg-[#faf9f6]"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4 text-[#001b44]" /> : <ChevronLeft className="h-4 w-4 text-[#001b44]" />}
        </Button>
      )}

      <div className="px-3 py-2 flex-1 overflow-hidden">
        <Link href="/dashboard" className={cn(
          "flex items-center mb-10 transition-all duration-300",
          isCollapsed ? "justify-center" : "px-4"
        )}>
          <BarChart3 className="h-8 w-8 text-[#fed65b] fill-[#fed65b] flex-shrink-0" />
          {!isCollapsed && (
            <h1 className="text-xl font-heading font-bold text-[#001b44] ml-3 truncate">
              Koç Ai
            </h1>
          )}
        </Link>

        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer rounded-xl transition-all duration-200",
                pathname === route.href 
                  ? "bg-[#f4f3f1] text-[#001b44] shadow-sm" 
                  : "text-[#434750] hover:bg-[#faf9f6] hover:text-[#001b44]",
                isCollapsed && "justify-center"
              )}
            >
              <div className={cn(
                "flex items-center flex-1",
                isCollapsed && "flex-none"
              )}>
                <route.icon className={cn("h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110", route.color, !isCollapsed && "mr-3")} />
                {!isCollapsed && <span className="truncate">{route.label}</span>}
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className={cn(
        "px-3 py-6 border-t border-[#c4c6d2]/20 flex items-center transition-all duration-300",
        isCollapsed ? "justify-center" : "justify-between px-6 bg-[#faf9f6]/30"
      )}>
        <div className="flex items-center gap-3 overflow-hidden">
          <UserButton 
            appearance={{
              elements: {
                userButtonAvatarBox: "h-9 w-9 ring-2 ring-[#fed65b]/20"
              }
            }}
          />
          {!isCollapsed && (
            <div className="flex flex-col truncate">
              <p className="text-sm font-semibold text-[#1a1c1a] truncate">Hesabım</p>
              <p className="text-[10px] uppercase tracking-wider font-bold text-[#434750] truncate opacity-60">Yönetim</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
