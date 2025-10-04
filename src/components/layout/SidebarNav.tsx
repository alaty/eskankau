"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, BarChart3, FileText, LineChart, LogOut, Sparkles, Building2, Wrench, WalletCards, SlidersHorizontal, ShieldCheck, ShieldAlert, TrendingUp, ClipboardCheck, BarChartHorizontal, TrendingDown, GitCommitHorizontal, Map, FileWarning, Hammer, ListChecks, BarChart2, Archive, Wallet, PlusSquare, Building, PlusCircle, Trash2 } from "lucide-react";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel, useSidebar, SidebarSeparator } from "../ui/sidebar";

const navItems = [
  { href: "/units", label: "إدارة الوحدات", icon: Building2 },
  { href: "/add", label: "اضافة وحذف الوحدات", icon: PlusCircle },
  { href: "/visual-plan", label: "التخطيط المرئي", icon: Map },
  { href: "/adjustment-tool", label: "أداة التعديل", icon: SlidersHorizontal },
];

const financialItems = [
    { href: "/financial-follow-up", label: "متابعة المستحقات المالية", icon: Wallet },
    { href: "/claims", label: "المطالبات المالية", icon: FileWarning },
    { href: "/payment-plans", label: "خطط السداد المالية", icon: WalletCards },
    { href: "/lost-revenue", label: "الإيرادات المفقودة", icon: TrendingDown },
]

const maintenanceItems = [
    { href: "/maintenance-request", label: "طلب صيانة", icon: Hammer },
    { href: "/maintenance", label: "متابعة الصيانة", icon: Wrench },
    { href: "/maintenance-performance", label: "مؤشر أداء الصيانة", icon: BarChart2 },
    { href: "/maintenance-archive", label: "أرشيف الصيانة", icon: Archive },
];

const reportsItems = [
  { href: "/performance-indicators", label: "لوحة مؤشرات الأداء (KPIs)", icon: TrendingUp },
  { href: "/quarterly-reports", label: "التقارير المالية الفصلية", icon: FileText },
  { href: "/forecast", label: "التوقعات المالية المستقبلية", icon: LineChart },
  { href: "/request-report", label: "منشئ التقارير المخصصة", icon: ClipboardCheck },
]

const systemItems = [
    { href: "/site-structure", label: "حالة الموقع", icon: ShieldCheck },
];

export function SidebarNav({ isMobile = false, isSidebar = false }: { isMobile?: boolean, isSidebar?: boolean }) {
  const pathname = usePathname();
  const { state } = useSidebar();

  const getIsActive = (href: string) => {
    return pathname === href;
  };
  
  const linkClass = (href: string) => cn(
    "flex items-center gap-3 rounded-md px-3 py-2 font-medium transition-colors w-full text-right justify-start",
    getIsActive(href)
      ? "bg-sidebar-primary text-sidebar-primary-foreground"
      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
    isMobile ? "text-xl" : "text-sm"
  );
  
  if (isSidebar) {
      return (
        <div className="flex flex-col h-full">
            <SidebarMenu className="flex-grow pt-2">
                 <SidebarGroup>
                    <SidebarGroupLabel>القائمة الرئيسية</SidebarGroupLabel>
                    {navItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                         <Link href={item.href} className="w-full">
                            <SidebarMenuButton isActive={getIsActive(item.href)} tooltip={item.label}>
                                <item.icon />
                                <span>{item.label}</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                    ))}
                </SidebarGroup>
                <SidebarGroup>
                    <SidebarGroupLabel>الشؤون المالية</SidebarGroupLabel>
                    {financialItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                         <Link href={item.href} className="w-full">
                            <SidebarMenuButton isActive={getIsActive(item.href)} tooltip={item.label}>
                                <item.icon />
                                <span>{item.label}</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                    ))}
                </SidebarGroup>
                 <SidebarGroup>
                    <SidebarGroupLabel>عمليات الصيانة</SidebarGroupLabel>
                    {maintenanceItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                         <Link href={item.href} className="w-full">
                            <SidebarMenuButton isActive={getIsActive(item.href)} tooltip={item.label}>
                                <item.icon />
                                <span>{item.label}</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                    ))}
                </SidebarGroup>
                <SidebarGroup>
                    <SidebarGroupLabel>التقارير والتحليل</SidebarGroupLabel>
                     {reportsItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                         <Link href={item.href} className="w-full">
                            <SidebarMenuButton isActive={getIsActive(item.href)} tooltip={item.label}>
                                <item.icon />
                                <span>{item.label}</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                    ))}
                </SidebarGroup>
                 <SidebarSeparator className="my-2" />
                 <SidebarGroup>
                    {systemItems.map((item) => (
                        <SidebarMenuItem key={item.href}>
                            <Link href={item.href} className="w-full">
                                <SidebarMenuButton isActive={getIsActive(item.href)} tooltip={item.label}>
                                    <item.icon />
                                    <span>{item.label}</span>
                                </SidebarMenuButton>
                            </Link>
                        </SidebarMenuItem>
                    ))}
                </SidebarGroup>
            </SidebarMenu>
        </div>
      )
  }

  // This part is for potential mobile sheet view if ever needed separately
  const navClass = cn(
    "flex gap-2 p-4",
    isMobile ? "flex-col space-y-4 text-lg" : "items-center"
  );

  return (
    <nav className={navClass}>
      {[...navItems, ...reportsItems].map((item) => (
        <Link key={item.href} href={item.href} className={linkClass(item.href)}>
          <item.icon className="h-5 w-5" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
