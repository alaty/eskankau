
"use client";

import React, { useState } from 'react';
import { type Unit } from '@/lib/types';
import { useAppContext } from '@/contexts/AppDataContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils';
import { Printer, Copy, FileWarning } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ClaimDialogProps {
  unit: Unit;
  remainingAmount: number;
  dueDate: Date | null;
}

export const ClaimDialog = ({ unit, remainingAmount, dueDate }: ClaimDialogProps) => {
  const { logClaimAction } = useAppContext();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const claimText = `عزيزي ساكن الغرفة ${unit.unitNumber}،
السلام عليكم ورحمة الله وبركاته،
نود أن نشعركم بضرورة تسديد المستحقات المالية التي حل موعد سدادها بقيمة (${formatCurrency(remainingAmount)}) بتاريخ (${dueDate ? dueDate.toLocaleDateString('ar-SA') : 'غير محدد'}).
وفي حال عدم السداد، نرجو منكم التواصل مع الإدارة المالية للمجمع السكني.

مدير الصندوق
أ. نادر حمبضاضة`;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>مطالبة مالية</title>
            <style>
              body { font-family: 'Tajawal', sans-serif; direction: rtl; padding: 2rem; }
              pre { white-space: pre-wrap; font-size: 1rem; line-height: 1.6; }
            </style>
          </head>
          <body>
            <pre>${claimText}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
      logAction("طباعة مطالبة ورقية");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(claimText).then(() => {
      toast({
        title: 'تم النسخ بنجاح',
        description: 'تم نسخ نص المطالبة إلى الحافظة.',
      });
      logAction("نسخ مطالبة نصية");
    });
  };

  const logAction = (action: string) => {
    logClaimAction(unit.buildingId, unit.id, action);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs">
           <FileWarning className="ml-1 h-3 w-3" />
           إنشاء مطالبة
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>نموذج مطالبة مالية</DialogTitle>
          <DialogDescription>
            مطالبة للوحدة رقم {unit.unitNumber} في مبنى {unit.buildingId}.
          </DialogDescription>
        </DialogHeader>
        <div className="my-4 p-4 border rounded-md bg-muted/50 whitespace-pre-wrap text-sm" dir="rtl">
          {claimText}
        </div>
        <DialogFooter className="sm:justify-start gap-2">
          <Button type="button" onClick={handlePrint}>
            <Printer className="ml-2 h-4 w-4" />
            طباعة
          </Button>
          <Button type="button" variant="secondary" onClick={handleCopy}>
            <Copy className="ml-2 h-4 w-4" />
            نسخ
          </Button>
          <DialogClose asChild>
             <Button type="button" variant="ghost">إغلاق</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
