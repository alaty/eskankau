"use client";

import React from 'react';
import { type Unit, type PaymentPlan } from '@/lib/types';
import { useAppContext } from '@/contexts/AppDataContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { PaymentPlanForm, type PaymentPlanFormData } from './PaymentPlanForm';
import { WalletCards } from 'lucide-react';

interface PaymentPlanDialogProps {
  unit: Unit;
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentPlanDialog = ({ unit, isOpen, onClose }: PaymentPlanDialogProps) => {
    const { updatePaymentPlan } = useAppContext();

    const handleSubmit = (data: PaymentPlanFormData) => {
        const finalPlan: PaymentPlan = {
            type: data.type,
            notes: data.notes,
        };
        if (data.type === 'deferred') {
            finalPlan.deferredUntil = data.deferredUntil;
        } else if (data.type === 'installment') {
            finalPlan.installments = data.installments;
        } else if (data.type === 'stipend') {
            finalPlan.stipendDeductions = data.stipendDeductions;
        }
        updatePaymentPlan(unit.buildingId, unit.id, finalPlan);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] p-0">
                <DialogHeader className="text-center p-6 bg-muted/50 rounded-t-lg">
                    <div className="flex items-center justify-center gap-2">
                        <WalletCards className="h-6 w-6 text-primary" />
                        <DialogTitle>
                            {unit.paymentPlan ? 'تعديل الخطة المالية' : 'تحديد الخطة المالية'}
                        </DialogTitle>
                    </div>
                    <DialogDescription>
                         للغرفة {unit.unitNumber} في مبنى {unit.buildingId} ({unit.unitType === 'apartment' ? "شقة" : "جناح"})
                    </DialogDescription>
                </DialogHeader>
                <div className="p-6">
                    <PaymentPlanForm unit={unit} onSubmit={handleSubmit} onCancel={onClose} />
                </div>
            </DialogContent>
        </Dialog>
    );
};
