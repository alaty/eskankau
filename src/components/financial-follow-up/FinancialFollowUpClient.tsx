
"use client";

import React, { useMemo, useState } from 'react';
import { useAppContext } from '@/contexts/AppDataContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, BellRing, ListChecks, DollarSign, CalendarCheck, Clock, AlertTriangle, CheckCircle, Banknote } from 'lucide-react';
import { type Unit } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatCurrency } from '@/lib/utils';
import { ActiveDuesTable } from './ActiveDuesTable';
import { PaymentPlanDialog } from './PaymentPlanDialog';
import { PaidInstallmentsTable } from './PaidInstallmentsTable';


const StatCard = ({ title, value, icon: Icon, description, colorClass }: { title: string, value: string | number, icon: React.ElementType, description?: string, colorClass: string }) => (
    <Card className={`shadow-lg border-t-4 ${colorClass}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-md font-bold">{title}</CardTitle>
            <Icon className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-3xl font-black">{value}</div>
            {description && <p className="text-xs text-muted-foreground pt-1">{description}</p>}
        </CardContent>
    </Card>
);

const getUnitDueStatus = (unit: Unit): { isOverdue: boolean; hasUpcoming: boolean, hasPaidInstallments: boolean } => {
    // If the unit doesn't have a status that implies dues, it has neither.
    if (!['deferred', 'payment_plan'].includes(unit.paymentStatus || '')) {
        return { isOverdue: false, hasUpcoming: false, hasPaidInstallments: false };
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to the start of today

    const plan = unit.paymentPlan;

    // A 'deferred' unit without a plan is considered overdue for action (needs a plan).
    if (!plan && unit.paymentStatus === 'deferred') {
        return { isOverdue: true, hasUpcoming: false, hasPaidInstallments: false };
    }

    if (!plan) {
      return { isOverdue: false, hasUpcoming: false, hasPaidInstallments: false };
    }

    if (plan.type === 'deferred' && plan.deferredUntil) {
        const dueDate = new Date(plan.deferredUntil);
        const isOverdue = dueDate < today;
        return { isOverdue, hasUpcoming: !isOverdue, hasPaidInstallments: false };
    }

    const installments = plan.installments || plan.stipendDeductions;
    if (installments && installments.length > 0) {
        const isOverdue = installments.some(i => !i.isPaid && new Date(i.dueDate) < today);
        const hasUpcoming = installments.some(i => !i.isPaid && new Date(i.dueDate) >= today);
        const hasPaid = installments.some(i => i.isPaid);
        return { isOverdue, hasUpcoming, hasPaidInstallments: hasPaid };
    }

    // Default case if plan exists but has no actionable items
    return { isOverdue: false, hasUpcoming: false, hasPaidInstallments: false };
};

export function FinancialFollowUpClient() {
  const { buildings, loading } = useAppContext();
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

  const { financeStats, overdueUnits, upcomingUnits, unitsWithPaidInstallments } = useMemo(() => {
    if (loading) return { financeStats: null, overdueUnits: [], upcomingUnits: [], unitsWithPaidInstallments: [] };

    const overdue: Unit[] = [];
    const upcoming: Unit[] = [];
    const withPaid: Unit[] = [];


    buildings.forEach(building => {
      const allUnits = [...building.apartments.units, ...building.suites.units];
      allUnits.forEach(unit => {
        const { isOverdue, hasUpcoming, hasPaidInstallments } = getUnitDueStatus(unit);
        if (isOverdue) {
            overdue.push(unit);
        } 
        if (hasUpcoming) { 
            upcoming.push(unit);
        }
        if (hasPaidInstallments) {
            withPaid.push(unit);
        }
      });
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalOverdueInstallments = 0;
    let totalUpcomingInstallments = 0;

    const allActiveUnits = [...overdue, ...upcoming];
    const uniqueActiveUnits = Array.from(new Set(allActiveUnits.map(u => u.id))).map(id => allActiveUnits.find(u => u.id === id)!);

    uniqueActiveUnits.forEach(unit => {
        if (unit.paymentPlan) {
            const installments = unit.paymentPlan.installments || unit.paymentPlan.stipendDeductions || [];
            installments.forEach(inst => {
                if (!inst.isPaid) {
                    if (new Date(inst.dueDate) < today) {
                        totalOverdueInstallments++;
                    } else {
                        totalUpcomingInstallments++;
                    }
                }
            });
            if (unit.paymentPlan.type === 'deferred' && unit.paymentPlan.deferredUntil) {
                 if (!unit.paymentPlan.installments?.every(i => i.isPaid)) {
                     if (new Date(unit.paymentPlan.deferredUntil) < today) {
                        totalOverdueInstallments++;
                    } else {
                        totalUpcomingInstallments++;
                    }
                 }
            }
        } else if (unit.paymentStatus === 'deferred') {
            totalOverdueInstallments++;
        }
    });

    const overdueDueAmount = overdue.reduce((sum, unit) => {
        const plan = unit.paymentPlan;
        let remaining = 0;
         if (plan) {
             const installments = plan.installments || plan.stipendDeductions;
             if (installments) {
                const totalPaid = installments.filter(i => i.isPaid).reduce((s, i) => s + i.amount, 0);
                remaining = unit.baseRent - totalPaid;
             } else if (plan.type === 'deferred') {
                remaining = unit.baseRent;
             }
         } else if (unit.paymentStatus === 'deferred') {
             remaining = unit.baseRent;
         }
        return sum + remaining;
    }, 0);
    
    const totalPartiallyPaidAmount = withPaid.reduce((sum, unit) => {
        if (unit.paymentPlan) {
            const installments = unit.paymentPlan.installments || unit.paymentPlan.stipendDeductions;
            if (installments) {
                const totalPaid = installments.filter(i => i.isPaid).reduce((s, i) => s + i.amount, 0);
                return sum + totalPaid;
            }
        }
        return sum;
    }, 0);


    return { 
        financeStats: { 
            totalDueAmount: overdueDueAmount, 
            overdueUnitsCount: overdue.length,
            totalOverdueInstallments,
            totalUpcomingInstallments,
            totalPartiallyPaidAmount,
        },
        overdueUnits: overdue,
        upcomingUnits: upcoming,
        unitsWithPaidInstallments: withPaid,
    };
  }, [buildings, loading]);

  if (loading || !financeStats) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6">
        <Skeleton className="h-10 w-1/3 mb-8" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
            <Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" />
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 space-y-8">
        <div>
            <h1 className="text-3xl font-bold text-primary font-headline flex items-center gap-3">
              <Wallet className="h-8 w-8" />
              المتابعة المالية للمستحقات
            </h1>
            <p className="text-muted-foreground mt-2 text-base font-medium">
              لوحة معلومات تحليلية لحالات السداد المؤجلة والخطط المالية في النظام.
            </p>
        </div>

        {financeStats.overdueUnitsCount > 0 && (
             <Alert variant="destructive">
                <BellRing className="h-4 w-4" />
                <AlertTitle className="font-bold">تنبيه: توجد مستحقات متأخرة</AlertTitle>
                <AlertDescription>
                    يوجد حاليًا <strong>{financeStats.overdueUnitsCount}</strong> وحدة عليها مستحقات مالية متأخرة بقيمة إجمالية تبلغ <strong>{formatCurrency(financeStats.totalDueAmount)}</strong>.
                </AlertDescription>
            </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <StatCard title="إجمالي المبالغ المتأخرة" value={formatCurrency(financeStats.totalDueAmount)} icon={DollarSign} colorClass="border-red-500" />
            <StatCard title="عدد الوحدات المتأخرة" value={financeStats.overdueUnitsCount} icon={ListChecks} colorClass="border-orange-500" />
            <StatCard title="إجمالي الأقساط المستحقة" value={financeStats.totalOverdueInstallments} icon={AlertTriangle} colorClass="border-red-600" />
            <StatCard title="إجمالي الأقساط القادمة" value={financeStats.totalUpcomingInstallments} icon={Clock} colorClass="border-blue-500" />
            <StatCard title="المسدد جزئيًا (من الخطط)" value={formatCurrency(financeStats.totalPartiallyPaidAmount)} icon={Banknote} colorClass="border-green-500" />
        </div>
        
        <div className="space-y-12">
            <ActiveDuesTable 
                unitsWithPlans={overdueUnits} 
                title="مديونيات مالية تم استحقاقها"
                description="قائمة بجميع الوحدات التي لديها قسط واحد على الأقل فات موعد استحقاقه."
                onSelectUnit={setSelectedUnit}
            />
            <ActiveDuesTable 
                unitsWithPlans={upcomingUnits}
                title="المستحقات المالية القادمة"
                description="قائمة بجميع الوحدات التي لديها أقساط لم يحن تاريخ استحقاقها بعد."
                onSelectUnit={setSelectedUnit}
                isUpcomingOnlyView={true}
            />
            <PaidInstallmentsTable unitsWithPaidInstallments={unitsWithPaidInstallments} />
        </div>

        {selectedUnit && (
            <PaymentPlanDialog 
                unit={selectedUnit}
                isOpen={!!selectedUnit}
                onClose={() => setSelectedUnit(null)}
            />
        )}
    </div>
  );
}
