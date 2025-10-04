
"use client";

import React from 'react';
import { type Unit } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { Archive, Download, Printer, FileText, FileWarning, WalletCards, AlertTriangle, Clock, Check, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';


const typeLabels = {
  deferred: "تأجيل",
  installment: "تقسيط",
  exempt: "إعفاء",
  stipend: "خصم من المكافأة",
  scholarship: "ابتعاث"
};

export const ActiveDuesTable = ({ unitsWithPlans, title, description, onSelectUnit, isUpcomingOnlyView = false }: { unitsWithPlans: Unit[], title: string, description: string, onSelectUnit: (unit: Unit) => void, isUpcomingOnlyView?: boolean }) => {
  const { toast } = useToast();

  const handlePrint = () => {
    window.print();
  };
  
  const getPlanDetails = (unit: Unit) => {
    const plan = unit.paymentPlan;
    const totalRent = unit.baseRent;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const defaultReturn = { 
        remaining: 0, totalPaid: totalRent, totalRent, 
        typeLabel: 'غير محدد', dueDates: [], 
        paidCount: 0, unpaidCount: 0, overdueInstallmentsCount: 0, 
        upcomingInstallmentsCount: 0, totalInstallmentsCount: 0,
        daysRemaining: null,
    };

    if (unit.paymentStatus === 'paid_in_full') {
      const installmentsCount = plan?.installments?.length || 0;
      return { ...defaultReturn, typeLabel: plan ? typeLabels[plan.type] : 'مسدد بالكامل', paidCount: installmentsCount, totalInstallmentsCount: installmentsCount };
    }

    if (!plan) {
        if (unit.paymentStatus === 'deferred') {
            return { ...defaultReturn, remaining: totalRent, typeLabel: 'لا يوجد خطة', unpaidCount: 1, totalInstallmentsCount: 1, overdueInstallmentsCount: 1, dueDates: [{ date: new Date(), delay: 999, amount: totalRent }] };
        }
        return defaultReturn;
    }
    
    const installments = plan.installments || plan.stipendDeductions || [];
    const totalInstallmentsCount = installments.length;
    const paidCount = installments.filter(i => i.isPaid).length;
    
    let dueDates: { date: Date, delay: number, amount: number }[] = [];
    
    let totalPaid = installments.filter(i => i.isPaid).reduce((sum, i) => sum + i.amount, 0);
    let remaining = totalRent - totalPaid;
    let overdueInstallments = installments.filter(i => !i.isPaid && new Date(i.dueDate) < today);
    let upcomingInstallments = installments.filter(i => !i.isPaid && new Date(i.dueDate) >= today);
    
    let daysRemaining: number | null = null;
    
    if (isUpcomingOnlyView) {
        if(upcomingInstallments.length > 0) {
            dueDates = upcomingInstallments.map(i => {
                return { date: new Date(i.dueDate), delay: 0, amount: i.amount };
            }).sort((a,b) => a.date.getTime() - b.date.getTime());
             daysRemaining = Math.ceil((dueDates[0].date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        }
    } else {
        if(overdueInstallments.length > 0) {
            dueDates = overdueInstallments.map(i => {
                const dueDate = new Date(i.dueDate);
                const delay = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
                return { date: dueDate, delay: delay > 0 ? delay : 0, amount: i.amount };
            }).sort((a,b) => a.date.getTime() - b.date.getTime());
        }
    }


    if (plan.type === 'deferred' && plan.deferredUntil) {
        const deferredDate = new Date(plan.deferredUntil);
        const delay = Math.floor((today.getTime() - deferredDate.getTime()) / (1000 * 60 * 60 * 24));
        const isOverdue = deferredDate < today;
        if ((!isUpcomingOnlyView && isOverdue) || (isUpcomingOnlyView && !isOverdue)) {
            dueDates = [{ date: deferredDate, delay: delay > 0 ? delay : 0, amount: totalRent }];
        }
        if (isOverdue) {
            overdueInstallments = [{amount: totalRent, dueDate: plan.deferredUntil, isPaid: false}];
        } else {
            upcomingInstallments = [{amount: totalRent, dueDate: plan.deferredUntil, isPaid: false}];
        }
        if (isUpcomingOnlyView && !isOverdue) {
             daysRemaining = Math.ceil((deferredDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        }
    }

    return { 
      remaining, 
      totalPaid,
      totalRent,
      typeLabel: typeLabels[plan.type], 
      dueDates, 
      paidCount, 
      unpaidCount: totalInstallmentsCount - paidCount,
      overdueInstallmentsCount: overdueInstallments.length,
      upcomingInstallmentsCount: upcomingInstallments.length,
      totalInstallmentsCount,
      daysRemaining,
    };
  }

  const totalRemainingDues = unitsWithPlans.reduce((sum, unit) => {
      return sum + getPlanDetails(unit).remaining;
  }, 0);


  const handleExport = () => {
    try {
        const dataToExport = unitsWithPlans.map(unit => {
            const { remaining, totalPaid, totalRent, typeLabel, dueDates, overdueInstallmentsCount, upcomingInstallmentsCount, totalInstallmentsCount, paidCount, daysRemaining } = getPlanDetails(unit);
            const firstDueDate = dueDates.length > 0 ? format(dueDates[0].date, 'yyyy-MM-dd') : '-';
            
            let timeInfo;
            if (isUpcomingOnlyView) {
                timeInfo = { 'الأيام المتبقية': daysRemaining !== null ? `${daysRemaining} يوم` : '-' };
            } else {
                timeInfo = { 'مدة التأخير': dueDates.length > 0 && dueDates[0].delay > 0 ? `${dueDates[0].delay} يوم` : '-' };
            }

            const baseData: {[key: string]: any} = {
                'المبنى/الغرفة': `${unit.buildingId} / ${unit.unitNumber}`,
                'نوع الوحدة': unit.unitType === 'apartment' ? 'شقة' : 'جناح',
                'مبلغ الإيجار': formatCurrency(unit.actualRent ?? unit.baseRent),
                'نوع الخطة': typeLabel,
                'عدد الأقساط': totalInstallmentsCount > 0 ? totalInstallmentsCount : '-',
                'المسدد منها': paidCount > 0 ? paidCount : '-',
                'موعد الاستحقاق': firstDueDate,
                ...timeInfo,
                'قيمة الدفعة': dueDates.length > 0 ? formatCurrency(dueDates[0].amount) : '-',
                'المبلغ المتبقي': formatCurrency(remaining),
            };

            if (!isUpcomingOnlyView) {
              baseData['عدد المطالبات'] = `${unit.claimHistory?.length || 0} مطالبة`;
            }

            return baseData;
        });

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        ws["!rtl"] = true;
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, title);

        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        saveAs(new Blob([wbout], { type: "application/octet-stream" }), `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);

        toast({
            title: "تم التصدير بنجاح",
            description: `تم تصدير "${title}" إلى ملف Excel.`,
            className: "bg-green-100 border-green-400 text-green-800",
        });

    } catch (error) {
        console.error("Export failed:", error);
        toast({
            variant: "destructive",
            title: "خطأ في التصدير",
            description: "حدث خطأ أثناء محاولة إنشاء ملف Excel.",
        });
    }
  };
  
  const ClaimStatusCell = ({ unit, dueDates }: { unit: Unit, dueDates: { date: Date, delay: number, amount: number }[] }) => {
    const { claimHistory = [] } = unit;

    const claimsPerDueDate = dueDates.map(dd => {
        const claimsForDate = claimHistory.filter(claim => new Date(claim.date) >= dd.date);
        return {
            date: dd.date,
            count: claimsForDate.length
        };
    });

    return (
        <TableCell className="text-center">
             <div className="flex flex-col gap-1 items-center">
            {claimsPerDueDate.map(({ date, count }, index) => {
                const hasClaims = count > 0;
                return (
                     <div key={index} className="flex items-center justify-center gap-2 text-xs h-[18px]">
                        {hasClaims ? (
                            <Check className="h-4 w-4 text-green-600" />
                        ) : (
                            <X className="h-4 w-4 text-red-600" />
                        )}
                        <span className={cn("font-bold", hasClaims ? "text-green-700" : "text-red-700")}>
                            {count}
                        </span>
                    </div>
                );
            })}
             </div>
        </TableCell>
    );
};
  
  const DueDatesCell = ({ dates }: { dates: { date: Date, delay: number, amount: number }[] }) => {
    if (dates.length === 0) return <TableCell className="text-center">-</TableCell>;

    return (
        <TableCell className="text-center">
            <div className="flex flex-col gap-1 items-center">
                {dates.map(({ date }, index) => (
                    <div key={index} className="flex items-center justify-center gap-2 text-xs h-[18px]">
                        <span className="font-mono">{format(date, 'yyyy-MM-dd')}</span>
                    </div>
                ))}
            </div>
        </TableCell>
    );
  };

  const PaymentAmountCell = ({ dates }: { dates: { date: Date, delay: number, amount: number }[]}) => {
    if (dates.length === 0) return <TableCell className="text-center">-</TableCell>;
    
    return (
        <TableCell className="text-center">
             <div className="flex flex-col gap-1 items-center">
                {dates.map(({ amount }, index) => (
                    <div key={index} className="flex items-center justify-center text-xs h-[18px]">
                        <span className="font-normal">{formatCurrency(amount)}</span>
                    </div>
                ))}
            </div>
        </TableCell>
    );
  };

  const DelayCell = ({ dates }: { dates: { date: Date, delay: number, amount: number }[]}) => {
    if (dates.length === 0) return <TableCell className="text-center">-</TableCell>;

    return (
        <TableCell className="text-center">
            <div className="flex flex-col gap-1 items-center">
                {dates.map(({ delay }, index) => (
                    <div key={index} className="flex items-center justify-center text-xs h-[18px]">
                       <span className="text-red-600 font-normal">{delay} يوم</span>
                    </div>
                ))}
            </div>
        </TableCell>
    );
  };

   const DaysRemainingCell = ({ days }: { days: number | null }) => {
    if (days === null) {
      return <TableCell className="text-center">-</TableCell>;
    }
    const color = days < 7 ? 'text-orange-600' : 'text-blue-600';
    return (
      <TableCell className={cn("text-center font-normal", color)}>
        {days} يوم
      </TableCell>
    );
  };


  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-3 text-primary">
            {title}
          </CardTitle>
          <div className="flex gap-2 no-print">
            <Button onClick={handleExport} variant="outline"><Download className="ml-2 h-4 w-4" /> تصدير إكسل</Button>
            <Button onClick={handlePrint}><Printer className="ml-2 h-4 w-4" /> طباعة</Button>
          </div>
        </div>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {unitsWithPlans.length > 0 ? (
          <div className="overflow-x-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead className="text-center">المبنى/غرفة</TableHead>
                  <TableHead className="text-center">نوع الخطة</TableHead>
                  <TableHead className="text-center">عدد الأقساط</TableHead>
                  <TableHead className="text-center">المسدد منها</TableHead>
                   {!isUpcomingOnlyView && (
                      <TableHead className="text-center">المتبقي</TableHead>
                    )}
                    {isUpcomingOnlyView && (
                        <TableHead className="text-center">المتبقي من الاقساط القادمة</TableHead>
                    )}
                  <TableHead className="text-center whitespace-nowrap">
                    {isUpcomingOnlyView ? 'موعد الاستحقاق القادم' : 'تاريخ الاستحقاق'}
                  </TableHead>
                  {isUpcomingOnlyView ? (
                      <>
                        <TableHead className="text-center">الأيام المتبقية</TableHead>
                        <TableHead className="text-center">قيمة الدفعة</TableHead>
                      </>
                  ) : (
                      <>
                        <TableHead className="text-center">مدة التأخير</TableHead>
                        <TableHead className="text-center">عدد المطالبات</TableHead>
                      </>
                  )}
                  <TableHead className="text-center">المبلغ المتبقي</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unitsWithPlans.map(unit => {
                  const { remaining, typeLabel, dueDates, totalInstallmentsCount, paidCount, daysRemaining, overdueInstallmentsCount, upcomingInstallmentsCount } = getPlanDetails(unit);
                  const needsPlan = typeLabel === 'لا يوجد خطة';
                  return (
                    <TableRow key={unit.id}>
                        <TableCell className="font-medium text-center">
                            {unit.buildingId} / {unit.unitNumber}
                        </TableCell>
                        <TableCell className="text-center">
                           {needsPlan ? (
                             <span className="text-orange-600 font-semibold">{typeLabel}</span>
                           ) : (
                            typeLabel
                           )}
                        </TableCell>
                        <TableCell className="text-center">
                           {totalInstallmentsCount > 0 ? (
                                <span>{totalInstallmentsCount}</span>
                           ) : (
                                <span className="text-muted-foreground">-</span>
                           )}
                        </TableCell>
                         <TableCell className="text-center">
                           {paidCount > 0 ? (
                                <span className="font-semibold text-green-600">{paidCount}</span>
                           ) : (
                                <span className="text-muted-foreground">{totalInstallmentsCount > 0 ? 0 : '-'}</span>
                           )}
                        </TableCell>
                        {!isUpcomingOnlyView && (
                             <TableCell className="text-center">
                               {overdueInstallmentsCount > 0 ? (
                                    <span className="font-semibold text-red-600">{overdueInstallmentsCount}</span>
                               ) : (
                                    <span className="text-muted-foreground">{totalInstallmentsCount > 0 ? 0 : '-'}</span>
                               )}
                            </TableCell>
                        )}
                        {isUpcomingOnlyView && (
                             <TableCell className="text-center">
                                <span className="font-semibold text-blue-600">{upcomingInstallmentsCount}</span>
                            </TableCell>
                        )}
                        <DueDatesCell dates={dueDates} />
                         {isUpcomingOnlyView ? (
                            <>
                                <DaysRemainingCell days={daysRemaining} />
                                <PaymentAmountCell dates={dueDates} />
                            </>
                        ) : (
                             <>
                                <DelayCell dates={dueDates} />
                                <ClaimStatusCell unit={unit} dueDates={dueDates} />
                             </>
                        )}
                        <TableCell className="font-semibold text-center text-red-600">{formatCurrency(remaining)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFooter>
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell colSpan={isUpcomingOnlyView ? 7 : 8} className="text-center text-lg">
                    إجمالي المستحقات في هذا الكشف
                  </TableCell>
                  <TableCell className="text-center text-lg text-red-700" colSpan={1}>
                    {formatCurrency(totalRemainingDues)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        ) : (
          <p className="text-center text-muted-foreground p-4">
            لا توجد بيانات لعرضها في هذا الكشف.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
