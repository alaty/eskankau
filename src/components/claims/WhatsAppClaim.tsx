
"use client";

import React, { useState } from 'react';
import { type Unit } from '@/lib/types';
import { useAppContext } from '@/contexts/AppDataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/utils';
import { Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface WhatsAppClaimProps {
  unit: Unit;
  remainingAmount: number;
  dueDate: Date | null;
  onActionComplete: () => void;
}

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M19.223 15.259c-.455-.228-2.674-1.319-3.088-1.468-.413-.148-.713-.227-.055.514.51.588.628.753.628 1.294 0 .54-.278 1.004-.556 1.282-.278.278-.695.392-1.056.333-.36-.06-1.527-.56-2.908-1.776-1.071-.94-1.789-2.12-2.066-2.783-.278-.665-.056-1.026.222-1.28.278-.252.556-.666.833-.944.278-.278.39-.5.5-.833.11-.334.055-.612-.11-.834-.167-.222-1.056-2.5-1.445-3.418-.39-.918-.78-1.03-1.11-1.03-.334 0-1.057.11-1.612.556-.556.445-1.223 1.223-1.223 2.946s1.25 3.42 1.445 3.668c.195.25 2.585 4.39 6.28 5.86.89.36 1.58.556 2.11.723.834.25 1.557.22 2.112-.054.61-.28 1.833-.973 2.11-1.835.28-.86.28-1.58.196-1.834-.084-.25-.334-.39-.723-.61zM12 2C6.477 2 2 6.477 2 12c0 1.742.446 3.485 1.357 5L2.5 21.5l4.643-.802C8.515 21.554 10.258 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
  </svg>
);


export const WhatsAppClaim = ({ unit, remainingAmount, dueDate, onActionComplete }: WhatsAppClaimProps) => {
  const { logClaimAction } = useAppContext();
  const { toast } = useToast();
  
  const claimText = `عزيزي الطالب/ـة
مبنى رقم (${unit.buildingId}) غرفة رقم(${unit.unitNumber})
المبلغ: (${formatCurrency(remainingAmount)}) عن الفصل الدراسي الأول لعام 1447هـ.

السلام عليكم ورحمة الله وبركاته،
نود أن نشعركم بضرورة تسديد المستحقات المالية التي حل موعد سدادها بتاريخ (${dueDate ? format(dueDate, 'yyyy-MM-dd') : 'غير محدد'}).
وفي حال عدم السداد، نرجو منكم التواصل مع الإدارة المالية للمجمع السكني.

ادارة المتابعة المالية`;

  const [phoneNumber, setPhoneNumber] = useState('');

  const handleSend = () => {
    if (!phoneNumber.match(/^(5\d{8})$/)) {
        toast({
            variant: "destructive",
            title: "رقم الجوال غير صحيح",
            description: "الرجاء إدخال رقم جوال سعودي صحيح يبدأ بـ 5 ويتكون من 9 أرقام.",
        });
        return;
    }

    const internationalNumber = `966${phoneNumber}`;
    const encodedMessage = encodeURIComponent(claimText);
    const whatsappUrl = `https://wa.me/${internationalNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');

    logClaimAction(unit.buildingId, unit.id, "مطالبة عبر واتساب");
    toast({
        title: "تم توثيق الإجراء",
        description: `تم تسجيل إجراء المطالبة عبر واتساب للرقم ${phoneNumber}.`,
        className: "bg-green-100 border-green-400 text-green-800",
    });
    onActionComplete();
  };

  return (
    <div className="space-y-4 animate-in fade-in-50">
      <h3 className="font-semibold flex items-center gap-2"><WhatsAppIcon className="h-5 w-5" /> إرسال مطالبة عبر واتساب</h3>
      <div className="space-y-2">
          <Label htmlFor="wa-phone">رقم جوال المستلم (بدون 0 أو 966+)</Label>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-muted rounded-md text-sm">+966</span>
            <Input 
                id="wa-phone"
                type="tel"
                placeholder="5xxxxxxxx"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                dir="ltr"
            />
          </div>
      </div>
       <div className="flex justify-end">
            <Button onClick={handleSend} disabled={!phoneNumber}>
                <Send className="ml-2 h-4 w-4" />
                فتح واتساب وتوثيق
            </Button>
        </div>
    </div>
  );
};
