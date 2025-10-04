
"use client";

import { type Unit } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCurrency } from "@/lib/utils";
import { Crown } from "lucide-react";

const statusConfig = {
    rented: {
        bg: 'bg-green-500/80',
        border: 'border-green-700',
        label: 'مؤجرة'
    },
    available: {
        bg: 'bg-blue-500/80',
        border: 'border-blue-700',
        label: 'متاحة'
    },
    under_maintenance: {
        bg: 'bg-yellow-400/80',
        border: 'border-yellow-600',
        label: 'تحت الصيانة'
    },
    office: {
        bg: 'bg-gray-400/80',
        border: 'border-gray-600',
        label: 'مكتب إداري'
    }
};

const paymentStatusLabels: { [key: string]: string } = {
  paid: 'تم السداد',
  deferred: 'مؤجل',
  payment_plan: 'خطة سداد',
  paid_in_full: 'مسدد بالكامل',
  exempt: 'إعفاء',
  scholarship: 'ابتعاث'
};

const maintenanceTypeLabels: { [key: string]: string } = {
  maintenance: "صيانة عامة",
  furniture: "أثاث",
  electrical: "كهرباء",
  painting: "دهانات",
  none: "أخرى",
};


export function UnitCard({ unit }: { unit: Unit }) {
    const config = statusConfig[unit.status];
    const isSuite = unit.unitType === 'suite';

    const renderTooltipContent = () => {
        return (
            <div className="p-2 text-right space-y-1 text-sm" dir="rtl">
                <p><strong>الوحدة:</strong> {unit.buildingId} / {unit.unitNumber} ({unit.unitType === 'apartment' ? 'شقة' : 'جناح'})</p>
                <p><strong>الحالة:</strong> {config.label}</p>
                <p><strong>الإيجار:</strong> {formatCurrency(unit.baseRent)}</p>
                {unit.status === 'rented' && (
                    <p><strong>حالة السداد:</strong> {paymentStatusLabels[unit.paymentStatus || ''] || '-'}</p>
                )}
                 {unit.status === 'under_maintenance' && (
                    <p><strong>سبب الصيانة:</strong> {maintenanceTypeLabels[unit.vacancyReason || ''] || 'غير محدد'}</p>
                )}
            </div>
        );
    };

    return (
        <TooltipProvider delayDuration={0}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className={cn(
                        "w-full h-9 rounded-md flex items-center justify-center text-white shadow-md border cursor-pointer transition-transform hover:scale-110",
                        config.bg,
                        isSuite ? 'border-yellow-500' : config.border
                    )}>
                        {isSuite && <Crown className="h-3 w-3 ml-1 text-yellow-600" />}
                        <span className="font-bold text-sm">{unit.unitNumber}</span>
                    </div>
                </TooltipTrigger>
                <TooltipContent side="top" align="center">
                    {renderTooltipContent()}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
