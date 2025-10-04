
"use client";

import React from 'react';
import { type Unit } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { CheckCircle, Download, Printer } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export const PaidInstallmentsTable = ({ unitsWithPaidInstallments }: { unitsWithPaidInstallments: Unit[] }) => {
  const { toast } = useToast();

  const handlePrint = () => {
    window.print();
  };

  const getPaidDetails = (unit: Unit) => {
    if (!unit.paymentPlan) {
      return { paidAmount: 0, paidCount: 0, paidDates: [] };
    }
    const installments = unit.paymentPlan.installments || unit.paymentPlan.stipendDeductions || [];
    const paidInstallments = installments.filter(i => i.isPaid);
    const paidAmount = paidInstallments.reduce((sum, i) => sum + i.amount, 0);
    const paidDates = paidInstallments.map(i => i.dueDate);
    return { paidAmount, paidCount: paidInstallments.length, paidDates };
  };

  const handleExport = () => {
    try {
        const dataToExport = unitsWithPaidInstallments.map(unit => {
            const { paidAmount, paidCount, paidDates } = getPaidDetails(unit);
            return {
                'المبنى/الغرفة': `${unit.buildingId} / ${unit.unitNumber}`,
                'نوع الوحدة': unit.unitType === 'apartment' ? 'شقة' : 'جناح',
                'تواريخ السداد': paidDates.map(date => format(new Date(date), 'yyyy-MM-dd')).join(', '),
                'عدد الدفعات المسددة': paidCount,
                'إجمالي المبلغ المسدد': formatCurrency(paidAmount),
            };
        });

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        ws["!rtl"] = true;
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "الدفعات المسددة");

        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        saveAs(new Blob([wbout], { type: "application/octet-stream" }), `الدفعات_المسددة_${new Date().toISOString().split('T')[0]}.xlsx`);

        toast({
            title: "تم التصدير بنجاح",
            className: "bg-green-100 border-green-400 text-green-800",
        });
    } catch (error) {
        console.error("Export failed:", error);
        toast({
            variant: "destructive",
            title: "خطأ في التصدير",
        });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-3 text-primary">
            <CheckCircle className="h-6 w-6" />
            كشف بالدفعات المسددة (للخطط النشطة)
          </CardTitle>
          <div className="flex gap-2 no-print">
            <Button onClick={handleExport} variant="outline"><Download className="ml-2 h-4 w-4" /> تصدير إكسل</Button>
            <Button onClick={handlePrint}><Printer className="ml-2 h-4 w-4" /> طباعة</Button>
          </div>
        </div>
        <CardDescription>
          قائمة بالوحدات التي قامت بتسديد دفعة واحدة على الأقل من خطتها المالية وما زالت الخطة نشطة.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {unitsWithPaidInstallments.length > 0 ? (
          <div className="overflow-x-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead className="text-center">المبنى/غرفة</TableHead>
                  <TableHead className="text-center">نوع الوحدة</TableHead>
                  <TableHead className="text-center">تاريخ الاستحقاق</TableHead>
                  <TableHead className="text-center">عدد الدفعات المسددة</TableHead>
                  <TableHead className="text-center">إجمالي المبلغ المسدد</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unitsWithPaidInstallments.map(unit => {
                  const { paidAmount, paidCount, paidDates } = getPaidDetails(unit);
                  return (
                    <TableRow key={unit.id}>
                        <TableCell className="font-medium text-center">{unit.buildingId} / {unit.unitNumber}</TableCell>
                        <TableCell className="text-center">{unit.unitType === 'apartment' ? 'شقة' : 'جناح'}</TableCell>
                        <TableCell className="text-center text-xs">
                          {paidDates.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {paidDates.map((date, i) => (
                                <span key={i}>{format(new Date(date), 'yyyy-MM-dd')}</span>
                              ))}
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-center font-semibold">{paidCount}</TableCell>
                        <TableCell className="text-center font-bold text-green-600">{formatCurrency(paidAmount)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-center text-muted-foreground p-4">
            لا توجد دفعات مسددة لخطط نشطة حاليًا.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
