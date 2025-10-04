
"use client";

import { useMemo } from "react";
import { useAppContext } from "@/contexts/AppDataContext";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Target, Percent, Wallet, BarChart2, PieChart as PieChartIcon, Building, Coins } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const StatCard = ({ title, value, icon: Icon, description, colorClass }: { title: string, value: string | number, icon: React.ElementType, description?: string, colorClass: string }) => (
    <Card className={`shadow-lg border-t-4 ${colorClass}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-md font-bold">{title}</CardTitle>
            <Icon className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-3xl font-black">{value}</div>
            {description && <p className="text-xs text-muted-foreground pt-1">{description}</p>}
        </CardContent>
    </Card>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const formattedLabel = label ? `مبنى ${label}` : payload[0].name;
    const isCurrency = payload.some((p: any) => p.dataKey.toLowerCase().includes('revenue') || p.dataKey.toLowerCase().includes('lost'));

    return (
      <div className="p-2 bg-background border rounded-lg shadow-lg" style={{direction: 'rtl'}}>
        <p className="label font-bold">{formattedLabel}</p>
        {payload.map((pld: any, index: number) => (
          <p key={index} style={{ color: pld.stroke || pld.fill }}>
            {`${pld.name}: ${isCurrency ? formatCurrency(pld.value) : (pld.dataKey === 'value' ? `${pld.value} وحدة` : pld.value)}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function PerformanceIndicatorsClient() {
  const { buildings, loading } = useAppContext();

  const stats = useMemo(() => {
    if (loading || buildings.length === 0) return null;

    let totalExpectedRevenue = 0;
    let totalActualRevenue = 0;
    
    let totalApartments = 0;
    let totalRentedApartments = 0;
    let totalSuites = 0;
    let totalRentedSuites = 0;
    let totalMaintenanceUnits = 0;
    let totalAvailableUnits = 0;
    let totalOfficeUnits = 0;

    const buildingStats = buildings.map(building => {
      const allUnits = [...building.apartments.units, ...building.suites.units];
      
      const expectedRevenue = allUnits.reduce((sum, u) => sum + u.baseRent, 0);
      const actualRevenue = allUnits.filter(u => u.status === 'rented').reduce((sum, u) => sum + (u.actualRent ?? u.baseRent), 0);

      return {
        name: building.name.replace('مبنى ', ''),
        expectedRevenue,
        actualRevenue,
        lostRevenue: expectedRevenue - actualRevenue,
      };
    });

    buildings.forEach(building => {
        const allUnits = [...building.apartments.units, ...building.suites.units];
        totalApartments += allUnits.filter(u => u.unitType === 'apartment').length;
        totalRentedApartments += allUnits.filter(u => u.unitType === 'apartment' && u.status === 'rented').length;
        totalSuites += allUnits.filter(u => u.unitType === 'suite').length;
        totalRentedSuites += allUnits.filter(u => u.unitType === 'suite' && u.status === 'rented').length;
        
        allUnits.forEach(u => {
            totalExpectedRevenue += u.baseRent;
            if (u.status === 'rented') totalActualRevenue += u.actualRent ?? u.baseRent;
            if (u.status === 'available') totalAvailableUnits++;
            if (u.status === 'under_maintenance') totalMaintenanceUnits++;
            if (u.status === 'office') totalOfficeUnits++;
        });
    });


    const totalLostRevenue = totalExpectedRevenue - totalActualRevenue;
    const totalRentableUnits = totalApartments + totalSuites - totalOfficeUnits;
    const totalRentedUnits = totalRentedApartments + totalRentedSuites;
    const overallOccupancy = totalRentableUnits > 0 ? (totalRentedUnits / totalRentableUnits) * 100 : 0;
    const overallRevenueAchievement = totalExpectedRevenue > 0 ? (totalActualRevenue / totalExpectedRevenue) * 100 : 0;
    
    const unitStatusData = [
        { name: 'مؤجرة', value: totalRentedUnits, color: 'hsl(var(--chart-1))' },
        { name: 'متاحة', value: totalAvailableUnits, color: 'hsl(var(--chart-2))' },
        { name: 'تحت الصيانة', value: totalMaintenanceUnits, color: 'hsl(var(--chart-4))' },
        { name: 'مكاتب إدارية', value: totalOfficeUnits, color: 'hsl(var(--muted))' },
    ];
    
    const revenueSourceData = [
        { name: 'شقق', value: buildings.reduce((acc, b) => acc + b.apartments.units.filter(u => u.status === 'rented').reduce((s, u) => s + (u.actualRent ?? u.baseRent), 0), 0), color: 'hsl(var(--chart-3))' },
        { name: 'أجنحة', value: buildings.reduce((acc, b) => acc + b.suites.units.filter(u => u.status === 'rented').reduce((s, u) => s + (u.actualRent ?? u.baseRent), 0), 0), color: 'hsl(var(--chart-5))' },
    ]


    return { buildingStats, totalExpectedRevenue, totalActualRevenue, totalLostRevenue, overallOccupancy, overallRevenueAchievement, unitStatusData, revenueSourceData };
  }, [buildings, loading]);

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6">
        <Skeleton className="h-8 w-64 mb-8" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
          <Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" />
        </div>
        <div className="grid gap-8 lg:grid-cols-3">
            <Skeleton className="h-96 lg:col-span-2" />
            <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 space-y-8">
        <div>
            <h1 className="text-3xl font-bold text-primary font-headline flex items-center gap-3">
              <TrendingUp className="h-8 w-8" />
              لوحة مؤشرات الأداء (KPIs)
            </h1>
            <p className="text-muted-foreground mt-2 text-base font-medium">
              نظرة شاملة على أداء النظام المالي والتشغيلي للفصل الدراسي الحالي.
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <StatCard title="إجمالي الإيرادات المتوقعة" value={formatCurrency(stats.totalExpectedRevenue)} icon={Coins} description="الإيراد النظري لجميع الوحدات" colorClass="border-gray-500" />
            <StatCard title="الإيرادات الفعلية" value={formatCurrency(stats.totalActualRevenue)} icon={Wallet} description={`من إجمالي متوقع ${formatCurrency(stats.totalExpectedRevenue)}`} colorClass="border-green-500" />
            <StatCard title="نسبة تحقيق الإيرادات" value={`${stats.overallRevenueAchievement.toFixed(1)}%`} icon={Target} description="مقارنة بالمتوقع" colorClass="border-blue-500" />
            <StatCard title="نسبة الإشغال الإجمالية" value={`${stats.overallOccupancy.toFixed(1)}%`} icon={Percent} description="لا يشمل المكاتب الإدارية" colorClass="border-teal-500" />
            <StatCard title="مجموع الإيرادات المفقودة" value={formatCurrency(stats.totalLostRevenue)} icon={TrendingUp} description="بسبب الشواغر والصيانة والمكاتب" colorClass="border-red-500" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
             <Card className="shadow-xl lg:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary"><BarChart2 /> مقارنة إيرادات المباني</CardTitle>
                    <CardDescription>تحليل للإيرادات المتوقعة، المحققة، والمفقودة لكل مبنى.</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px] pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.buildingStats} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{ fill: 'hsl(var(--foreground))' }} name="المبنى" />
                            <YAxis tickFormatter={(value) => formatCurrency(value, true)} tick={{ fill: 'hsl(var(--foreground))' }} />
                            <Tooltip content={<CustomTooltip />} cursor={{fill: 'hsla(var(--accent) / 0.5)'}} />
                            <Legend wrapperStyle={{direction: 'rtl', paddingTop: '10px'}} formatter={(value) => <span className="text-card-foreground">{value}</span>} />
                            <Bar dataKey="expectedRevenue" name="الإيرادات المتوقعة" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="actualRevenue" name="الإيرادات المحققة" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="lostRevenue" name="الإيرادات المفقودة" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <div className="space-y-8">
                 <Card className="shadow-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-primary"><PieChartIcon /> توزيع حالة الوحدات</CardTitle>
                        <CardDescription>إجمالي الوحدات وتوزيعها حسب الحالة.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[200px]">
                       <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Tooltip content={<CustomTooltip />} />
                                <Pie data={stats.unitStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                    const radius = innerRadius + (outerRadius - innerRadius) * 1.2;
                                    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                                    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                                    return <text x={x} y={y} fill="currentColor" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-semibold">{`${(percent * 100).toFixed(0)}%`}</text>;
                                }}>
                                    {stats.unitStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                </Pie>
                                <Legend iconSize={10} wrapperStyle={{fontSize: '12px'}}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card className="shadow-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-primary"><Building /> مصادر الإيرادات</CardTitle>
                        <CardDescription>توزيع الإيرادات الفعلية بين الشقق والأجنحة.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[200px]">
                       <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Tooltip content={<CustomTooltip />} />
                                <Pie data={stats.revenueSourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} label>
                                    {stats.revenueSourceData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                </Pie>
                                <Legend iconSize={10} wrapperStyle={{fontSize: '12px'}}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

        </div>
    </div>
  );
}

    