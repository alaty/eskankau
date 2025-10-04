
"use client";

import React, { useState, useRef } from 'react';
import { type Unit } from '@/lib/types';
import { useAppContext } from '@/contexts/AppDataContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/utils';
import { FileText, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface PaperClaimProps {
  unit: Unit;
  remainingAmount: number;
  dueDate: Date | null;
  onActionComplete: () => void;
}

export const PaperClaim = ({ unit, remainingAmount, dueDate, onActionComplete }: PaperClaimProps) => {
  const { logClaimAction } = useAppContext();
  const { toast } = useToast();
  
  const initialClaimText = `عزيزي الطالب/ـة
مبنى رقم (${unit.buildingId}) غرفة رقم(${unit.unitNumber})
المبلغ: (${formatCurrency(remainingAmount)}) عن الفصل الدراسي الأول لعام 1447هـ.

السلام عليكم ورحمة الله وبركاته،
نود أن نشعركم بضرورة تسديد المستحقات المالية التي حل موعد سدادها بتاريخ (${dueDate ? format(dueDate, 'yyyy-MM-dd') : 'غير محدد'}).
وفي حال عدم السداد، نرجو منكم التواصل مع الإدارة المالية للمجمع السكني.

ادارة المتابعة المالية`;

  const [message, setMessage] = useState(initialClaimText);
  const printContentRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && printContentRef.current) {
        printWindow.document.write(`
            <html>
                <head>
                    <title>مطالبة مالية</title>
                    <style>
                        body { font-family: 'Tajawal', sans-serif; direction: rtl; padding: 2rem; }
                        pre { white-space: pre-wrap; font-family: 'Tajawal', sans-serif; font-size: 1rem; line-height: 1.6; }
                    </style>
                </head>
                <body>
                    <pre>${message}</pre>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();

        logClaimAction(unit.buildingId, unit.id, "مطالبة ورقية للطباعة");
        toast({
            title: "تم توثيق الإجراء",
            description: `تم تسجيل طباعة مطالبة ورقية بنجاح.`,
            className: "bg-green-100 border-green-400 text-green-800",
        });
        onActionComplete();
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in-50">
      <h3 className="font-semibold flex items-center gap-2"><FileText className="h-5 w-5" /> تحرير مطالبة ورقية</h3>
      <div className="space-y-2">
          <Label htmlFor="paper-message">نص المطالبة</Label>
           <Textarea 
                id="paper-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={8}
            />
      </div>
      <div ref={printContentRef} style={{ display: 'none' }}>
        {message}
      </div>
       <div className="flex justify-end">
            <Button onClick={handlePrint}>
                <Printer className="ml-2 h-4 w-4" />
                طباعة وتوثيق
            </Button>
        </div>
    </div>
  );
};
