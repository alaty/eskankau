
"use client";

import React, { useState } from 'react';
import { type Unit } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, RefreshCcw, GraduationCap, ShieldCheck } from 'lucide-react';
import { useAppContext } from '@/contexts/AppDataContext';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';

const typeLabels = {
  installment: "تقسيط",
  exempt: "إعفاء",
  stipend: "خصم من المكافأة",
  scholarship: "ابتعاث",
  deferred: "تأجيل",
  paid_in_full: "مسدد بالكامل"
};

const statusConfig: { [key in Unit['paymentStatus'] | 'default']: { label: string, icon: React.ElementType, badgeClass: string } } = {
    paid_in_full: { label: 'مسدد بالكامل', icon: CheckCircle, badgeClass: 'bg-green-200 text-green-900' },
    exempt: { label: 'إعفاء', icon: ShieldCheck, badgeClass: 'bg-blue-200 text-blue-900' },
    scholarship: { label: 'ابتعاث', icon: GraduationCap, badgeClass: 'bg-purple-200 text-purple-900' },
    default: { label: 'مكتمل', icon: CheckCircle, badgeClass: 'bg-gray-200 text-gray-800' },
    // Add other statuses if they can appear here, though unlikely
    paid: { label: 'مكتمل', icon: CheckCircle, badgeClass: 'bg-gray-200 text-gray-800' },
    deferred: { label: 'مكتمل', icon: CheckCircle, badgeClass: 'bg-gray-200 text-gray-800' },
    payment_plan: { label: 'مكتمل', icon: CheckCircle, badgeClass: 'bg-gray-200 text-gray-800' },
};


export const CompletedPlansTable = ({ unitsWithCompletedPlans }: { unitsWithCompletedPlans: Unit[] }) => {
  const { archiveCompletedPlan } = useAppContext();
  const { toast } = useToast();
  const [resettingUnits, setResettingUnits] = useState<Set<string>>(new Set());


  const handleResetToNormal = (unit: Unit) => {
    setResettingUnits(prev => new Set(prev).add(unit.id));
    archiveCompletedPlan(unit.buildingId, unit.id);
    toast({
        title: "تمت أرشفة الخطة",
        description: `تمت إعادة الوحدة ${unit.unitNumber} في مبنى ${unit.buildingId} إلى حالتها الطبيعية (تم السداد)، مع الاحتفاظ بالخطة في الأرشيف.`,
        className: 'bg-blue-100 border-blue-400 text-blue-800'
    });
  };
  
  if (unitsWithCompletedPlans.length === 0) {
    return (
      <div className="border rounded-lg p-4 text-center text-muted-foreground">
        لا توجد خطط مكتملة حتى الآن.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted">
            <TableHead className="text-center">المبنى/الغرفة</TableHead>
            <TableHead className="text-center">نوع الوحدة</TableHead>
            <TableHead className="text-center">مبلغ الإيجار</TableHead>
            <TableHead className="text-center">نوع الخطة المكتملة</TableHead>
            <TableHead className="text-center">تاريخ الإكمال</TableHead>
            <TableHead className="text-center">الحالة النهائية</TableHead>
            <TableHead className="text-center">إجراء</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {unitsWithCompletedPlans.map(unit => {
            const plan = unit.paymentPlan;
            // Determine the final type label, defaulting to the paymentStatus if no plan exists (e.g. for exempt/scholarship)
            const planTypeLabel = plan ? (typeLabels[plan.type as keyof typeof typeLabels] || 'غير محدد') : (typeLabels[unit.paymentStatus as keyof typeof typeLabels] || 'غير محدد');

            const isResetting = resettingUnits.has(unit.id);
            const isArchived = unit.planArchived === true;
            
            const finalStatusKey = unit.paymentStatus || 'default';
            const { label: statusLabel, icon: StatusIcon, badgeClass } = statusConfig[finalStatusKey] || statusConfig.default;


            return (
              <TableRow key={unit.id}>
                <TableCell className="font-medium text-center">
                  {unit.buildingId} / {unit.unitNumber}
                </TableCell>
                <TableCell className="text-center">{unit.unitType === 'apartment' ? 'شقة' : 'جناح'}</TableCell>
                <TableCell className="text-center">{formatCurrency(unit.baseRent)}</TableCell>
                <TableCell className="text-center">{planTypeLabel}</TableCell>
                <TableCell className="text-center">
                  {plan?.completedDate ? new Date(plan.completedDate).toLocaleDateString('ar-SA') : '-'}
                </TableCell>
                <TableCell className="text-center">
                   <Badge variant="secondary" className={badgeClass}>
                        <StatusIcon className="ml-1 h-4 w-4" />
                        {statusLabel}
                    </Badge>
                </TableCell>
                 <TableCell className="text-center">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResetToNormal(unit)}
                        className="text-xs"
                        disabled={isResetting || isArchived}
                    >
                       <RefreshCcw className="ml-1 h-3 w-3" />
                       {isResetting ? "جاري..." : (isArchived ? 'مؤرشفة' : 'إعادة للحالة الطبيعية')}
                    </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
