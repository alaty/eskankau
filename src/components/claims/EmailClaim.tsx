
"use client";

import React, { useState } from 'react';
import { type Unit } from '@/lib/types';
import { useAppContext } from '@/contexts/AppDataContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/utils';
import { Mail, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { format } from 'date-fns';


interface EmailClaimProps {
  unit: Unit;
  remainingAmount: number;
  dueDate: Date | null;
  onActionComplete: () => void;
}

export const EmailClaim = ({ unit, remainingAmount, dueDate, onActionComplete }: EmailClaimProps) => {
  const { logClaimAction } = useAppContext();
  const { toast } = useToast();
  
  const claimText = `عزيزي الطالب/ـة
مبنى رقم (${unit.buildingId}) غرفة رقم(${unit.unitNumber})
المبلغ: (${formatCurrency(remainingAmount)}) عن الفصل الدراسي الأول لعام 1447هـ.

السلام عليكم ورحمة الله وبركاته،
نود أن نشعركم بضرورة تسديد المستحقات المالية التي حل موعد سدادها بتاريخ (${dueDate ? format(dueDate, 'yyyy-MM-dd') : 'غير محدد'}).
وفي حال عدم السداد، نرجو منكم التواصل مع الإدارة المالية للمجمع السكني.

ادارة المتابعة المالية`;

  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(claimText);

  const handleSend = () => {
    // In a real app, this would trigger an API call to send the email.
    // Here, we just log the action.
    logClaimAction(unit.buildingId, unit.id, "مطالبة عبر البريد الإلكتروني");
    toast({
        title: "تم توثيق الإجراء",
        description: `تم تسجيل إرسال مطالبة إلى ${email} بنجاح.`,
        className: "bg-green-100 border-green-400 text-green-800",
    });
    onActionComplete();
  };

  return (
    <div className="space-y-4 animate-in fade-in-50">
        <h3 className="font-semibold flex items-center gap-2"><Mail className="h-5 w-5" /> إرسال مطالبة عبر البريد الإلكتروني</h3>
        <div className="space-y-2">
            <Label htmlFor="email-address">البريد الإلكتروني للمستلم</Label>
            <Input 
                id="email-address"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
        </div>
        <div className="space-y-2">
            <Label htmlFor="email-message">نص الرسالة</Label>
            <Textarea 
                id="email-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={8}
            />
        </div>
         <Alert variant="default" className="bg-blue-50 border-blue-200 text-blue-800">
            <AlertTitle>ملاحظة</AlertTitle>
            <AlertDescription>
                هذا النموذج مخصص للتوثيق فقط. الضغط على "إرسال وتوثيق" سيقوم بتسجيل الإجراء في النظام لكنه لن يقوم بإرسال بريد إلكتروني فعلي.
            </AlertDescription>
        </Alert>
        <div className="flex justify-end">
            <Button onClick={handleSend} disabled={!email}>
                <Send className="ml-2 h-4 w-4" />
                إرسال وتوثيق
            </Button>
        </div>
    </div>
  );
};
