"use client";

import React, { useMemo } from 'react';
import { useAppContext } from '@/contexts/AppDataContext';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { Target, TrendingUp, TrendingDown, Home, Wrench, Briefcase, GitCommitHorizontal, ArrowLeft } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const FlowBox = ({ title, value, icon: Icon, color, tooltip, children, className }: { title: string, value: number, icon: React.ElementType, color: string, tooltip: string, children?: React.ReactNode, className?: string }) => (
    <TooltipProvider>
        <Tooltip>
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
        </Tooltip>
    </TooltipProvider>
);

const FlowArrow = ({ isBranch }: { isBranch?: boolean }) => (
    <div className={`flex items-center justify-center ${isBranch ? 'rotate-90 md:rotate-0' : ''}`}>
        <ArrowLeft className="h-8 w-8 text-muted-foreground/50" />
    </div>
);

export function RevenueFlowClient() {
    const { buildings, loading } = useAppContext();

    const stats = useMemo(() => {
        if (loading || buildings.length === 0) return null;

        let totalExpectedRevenue = 0;
        let totalActualRevenue = 0;
        const lostRevenueBreakdown = {
            available: 0,
            under_maintenance: 0,
            office: 0,
        };

        buildings.forEach(building => {
            const allUnits = [...building.apartments.units, ...building.suites.units];
            allUnits.forEach(unit => {
                if (unit.status !== 'office') {
                    totalExpectedRevenue += unit.baseRent;
                }
                 if (unit.status === 'rented') {
                    totalActualRevenue += unit.actualRent ?? unit.baseRent;
                } else if (unit.status === 'available') {
                    lostRevenueBreakdown.available += unit.baseRent;
                } else if (unit.status === 'under_maintenance') {
                    lostRevenueBreakdown.under_maintenance += unit.baseRent;
                } else if (unit.status === 'office') {
                    lostRevenueBreakdown.office += unit.baseRent;
                }
            });
        });

        const totalLostRevenue = totalExpectedRevenue - totalActualRevenue;

        return {
            totalExpectedRevenue,
            totalActualRevenue,
            totalLostRevenue,
            lostRevenueBreakdown
        };
    }, [buildings, loading]);

    if (loading) {
        return (
            <div className="container mx-auto py-8 px-4 md:px-6 space-y-8">
                <Skeleton className="h-10 w-1/3 mb-8" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }
    
    if (!stats) return null;

    return (
        <div className="container mx-auto py-8 px-4 md:px-6">
            <div className="text-center mb-12">
                <h1 className="text-3xl font-bold text-primary font-headline flex items-center justify-center gap-3">
                  <GitCommitHorizontal className="h-8 w-8" />
                  خريطة تدفق الإيرادات
                </h1>
                <p className="text-muted-foreground mt-2 text-lg max-w-2xl mx-auto">
                    تصور مرئي لرحلة إيرادات الإسكان من المصدر المتوقع إلى صافي الدخل المحقق، مع توضيح نقاط فقدان الإيرادات.
                </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-5 items-center gap-x-6 gap-y-8">
                {/* Start Box */}
                <div className="md:col-span-1">
                    <FlowBox 
                        title="الإيرادات المتوقعة"
                        value={stats.totalExpectedRevenue}
                        icon={Target}
                        color="border-blue-500"
                        tooltip="أقصى إيراد يمكن تحقيقه نظريًا إذا كانت جميع الوحدات (غير الإدارية) مؤجرة."
                        className="animate-in fade-in-50"
                    />
                </div>

                {/* Arrow */}
                <FlowArrow isBranch />

                {/* Branching Point */}
                <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 items-start gap-6 relative">
                    {/* Top Branch (Actual Revenue) */}
                    <div className="md:col-span-3">
                         <FlowBox 
                            title="الإيرادات المحققة"
                            value={stats.totalActualRevenue}
                            icon={TrendingUp}
                            color="border-green-500"
                            tooltip="إجمالي المبالغ التي تم تحصيلها بالفعل من الوحدات المؤجرة."
                            className="animate-in fade-in-50 delay-200"
                        />
                    </div>
                    
                    {/* Vertical branching line */}
                     <div className="absolute top-0 right-1/2 h-full w-px bg-muted-foreground/30 hidden md:block" />

                    {/* Bottom Branch (Lost Revenue) */}
                     <div className="md:col-span-3">
                        <FlowBox 
                            title="الإيرادات المفقودة"
                            value={stats.totalLostRevenue}
                            icon={TrendingDown}
                            color="border-red-500"
                            tooltip="إجمالي الإيرادات التي لم يتم تحصيلها بسبب وحدات غير مؤجرة."
                            className="animate-in fade-in-50 delay-300"
                        >
                            <div className="mt-4 pt-4 border-t border-dashed">
                                <h4 className="text-xs font-semibold mb-2 text-muted-foreground">تفصيل أسباب الفقد:</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                                     <div className="flex justify-between p-1 bg-blue-100/50 rounded">
                                        <span className="flex items-center gap-1"><Home className="h-3 w-3"/> متاح</span>
                                        <span className="font-bold">{formatCurrency(stats.lostRevenueBreakdown.available)}</span>
                                    </div>
                                    <div className="flex justify-between p-1 bg-yellow-100/50 rounded">
                                       <span className="flex items-center gap-1"><Wrench className="h-3 w-3"/> صيانة</span>
                                        <span className="font-bold">{formatCurrency(stats.lostRevenueBreakdown.under_maintenance)}</span>
                                    </div>
                                    <div className="flex justify-between p-1 bg-gray-200/50 rounded">
                                        <span className="flex items-center gap-1"><Briefcase className="h-3 w-3"/> إداري</span>
                                        <span className="font-bold">{formatCurrency(stats.lostRevenueBreakdown.office)}</span>
                                    </div>
                                </div>
                            </div>
                        </FlowBox>
                     </div>
                </div>
            </div>
        </div>
    );
}
