"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { 
  LayoutDashboard, 
  Settings, 
  TrendingUp, 
  Wallet, 
  PieChart,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

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

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-white border-r border-slate-200">
      <div className="px-6 py-2 flex-1">
        <Link href="/dashboard" className="flex items-center mb-10">
          <div className="relative w-8 h-8 mr-3">
            <div className="absolute inset-0 bg-primary rounded-lg rotate-3 opacity-20"></div>
            <Wallet className="w-8 h-8 text-primary relative z-10" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Finans Koç AI
          </h1>
        </Link>
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:bg-slate-50 rounded-lg transition",
                pathname === route.href ? "bg-slate-50 text-primary" : "text-slate-500"
              )}
            >
              <div className="flex items-center flex-1">
                <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                {route.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserButton 
            appearance={{
              elements: {
                userButtonAvatarBox: "h-9 w-9"
              }
            }}
          />
          <div className="flex flex-col">
            <p className="text-sm font-medium text-slate-900">Hesabım</p>
            <p className="text-xs text-slate-500">Profil ve Çıkış</p>
          </div>
        </div>
      </div>
    </div>
  );
}
