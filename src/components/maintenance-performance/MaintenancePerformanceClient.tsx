
"use client";

import React, { useMemo } from 'react';
import { useAppContext } from '@/contexts/AppDataContext';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Archive, History, BarChart2, DollarSign, ShieldCheck, ListChecks, Sparkles, CheckCircle, AlertTriangle } from 'lucide-react';
import { type Unit, type MaintenanceRecord } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar, CartesianGrid } from 'recharts';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

const StatCard = ({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) => (
    <Card className="shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-background border rounded-lg shadow-lg">
        <p className="label font-bold">{`السبب: ${label}`}</p>
        <p className="text-sm text-primary">{`عدد المرات: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

export function MaintenancePerformanceClient() {
  const { buildings, loading } = useAppContext();

  const maintenanceStats = useMemo(() => {
    if (loading) {
      return { active: [], archived: [], totalCost: 0, reasonCounts: {}, allArchivedRecords: [], overdueCount: 0, archivedUnits: [] };
    }
    
    const archived: { unit: Unit, record: MaintenanceRecord }[] = [];
    let totalCost = 0;
    const reasonCounts: { [key: string]: number } = {
        maintenance: 0, furniture: 0, electrical: 0, painting: 0, none: 0
    };
    
    let onTimeCount = 0;
    let earlyCount = 0;
    let delayedCount = 0;

    buildings.forEach(building => {
      const allUnits = [...building.apartments.units, ...building.suites.units];
      allUnits.forEach(unit => {
        if (unit.maintenanceHistory && unit.maintenanceHistory.length > 0) {
          unit.maintenanceHistory.forEach(record => {
            archived.push({ unit, record });
            totalCost += record.cost;
            if (reasonCounts[record.type] !== undefined) {
              reasonCounts[record.type]++;
            }
            
            // Performance analysis
            if (record.expectedEndDate) {
                const actualEnd = new Date(record.endDate);
                const expectedEnd = new Date(record.expectedEndDate);
                if (actualEnd > expectedEnd) {
                    delayedCount++;
                } else if (actualEnd < expectedEnd) {
                    earlyCount++;
                } else {
                    onTimeCount++;
                }
            } else {
                onTimeCount++; // Assume on-time if no expected date was set
            }
          });
        }
      });
    });
    
    const aggregatedArchived = Array.from(
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
      }, new Map()).values()
    );

    const totalJobs = archived.length;
    const avgCost = totalJobs > 0 ? totalCost / totalJobs : 0;
    
    const sortedByProfitLoss = [...aggregatedArchived].sort((a,b) => (a.actualRevenue - a.totalCost) - (b.actualRevenue - b.totalCost));


    return { 
        archivedUnits: sortedByProfitLoss,
        totalArchivedJobs: totalJobs,
        totalCost, 
        avgCost,
        reasonCounts,
        performance: { onTime: onTimeCount, early: earlyCount, delayed: delayedCount }
    };
  }, [buildings, loading]);
  
  const vacancyReasonLabels: {[key: string]: string} = { maintenance: 'صيانة', furniture: 'أثاث', electrical: 'كهرباء', painting: 'دهانات', none: 'أخرى' };
  const vacancyChartData = Object.entries(maintenanceStats?.reasonCounts || {}).map(([reason, count]) => ({
      name: vacancyReasonLabels[reason as keyof typeof vacancyReasonLabels],
      count: count,
  }));

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6">
        <Skeleton className="h-10 w-1/3 mb-4" />
        <div className="grid gap-4 md:grid-cols-3 mb-8">
            <Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-10 w-1/3 mt-8 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!maintenanceStats) return null;

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 space-y-12">
      <div>
        <h1 className="text-3xl font-bold text-primary font-headline flex items-center gap-3">
          <TrendingUp className="h-8 w-8" />
          مؤشرات أداء الصيانة
        </h1>
        <p className="text-muted-foreground mt-2 text-base font-medium">
          تحليلات شاملة لتقييم كفاءة وفعالية عمليات الصيانة في النظام.
        </p>
      </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard title="إجمالي تكاليف الصيانة" value={formatCurrency(maintenanceStats.totalCost)} icon={DollarSign} />
          <StatCard title="متوسط التكلفة لكل عملية" value={formatCurrency(maintenanceStats.avgCost)} icon={DollarSign} />
          <StatCard title="إجمالي أعمال الصيانة المكتملة" value={maintenanceStats.totalArchivedJobs} icon={ShieldCheck} />
      </div>
      
       <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-primary">
              <ShieldCheck className="h-6 w-6" />
              ملخص الأداء الزمني
            </CardTitle>
            <CardDescription>
                تحليل لمدى الالتزام بالتواريخ المتوقعة لانتهاء أعمال الصيانة.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <Alert className="bg-green-50 border-green-200 text-green-800">
                    <CheckCircle className="h-4 w-4 text-green-800" />
                    <AlertTitle>مهام تمت في الوقت المحدد</AlertTitle>
                    <AlertDescription className="text-2xl font-bold">
                        {maintenanceStats.performance.onTime}
                    </AlertDescription>
                </Alert>
                <Alert className="bg-blue-50 border-blue-200 text-blue-800">
                    <Sparkles className="h-4 w-4 text-blue-800" />
                    <AlertTitle>مهام أنجزت مبكرًا</AlertTitle>
                    <AlertDescription className="text-2xl font-bold">
                        {maintenanceStats.performance.early}
                    </AlertDescription>
                </Alert>
                <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
                    <AlertTriangle className="h-4 w-4 text-red-800" />
                    <AlertTitle>مهام متأخرة</AlertTitle>
                    <AlertDescription className="text-2xl font-bold">
                        {maintenanceStats.performance.delayed}
                    </AlertDescription>
                </Alert>
          </CardContent>
       </Card>

      <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-3 text-primary">
                  <BarChart2 className="h-6 w-6" />
                  اعمال الصيانة الاكثر شيوعا
              </CardTitle>
              <CardDescription>
                  رسم بياني يوضح الأسباب الأكثر شيوعًا لأعمال الصيانة.
              </CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={vacancyChartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={50} />
                      <Tooltip content={<CustomTooltip />} cursor={{fill: 'hsla(var(--accent) / 0.5)'}}/>
                      <Bar dataKey="count" name="عدد المرات" barSize={30} radius={[0, 4, 4, 0]} fill="hsl(var(--primary))" />
                  </BarChart>
              </ResponsiveContainer>
          </CardContent>
      </Card>

    </div>
  );
}
