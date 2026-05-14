"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Settings,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  ArrowRightLeft,
  CreditCard,
  Bitcoin,
  Globe,
  Home,
  Coins,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const routes = [
  {
    label: "Finansal Özet",
    icon: LayoutDashboard,
    href: "/dashboard",
    color: "text-[#8c5000]",
  },
  {
    label: "Varlıklarım",
    icon: TrendingUp,
    href: "/dashboard/assets",
    color: "text-[#666000]",
    isExpandable: true,
    subRoutes: [
        { label: "Kripto Para", icon: Bitcoin, href: "/dashboard/assets/crypto", color: "text-orange-500" },
        { label: "BIST (Hisse)", icon: TrendingUp, href: "/dashboard/assets/bist", color: "text-emerald-500" },
        { label: "NASDAQ (Hisse)", icon: Globe, href: "/dashboard/assets/nasdaq", color: "text-blue-500" },
        { label: "Altın & Emtia", icon: Coins, href: "/dashboard/assets/gold", color: "text-amber-500" },
        { label: "Sabit Varlıklar", icon: Home, href: "/dashboard/assets/fixed", color: "text-indigo-500" },
    ]
  },
  {
    label: "Gelir - Gider",
    icon: ArrowRightLeft,
    href: "/dashboard/income-expense",
    color: "text-[#36684d]",
  },
  {
    label: "Borç ve Krediler",
    icon: CreditCard,
    href: "/dashboard/debts",
    color: "text-[#ba1a1a]",
  },
  {
    label: "Bilgileri Düzenle",
    icon: Settings,
    href: "/dashboard/settings",
    color: "text-[#554336]",
  },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  hideToggle?: boolean;
  theme?: "light" | "dark";
  onToggleTheme?: () => void;
}

export function Sidebar({ isCollapsed, onToggle, hideToggle, theme, onToggleTheme }: SidebarProps) {
  const pathname = usePathname();
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({ "Varlıklarım": true });

  const toggleSubMenu = (label: string) => {
    setOpenSubMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  useEffect(() => {
    if (isCollapsed) {
        setOpenSubMenus({});
    } else {
        // Find if current path is in subroutes to open it
        routes.forEach(route => {
            if (route.subRoutes?.some(sub => pathname.startsWith(sub.href))) {
                setOpenSubMenus(prev => ({ ...prev, [route.label]: true }));
            }
        });
    }
  }, [isCollapsed, pathname]);

  return (
    <div className={cn(
      "relative space-y-4 py-4 flex flex-col h-full bg-white border-r border-[#dbc2b0]/30 transition-all duration-300 shadow-ambient-low",
      isCollapsed ? "w-20" : "w-72"
    )}>
      {/* Toggle Button */}
      {!hideToggle && (
        <Button
          onClick={onToggle}
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-10 h-6 w-6 rounded-full border border-[#dbc2b0]/30 bg-white shadow-ambient-low z-50 hover:bg-[#f8f9fa]"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4 text-[#8c5000]" /> : <ChevronLeft className="h-4 w-4 text-[#8c5000]" />}
        </Button>
      )}

      <div className="px-3 py-2 flex-1 overflow-hidden">
        <Link href="/dashboard" className={cn(
          "flex items-center mb-10 transition-all duration-300",
          isCollapsed ? "justify-center" : "px-4"
        )}>
          <img src="/mascot.png" alt="Logo" className="h-14 w-14 object-contain" />
          {!isCollapsed && (
            <h1 className="text-xl font-heading font-bold text-[#8c5000] ml-3 truncate">
              Koç Ram Finans
            </h1>
          )}
        </Link>

        <div className="space-y-1">
          {routes.map((route) => (
            <div key={route.href} className="space-y-1">
              {route.isExpandable && !isCollapsed ? (
                <div
                  onClick={() => toggleSubMenu(route.label)}
                  className={cn(
                    "text-sm group flex p-3 w-full justify-between font-medium cursor-pointer rounded-xl transition-all duration-200",
                    pathname.startsWith(route.href)
                      ? "bg-[#f3f4f5]/50 text-[#8c5000]"
                      : "text-[#554336] hover:bg-[#f8f9fa] hover:text-[#8c5000]"
                  )}
                >
                  <div className="flex items-center flex-1">
                    <route.icon className={cn("h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110 mr-3", route.color)} />
                    <span className="truncate">{route.label}</span>
                  </div>
                  <ChevronDown className={cn("h-4 w-4 transition-transform duration-200 opacity-50", openSubMenus[route.label] && "rotate-180")} />
                </div>
              ) : (
                <Link
                  href={route.href}
                  className={cn(
                    "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer rounded-xl transition-all duration-200",
                    pathname === route.href
                      ? "bg-[#f3f4f5] text-[#8c5000] shadow-ambient-low"
                      : "text-[#554336] hover:bg-[#f8f9fa] hover:text-[#8c5000]",
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
              )}

              {/* Render Subroutes */}
              {!isCollapsed && route.subRoutes && openSubMenus[route.label] && (
                <div className="ml-6 space-y-1 animate-in slide-in-from-top-2 duration-300">
                  {route.subRoutes.map((sub) => (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      className={cn(
                        "text-[13px] group flex p-2.5 w-full justify-start font-bold cursor-pointer rounded-xl transition-all duration-200",
                        pathname === sub.href
                          ? "bg-[#efe440]/10 text-[#8c5000]"
                          : "text-[#554336]/70 hover:bg-[#f8f9fa] hover:text-[#8c5000]"
                      )}
                    >
                      <div className="flex items-center flex-1">
                        <sub.icon className={cn("h-4 w-4 flex-shrink-0 transition-transform group-hover:scale-110 mr-3", sub.color)} />
                        <span className="truncate">{sub.label}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className={cn(
        "px-3 py-6 border-t border-[#dbc2b0]/20 flex items-center transition-all duration-300",
        isCollapsed ? "justify-center" : "justify-between px-6 bg-[#f8f9fa]/30"
      )}>
        <div className="flex items-center gap-3 overflow-hidden">
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox: "h-9 w-9 ring-2 ring-[#efe440]/20"
              }
            }}
          />
          {!isCollapsed && (
            <div className="flex flex-col truncate">
              <p className="text-sm font-semibold text-[#191c1d] truncate">Hesabım</p>
              <p className="text-[10px] uppercase tracking-wider font-bold text-[#554336] truncate opacity-60">Yönetim</p>
            </div>
          )}
        </div>

        {theme && onToggleTheme && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleTheme}
            className="rounded-full h-8 w-8 text-[#8c5000] hover:bg-[#8c5000]/10 flex-shrink-0"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        )}
      </div>
    </div>
  );
}
