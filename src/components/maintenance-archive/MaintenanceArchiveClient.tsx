
"use client";

import React, { useMemo } from 'react';
import { useAppContext } from '@/contexts/AppDataContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Archive, BarChart2, Printer, Download } from 'lucide-react';
import { type Unit, type MaintenanceRecord } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CompletedMaintenanceLogTable } from '../maintenance/CompletedMaintenanceLogTable';
import { ArchivedMaintenanceTable } from './ArchivedMaintenanceTable';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

interface AggregatedRecord {
    unit: Unit;
    count: number;
    totalCost: number;
    actualRevenue: number;
}

export function MaintenanceArchiveClient() {
  const { buildings, loading } = useAppContext();
  const { toast } = useToast();

  const { allArchivedRecords, aggregatedRecords } = useMemo(() => {
    if (loading) {
      return { allArchivedRecords: [], aggregatedRecords: [] };
    }
    const archived: { unit: Unit, record: MaintenanceRecord }[] = [];
    
    buildings.forEach(building => {
      const allUnits = [...building.apartments.units, ...building.suites.units];
      allUnits.forEach(unit => {
        if (unit.maintenanceHistory && unit.maintenanceHistory.length > 0) {
          unit.maintenanceHistory.forEach(record => {
            archived.push({ unit, record });
          });
        }
      });
    });
    
    const aggregated = Array.from(
      archived.reduce((map, { unit, record }) => {
        const key = unit.id;
        const existing = map.get(key) || { 
            unit, 
            count: 0, 
            totalCost: 0,
            actualRevenue: unit.status === 'rented' ? (unit.actualRent ?? unit.baseRent) : 0,
        };
        existing.count++;
        existing.totalCost += record.cost;
        map.set(key, existing);
        return map;
      }, new Map<string, AggregatedRecord>()).values()
    );


    return {
        allArchivedRecords: archived.sort((a, b) => new Date(b.record.endDate).getTime() - new Date(a.record.endDate).getTime()),
        aggregatedRecords: aggregated,
    };
  }, [buildings, loading]);

  const handlePrint = () => window.print();

  const handleExportSummary = () => {
    try {
        const dataToExport = aggregatedRecords.map(({ unit, count, totalCost }) => {
             const costToRentRatio = unit.baseRent > 0 ? (totalCost / unit.baseRent) * 100 : 0;
            return {
                'المبنى/الغرفة': `${unit.buildingId} / ${unit.unitNumber}`,
                'عدد الصيانات': count,
                'التكلفة الإجمالية': formatCurrency(totalCost),
                'نسبة التكلفة/الإيجار': `${costToRentRatio.toFixed(1)}%`
            };
        });

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        ws["!rtl"] = true;
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "ملخص أداء الصيانة");

        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        saveAs(new Blob([wbout], { type: "application/octet-stream" }), `ملخص_أداء_الصيانة_${new Date().toISOString().split('T')[0]}.xlsx`);

        toast({
            title: "تم التصدير بنجاح",
            description: "تم تصدير ملخص أداء الصيانة إلى ملف Excel.",
            className: "bg-green-100 border-green-400 text-green-800",
        });

    } catch (error) {
        console.error("Export failed:", error);
        toast({ variant: "destructive", title: "خطأ في التصدير" });
    }
  };
  
  const handleExportLog = () => {
       try {
        const dataToExport = allArchivedRecords.map(({ unit, record }) => {
            const startDate = new Date(record.startDate);
            const actualEndDate = new Date(record.endDate);
            const durationInDays = Math.round((actualEndDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            
            return {
                'المبنى/الغرفة': `${unit.buildingId} / ${unit.unitNumber}`,
                'نوع الصيانة': record.type,
                'تاريخ البدء': format(startDate, 'yyyy-MM-dd'),
                'الانتهاء المتوقع': record.expectedEndDate ? format(new Date(record.expectedEndDate), 'yyyy-MM-dd') : '-',
                'الانتهاء الفعلي': format(actualEndDate, 'yyyy-MM-dd'),
                'مدة الصيانة (أيام)': durationInDays >= 0 ? durationInDays : 0,
                'التكلفة': formatCurrency(record.cost)
            };
        });

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        ws["!rtl"] = true;
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "سجل الصيانة المكتملة");

        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        saveAs(new Blob([wbout], { type: "application/octet-stream" }), `سجل_الصيانة_المكتملة_${new Date().toISOString().split('T')[0]}.xlsx`);

        toast({
            title: "تم التصدير بنجاح",
            description: "تم تصدير سجل الصيانة المكتملة إلى ملف Excel.",
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
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 space-y-12">
      <div>
        <h1 className="text-3xl font-bold text-primary font-headline flex items-center gap-3">
            <Archive className="h-8 w-8" />
            أرشيف عمليات الصيانة
        </h1>
        <p className="text-muted-foreground mt-2">
            كشف تفصيلي لجميع أعمال الصيانة التي تم إكمالها وأرشفتها عبر النظام.
        </p>
      </div>

       <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-3 text-primary">
                  <BarChart2 className="h-6 w-6" />
                  ملخص أداء الصيانة للوحدات
                </CardTitle>
                <div className="flex gap-2 no-print">
                    <Button onClick={handleExportSummary} variant="outline"><Download className="ml-2 h-4 w-4" /> تصدير إكسل</Button>
                    <Button onClick={handlePrint}><Printer className="ml-2 h-4 w-4" /> طباعة</Button>
                </div>
            </div>
            <CardDescription>
              إحصائيات تفصيلية لتكاليف الصيانة وتحليل الأرباح والخسائر لكل وحدة سكنية.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ArchivedMaintenanceTable records={aggregatedRecords} />
          </CardContent>
        </Card>

       <Card>
            <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <CardTitle className="flex items-center gap-3 text-primary">
                        سجل الصيانة المكتملة
                    </CardTitle>
                    <div className="flex gap-2 no-print">
                        <Button onClick={handleExportLog} variant="outline"><Download className="ml-2 h-4 w-4" /> تصدير إكسل</Button>
                        <Button onClick={handlePrint}><Printer className="ml-2 h-4 w-4" /> طباعة</Button>
                    </div>
                </div>
              <CardDescription>
                كشف تفصيلي لجميع أعمال الصيانة التي تم إكمالها وأرشفتها.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CompletedMaintenanceLogTable records={allArchivedRecords} />
            </CardContent>
        </Card>
    </div>
  );
}
