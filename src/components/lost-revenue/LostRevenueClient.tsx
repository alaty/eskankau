

"use client";

import { useMemo, useState } from "react";
import { useAppContext } from "@/contexts/AppDataContext";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Target, Building, Home, Wrench, BriefcaseBusiness, Target as TargetIcon, Percent, Printer, Download, Package, ListTree, BarChart2, GitCommitHorizontal, ArrowLeft, FileWarning, ArrowUpDown, GraduationCap, ShieldCheck, Sigma, Wallet, Calendar, Repeat, CheckCircle } from "lucide-react";
import type { Unit } from "@/lib/types";
import { Button } from "../ui/button";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useToast } from "@/hooks/use-toast";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Tooltip as ShadTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";


interface LostRevenueUnit {
  unit: Unit;
  lostAmount: number;
  reason: string;
}

const statusConfig: { [key in Unit['status'] | 'deferred_payment' | 'other' | 'maintenance_cost' | 'scholarship' | 'exempt']: { label: string; icon: React.ElementType; colorClass: string } } = {
    available: { label: 'وحدات متاحة (شاغرة)', icon: Home, colorClass: 'border-blue-500' },
    under_maintenance: { label: 'وحدات تحت الصيانة', icon: Wrench, colorClass: 'border-yellow-500' },
    office: { label: 'وحدات إدارية (مكاتب)', icon: BriefcaseBusiness, colorClass: 'border-gray-500' },
    deferred_payment: { label: 'مبالغ متبقية (خطط سداد)', icon: FileWarning, colorClass: 'border-orange-500' },
    maintenance_cost: { label: 'تكاليف الصيانة', icon: Wrench, colorClass: 'border-purple-500' },
    scholarship: { label: 'طالبات ابتعاث', icon: GraduationCap, colorClass: 'border-indigo-500' },
    exempt: { label: 'إعفاء من السداد', icon: ShieldCheck, colorClass: 'border-teal-500' },
    rented: { label: 'مؤجرة', icon: Package, colorClass: 'border-transparent' }, // Should not appear
    other: { label: 'حالات أخرى', icon: Package, colorClass: 'border-purple-500' }
};

const FlowBox = ({ title, value, icon: Icon, color, tooltip, children, className }: { title: string, value: number, icon: React.ElementType, color: string, tooltip: string, children?: React.ReactNode, className?: string }) => (
    <TooltipProvider>
        <ShadTooltip>
            <TooltipTrigger asChild>
                <div className={`relative p-4 rounded-lg shadow-lg border-t-4 ${color} ${className}`}>
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <h3 className="text-sm font-semibold text-muted-foreground">{title}</h3>
                            <p className="text-2xl font-bold">{formatCurrency(value)}</p>
                        </div>
                        <Icon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    {children}
                </div>
            </TooltipTrigger>
            <TooltipContent>
                <p>{tooltip}</p>
            </TooltipContent>
        </ShadTooltip>
    </TooltipProvider>
);

const FlowArrow = ({ isBranch }: { isBranch?: boolean }) => (
    <div className={`flex items-center justify-center ${isBranch ? 'rotate-90 md:rotate-0' : ''}`}>
        <ArrowLeft className="h-8 w-8 text-muted-foreground/50" />
    </div>
);


const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-background border rounded-lg shadow-lg" style={{direction: 'rtl'}}>
        <p className="label font-bold">{label}</p>
        {payload.map((pld: any, index: number) => (
          <p key={index} style={{ color: pld.stroke || pld.fill }}>
            {`قيمة الفقد: ${formatCurrency(pld.value)}`}
          </p>
        ))}
      </div>
    );
  }

  return null;
};

