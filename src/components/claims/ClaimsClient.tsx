
"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppDataContext';
import { Skeleton } from '@/components/ui/skeleton';
import { FileWarning, Download, Printer, Send, Mail, MessageSquare, FileText, History, CheckCircle, Archive, AlertCircle, ListChecks } from 'lucide-react';
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
import { ArchivedClaimsTable } from '../financial-follow-up/ArchivedClaimsTable';
import { Separator } from '../ui/separator';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { format } from 'date-fns';


const paymentStatusLabels: { [key: string]: string } = {
  deferred: 'مؤجل',
  payment_plan: 'خطة سداد',
  exempt: 'إعفاء',
  scholarship: 'ابتعاث'
};

const claimActionConfig: { [key: string]: { icon: React.ElementType, text: string } } = {
  'مطالبة عبر البريد الإلكتروني': { icon: Mail, text: 'مطالبة عبر البريد الإلكتروني' },
  'مطالبة عبر واتساب': { icon: MessageSquare, text: 'مطالبة عبر واتساب' },
  'مطالبة ورقية للطباعة': { icon: FileText, text: 'مطالبة ورقية للطباعة' },
};


const getLastClaim = (unit: Unit) => {
    if (!unit.claimHistory || unit.claimHistory.length === 0) {
        return null;
    }
    // Sort by date to make sure the last one is truly the most recent
    const sortedHistory = [...unit.claimHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return sortedHistory[0];
};

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
            if (nextUnpaid && nextUnpaid.dueDate) {
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


export function ClaimsClient() {
  const { buildings, loading, logClaimAction } = useAppContext();
  const { toast } = useToast();
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [activeAction, setActiveAction] = useState<'email' | 'whatsapp' | 'paper' | null>(null);
  
  const claimsTableRef = useRef<HTMLDivElement>(null);
  const actionPanelRef = useRef<HTMLDivElement>(null);


  // This effect ensures that when the global context updates, our local selectedUnit also gets the fresh data.
  React.useEffect(() => {
    if (selectedUnit) {
      const freshUnit = buildings
        .flatMap(b => [...b.apartments.units, ...b.suites.units])
        .find(u => u.id === selectedUnit.id);
      setSelectedUnit(freshUnit || null);
    }
  }, [buildings, selectedUnit?.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (
            selectedUnit &&
            claimsTableRef.current && 
            !claimsTableRef.current.contains(event.target as Node) &&
            actionPanelRef.current && 
            !actionPanelRef.current.contains(event.target as Node)
        ) {
            setSelectedUnit(null);
            setActiveAction(null);
        }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedUnit]);


 const { unitsWithActiveDues, unitsWithClaims } = useMemo(() => {
    if (loading) return { unitsWithActiveDues: [], unitsWithClaims: [] };
    
    const allUnits = buildings.flatMap(b => [...b.apartments.units, ...b.suites.units]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const activeDues: Unit[] = [];
    const withClaimsHistory: Unit[] = [];

    allUnits.forEach(u => {
        const isEligibleForClaim = u.status === 'rented' && 
                                   u.paymentStatus && 
                                   (u.paymentStatus === 'deferred' || u.paymentStatus === 'payment_plan');
        
        let needsClaimAction = false;

        if (isEligibleForClaim) {
            if (u.paymentStatus === 'deferred' && !u.paymentPlan) {
                // Case 1: Deferred payment with no plan. It's immediately considered due for a claim.
                needsClaimAction = true;
            } else if (u.paymentPlan) {
                // Case 2: Unit has a payment plan. Check if any due date is in the past.
                 const installments = u.paymentPlan.installments || u.paymentPlan.stipendDeductions;
                 if (installments && installments.some(i => !i.isPaid && new Date(i.dueDate) < today)) {
                     needsClaimAction = true;
                 } else if (u.paymentPlan.type === 'deferred' && u.paymentPlan.deferredUntil && new Date(u.paymentPlan.deferredUntil) < today) {
                     needsClaimAction = true;
                 }
            }
        }
        
        if (needsClaimAction) {
            activeDues.push(u);
        }
        
        if (u.claimHistory && u.claimHistory.length > 0) {
            withClaimsHistory.push(u);
        }
    });
    
    // Sort by priority: units with no claims first, then by building/unit number
    const sortFn = (a: Unit, b: Unit) => {
        const aHasClaims = (a.claimHistory?.length || 0) > 0;
        const bHasClaims = (b.claimHistory?.length || 0) > 0;
        if (aHasClaims !== bHasClaims) {
            return aHasClaims ? 1 : -1; // No claims first
        }
        return a.buildingId - b.buildingId || a.unitNumber - b.unitNumber;
    };
    activeDues.sort(sortFn);

    return { unitsWithActiveDues: activeDues, unitsWithClaims: withClaimsHistory };

  }, [buildings, loading]);

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

  const handleExport = (unitsToExport: Unit[], fileName: string) => {
    try {
      const dataToExport = unitsToExport.map(unit => {
        const { dueDate, remaining } = getPlanDetails(unit);
        const lastClaim = getLastClaim(unit);
        return {
            'المبنى/الغرفة': `${unit.buildingId} / ${unit.unitNumber}`,
            'نوع الوحدة': unit.unitType === 'apartment' ? 'شقة' : 'جناح',
            'حالة السداد': paymentStatusLabels[unit.paymentStatus || ''] || 'غير محدد',
            'تاريخ الاستحقاق القادم': dueDate ? format(dueDate, 'yyyy-MM-dd') : '-',
            'المبلغ المتبقي': formatCurrency(remaining),
            'آخر إجراء مطالبة': lastClaim ? lastClaim.action : 'لا يوجد',
            'تاريخ آخر إجراء': lastClaim ? format(new Date(lastClaim.date), 'yyyy-MM-dd') : '-',
        };
      });

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      ws["!rtl"] = true;
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "تقرير المطالبات المالية");
      
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      saveAs(new Blob([wbout], { type: "application/octet-stream" }), `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);

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

  const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M19.223 15.259c-.455-.228-2.674-1.319-3.088-1.468-.413-.148-.713-.227-.055.514.51.588.628.753.628 1.294 0 .54-.278 1.004-.556 1.282-.278.278-.695.392-1.056.333-.36-.06-1.527-.56-2.908-1.776-1.071-.94-1.789-2.12-2.066-2.783-.278-.665-.056-1.026.222-1.28.278-.252.556-.666.833-.944.278-.278.39-.5.5-.833.11-.334.055-.612-.11-.834-.167-.222-1.056-2.5-1.445-3.418-.39-.918-.78-1.03-1.11-1.03-.334 0-1.057.11-1.612.556-.556.445-1.223 1.223-1.223 2.946s1.25 3.42 1.445 3.668c.195.25 2.585 4.39 6.28 5.86.89.36 1.58.556 2.11.723.834.25 1.557.22 2.112-.054.61-.28 1.833-.973 2.11-1.835.28-.86.28-1.58.196-1.834-.084-.25-.334-.39-.723-.61zM12 2C6.477 2 2 6.477 2 12c0 1.742.446 3.485 1.357 5L2.5 21.5l4.643-.802C8.515 21.554 10.258 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
    </svg>
  );

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

       <div ref={claimsTableRef}>
        <Card className="mb-12">
            <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <CardTitle className="flex items-center gap-3 text-primary">
                        قائمة الوحدات المستحقة
                    </CardTitle>
                    <div className="flex gap-2 no-print">
                        <Button onClick={() => handleExport(unitsWithActiveDues, 'تقرير_مطالبات_مستحقة')} variant="outline" size="sm"><Download className="ml-2 h-4 w-4" /> تصدير إكسل</Button>
                        <Button onClick={handlePrint} size="sm"><Printer className="ml-2 h-4 w-4" /> طباعة</Button>
                    </div>
                </div>
                <CardDescription>
                    الجدول التالي يعرض جميع الوحدات التي عليها مستحقات مالية متأخرة أو تحتاج إلى تحديد خطة سداد.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto border rounded-lg">
                    <Table>
                        <TableHeader><TableRow className="bg-muted"><TableHead className="text-center">المبنى/الغرفة</TableHead><TableHead className="text-center">نوع الوحدة</TableHead><TableHead className="text-center">حالة السداد</TableHead><TableHead className="text-center">تاريخ الاستحقاق</TableHead><TableHead className="text-center">المبلغ المتبقي</TableHead><TableHead className="text-center">آخر إجراء مطالبة</TableHead><TableHead className="text-center">تاريخه</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {unitsWithActiveDues.length > 0 ? unitsWithActiveDues.map(unit => {
                                const { dueDate, remaining } = getPlanDetails(unit);
                                const lastClaim = getLastClaim(unit);
                                const hasNoClaims = !lastClaim;
                                const isSelected = selectedUnit?.id === unit.id;
                                return (
                                    <TableRow key={unit.id} onClick={() => handleRowClick(unit)} className={cn("cursor-pointer", isSelected ? "bg-primary/10" : (hasNoClaims ? "bg-red-50 hover:bg-red-100" : ""))}>
                                        <TableCell className="font-medium text-center">{unit.buildingId} / {unit.unitNumber}</TableCell>
                                        <TableCell className="text-center font-medium">{unit.unitType === 'apartment' ? 'شقة' : 'جناح'}</TableCell>
                                        <TableCell className="text-center"><Badge variant="outline">{paymentStatusLabels[unit.paymentStatus || ''] || '-'}</Badge></TableCell>
                                        <TableCell className="text-center">{dueDate ? format(dueDate, 'yyyy-MM-dd') : '-'}</TableCell>
                                        <TableCell className="font-semibold text-center text-red-600">{formatCurrency(remaining)}</TableCell>
                                        <TableCell className={cn("text-center text-sm", hasNoClaims ? "font-bold text-red-700" : "text-muted-foreground")}>{lastClaim ? lastClaim.action : "لم تتم المطالبة"}</TableCell>
                                        <TableCell className="text-center text-sm text-muted-foreground">{lastClaim ? format(new Date(lastClaim.date), 'yyyy-MM-dd') : '-'}</TableCell>
                                    </TableRow>
                                )
                            }) : (<TableRow><TableCell colSpan={7} className="text-center text-muted-foreground p-4">لا توجد وحدات مستحقة حاليًا.</TableCell></TableRow>)}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
      </div>
      
      {selectedUnit && (
        <div ref={actionPanelRef} className="mt-8 p-6 rounded-lg bg-muted shadow-inner">
            <Card className="shadow-lg animate-in fade-in-50">
                <CardHeader>
                    <h3 className="font-bold text-lg flex items-center gap-2"><Send className="h-5 w-5 text-primary" /> لوحة الإجراءات للوحدة</h3>
                    <p className="text-sm text-muted-foreground">مبنى {selectedUnit.buildingId} / غرفة {selectedUnit.unitNumber}</p>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div>
                        <div className="flex justify-center gap-4 mb-4 border-b pb-4">
                        <Button variant={activeAction === 'email' ? "default" : "outline"} onClick={() => setActiveAction('email')}>
                            <Mail className="ml-2 h-4 w-4" /> مطالبة عبر البريد الإلكتروني
                        </Button>
                        <Button variant={activeAction === 'whatsapp' ? "default" : "outline"} onClick={() => setActiveAction('whatsapp')}>
                            <WhatsAppIcon className="ml-2 h-4 w-4" /> مطالبة عبر واتساب
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

                    <Separator />

                    <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-4"><History className="h-5 w-5 text-primary" /> سجل المطالبات السابقة</h3>
                        <div className="border rounded-lg max-h-96 overflow-y-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted">
                                        <TableHead className="text-center">الإجراء</TableHead>
                                        <TableHead className="text-center">التاريخ والوقت</TableHead>
                                        <TableHead className="text-center">الحالة</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {selectedUnit.claimHistory && selectedUnit.claimHistory.length > 0 ? (
                                        [...selectedUnit.claimHistory].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(claim => {
                                            const config = claimActionConfig[claim.action];
                                            const ActionIcon = claim.action === 'مطالبة عبر واتساب' ? WhatsAppIcon : (config ? config.icon : FileWarning);
                                            return (
                                                <TableRow key={claim.id}>
                                                    <TableCell className="text-center text-sm flex items-center justify-center gap-2">
                                                        <ActionIcon className="h-4 w-4 text-muted-foreground" />
                                                        <span>{claim.action}</span>
                                                    </TableCell>
                                                    <TableCell className="text-center text-xs">{new Date(claim.date).toLocaleString('en-CA')}</TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                                                            <Send className="ml-1 h-3 w-3" />
                                                            تم الإرسال
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center text-muted-foreground p-4">لا يوجد سجل مطالبات لهذه الوحدة.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                    </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      )}
      
       <div className="mt-12">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-primary font-headline flex items-center gap-3">
                        <Archive className="h-7 w-7" />
                        أرشيف المطالبات المالية الموثقة
                    </CardTitle>
                    <CardDescription>
                       كشف شامل لجميع الوحدات التي تم إجراء مطالبات مالية لها، مع توضيح إجمالي عدد المطالبات لكل وحدة.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ArchivedClaimsTable unitsWithClaims={unitsWithClaims} />
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
