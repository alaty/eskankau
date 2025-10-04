
"use client";

import React from 'react';
import { type Unit, type PaymentPlan, type PaymentInstallment } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Calendar, Repeat, GraduationCap, FileText, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const typeLabels: Record<PaymentPlan['type'], string> = {
  deferred: "تأجيل السداد",
  installment: "تقسيط المبلغ",
  exempt: "إعفاء من الرسوم",
  stipend: "خصم من المكافأة",
  scholarship: "ابتعاث",
};

const typeIcons: Record<PaymentPlan['type'], React.ElementType> = {
  deferred: Calendar,
  installment: Repeat,
  exempt: GraduationCap,
  stipend: FileText,
  scholarship: GraduationCap,
};

const InstallmentTable = ({ installments }: { installments: PaymentInstallment[] }) => {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="h-8">المبلغ</TableHead>
                    <TableHead className="h-8">الاستحقاق</TableHead>
                    <TableHead className="h-8">الحالة</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {installments.map((inst, index) => (
                    <TableRow key={index}>
                        <TableCell className="py-1">{formatCurrency(inst.amount)}</TableCell>
                        <TableCell className="py-1">{new Date(inst.dueDate).toLocaleDateString('ar-SA')}</TableCell>
                        <TableCell className="py-1">
                            {inst.isPaid 
                                ? <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs"><CheckCircle className="ml-1 h-3 w-3" />مدفوع</Badge>
                                : <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs"><XCircle className="ml-1 h-3 w-3" />غير مدفوع</Badge>
                            }
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};


export const PaymentPlanInfo = ({ unit }: { unit: Unit }) => {
    if (!unit.paymentPlan) {
        return <p className="text-sm text-muted-foreground">لا توجد خطة مالية لهذه الوحدة.</p>
    }

    const plan = unit.paymentPlan;
    const PlanIcon = typeIcons[plan.type];
    
    return (
        <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 font-bold text-primary">
                <PlanIcon className="h-5 w-5" />
                <span>{typeLabels[plan.type]}</span>
            </div>

            <div className="text-xs text-muted-foreground">
                <p><strong>المبنى:</strong> {unit.buildingId}</p>
                <p><strong>الغرفة:</strong> {unit.unitNumber} ({unit.unitType === 'apartment' ? "شقة" : "جناح"})</p>
            </div>
            
             {plan.type === 'deferred' && plan.deferredUntil && (
                <div className="p-2 bg-muted rounded-md text-xs">
                    تاريخ الاستحقاق: <strong>{new Date(plan.deferredUntil).toLocaleDateString('ar-SA')}</strong>
                </div>
            )}
            
            {(plan.type === 'installment' && plan.installments) && <InstallmentTable installments={plan.installments} />}
            {(plan.type === 'stipend' && plan.stipendDeductions) && <InstallmentTable installments={plan.stipendDeductions} />}

            {plan.notes && (
                <div className="space-y-1 pt-2">
                    <h4 className="font-semibold text-xs">ملاحظات:</h4>
                    <p className="text-xs text-muted-foreground p-2 border rounded-md whitespace-pre-wrap">{plan.notes}</p>
                </div>
            )}
        </div>
    );
}