export function LostRevenueClient() {
  const { buildings, loading } = useAppContext();
  const { toast } = useToast();

  const stats = useMemo(() => {
    if (loading || buildings.length === 0) return null;

    let totalExpectedRevenue = 0;
    let totalActualRevenue = 0;
    let totalMaintenanceCost = 0;

    const lostRevenueBreakdown = {
        available: 0,
        under_maintenance: 0,
        office: 0,
        deferred_payment: 0,
        scholarship: 0,
        exempt: 0,
    };
    
    const unitCountBreakdown = {
        available: 0,
        under_maintenance: 0,
        office: 0,
        deferred_payment: 0,
        scholarship: 0,
        exempt: 0,
    };
    
    const paymentStatusCounts = {
        apartments: { paid: 0, paid_in_full: 0, deferred: 0, payment_plan: 0, exempt: 0, scholarship: 0 },
        suites: { paid: 0, paid_in_full: 0, deferred: 0, payment_plan: 0, exempt: 0, scholarship: 0 },
    };

    const unitStatusCounts = {
        apartments: { rented: 0, available: 0, under_maintenance: 0, office: 0, total: 0, paid: 0, paid_in_full: 0 },
        suites: { rented: 0, available: 0, under_maintenance: 0, office: 0, total: 0, paid: 0, paid_in_full: 0 },
    };
    
    let totalApartments = 0;
    let totalSuites = 0;

    const buildingPerformance = buildings.map(building => {
      let buildingExpected = 0;
      let buildingActual = 0;
      const allUnits = [...building.apartments.units, ...building.suites.units];
      
      allUnits.forEach(unit => {
        buildingExpected += unit.baseRent;

        if (unit.status === 'rented') {
            const totalPaid = (unit.paymentPlan?.installments || unit.paymentPlan?.stipendDeductions || []).filter(i => i.isPaid).reduce((sum, i) => sum + i.amount, 0);
            if(unit.paymentStatus === 'paid' || unit.paymentStatus === 'paid_in_full') {
              buildingActual += unit.baseRent;
            } else if (unit.paymentStatus === 'payment_plan') {
              buildingActual += totalPaid;
            } else if (unit.paymentPlan) { // For exempt/scholarship
                buildingActual += 0;
            }
        }
      });
      totalExpectedRevenue += buildingExpected;
      totalActualRevenue += buildingActual;
      return {
        name: building.name,
        expected: buildingExpected,
        actual: buildingActual,
        lost: buildingExpected - buildingActual,
      }
    });

    buildings.forEach(building => {
      const allBuildingUnits = [...building.apartments.units, ...building.suites.units];
      
      totalApartments += building.apartments.units.length;
      totalSuites += building.suites.units.length;
      
      allBuildingUnits.forEach(unit => {
        // Unit Status Count Logic
        const targetCount = unit.unitType === 'apartment' ? unitStatusCounts.apartments : unitStatusCounts.suites;
        targetCount.total++;

        if(unit.status === 'rented') {
            targetCount.rented++;
            if(unit.paymentStatus) {
                const paymentTargetCount = unit.unitType === 'apartment' ? paymentStatusCounts.apartments : paymentStatusCounts.suites;
                if(paymentTargetCount.hasOwnProperty(unit.paymentStatus)) {
                    (paymentTargetCount[unit.paymentStatus as keyof typeof paymentTargetCount] as number)++;
                }
                
                if (unit.paymentStatus === 'paid') {
                    targetCount.paid++;
                }
                if (unit.paymentStatus === 'paid_in_full') {
                    targetCount.paid_in_full++;
                }
            }
        } else if (unit.status === 'available') {
            targetCount.available++;
        } else if (unit.status === 'under_maintenance') {
            targetCount.under_maintenance++;
        } else if (unit.status === 'office') {
            targetCount.office++;
        }
        
        // Lost Revenue Logic
        if (unit.status === 'rented') {
             if (unit.paymentStatus === 'deferred' || unit.paymentStatus === 'payment_plan') {
                const totalPaid = (unit.paymentPlan?.installments || unit.paymentPlan?.stipendDeductions || []).filter(i => i.isPaid).reduce((sum, i) => sum + i.amount, 0);
                const remaining = unit.baseRent - totalPaid;
                if (remaining > 0) {
                  lostRevenueBreakdown.deferred_payment += remaining;
                  unitCountBreakdown.deferred_payment++;
                }
            } else if (unit.paymentStatus === 'scholarship' || unit.paymentStatus === 'exempt') {
                const lostAmount = unit.baseRent;
                if (unit.paymentStatus === 'scholarship') {
                    lostRevenueBreakdown.scholarship += lostAmount;
                    unitCountBreakdown.scholarship++;
                } else {
                    lostRevenueBreakdown.exempt += lostAmount;
                    unitCountBreakdown.exempt++;
                }
            }

        } else { 
            const lostAmount = unit.baseRent;
            if (unit.status === 'available') {
                lostRevenueBreakdown.available += lostAmount;
                unitCountBreakdown.available++;
            } else if (unit.status === 'under_maintenance') {
                lostRevenueBreakdown.under_maintenance += lostAmount;
                unitCountBreakdown.under_maintenance++;
            } else if (unit.status === 'office') {
                lostRevenueBreakdown.office += lostAmount;
                unitCountBreakdown.office++;
            }
        }

        if (unit.maintenanceHistory) {
            unit.maintenanceHistory.forEach(record => {
                totalMaintenanceCost += record.cost;
            });
        }
      });
    });
    
    const totalLostRevenue = totalExpectedRevenue - totalActualRevenue;
    const lostRevenuePercentage = totalExpectedRevenue > 0 ? (totalLostRevenue / totalExpectedRevenue) * 100 : 0;
    
    const reportSections = Object.entries(lostRevenueBreakdown).map(([status, totalLost]) => {
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.other;
        return {
            status,
            title: config.label,
            icon: config.icon,
            colorClass: config.colorClass,
            totalLost,
            unitCount: unitCountBreakdown[status as keyof typeof unitCountBreakdown]
        };
    });

    reportSections.push({
      status: 'maintenance_cost',
      title: 'تكاليف الصيانة',
      icon: Wrench,
      colorClass: 'border-purple-500',
      totalLost: totalMaintenanceCost,
      unitCount: buildings.reduce((sum, b) => sum + b.apartments.units.reduce((uSum, u) => uSum + u.maintenanceHistory.length, 0) + b.suites.units.reduce((uSum, u) => uSum + u.maintenanceHistory.length, 0), 0)
    });


    return { 
        totalApartments,
        totalSuites,
        buildingPerformance,
        reportSections: reportSections.sort((a, b) => b.totalLost - a.totalLost),
        totalLostRevenue, 
        totalExpectedRevenue,
        lostRevenuePercentage,
        totalActualRevenue,
        totalMaintenanceCost,
        unitCountBreakdown,
        unitStatusCounts,
        paymentStatusCounts
    };
  }, [buildings, loading]);

  const handlePrint = () => {
      window.print();
  };
  
  const handleExport = () => {
    if (!stats) return;

    try {
        const wb = XLSX.utils.book_new();
        
        const summaryData = stats.reportSections.map(section => ({
            'سبب فقدان الإيراد': section.title,
            'عدد الوحدات': section.status === 'maintenance_cost' ? `${section.unitCount} عملية` : section.unitCount,
            'قيمة الفقد (الفصل الحالي)': section.totalLost,
        }));
        
        const ws = XLSX.utils.json_to_sheet(summaryData);
        ws['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 25 }];
        XLSX.utils.book_append_sheet(wb, ws, "تفاصيل فقد الإيرادات");
        
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        saveAs(new Blob([wbout], { type: "application/octet-stream" }), `تفاصيل_الإيرادات_المفقودة_${new Date().toISOString().split('T')[0]}.xlsx`);

        toast({
            title: "تم التصدير بنجاح",
            description: "تم تصدير تقرير الإيرادات المفقودة إلى ملف Excel.",
            className: "bg-green-100 border-green-400 text-green-800",
        });

    } catch (error) {
        console.error("Export failed:", error);
        toast({
            title: "خطأ في التصدير",
            description: "حدث خطأ أثناء محاولة إنشاء ملف Excel.",
            variant: "destructive",
        });
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6">
        <Skeleton className="h-8 w-64 mb-8" />
        <div className="space-y-8">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const chartData = stats.reportSections
    .filter(s => s.totalLost > 0)
    .map(s => ({
        name: s.title,
        value: s.totalLost,
    }));

  const maintenanceSections = stats.reportSections.filter(s => s.status === 'under_maintenance' || s.status === 'maintenance_cost');
  const otherSections = stats.reportSections.filter(s => s.status !== 'under_maintenance' && s.status !== 'maintenance_cost');

  const { apartments: aptStatuses, suites: suiteStatuses } = stats.paymentStatusCounts;
  const planUnitsApt = aptStatuses.deferred + aptStatuses.payment_plan + aptStatuses.exempt + aptStatuses.scholarship;
  const planUnitsSuite = suiteStatuses.deferred + suiteStatuses.payment_plan + suiteStatuses.exempt + suiteStatuses.scholarship;

  const totalRentableApt = stats.unitStatusCounts.apartments.total - stats.unitStatusCounts.apartments.office;
  const occupancyApt = totalRentableApt > 0 ? (stats.unitStatusCounts.apartments.rented / totalRentableApt) * 100 : 0;
  
  const totalRentableSte = stats.unitStatusCounts.suites.total - stats.unitStatusCounts.suites.office;
  const occupancySte = totalRentableSte > 0 ? (stats.unitStatusCounts.suites.rented / totalRentableSte) * 100 : 0;
  
  const totalRentable = totalRentableApt + totalRentableSte;
  const totalRented = stats.unitStatusCounts.apartments.rented + stats.unitStatusCounts.suites.rented;
  const occupancyTotal = totalRentable > 0 ? (totalRented / totalRentable) * 100 : 0;


  return (
    <div className="container mx-auto py-8 px-4 md:px-6 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4 no-print">
            <div>
                <h1 className="text-3xl font-bold text-primary font-headline flex items-center gap-3">
                  <TrendingDown className="h-8 w-8" />
                  تفصيل الإيرادات المفقودة
                </h1>
                <p className="text-muted-foreground mt-2 text-base font-medium">
                  تحليل تفصيلي للوحدات يوضح الايرادات المالية بكافة تفاصيلها واسباب الفقد المالي.
                </p>
            </div>
             <div className="flex gap-2">
                <Button onClick={handleExport} variant="outline"><Download className="ml-2 h-4 w-4" /> تصدير Excel</Button>
                <Button onClick={handlePrint}><Printer className="ml-2 h-4 w-4" /> طباعة</Button>
            </div>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>الملخص المالي الإجمالي</CardTitle>
                <CardDescription>نظرة عامة على الأداء المالي لجميع المباني.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-center">إجمالي الشقق</TableHead>
                            <TableHead className="text-center">إجمالي الأجنحة</TableHead>
                            <TableHead className="text-center">الإيراد المتوقع</TableHead>
                            <TableHead className="text-center">الإيراد الفعلي</TableHead>
                            <TableHead className="text-center">الإيراد المفقود</TableHead>
                            <TableHead className="text-center">نسبة الفقد</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell className="text-center font-bold">{stats.totalApartments}</TableCell>
                            <TableCell className="text-center font-bold">{stats.totalSuites}</TableCell>
                            <TableCell className="text-center font-semibold">{formatCurrency(stats.totalExpectedRevenue)}</TableCell>
                            <TableCell className="text-center font-semibold text-green-600">{formatCurrency(stats.totalActualRevenue)}</TableCell>
                            <TableCell className="text-center font-semibold text-red-600">{formatCurrency(stats.totalLostRevenue)}</TableCell>
                            <TableCell className="text-center font-semibold text-red-600">{stats.lostRevenuePercentage.toFixed(1)}%</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        
         <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-3 text-primary">
                    <ListTree className="h-6 w-6" />
                    ملخص حسب حالة الوحدات
                </CardTitle>
                <CardDescription>
                    جدول يوضح توزيع جميع الوحدات حسب حالتها ونوعها.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted">
                                <TableHead className="text-center">النوع</TableHead>
                                <TableHead className="text-center font-bold">إجمالي الوحدات</TableHead>
                                <TableHead className="text-center">إجمالي المؤجرة</TableHead>
                                <TableHead className="text-center">المتاحة (شاغرة)</TableHead>
                                <TableHead className="text-center">نسبة الإشغال</TableHead>
                                <TableHead className="text-center">المسددة مباشرة</TableHead>
                                <TableHead className="text-center">المسددة (خطة)</TableHead>
                                <TableHead className="text-center">عليها مديونية / خطة</TableHead>
                                <TableHead className="text-center">تحت الصيانة</TableHead>
                                <TableHead className="text-center">مكاتب إدارية</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell className="font-medium text-center">شقق</TableCell>
                                <TableCell className="text-center font-bold">{stats.unitStatusCounts.apartments.total}</TableCell>
                                <TableCell className="text-center font-semibold">{stats.unitStatusCounts.apartments.rented}</TableCell>
                                <TableCell className="text-center font-semibold">{stats.unitStatusCounts.apartments.available}</TableCell>
                                <TableCell className="text-center font-bold text-teal-600">{occupancyApt.toFixed(1)}%</TableCell>
                                <TableCell className="text-center font-semibold text-green-600">{stats.unitStatusCounts.apartments.paid}</TableCell>
                                <TableCell className="text-center font-semibold text-green-600">{stats.unitStatusCounts.apartments.paid_in_full}</TableCell>
                                <TableCell className="text-center font-semibold text-orange-600">{planUnitsApt}</TableCell>
                                <TableCell className="text-center font-semibold">{stats.unitStatusCounts.apartments.under_maintenance}</TableCell>
                                <TableCell className="text-center font-semibold">{stats.unitStatusCounts.apartments.office}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium text-center">أجنحة</TableCell>
                                <TableCell className="text-center font-bold">{stats.unitStatusCounts.suites.total}</TableCell>
                                <TableCell className="text-center font-semibold">{stats.unitStatusCounts.suites.rented}</TableCell>
                                <TableCell className="text-center font-semibold">{stats.unitStatusCounts.suites.available}</TableCell>
                                <TableCell className="text-center font-bold text-teal-600">{occupancySte.toFixed(1)}%</TableCell>
                                <TableCell className="text-center font-semibold text-green-600">{stats.unitStatusCounts.suites.paid}</TableCell>
                                <TableCell className="text-center font-semibold text-green-600">{stats.unitStatusCounts.suites.paid_in_full}</TableCell>
                                <TableCell className="text-center font-semibold text-orange-600">{planUnitsSuite}</TableCell>
                                <TableCell className="text-center font-semibold">{stats.unitStatusCounts.suites.under_maintenance}</TableCell>
                                <TableCell className="text-center font-semibold">{stats.unitStatusCounts.suites.office}</TableCell>
                            </TableRow>
                        </TableBody>
                         <TableFooter>
                            <TableRow className="bg-muted font-bold">
                                <TableCell className="text-center">الإجمالي</TableCell>
                                <TableCell className="text-center">{stats.unitStatusCounts.apartments.total + stats.unitStatusCounts.suites.total}</TableCell>
                                <TableCell className="text-center">{stats.unitStatusCounts.apartments.rented + stats.unitStatusCounts.suites.rented}</TableCell>
                                <TableCell className="text-center">{stats.unitStatusCounts.apartments.available + stats.unitStatusCounts.suites.available}</TableCell>
                                <TableCell className="text-center text-teal-700">{occupancyTotal.toFixed(1)}%</TableCell>
                                <TableCell className="text-center text-green-700">{stats.unitStatusCounts.apartments.paid + stats.unitStatusCounts.suites.paid}</TableCell>
                                <TableCell className="text-center text-green-700">{stats.unitStatusCounts.apartments.paid_in_full + stats.unitStatusCounts.suites.paid_in_full}</TableCell>
                                <TableCell className="text-center text-orange-700">{planUnitsApt + planUnitsSuite}</TableCell>
                                <TableCell className="text-center">{stats.unitStatusCounts.apartments.under_maintenance + stats.unitStatusCounts.suites.under_maintenance}</TableCell>
                                <TableCell className="text-center">{stats.unitStatusCounts.apartments.office + stats.unitStatusCounts.suites.office}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
            </CardContent>
        </Card>

        
        <div className="grid lg:grid-cols-2 gap-8">
            <Card className="shadow-lg" id="summary-table-card">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="flex items-center gap-3">
                                <TrendingDown className="h-6 w-6" />
                                ملخص أسباب الإيرادات المفقودة
                            </CardTitle>
                            <CardDescription>
                                جدول يوضح توزيع الإيرادات المفقودة حسب حالة الوحدات.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted">
                                    <TableHead className="text-center">سبب فقدان الإيراد</TableHead>
                                    <TableHead className="text-center">عدد الوحدات</TableHead>
                                    <TableHead className="text-center">إجمالي الإيراد المفقود</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {otherSections.map(section => (
                                    <TableRow key={section.status}>
                                        <TableCell className="text-center font-medium flex items-center justify-center gap-2">
                                            <section.icon className="h-4 w-4 text-muted-foreground" />
                                            {section.title}
                                        </TableCell>
                                        <TableCell className="text-center font-semibold text-primary">{section.unitCount}</TableCell>
                                        <TableCell className="text-center font-semibold text-red-600">{formatCurrency(section.totalLost)}</TableCell>
                                    </TableRow>
                                ))}
                                {maintenanceSections.map(section => (
                                     <TableRow key={section.status} className="bg-muted/50">
                                        <TableCell className="text-center font-medium flex items-center justify-center gap-2">
                                           <section.icon className="h-4 w-4 text-muted-foreground" />
                                           {section.title}
                                        </TableCell>
                                        <TableCell className="text-center font-semibold text-primary">{section.status === 'maintenance_cost' ? `${section.unitCount} عملية` : section.unitCount}</TableCell>
                                        <TableCell className="text-center font-semibold text-red-600">{formatCurrency(section.totalLost)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                            <TableFooter>
                                <TableRow className="bg-muted font-bold">
                                    <TableCell className="text-center" colSpan={2}>الإجمالي</TableCell>
                                    <TableCell className="text-red-700 text-center">{formatCurrency(stats.totalLostRevenue)}</TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <BarChart2 className="h-6 w-6" />
                        رسم بياني لأسباب فقدان الإيرادات
                    </CardTitle>
                    <CardDescription>
                        توزيع قيمة الإيرادات المفقودة حسب الحالة.
                    </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" tickFormatter={(value) => formatCurrency(value, true)} tick={{ fontSize: 12 }} />
                            <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                            <Tooltip content={<CustomTooltip />} cursor={{fill: 'hsla(var(--accent) / 0.5)'}}/>
                            <Bar dataKey="value" name="قيمة الفقد" barSize={35} radius={[0, 4, 4, 0]} fill="hsl(var(--destructive))" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>


        <div className="border-t-2 border-dashed pt-8 space-y-8">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                        <Building className="h-6 w-6" />
                        ملخص الايرادات حسب المباني
                    </CardTitle>
                    <CardDescription>
                        تحليل مقارن لقيمة الايرادات المحققة والمفقودة لكل مبنى
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto border rounded-lg">
                        <Table>
                             <TableHeader>
                                <TableRow className="bg-muted">
                                    <TableHead className="text-center">المبنى</TableHead>
                                    <TableHead className="text-center">الإيرادات المتوقعة</TableHead>
                                    <TableHead className="text-center">الإيرادات الفعلية</TableHead>
                                    <TableHead className="text-center">قيمة الفقد</TableHead>
                                    <TableHead className="text-center">نسبة الفقد</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                               {stats.buildingPerformance.map(b => {
                                 const lostPercentage = b.expected > 0 ? (b.lost / b.expected) * 100 : 0;
                                 return (
                                    <TableRow key={b.name}>
                                        <TableCell className="text-center font-medium">{b.name}</TableCell>
                                        <TableCell className="text-center">{formatCurrency(b.expected)}</TableCell>
                                        <TableCell className="text-center font-semibold text-green-600">{formatCurrency(b.actual)}</TableCell>
                                        <TableCell className="text-center font-semibold text-red-600">{formatCurrency(b.lost)}</TableCell>
                                        <TableCell className="text-center font-semibold text-red-600">{lostPercentage.toFixed(1)}%</TableCell>
                                    </TableRow>
                                )})}
                            </TableBody>
                            <TableFooter>
                                <TableRow className="bg-primary text-white font-bold text-base">
                                    <TableCell className="text-center">الإجمالي</TableCell>
                                    <TableCell className="text-center">{formatCurrency(stats.totalExpectedRevenue)}</TableCell>
                                    <TableCell className="text-center">{formatCurrency(stats.totalActualRevenue)}</TableCell>
                                    <TableCell className="text-center" colSpan={2}>{formatCurrency(stats.totalExpectedRevenue - stats.totalActualRevenue)}</TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}





    
    

    
