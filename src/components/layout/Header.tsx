
"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogOut, Wallet, Wrench, BellRing, FileWarning } from "lucide-react";
import { SidebarTrigger } from "../ui/sidebar";
import { useAppContext } from "@/contexts/AppDataContext";
import { useMemo } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Unit } from "@/lib/types";

export function Header() {
  const { buildings, loading } = useAppContext();

  const hasFinancialDues = useMemo(() => {
    if (loading || !buildings) return false;

    const isUnitOverdueWithNoClaims = (unit: Unit): boolean => {
        // A notification is only relevant if there's an overdue payment
        // AND no claims have been made yet.
        const hasClaims = unit.claimHistory && unit.claimHistory.length > 0;
        if (hasClaims) {
            return false;
        }

        const plan = unit.paymentPlan;
        if (!plan) {
            // A unit with 'deferred' status but no plan might need attention, but doesn't have an overdue *date*.
            // Based on the request for "stalled payment plans", we only consider plans with dates.
            return false;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (plan.type === 'deferred' && plan.deferredUntil) {
            const dueDate = new Date(plan.deferredUntil);
            return dueDate < today;
        }

        const installments = plan.installments || plan.stipendDeductions;
        if (installments) {
            return installments.some(inst => {
                const dueDate = new Date(inst.dueDate);
                return !inst.isPaid && dueDate < today;
            });
        }

        return false;
    };

    return buildings.some(b =>
      [...b.apartments.units, ...b.suites.units].some(isUnitOverdueWithNoClaims)
    );
  }, [buildings, loading]);

  const hasOverdueMaintenance = useMemo(() => {
    if (loading || !buildings) return false;
    const today = new Date();
    today.setHours(0,0,0,0);
    return buildings.some(b => 
      [...b.apartments.units, ...b.suites.units].some(u => 
        u.status === 'under_maintenance' && u.maintenanceEndDate && new Date(u.maintenanceEndDate) < today
      )
    );
  }, [buildings, loading]);
  
  const hasUnitsNeedingPlan = useMemo(() => {
    if (loading || !buildings) return false;
    return buildings.some(b => 
        [...b.apartments.units, ...b.suites.units].some(u => 
            u.paymentStatus === 'deferred' && !u.paymentPlan
        )
    );
  }, [buildings, loading]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-accent-foreground shadow-lg no-print">
      <div className="container flex h-20 items-center justify-between px-4 md:px-6">
        
        <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden text-primary-foreground hover:text-primary-foreground/80" />
            <Link href="/units" className="flex items-center gap-3">
              <div className="bg-white p-1 rounded-md shadow-sm">
                  <Image
                  src="https://j.top4top.io/p_35298zyqb1.png"
                  alt="شعار جامعة الملك عبدالعزيز"
                  width={40}
                  height={40}
                  data-ai-hint="university logo"
                  />
              </div>
              <div className="hidden sm:flex flex-col text-right">
                  <span className="text-lg font-bold text-primary-foreground leading-tight">
                  نظام الاسكان الطلابي
                  </span>
                  <span className="text-xs text-primary-foreground/80">
                  جامعة الملك عبدالعزيز - عمادة شؤون الطلاب
                  </span>
              </div>
            </Link>
        </div>

        <div className="flex items-center gap-2">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                         <Link href="/maintenance">
                             <Button size="icon" className="bg-primary/80 text-primary-foreground hover:bg-primary/90">
                                <Wrench className={cn("h-6 w-6", hasOverdueMaintenance && "text-orange-400 animate-pulse")} />
                                <span className="sr-only">تنبيهات الصيانة</span>
                            </Button>
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{hasOverdueMaintenance ? "توجد مهام صيانة متأخرة" : "لا توجد مهام صيانة متأخرة"}</p>
                    </TooltipContent>
                </Tooltip>
                 <Tooltip>
                    <TooltipTrigger asChild>
                        <Link href="/claims">
                            <Button size="icon" className="bg-primary/80 text-primary-foreground hover:bg-primary/90">
                                <Wallet className={cn("h-6 w-6", hasFinancialDues && "text-red-500 animate-pulse")} />
                                <span className="sr-only">تنبيهات المستحقات المالية</span>
                            </Button>
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                       <p>{hasFinancialDues ? "توجد خطط سداد متعثرة لم تتم المطالبة بها" : "لا توجد مستحقات مالية تحتاج لمطالبة"}</p>
                    </TooltipContent>
                </Tooltip>
                 <Tooltip>
                    <TooltipTrigger asChild>
                        <Link href="/payment-plans">
                            <Button size="icon" className="bg-primary/80 text-primary-foreground hover:bg-primary/90">
                                <FileWarning className={cn("h-6 w-6", hasUnitsNeedingPlan && "text-yellow-400 animate-pulse")} />
                                <span className="sr-only">وحدات تحتاج خطط مالية</span>
                            </Button>
                        </Link>
                    </TooltipTrigger>
                     <TooltipContent>
                       <p>{hasUnitsNeedingPlan ? "توجد وحدات مؤجلة تحتاج لخطط مالية" : "لا توجد وحدات تحتاج لخطط مالية"}</p>
                    </TooltipContent>
                </Tooltip>
                 <Tooltip>
                    <TooltipTrigger asChild>
                         <Link href="/">
                            <Button size="icon" className="bg-red-700 text-primary-foreground hover:bg-red-800">
                                <LogOut className="h-6 w-6" />
                                <span className="sr-only">خروج</span>
                            </Button>
                        </Link>
                    </TooltipTrigger>
                     <TooltipContent>
                       <p>تسجيل الخروج</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
      </div>
    </header>
  );
}
