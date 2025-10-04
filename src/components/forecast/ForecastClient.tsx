
"use client";

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppDataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SlidersHorizontal, BarChart as BarChartIcon, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { YearlyForecastInput, SemesterData } from '@/lib/types';


const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-background border rounded-lg shadow-lg" style={{direction: 'rtl'}}>
        <p className="label font-bold">{label}</p>
        {payload.map((pld: any) => (
          <p key={pld.dataKey} style={{ color: pld.fill }}>
            {`${pld.name}: ${formatCurrency(pld.value)}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function ForecastClient() {
  const { buildings, loading, forecastInputs: initialForecasts, saveForecastInputs } = useAppContext();
  const { toast } = useToast();
  const [years, setYears] = useState(1);
  const [forecastInputs, setForecastInputs] = useState<YearlyForecastInput[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const initialTotals = useMemo(() => {
    if (loading || buildings.length === 0) return { apartments: 0, suites: 0, rent: { apt: 1700, ste: 3000 } };
    const totalApartments = buildings.reduce((sum, b) => sum + b.apartments.total, 0);
    const totalSuites = buildings.reduce((sum, b) => sum + b.suites.total, 0);
    const avgApartmentRent = buildings.length > 0 ? buildings.reduce((sum, b) => sum + b.apartments.rent, 0) / buildings.length : 1700;
    const avgSuiteRent = buildings.length > 0 ? buildings.reduce((sum, b) => sum + b.suites.rent, 0) / buildings.length : 3000;
    return { 
        apartments: totalApartments, 
        suites: totalSuites, 
        rent: { apt: Math.round(avgApartmentRent), ste: Math.round(avgSuiteRent) } 
    };
  }, [buildings, loading]);

  useEffect(() => {
    const currentYear = 1447; // Current Hijri Year
    
    const generateDefaultForecasts = () => Array.from({ length: years }, (_, i): YearlyForecastInput => ({
        year: currentYear + i,
        semesters: [
            { apartmentRent: initialTotals.rent.apt, rentedApartments: initialTotals.apartments, suiteRent: initialTotals.rent.ste, rentedSuites: initialTotals.suites, expenses: 0 },
            { apartmentRent: initialTotals.rent.apt, rentedApartments: initialTotals.apartments, suiteRent: initialTotals.rent.ste, rentedSuites: initialTotals.suites, expenses: 0 }
        ]
    }));

    // Use stored forecasts if available and match the number of years, otherwise generate new ones.
    const forecastsToUse = initialForecasts.length === years 
      ? initialForecasts 
      : generateDefaultForecasts();

    setForecastInputs(forecastsToUse);

  }, [years, initialTotals, initialForecasts]);


  const handleYearsChange = (value: string) => {
    const numValue = Number(value);
    if (!isNaN(numValue) && numValue > 0 && numValue <= 20) {
      setYears(numValue);
      setHasChanges(true);
      // When years change, we might want to regenerate forecasts if the old ones are irrelevant.
      // This will be handled by the useEffect dependency change.
    }
  };

  const handleInputChange = (yearIndex: number, semesterIndex: 0 | 1, field: keyof SemesterData, value: string) => {
    const numValue = Number(value);
    if (!isNaN(numValue) && numValue >= 0) {
        const newForecasts = [...forecastInputs];
        const currentData = newForecasts[yearIndex].semesters[semesterIndex];
        
        let validatedValue = numValue;
        if (field === 'rentedApartments' && numValue > initialTotals.apartments) {
            validatedValue = initialTotals.apartments;
        } else if (field === 'rentedSuites' && numValue > initialTotals.suites) {
            validatedValue = initialTotals.suites;
        }
        
        currentData[field] = validatedValue;
        setForecastInputs(newForecasts);
        setHasChanges(true);
    }
  };
  
  const calculateForecast = useCallback(() => {
    return forecastInputs.map(yearInput => {
      const yearResult = {
        year: yearInput.year,
        totalRevenue: 0,
        totalExpenses: 0,
        totalNetProfit: 0,
      };

      yearInput.semesters.forEach(semester => {
        const aptRevenue = semester.rentedApartments * semester.apartmentRent;
        const suiteRevenue = semester.rentedSuites * semester.suiteRent;
        const semesterRevenue = aptRevenue + suiteRevenue;
        const semesterNetProfit = semesterRevenue - semester.expenses;
        
        yearResult.totalRevenue += semesterRevenue;
        yearResult.totalExpenses += semester.expenses;
        yearResult.totalNetProfit += semesterNetProfit;
      });

      return yearResult;
    });
  }, [forecastInputs]);

  const forecastData = useMemo(() => calculateForecast(), [calculateForecast]);
  
  const grandTotals = useMemo(() => {
    return forecastData.reduce(
      (acc, year) => {
        acc.totalRevenue += year.totalRevenue;
        acc.totalExpenses += year.totalExpenses;
        acc.totalNetProfit += year.totalNetProfit;
        return acc;
      },
      { totalRevenue: 0, totalExpenses: 0, totalNetProfit: 0 }
    );
  }, [forecastData]);

  const handleSave = () => {
    saveForecastInputs(forecastInputs);
    setHasChanges(false);
    toast({
      title: "تم الحفظ بنجاح",
      description: "تم حفظ بيانات التوقعات بشكل دائم.",
      className: "bg-green-100 border-green-400 text-green-800",
      duration: 3000,
    });
  };


  const chartData = forecastData.map(y => ({
    name: `عام ${y.year}هـ`,
    'الإيرادات': y.totalRevenue,
    'المصروفات': y.totalExpenses,
    'صافي الربح': y.totalNetProfit,
  }));

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary font-headline flex items-center gap-3">
            <BarChartIcon className="h-8 w-8" />
            أداة التوقعات المالية المستقبلية
          </h1>
          <p className="text-muted-foreground mt-2 text-base font-medium">
            أداة تفاعلية لتخطيط الإيرادات والمصروفات المتوقعة للسنوات القادمة.
          </p>
        </div>
      </div>
      
      <Card className="mb-8 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><SlidersHorizontal /> متحكمات التوقع الرئيسية</CardTitle>
          <CardDescription>عدّل الفرضيات التالية لتحديث جدول التوقعات والمخطط البياني بشكل فوري.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-w-xs">
            <Label htmlFor="years">عدد سنوات التوقع (1-20)</Label>
            <Input id="years" type="number" value={years} onChange={(e) => handleYearsChange(e.target.value)} placeholder="مثال: 5" min="1" max="20" />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-10">
        <Card className="shadow-xl border-gray-200">
            <CardHeader>
              <div className="flex justify-between items-start">
                  <div>
                      <CardTitle>جدول إدخال بيانات التوقع</CardTitle>
                      <CardDescription className="mt-1">
                          أدخل البيانات المتوقعة لكل سنة دراسية لتحديث النتائج في الجدول أدناه والمخطط البياني.
                          العدد الأقصى للشقق المؤجرة هو {initialTotals.apartments} وللأجنحة {initialTotals.suites}.
                      </CardDescription>
                  </div>
              </div>
            </CardHeader>
            <CardContent>
                 <div className="overflow-x-auto border border-gray-300 rounded-lg">
                    <Table className="min-w-full">
                        <TableHeader>
                            <TableRow className="bg-muted hover:bg-muted">
                                <TableHead className="text-center font-bold text-muted-foreground">السنة</TableHead>
                                <TableHead className="text-center font-bold text-muted-foreground">الفصل</TableHead>
                                <TableHead className="text-center font-bold text-muted-foreground">إيجار الشقة</TableHead>
                                <TableHead className="text-center font-bold text-muted-foreground">شقق مؤجرة</TableHead>
                                <TableHead className="text-center font-bold text-muted-foreground">إيجار الجناح</TableHead>
                                <TableHead className="text-center font-bold text-muted-foreground">أجنحة مؤجرة</TableHead>
                                <TableHead className="text-center font-bold text-muted-foreground">المصروفات</TableHead>
                                <TableHead className="text-center font-bold text-muted-foreground">الإيرادات</TableHead>
                                <TableHead className="text-center font-bold text-muted-foreground">صافي الربح</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {forecastInputs.map((year, yearIndex) => (
                                <React.Fragment key={year.year}>
                                    {[0, 1].map(semIndex_ => {
                                        const semIndex = semIndex_ as 0 | 1;
                                        const semester = year.semesters[semIndex];
                                        const revenue = (semester.rentedApartments * semester.apartmentRent) + (semester.rentedSuites * semester.suiteRent);
                                        const netProfit = revenue - semester.expenses;
                                        return (
                                            <TableRow key={semIndex} className={yearIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                {semIndex === 0 && <TableCell rowSpan={2} className="text-center font-medium align-middle border-l">{year.year} هـ</TableCell>}
                                                <TableCell className="text-center border-l">الفصل {semIndex === 0 ? 'الأول' : 'الثاني'}</TableCell>
                                                <TableCell className="border-l p-1"><Input type="number" value={semester.apartmentRent} onChange={(e) => handleInputChange(yearIndex, semIndex, 'apartmentRent', e.target.value)} className="h-8 text-center" /></TableCell>
                                                <TableCell className="border-l p-1"><Input type="number" value={semester.rentedApartments} onChange={(e) => handleInputChange(yearIndex, semIndex, 'rentedApartments', e.target.value)} className="h-8 text-center" /></TableCell>
                                                <TableCell className="border-l p-1"><Input type="number" value={semester.suiteRent} onChange={(e) => handleInputChange(yearIndex, semIndex, 'suiteRent', e.target.value)} className="h-8 text-center" /></TableCell>
                                                <TableCell className="border-l p-1"><Input type="number" value={semester.rentedSuites} onChange={(e) => handleInputChange(yearIndex, semIndex, 'rentedSuites', e.target.value)} className="h-8 text-center" /></TableCell>
                                                <TableCell className="border-l p-1"><Input type="number" value={semester.expenses} onChange={(e) => handleInputChange(yearIndex, semIndex, 'expenses', e.target.value)} className="h-8 text-center" /></TableCell>
                                                <TableCell className="text-center border-l font-semibold">{formatCurrency(revenue)}</TableCell>
                                                <TableCell className="text-center text-green-600 font-bold">{formatCurrency(netProfit)}</TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </React.Fragment>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                 <div className="mt-6 flex justify-end">
                    <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700" disabled={!hasChanges}>
                        <Save className="ml-2 h-4 w-4" />
                        حفظ التعديلات
                    </Button>
                </div>
            </CardContent>
        </Card>
        
        <Card className="shadow-xl border-gray-200">
          <CardHeader>
            <CardTitle>الملخص السنوي للتوقعات</CardTitle>
             <CardDescription>هذا الجدول يلخص الإيرادات والمصروفات والأرباح لكل سنة مالية.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto border border-gray-300 rounded-lg">
                <Table className="min-w-full">
                    <TableHeader>
                        <TableRow className="bg-muted hover:bg-muted">
                            <TableHead className="text-center font-bold text-muted-foreground">السنة</TableHead>
                            <TableHead className="text-center font-bold text-muted-foreground">إجمالي الإيرادات</TableHead>
                            <TableHead className="text-center font-bold text-muted-foreground">إجمالي المصروفات</TableHead>
                            <TableHead className="text-center font-bold text-muted-foreground">إجمالي صافي الربح</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {forecastData.map((year, index) => (
                          <TableRow key={year.year} className={`text-center ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                              <TableCell className="font-medium border-l">{year.year} هـ</TableCell>
                              <TableCell className="font-semibold text-blue-700 border-l">{formatCurrency(year.totalRevenue)}</TableCell>
                              <TableCell className="font-semibold text-red-700 border-l">{formatCurrency(year.totalExpenses)}</TableCell>
                              <TableCell className="font-bold text-green-700">{formatCurrency(year.totalNetProfit)}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xl border-gray-200">
          <CardHeader>
            <CardTitle>الملخص الإجمالي لجميع سنوات التوقع ({years} سنوات)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto border border-gray-300 rounded-lg">
                <Table className="min-w-full">
                    <TableHeader>
                        <TableRow className="bg-muted hover:bg-muted">
                            <TableHead className="text-center font-bold text-muted-foreground">البند</TableHead>
                            <TableHead className="text-center font-bold text-muted-foreground">المبلغ الإجمالي</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow className="text-center bg-white">
                            <TableCell className="font-medium border-l">إجمالي الإيرادات المتوقعة</TableCell>
                            <TableCell className="font-bold text-blue-700">{formatCurrency(grandTotals.totalRevenue)}</TableCell>
                        </TableRow>
                         <TableRow className="text-center bg-gray-50">
                            <TableCell className="font-medium border-l">إجمالي المصروفات المتوقعة</TableCell>
                            <TableCell className="font-bold text-red-700">{formatCurrency(grandTotals.totalExpenses)}</TableCell>
                        </TableRow>
                    </TableBody>
                    <TableFooter>
                        <TableRow className="bg-primary text-white font-extrabold text-lg">
                            <TableCell className="text-center">إجمالي صافي الربح المتوقع</TableCell>
                            <TableCell className="text-center">{formatCurrency(grandTotals.totalNetProfit)}</TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xl border-gray-200">
          <CardHeader>
            <CardTitle>مخطط النمو المالي المتوقع</CardTitle>
            <CardDescription>
              رسم بياني يوضح توقعات الإيرادات، المصروفات، وصافي الربح للسنوات القادمة.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[400px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--foreground))' }}/>
                <YAxis tickFormatter={(value) => formatCurrency(value, true)} tick={{ fill: 'hsl(var(--foreground))' }} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'hsla(var(--accent) / 0.5)'}} />
                <Legend wrapperStyle={{direction: 'rtl', paddingTop: '10px'}}/>
                <Bar dataKey="الإيرادات" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="المصروفات" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="صافي الربح" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>

    </div>
  );
}
