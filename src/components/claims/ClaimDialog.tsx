
"use client";

import React, { useState, useMemo } from 'react';
import { useAppContext } from '@/contexts/AppDataContext';
import { Skeleton } from '@/components/ui/skeleton';
import { FileWarning, Download, Printer, Send, Mail, MessageSquare, FileText, History } from 'lucide-react';
import { type Unit } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { EmailClaim } from './EmailClaim';
import { WhatsAppClaim } from './WhatsAppClaim';
import { PaperClaim } from './PaperClaim';
import { cn } from '@/lib/utils';

const paymentStatusLabels: { [key: string]: string } = {
  deferred: 'مؤجل',
  payment_plan: 'خطة سداد',
  exempt: 'إعفاء',
  scholarship: 'ابتعاث'
};

const getLastClaim = (unit: Unit) => {
    if (!unit.claimHistory || unit.claimHistory.length === 0) {
        return null;
    }
    // Sort by date to make sure the last one is truly the most recent
    const sortedHistory = [...unit.claimHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return sortedHistory[0];
};

export function ClaimsClient() {
  const { buildings, loading, setBuildings } = useAppContext();
  const { toast } = useToast();
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [activeAction, setActiveAction] = useState<'email' | 'whatsapp' | 'paper' | null>(null);
  
  // This effect ensures that when the global context updates, our local selectedUnit also gets the fresh data.
  React.useEffect(() => {
    if (selectedUnit) {
      const freshUnit = buildings
        .flatMap(b => [...b.apartments.units, ...b.suites.units])
        .find(u => u.id === selectedUnit.id);
      setSelectedUnit(freshUnit || null);
    }
  }, [buildings, selectedUnit?.id]);


  const unitsWithDues = useMemo(() => {
    if (loading) return [];
    
    const allUnits = buildings.flatMap(b => [...b.apartments.units, ...b.suites.units]);
    
    return allUnits
      .filter(u => u.status === 'rented' && u.paymentStatus && (u.paymentStatus !== 'paid' && u.paymentStatus !== 'paid_in_full'))
      .sort((a, b) => a.buildingId - b.buildingId || a.unitNumber - b.unitNumber);

  }, [buildings, loading]);

  const getPlanDetails = (unit: Unit | null) => {
    if (!unit) return { dueDate: null, remaining: 0 };
    
    const plan = unit.paymentPlan;
    const totalRent = unit.baseRent;

    let dueDate: Date | null = null;
    let remaining = 0;

    if (unit.paymentStatus === 'paid_in_full') {
        remaining = 0;
    } else if (!plan) {
        if (unit.paymentStatus === 'deferred') {
            remaining = totalRent;
        }
    } else {
        const calculateInstallments = (installments: any[]) => {
            const totalPaid = installments.filter(i => i.isPaid).reduce((sum, i) => sum + i.amount, 0);
            remaining = totalRent - totalPaid;
            const nextUnpaid = installments.find(i => !i.isPaid);
            if (nextUnpaid) {
                dueDate = new Date(nextUnpaid.dueDate);
            }
        }

        if (plan.type === 'installment' && plan.installments) {
            calculateInstallments(plan.installments);
        } else if (plan.type === 'stipend' && plan.stipendDeductions) {
           calculateInstallments(plan.stipendDeductions);
        } else if (plan.type === 'deferred' && plan.deferredUntil) {
            remaining = totalRent;
            dueDate = new Date(plan.deferredUntil);
        } else if (plan.type === 'exempt' || plan.type === 'scholarship') {
            remaining = 0;
        }
    }
    
    return { dueDate, remaining };
  }

  const { dueDate: selectedUnitDueDate, remaining: selectedUnitRemaining } = getPlanDetails(selectedUnit);

  const handleRowClick = (unit: Unit) => {
    if (selectedUnit?.id === unit.id) {
        setSelectedUnit(null); // Deselect if clicking the same row
        setActiveAction(null);
    } else {
        setSelectedUnit(unit);
        setActiveAction(null);
    }
  };
  
  const handleActionComplete = () => {
    setActiveAction(null);
    // The selectedUnit state will be updated via the useEffect hook when context changes
  };


  const handlePrint = () => window.print();

  const handleExport = () => {
    try {
      const dataToExport = unitsWithDues.map(unit => {
        const { dueDate, remaining } = getPlanDetails(unit);
        const lastClaim = getLastClaim(unit);
        return {
            'المبنى': unit.buildingId,
            'الغرفة': unit.unitNumber,
            'حالة السداد': paymentStatusLabels[unit.paymentStatus || ''] || 'غير محدد',
            'تاريخ الاستحقاق القادم': dueDate ? dueDate.toLocaleDateString('ar-SA') : '-',
            'المبلغ المتبقي': formatCurrency(remaining),
            'آخر إجراء مطالبة': lastClaim ? lastClaim.action : 'لا يوجد',
            'تاريخ آخر إجراء': lastClaim ? new Date(lastClaim.date).toLocaleDateString('ar-SA') : '-',
        };
      });

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      ws["!rtl"] = true;
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "تقرير المطالبات المالية");
      
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      saveAs(new Blob([wbout], { type: "application/octet-stream" }), `تقرير_المطالبات_${new Date().toISOString().split('T')[0]}.xlsx`);

       toast({
            title: "تم التصدير بنجاح",
            description: "تم تصدير تقرير المطالبات المالية إلى ملف Excel.",
            className: "bg-green-100 border-green-400 text-green-800",
        });

    } catch (error) {
       console.error("Export failed:", error);
       toast({ variant: "destructive", title: "خطأ في التصدير" });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6">
        <Skeleton className="h-10 w-1/3 mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="mb-8 print:hidden">
        <h1 className="text-3xl font-bold text-primary font-headline flex items-center gap-3">
          <FileWarning className="h-8 w-8" />
          المطالبات المالية
        </h1>
        <p className="text-muted-foreground mt-2 text-base font-medium">
          صفحة مركزية لإنشاء ومتابعة المطالبات المالية للوحدات ذات المستحقات المتأخرة.
        </p>
      </div>

      <Card>
        <CardHeader>
             <div className="flex flex-wrap items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-3 text-primary">
                    قائمة الوحدات المستحقة
                </CardTitle>
                <div className="flex gap-2 no-print">
                    <Button onClick={handleExport} variant="outline"><Download className="ml-2 h-4 w-4" /> تصدير إكسل</Button>
                    <Button onClick={handlePrint}><Printer className="ml-2 h-4 w-4" /> طباعة</Button>
                </div>
            </div>
          <CardDescription>
            قائمة بالوحدات التي عليها مستحقات مالية للفصل الدراسي الحالي. اختر وحدة لبدء إجراء المطالبة.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto border rounded-lg">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted">
                        <TableHead className="text-center">مبنى/غرفة</TableHead>
                        <TableHead className="text-center">حالة السداد</TableHead>
                        <TableHead className="text-center">تاريخ الاستحقاق</TableHead>
                        <TableHead className="text-center">المبلغ المتبقي</TableHead>
                        <TableHead className="text-center">آخر إجراء مطالبة</TableHead>
                        <TableHead className="text-center">تاريخه</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {unitsWithDues.length > 0 ? unitsWithDues.map(unit => {
                        const { dueDate, remaining } = getPlanDetails(unit);
                        const lastClaim = getLastClaim(unit);
                        const isSelected = selectedUnit?.id === unit.id;
                        return (
                            <TableRow 
                                key={unit.id} 
                                onClick={() => handleRowClick(unit)}
                                className={cn("cursor-pointer", isSelected && "bg-primary/10")}
                            >
                                <TableCell className="font-medium text-center">
                                    {unit.buildingId} / {unit.unitNumber}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="outline">{paymentStatusLabels[unit.paymentStatus || ''] || '-'}</Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                    {dueDate ? dueDate.toLocaleDateString('ar-SA') : '-'}
                                </TableCell>
                                <TableCell className="font-semibold text-center text-red-600">
                                    {formatCurrency(remaining)}
                                </TableCell>
                                <TableCell className="text-center text-sm text-muted-foreground">
                                    {lastClaim ? lastClaim.action : "لا يوجد"}
                                </TableCell>
                                <TableCell className="text-center text-sm text-muted-foreground">
                                    {lastClaim ? new Date(lastClaim.date).toLocaleDateString('ar-SA') : '-'}
                                </TableCell>
                            </TableRow>
                        )
                    }) : (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground p-4">
                                لا توجد وحدات عليها مستحقات حاليًا.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {selectedUnit && (
        <Card className="mt-6 shadow-lg animate-in fade-in-50">
           <CardHeader className="bg-muted/50">
               <CardTitle>لوحة الإجراءات للوحدة: {selectedUnit.buildingId} / {selectedUnit.unitNumber}</CardTitle>
               <CardDescription>اختر وسيلة المطالبة المناسبة لهذه الوحدة.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex justify-center gap-4 mb-4 border-b pb-4">
                      <Button variant={activeAction === 'email' ? "default" : "outline"} onClick={() => setActiveAction('email')}>
                          <Mail className="ml-2 h-4 w-4" /> مطالبة عبر البريد الإلكتروني
                      </Button>
                      <Button variant={activeAction === 'whatsapp' ? "default" : "outline"} onClick={() => setActiveAction('whatsapp')}>
                           <MessageSquare className="ml-2 h-4 w-4" /> مطالبة عبر واتساب
                      </Button>
                      <Button variant={activeAction === 'paper' ? "default" : "outline"} onClick={() => setActiveAction('paper')}>
                          <FileText className="ml-2 h-4 w-4" /> مطالبة ورقية للطباعة
                      </Button>
                  </div>
                  
                  <div className="p-4">
                      {activeAction === 'email' && <EmailClaim unit={selectedUnit} remainingAmount={selectedUnitRemaining} dueDate={selectedUnitDueDate} onActionComplete={handleActionComplete} />}
                      {activeAction === 'whatsapp' && <WhatsAppClaim unit={selectedUnit} remainingAmount={selectedUnitRemaining} dueDate={selectedUnitDueDate} onActionComplete={handleActionComplete} />}
                      {activeAction === 'paper' && <PaperClaim unit={selectedUnit} remainingAmount={selectedUnitRemaining} dueDate={selectedUnitDueDate} onActionComplete={handleActionComplete} />}
                  </div>
                </div>

                <div>
                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><History className="h-5 w-5 text-primary" /> سجل المطالبات السابقة</h3>
                     <div className="border rounded-lg max-h-80 overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-center">الإجراء</TableHead>
                                    <TableHead className="text-center">التاريخ</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {selectedUnit.claimHistory && selectedUnit.claimHistory.length > 0 ? (
                                    [...selectedUnit.claimHistory].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(claim => (
                                        <TableRow key={claim.id}>
                                            <TableCell className="text-center text-sm">{claim.action}</TableCell>
                                            <TableCell className="text-center text-xs">{new Date(claim.date).toLocaleString('ar-SA')}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center text-muted-foreground">لا يوجد سجل مطالبات لهذه الوحدة.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
