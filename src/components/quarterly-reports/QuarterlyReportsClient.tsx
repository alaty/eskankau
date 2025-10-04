
"use client";

import { useState, useMemo, ChangeEvent, useEffect } from "react";
import { useAppContext } from "@/contexts/AppDataContext";
import { formatCurrency } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Download, FileSpreadsheet, CalendarCheck2, Printer } from "lucide-react";
import * as XLSX from 'xlsx';
import { useToast } from "@/hooks/use-toast";
import { type Unit } from "@/lib/types";

interface Expenses {
  operational: number;
  maintenance: number;
  purchases: number;
}

interface BuildingReport {
  id: number;
  name: string;
  expectedRevenue: number;
  actualRevenue: number;
  totalUnits: number;
  rentedApartments: number;
  rentedSuites: number;
}

const buildingNameMapping: { [key: string]: string } = {
    "مبنى 1": "1",
    "مبنى 2": "2",
    "مبنى 3": "3",
    "مبنى 4": "4",
    "مبنى 5": "5",
    "مبنى 6": "6",
    "مبنى 7": "7",
    "مبنى 8": "8",
};

const ReportTable = ({ title, reportData }: { title: string, reportData: BuildingReport[]}) => {
    
    const totals = useMemo(() => {
        return reportData.reduce((acc, report) => {
            acc.expectedRevenue += report.expectedRevenue;
            acc.actualRevenue += report.actualRevenue;
            return acc;
        }, { expectedRevenue: 0, actualRevenue: 0 });
    }, [reportData]);

    const totalBuildingNetRevenue = totals.actualRevenue;
    
    const getDeficitClass = (value: number) => {
      return value > 0 ? "bg-orange-100 text-orange-800" : "text-gray-600";
    }

    return (
         <div className="overflow-x-auto border border-gray-300 rounded-lg">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead colSpan={6} className="text-center font-extrabold text-lg p-3 text-primary rounded-t-lg">
                        {title}
                    </TableHead>
                  </TableRow>
                  <TableRow className="bg-gray-100">
                    <TableHead className="text-center font-bold text-gray-600 border-l">المبنى</TableHead>
                    <TableHead className="text-center font-bold text-gray-600 border-l">اجمالي غرف المبنى</TableHead>
                    <TableHead className="text-center font-bold text-gray-600 border-l">شقق مؤجرة</TableHead>
                    <TableHead className="text-center font-bold text-gray-600 border-l">أجنحة مؤجرة</TableHead>
                    <TableHead className="text-center font-bold text-gray-600 border-l">قيمة الإيجار الكلي</TableHead>
                    <TableHead className="text-center font-bold text-gray-600">قيمة الايرادات المحققة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.map((report) => {
                     const deficit = report.expectedRevenue - report.actualRevenue;
                    return (
                      <TableRow key={report.id} className="text-center even:bg-gray-50">
                        <TableCell className="font-medium border-l">{report.name.replace('مبنى ','')}</TableCell>
                        <TableCell className="border-l">{report.totalUnits}</TableCell>
                        <TableCell className="border-l">{report.rentedApartments}</TableCell>
                        <TableCell className="border-l">{report.rentedSuites}</TableCell>
                        <TableCell className="border-l">{formatCurrency(report.expectedRevenue)}</TableCell>
                        <TableCell className="font-semibold text-green-700">{formatCurrency(report.actualRevenue)}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
                 <TableFooter>
                        <TableRow className="bg-primary text-white font-extrabold text-lg">
                            <TableCell colSpan={5} className="text-center">صافي الإيرادات</TableCell>
                            <TableCell className="text-center">{formatCurrency(totalBuildingNetRevenue)}</TableCell>
                        </TableRow>
                    </TableFooter>
              </Table>
            </div>
    )
}

export function QuarterlyReportsClient() {
  const { buildings, loading } = useAppContext();
  const { toast } = useToast();
  
  const reportData = useMemo<BuildingReport[]>(() => {
    if (loading) return [];
    return buildings.map(building => {
        const aptRentedUnits = building.apartments.units.filter(u => u.status === 'rented');
        const suiteRentedUnits = building.suites.units.filter(u => u.status === 'rented');
        
        const rentedApartments = aptRentedUnits.length;
        const rentedSuites = suiteRentedUnits.length;

        const expectedRevenue = building.apartments.units.reduce((sum, u) => sum + u.baseRent, 0) + building.suites.units.reduce((sum, u) => sum + u.baseRent, 0);
        const actualRevenue = aptRentedUnits.reduce((sum, u) => sum + (u.actualRent ?? u.baseRent), 0) + suiteRentedUnits.reduce((sum, u) => sum + (u.actualRent ?? u.baseRent), 0);

        return {
          id: building.id,
          name: building.name,
          expectedRevenue,
          actualRevenue,
          totalUnits: building.apartments.units.length + building.suites.units.length,
          rentedApartments,
          rentedSuites,
        };
    });
  }, [buildings, loading]);
  
  const summaryStats = useMemo(() => {
    const totalExpectedRevenue = reportData.reduce((sum, r) => sum + r.expectedRevenue, 0);
    const totalActualRevenue = reportData.reduce((sum, r) => sum + r.actualRevenue, 0);
    
    const totalDeficit = totalExpectedRevenue - totalActualRevenue;
    const totalDeficitPercentage = totalExpectedRevenue > 0 ? (totalDeficit / totalExpectedRevenue) * 100 : 0;
    
    return {
      totalExpectedRevenue,
      totalActualRevenue,
      totalDeficit,
      totalDeficitPercentage,
    };
  }, [reportData]);


  const generateSheetData = (title: string, data: BuildingReport[]) => {
    const tableData = data.map(report => {
      const deficit = report.expectedRevenue - report.actualRevenue;
      return {
        'المبنى': report.name.replace('مبنى ',''),
        'اجمالي غرف المبنى': report.totalUnits,
        'شقق مؤجرة': report.rentedApartments,
        'أجنحة مؤجرة': report.rentedSuites,
        'قيمة الإيجار الكلي': report.expectedRevenue,
        'قيمة العجز': deficit,
        'قيمة الايرادات المحققة': report.actualRevenue,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(tableData, { origin: 'A2' });
    XLSX.utils.sheet_add_aoa(worksheet, [[title]], { origin: 'A1' });
    
    const columnWidths = Object.keys(tableData[0] || {}).map(key => ({ wch: Math.max(key.length, ...tableData.map(row => (row[key as keyof typeof row] ?? '').toString().length)) + 2 }));
    worksheet['!cols'] = columnWidths;

    worksheet['A1'].s = { font: { bold: true, sz: 16 }, alignment: { horizontal: 'center' } };
    
    return worksheet;
  };

  const handleExport = () => {
    try {
        const wb = XLSX.utils.book_new();
        
        const ws1 = generateSheetData("تقرير عن الفصل الحالي (الفصل الأول لعام ١٤٤٧ هـ)", reportData);
        XLSX.utils.book_append_sheet(wb, ws1, "تقرير الفصل الحالي");
        
        const summaryData = [
            { 'البند': 'إجمالي الإيرادات المتوقعة', 'المبلغ': formatCurrency(summaryStats.totalExpectedRevenue) },
            { 'البند': 'إجمالي الإيرادات الفعلية (المحققة)', 'المبلغ': formatCurrency(summaryStats.totalActualRevenue) },
            { 'البند': 'اجمالي قيمة المبالغ الغير محققة', 'المبلغ': formatCurrency(summaryStats.totalDeficit) },
            { 'البند': 'نسبة العجز', 'المبلغ': `${summaryStats.totalDeficitPercentage.toFixed(1)}%` },
        ];
        const ws3 = XLSX.utils.json_to_sheet(summaryData);
        ws3['!cols'] = [{wch: 30}, {wch: 20}];
        XLSX.utils.book_append_sheet(wb, ws3, "الملخص");

        XLSX.writeFile(wb, `تقارير_فصلية_${new Date().toISOString().split('T')[0]}.xlsx`);

        toast({
            title: "تم التصدير بنجاح",
            description: "تم إنشاء ملف Excel يحتوي على التقارير الفصلية.",
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

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6">
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <Card className="shadow-xl border-gray-200">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
              <CardTitle className="text-xl font-bold text-primary flex items-center gap-3">
                  <FileSpreadsheet className="h-7 w-7" />
                  تقارير الإيرادات الفصلية
              </CardTitle>
              <div className="flex gap-2">
                <Button onClick={handleExport} variant="outline">
                    <Download className="ml-2 h-4 w-4" />
                    تصدير إلى Excel
                </Button>
                <Button onClick={handlePrint}>
                    <Printer className="ml-2 h-4 w-4" />
                    طباعة
                </Button>
              </div>
          </div>
          <CardDescription className="mt-2">
            هذه الصفحة توفر تقريرًا ماليًا مفصلاً للفصل الدراسي الحالي.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-12">
            <ReportTable 
                title="تقرير عن الفصل الحالي (الفصل الأول لعام ١٤٤٧ هـ)"
                reportData={reportData}
            />
            
            <div className="overflow-x-auto border border-gray-300 rounded-lg">
                 <Table className="min-w-full">
                    <TableHeader>
                      <TableRow className="bg-muted">
                        <TableHead colSpan={2} className="text-center font-extrabold text-lg p-3 text-primary rounded-t-lg flex items-center justify-center gap-2">
                            <CalendarCheck2 />
                            الملخص الإجمالي للفصل
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow className="text-center even:bg-white odd:bg-gray-50">
                            <TableCell className="font-medium border-l border-t bg-gray-100 text-gray-700">إجمالي الإيرادات المتوقعة</TableCell>
                            <TableCell className="border-t font-bold">{formatCurrency(summaryStats.totalExpectedRevenue)}</TableCell>
                        </TableRow>
                        <TableRow className="text-center even:bg-white odd:bg-gray-50">
                            <TableCell className="font-medium border-l border-t bg-gray-100 text-gray-700">إجمالي الإيرادات الفعلية (المحققة)</TableCell>
                            <TableCell className="border-t font-bold text-green-700">{formatCurrency(summaryStats.totalActualRevenue)}</TableCell>
                        </TableRow>
                         <TableRow className="text-center even:bg-white odd:bg-gray-50">
                            <TableCell className="font-medium border-l border-t bg-gray-100 text-gray-700">اجمالي قيمة المبالغ الغير محققة</TableCell>
                            <TableCell className="border-t font-bold text-orange-800">{formatCurrency(summaryStats.totalDeficit)}</TableCell>
                        </TableRow>
                        <TableRow className="text-center even:bg-white odd:bg-gray-50">
                            <TableCell className="font-medium border-l border-t bg-gray-100 text-gray-700">نسبة العجز</TableCell>
                            <TableCell className="border-t font-bold text-orange-800">{summaryStats.totalDeficitPercentage.toFixed(1)}%</TableCell>
                        </TableRow>
                    </TableBody>
                 </Table>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
