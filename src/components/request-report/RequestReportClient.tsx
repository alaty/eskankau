
"use client";

import React, { useState, useMemo } from 'react';
import { useAppContext } from '@/contexts/AppDataContext';
import { type Unit } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardCheck, Download, Printer, BedDouble, Wallet, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const maintenanceTypeLabels: { [key: string]: string } = {
  maintenance: "صيانة عامة",
  furniture: "أثاث",
  electrical: "كهرباء",
  painting: "دهانات",
  none: "أخرى",
};

const unitStatusLabels: Record<Unit['status'], string> = {
  available: "متاحة",
  rented: "مؤجرة",
  under_maintenance: "تحت الصيانة",
  office: "مكتب إداري",
};

const paymentStatusLabels: { [key: string]: string } = {
  paid: 'تم السداد',
  deferred: 'مؤجل',
  payment_plan: 'خطة سداد',
  paid_in_full: 'مسدد بالكامل',
  exempt: 'إعفاء',
  scholarship: 'ابتعاث'
};

const ReportResultsTable = ({ units, reportType, reportValue }: { units: Unit[], reportType: string, reportValue: string }) => {
  const { toast } = useToast();

  const handlePrint = () => window.print();

    const getOverdueDetails = (unit: Unit) => {
        if (!unit.paymentPlan) return { dueDate: null, daysOverdue: null, remainingAmount: 0 };

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let nextDueDate: Date | null = null;
        let remainingAmount = unit.baseRent;

        if (unit.paymentPlan.type === 'deferred' && unit.paymentPlan.deferredUntil) {
            nextDueDate = new Date(unit.paymentPlan.deferredUntil);
            remainingAmount = unit.baseRent;
        } else {
            const installments = unit.paymentPlan.installments || unit.paymentPlan.stipendDeductions;
            if (installments) {
                 const totalPaid = installments.filter(inst => inst.isPaid).reduce((sum, inst) => sum + inst.amount, 0);
                 remainingAmount = unit.baseRent - totalPaid;

                const overdueInstallments = installments
                    .filter(inst => !inst.isPaid)
                    .map(inst => new Date(inst.dueDate))
                    .sort((a, b) => a.getTime() - b.getTime());

                if (overdueInstallments.length > 0) {
                    nextDueDate = overdueInstallments[0];
                }
            }
        }
        
        if (nextDueDate) {
            const daysOverdue = Math.floor((today.getTime() - nextDueDate.getTime()) / (1000 * 60 * 60 * 24));
            return { dueDate: nextDueDate, daysOverdue: daysOverdue > 0 ? daysOverdue : 0, remainingAmount };
        }

        return { dueDate: null, daysOverdue: null, remainingAmount };
    };
  
  const getReportTitle = () => {
    if (reportType === 'status') {
      return `تقرير الوحدات (${unitStatusLabels[reportValue as Unit['status']]})`;
    }
    if (reportType === 'paymentStatus') {
       return `تقرير حالة السداد (${paymentStatusLabels[reportValue] || 'غير محدد'})`;
    }
    if (reportType === 'overdue') {
        return `تقرير الوحدات ذات المستحقات المتأخرة`;
    }
    return 'نتائج التقرير';
  }

  const getReportDescription = () => {
    let description = '';
    if (reportType === 'status') {
      description = `إجمالي عدد الوحدات التي تم رصد حالتها إلى (${unitStatusLabels[reportValue as Unit['status']]}) في جميع المباني = ${units.length}`;
    } else if (reportType === 'paymentStatus') {
      description = `إجمالي عدد الوحدات التي تم رصد حالة سدادها إلى (${paymentStatusLabels[reportValue] || 'غير محدد'}) في جميع المباني = ${units.length}`;
    } else if (reportType === 'overdue') {
        description = `إجمالي عدد الوحدات التي لديها دفعات متأخرة = ${units.length}`;
    } else {
      description = `إجمالي عدد الوحدات التي تطابق هذا الشرط: ${units.length}`;
    }
    return description;
  }

  const reportTitle = getReportTitle();
  const reportDescription = getReportDescription();


  const handleExport = () => {
    try {
      const dataToExport = units.map(unit => {
        let baseData: {[key: string]: any} = {
          'المبنى/الغرفة': `${unit.buildingId} / ${unit.unitNumber}`,
          'نوع الوحدة': unit.unitType === 'apartment' ? 'شقة' : 'جناح',
        };

        if (reportType === 'status') {
             baseData['الحالة'] = unitStatusLabels[unit.status];
             if (reportValue === 'under_maintenance') {
                 return { ...baseData, 'نوع الصيانة': maintenanceTypeLabels[unit.vacancyReason || 'none'] || 'غير محدد', 'التكلفة': formatCurrency(unit.maintenanceCost || 0) };
             }
             if (reportValue === 'rented') {
                 return { ...baseData, 'حالة السداد': paymentStatusLabels[unit.paymentStatus || ''] || '-', 'الإيجار الفعلي': formatCurrency(unit.actualRent || 0) };
             }
        }
        
        if (reportType === 'paymentStatus') {
            baseData['حالة الغرفة'] = unitStatusLabels[unit.status];
            baseData['حالة السداد'] = paymentStatusLabels[unit.paymentStatus || ''] || '-';
            baseData['الإيجار الأساسي'] = formatCurrency(unit.baseRent);
            baseData['الإيجار الفعلي'] = formatCurrency(unit.actualRent || 0);
        }

        if (reportType === 'overdue') {
            const { dueDate, daysOverdue, remainingAmount } = getOverdueDetails(unit);
            return {
                ...baseData,
                'حالة السداد': paymentStatusLabels[unit.paymentStatus || ''] || '-',
                'الإيجار الأساسي': formatCurrency(unit.baseRent),
                'تاريخ الاستحقاق': dueDate ? format(dueDate, 'yyyy-MM-dd') : '-',
                'أيام التأخير': daysOverdue !== null ? daysOverdue : '-',
                'المبلغ المتبقي': formatCurrency(remainingAmount),
            };
        }

        return baseData;
      });

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      ws["!rtl"] = true;
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, reportTitle);

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      saveAs(new Blob([wbout], { type: "application/octet-stream" }), `تقرير_${reportValue}_${new Date().toISOString().split('T')[0]}.xlsx`);

      toast({
        title: "تم التصدير بنجاح",
        description: "تم تصدير التقرير إلى ملف Excel.",
        className: "bg-green-100 border-green-400 text-green-800",
      });

    } catch (error) {
      console.error("Export failed:", error);
      toast({ variant: "destructive", title: "خطأ في التصدير" });
    }
  };
  
  if (units.length === 0) {
      return <p className="text-center text-muted-foreground p-4">لا توجد وحدات تطابق هذا الشرط حاليًا.</p>;
  }

  const renderHeaders = () => {
      const baseHeaders = (
        <>
            <TableHead className="w-[15%] text-center">المبنى/الغرفة</TableHead>
            <TableHead className="w-[15%] text-center">نوع الوحدة</TableHead>
        </>
      );
      
      if (reportType === 'status') {
          switch(reportValue) {
              case 'under_maintenance':
                  return (
                      <>
                        {baseHeaders}
                        <TableHead className="w-[20%] text-center">نوع الصيانة</TableHead>
                        <TableHead className="w-[15%] text-center">تاريخ البدء</TableHead>
                        <TableHead className="w-[15%] text-center">الانتهاء المتوقع</TableHead>
                        <TableHead className="w-[20%] text-center">التكلفة</TableHead>
                      </>
                  );
              case 'rented':
                   return (
                      <>
                        {baseHeaders}
                        <TableHead className="w-[20%] text-center">حالة السداد</TableHead>
                        <TableHead className="w-[15%] text-center">تاريخ الإيجار</TableHead>
                        <TableHead className="w-[15%] text-center">الإيجار الفعلي</TableHead>
                      </>
                  );
              default:
                  return baseHeaders;
          }
      }
      
      if (reportType === 'paymentStatus') {
          return (
             <>
                {baseHeaders}
                <TableHead className="w-[15%] text-center">حالة الغرفة</TableHead>
                <TableHead className="w-[15%] text-center">حالة السداد</TableHead>
                <TableHead className="w-[20%] text-center">الإيجار الأساسي</TableHead>
                <TableHead className="w-[20%] text-center">الإيجار الفعلي</TableHead>
             </>
          )
      }
      
       if (reportType === 'overdue') {
          return (
             <>
                {baseHeaders}
                <TableHead className="text-center">حالة السداد</TableHead>
                <TableHead className="text-center">الإيجار الأساسي</TableHead>
                <TableHead className="text-center">المبلغ المتبقي</TableHead>
                <TableHead className="text-center">تاريخ الاستحقاق</TableHead>
                <TableHead className="text-center">أيام التأخير</TableHead>
             </>
          )
      }

      return baseHeaders;
  }
  
  const renderRow = (unit: Unit) => {
       const baseCells = (
        <>
            <TableCell className="font-medium text-center">{unit.buildingId} / {unit.unitNumber}</TableCell>
            <TableCell className="text-center">{unit.unitType === 'apartment' ? 'شقة' : 'جناح'}</TableCell>
        </>
       );

       if (reportType === 'status') {
           switch(reportValue) {
               case 'under_maintenance':
                   return (
                       <>
                        {baseCells}
                        <TableCell className="text-center">{maintenanceTypeLabels[unit.vacancyReason || 'none'] || 'غير محدد'}</TableCell>
                        <TableCell className="text-center">{unit.maintenanceStartDate ? format(new Date(unit.maintenanceStartDate), 'yyyy-MM-dd') : '-'}</TableCell>
                        <TableCell className="text-center">{unit.maintenanceEndDate ? format(new Date(unit.maintenanceEndDate), 'yyyy-MM-dd') : '-'}</TableCell>
                        <TableCell className="text-center">{formatCurrency(unit.maintenanceCost || 0)}</TableCell>
                       </>
                   );
                case 'rented':
                    return (
                        <>
                        {baseCells}
                        <TableCell className="text-center"><Badge variant="outline">{paymentStatusLabels[unit.paymentStatus || ''] || '-'}</Badge></TableCell>
                        <TableCell className="text-center">{unit.rentDate ? format(new Date(unit.rentDate), 'yyyy-MM-dd') : '-'}</TableCell>
                        <TableCell className="text-center">{formatCurrency(unit.actualRent || 0)}</TableCell>
                        </>
                    );
               default:
                   return baseCells;
           }
       }
       
       if (reportType === 'paymentStatus') {
           return (
               <>
                {baseCells}
                <TableCell className="text-center"><Badge variant="outline">{unitStatusLabels[unit.status]}</Badge></TableCell>
                <TableCell className="text-center"><Badge variant="secondary">{paymentStatusLabels[unit.paymentStatus || ''] || '-'}</Badge></TableCell>
                <TableCell className="text-center">{formatCurrency(unit.baseRent)}</TableCell>
                <TableCell className="text-center font-semibold text-green-700">{formatCurrency(unit.actualRent || 0)}</TableCell>
               </>
           )
       }

       if (reportType === 'overdue') {
           const { dueDate, daysOverdue, remainingAmount } = getOverdueDetails(unit);
           return (
               <>
                {baseCells}
                <TableCell className="text-center"><Badge variant="secondary">{paymentStatusLabels[unit.paymentStatus || ''] || '-'}</Badge></TableCell>
                <TableCell className="text-center">{formatCurrency(unit.baseRent)}</TableCell>
                <TableCell className="text-center font-semibold text-red-700">{formatCurrency(remainingAmount)}</TableCell>
                <TableCell className="text-center">{dueDate ? format(dueDate, 'yyyy-MM-dd') : '-'}</TableCell>
                <TableCell className="text-center font-bold text-red-600">{daysOverdue !== null ? `${daysOverdue} يوم` : '-'}</TableCell>
               </>
           )
       }

       return baseCells;
  }

  return (
    <Card className="mt-8 shadow-lg print-container">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
                <CardTitle>{reportTitle}</CardTitle>
                <CardDescription className="pt-1">{reportDescription}</CardDescription>
            </div>
          <div className="flex gap-2 no-print">
            <Button onClick={handleExport} variant="outline"><Download className="ml-2 h-4 w-4" /> تصدير</Button>
            <Button onClick={handlePrint}><Printer className="ml-2 h-4 w-4" /> طباعة</Button>
          </div>
        </div>
        <div className="print-header hidden print:flex">
          <span className="print-title">{reportTitle}</span>
          <img src="https://j.top4top.io/p_35298zyqb1.png" alt="Logo" className="print-logo" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                {renderHeaders()}
              </TableRow>
            </TableHeader>
            <TableBody>
              {units.map(unit => (
                <TableRow key={unit.id}>
                    {renderRow(unit)}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

const reportOptionsConfig = {
    status: {
        label: "حسب حالة الوحدة",
        icon: BedDouble,
        options: [
            { value: 'rented', label: 'مؤجرة', color: "text-green-600" },
            { value: 'available', label: 'متاحة', color: "text-blue-600" },
            { value: 'under_maintenance', label: 'تحت الصيانة', color: "text-yellow-600" },
            { value: 'office', label: 'مكتب إداري', color: "text-gray-600" },
        ]
    },
    paymentStatus: {
        label: "حسب حالة السداد",
        icon: Wallet,
        options: [
            { value: 'paid', label: 'تم السداد', color: "text-green-600" },
            { value: 'deferred', label: 'مؤجل', color: "text-orange-600" },
            { value: 'payment_plan', label: 'خطة سداد', color: "text-purple-600" },
            { value: 'exempt', label: 'إعفاء', color: "text-indigo-600" },
            { value: 'scholarship', label: 'ابتعاث', color: "text-pink-600" },
        ]
    },
    overdue: {
        label: "حسب الاستحقاق",
        icon: AlertCircle,
        options: [
            { value: 'all', label: 'مستحقات متأخرة', color: "text-red-600" },
        ]
    }
};

export function RequestReportClient() {
  const { buildings, loading } = useAppContext();
  const [selectedReportKey, setSelectedReportKey] = useState<string>('');
  const [reportData, setReportData] = useState<Unit[] | null>(null);
  
  const { reportType, reportValue } = useMemo(() => {
    if (!selectedReportKey) return { reportType: '', reportValue: '' };
    const [type, value] = selectedReportKey.split(':');
    return { reportType: type, reportValue: value };
  }, [selectedReportKey]);

  const isUnitOverdue = (unit: Unit): boolean => {
    if (!unit.paymentPlan) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today's date

    if (unit.paymentPlan.type === 'deferred' && unit.paymentPlan.deferredUntil) {
        const dueDate = new Date(unit.paymentPlan.deferredUntil);
        return dueDate < today;
    }

    const installments = unit.paymentPlan.installments || unit.paymentPlan.stipendDeductions;
    if (installments) {
        return installments.some(inst => {
            const dueDate = new Date(inst.dueDate);
            return !inst.isPaid && dueDate < today;
        });
    }

    return false;
  };

  const generateReport = () => {
    if (!selectedReportKey) return;
    
    const allUnits = buildings.flatMap(b => [...b.apartments.units, ...b.suites.units]);
    
    let filteredUnits: Unit[] = [];
    if (reportType === 'status') {
      filteredUnits = allUnits.filter(u => u.status === reportValue);
    } else if (reportType === 'paymentStatus') {
      filteredUnits = allUnits.filter(u => u.paymentStatus === reportValue);
    } else if (reportType === 'overdue') {
      filteredUnits = allUnits.filter(isUnitOverdue);
    }
    
    setReportData(filteredUnits);
  };
  
  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6">
        <Skeleton className="h-12 w-1/2 mb-4" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="flex flex-col items-center text-center">
        <h1 className="text-3xl font-bold text-primary font-headline flex items-center gap-3 mb-4">
          <ClipboardCheck className="h-8 w-8" />
          منشئ التقارير المخصصة
        </h1>
        <p className="text-muted-foreground mt-2 text-lg max-w-2xl mx-auto">
          اختر نوع التقرير المطلوب من الأزرار أدناه ثم اضغط على "إنشاء التقرير" لعرض البيانات.
        </p>
      </div>

      <Card className="mt-8 shadow-xl">
        <CardHeader>
          <CardTitle>تكوين التقرير</CardTitle>
          <CardDescription>
            حدد المعطيات اللازمة لتوليد التقرير المطلوب.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="p-4 border rounded-lg">
                <div className="flex flex-wrap gap-2 justify-center">
                    {Object.entries(reportOptionsConfig).flatMap(([type, config]) => 
                        config.options.map(option => (
                            <Button
                                key={`${type}:${option.value}`}
                                variant={selectedReportKey === `${type}:${option.value}` ? 'default' : 'outline'}
                                onClick={() => setSelectedReportKey(`${type}:${option.value}`)}
                                className={cn("flex items-center gap-2", selectedReportKey === `${type}:${option.value}` ? 'bg-primary' : option.color)}
                            >
                                <config.icon className="h-4 w-4"/>
                                <span>{option.label}</span>
                            </Button>
                        ))
                    )}
                </div>
            </div>
            
            <div className="flex justify-end pt-6 mt-6 border-t">
                 <Button onClick={generateReport} disabled={!selectedReportKey} size="lg">
                    إنشاء التقرير
                </Button>
            </div>
        </CardContent>
      </Card>
      
      {reportData !== null && <ReportResultsTable units={reportData} reportType={reportType} reportValue={reportValue} />}
    </div>
  );
}
