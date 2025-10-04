
"use client";

import React from 'react';
import { type Unit } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { Archive, Download, Printer, FileText, FileWarning } from 'lucide-react';
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

export const ArchivedPlansTable = ({ unitsWithPlans }: { unitsWithPlans: Unit[] }) => {
  const { toast } = useToast();

  const handlePrint = () => {
    window.print();
  };
  
  const getPlanDetails = (unit: Unit) => {
    const plan = unit.paymentPlan;
    const totalRent = unit.baseRent;

    let dueDate: Date | null = null;
    let daysRemaining: number | null = null;
    let paidCount = 0;
    let unpaidCount = 0;
    let remaining = 0;
    let totalPaid = 0;
    let overdueInstallmentsCount = 0;
    let totalInstallmentsCount = 0;

    if (unit.paymentStatus === 'paid_in_full') {
        remaining = 0;
        totalPaid = totalRent;
    } else if (!plan) {
        if (unit.paymentStatus === 'deferred') {
            remaining = totalRent;
            totalPaid = 0;
        } else {
            remaining = 0;
            totalPaid = totalRent;
        }
    } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const calculateInstallments = (installments: any[]) => {
            totalInstallmentsCount = installments.length;
            paidCount = installments.filter(i => i.isPaid).length;
            unpaidCount = totalInstallmentsCount - paidCount;
            totalPaid = installments.filter(i => i.isPaid).reduce((sum, i) => sum + i.amount, 0);
            remaining = totalRent - totalPaid;
            
            const unpaidInstallments = installments.filter(i => !i.isPaid);
            const nextUnpaid = unpaidInstallments.sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
            
            if (nextUnpaid && nextUnpaid.dueDate) {
                dueDate = new Date(nextUnpaid.dueDate);
            }

            overdueInstallmentsCount = unpaidInstallments.filter(i => new Date(i.dueDate) < today).length;

        }

        if (plan.type === 'installment' && plan.installments) {
            calculateInstallments(plan.installments);
        } else if (plan.type === 'stipend' && plan.stipendDeductions) {
           calculateInstallments(plan.stipendDeductions);
        } else if (plan.type === 'deferred' && plan.deferredUntil) {
            remaining = totalRent;
            totalPaid = 0;
            dueDate = new Date(plan.deferredUntil);
            totalInstallmentsCount = 1;
            if (dueDate < today) {
                overdueInstallmentsCount = 1;
            }
        }
    }

    if (dueDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDateNormalized = new Date(dueDate);
        dueDateNormalized.setHours(0,0,0,0);
        daysRemaining = Math.round((dueDateNormalized.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }


    return { 
      remaining, 
      totalPaid,
      totalRent,
      typeLabel: plan ? typeLabels[plan.type] : (unit.paymentStatus === 'deferred' ? 'مديونية مؤجلة' : '-'), 
      dueDate, 
      daysRemaining, 
      paidCount, 
      unpaidCount,
      overdueInstallmentsCount,
      totalInstallmentsCount,
    };
  }

  const totalRemainingDues = unitsWithPlans.reduce((sum, unit) => {
      return sum + getPlanDetails(unit).remaining;
  }, 0);


  const handleExport = () => {
    try {
        const dataToExport = unitsWithPlans.map(unit => {
            const { remaining, totalPaid, totalRent, typeLabel, dueDate, daysRemaining, overdueInstallmentsCount, totalInstallmentsCount, paidCount } = getPlanDetails(unit);
            return {
                'المبنى/الغرفة': `${unit.buildingId} / ${unit.unitNumber}`,
                'نوع الوحدة': unit.unitType === 'apartment' ? 'شقة' : 'جناح',
                'مبلغ الإيجار': formatCurrency(unit.actualRent ?? unit.baseRent),
                'نوع الخطة': typeLabel,
                'عدد الأقساط': totalInstallmentsCount > 0 ? totalInstallmentsCount : '-',
                'المسدد منها': paidCount > 0 ? paidCount : '-',
                'عدد المطالبات': `${unit.claimHistory?.length || 0} مطالبة`,
                'تاريخ الاستحقاق القادم': dueDate ? format(dueDate, 'yyyy-MM-dd') : '-',
                'الأيام المتبقية': daysRemaining !== null ? (daysRemaining >= 0 ? `${daysRemaining} يوم` : `متأخر ${Math.abs(daysRemaining)} يوم`) : '-',
                'الدفعات المستحقة': overdueInstallmentsCount > 0 ? `${overdueInstallmentsCount} من ${totalInstallmentsCount}` : '-',
                'إجمالي الدين': formatCurrency(totalRent),
                'المبلغ المسدد': formatCurrency(totalPaid),
                'المبلغ المتبقي': formatCurrency(remaining),
            };
        });

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        ws["!rtl"] = true;
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "الخطط المالية النشطة");

        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        saveAs(new Blob([wbout], { type: "application/octet-stream" }), `الخطط_المالية_النشطة_${new Date().toISOString().split('T')[0]}.xlsx`);

        toast({
            title: "تم التصدير بنجاح",
            description: "تم تصدير الخطط المالية النشطة إلى ملف Excel.",
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
  
  const DaysRemainingCell = ({ days }: { days: number | null }) => {
    if (days === null) return <TableCell className="text-center">-</TableCell>;
    const cellClass = days < 0 ? 'text-destructive' : 'text-foreground';
    return (
        <TableCell className={cn("text-center text-xs font-normal", cellClass)}>
            {days < 0 ? `متأخر ${Math.abs(days)} يوم` : `${days} يوم`}
        </TableCell>
    );
  };
  
  const ClaimStatusCell = ({ unit }: { unit: Unit }) => {
    const claimCount = unit.claimHistory?.length || 0;
    const hasClaims = claimCount > 0;
    return (
      <TableCell className="text-center">
        <Badge variant={hasClaims ? "destructive" : "secondary"} className={cn("gap-1", !hasClaims && "bg-gray-200 text-gray-800")}>
          <FileWarning className="h-3 w-3" />
          <span>{claimCount}</span>
        </Badge>
      </TableCell>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-3 text-primary">
            <FileText className="h-6 w-6" />
            سجل المستحقات المالية النشطة
          </CardTitle>
          <div className="flex gap-2 no-print">
            <Button onClick={handleExport} variant="outline"><Download className="ml-2 h-4 w-4" /> تصدير إكسل</Button>
            <Button onClick={handlePrint}><Printer className="ml-2 h-4 w-4" /> طباعة</Button>
          </div>
        </div>
        <CardDescription>
          سجل تفاعلي لجميع الوحدات التي لديها مستحقات مالية نشطة للفصل الدراسي الحالي.
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
                  <TableHead className="text-center">عدد المطالبات</TableHead>
                  <TableHead className="text-center">تاريخ الاستحقاق</TableHead>
                  <TableHead className="text-center">الأيام المتبقية</TableHead>
                  <TableHead className="text-center">الدفعات المستحقة</TableHead>
                  <TableHead className="text-center">إجمالي الدين</TableHead>
                  <TableHead className="text-center">المبلغ المسدد</TableHead>
                  <TableHead className="text-center">المبلغ المتبقي</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unitsWithPlans.map(unit => {
                  const { remaining, totalPaid, totalRent, typeLabel, dueDate, daysRemaining, overdueInstallmentsCount, totalInstallmentsCount, paidCount } = getPlanDetails(unit);
                  return (
                    <TableRow key={unit.id}>
                        <TableCell className="font-medium text-center">
                            {unit.buildingId} / {unit.unitNumber}
                        </TableCell>
                        <TableCell className="text-center">{typeLabel}</TableCell>
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
                        <ClaimStatusCell unit={unit} />
                        <TableCell className="text-center">{dueDate ? format(dueDate, 'yyyy-MM-dd') : '-'}</TableCell>
                        <DaysRemainingCell days={daysRemaining} />
                        <TableCell className="text-center">
                           {overdueInstallmentsCount > 0 ? (
                                <span>
                                    <span className="font-bold text-destructive">{overdueInstallmentsCount}</span>
                                    <span className="text-muted-foreground font-normal text-xs"> من {totalInstallmentsCount}</span>
                                </span>
                           ) : (
                                <span className="text-muted-foreground">-</span>
                           )}
                        </TableCell>
                        <TableCell className="font-semibold text-center">{formatCurrency(totalRent)}</TableCell>
                        <TableCell className="font-semibold text-center text-green-600">{formatCurrency(totalPaid)}</TableCell>
                        <TableCell className="font-semibold text-center text-red-600">{formatCurrency(remaining)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFooter>
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell colSpan={10} className="text-center text-lg">
                    إجمالي المستحقات المتأخرة
                  </TableCell>
                  <TableCell className="text-center text-lg text-red-700">
                    {formatCurrency(totalRemainingDues)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        ) : (
          <p className="text-center text-muted-foreground p-4">
            لا توجد خطط مالية نشطة مسجلة حاليًا.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
