"use client";

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { type Unit, type PaymentPlan } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { X, ChevronsRight, PlusCircle, Trash2 } from 'lucide-react';
import { Checkbox } from '../ui/checkbox';
import { formatCurrency } from '@/lib/utils';
import { DatePicker } from '../ui/datepicker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { cn } from '@/lib/utils';


const planTypeSchema = z.enum(['deferred', 'installment', 'exempt', 'stipend', 'scholarship']);

const formSchema = z.object({
  type: planTypeSchema,
  notes: z.string().optional(),
  deferredUntil: z.string().optional(),
  installments: z.array(z.object({
    amount: z.coerce.number().min(0, "المبلغ يجب أن يكون موجبًا"),
    dueDate: z.string().min(1, "التاريخ مطلوب"),
    isPaid: z.boolean(),
  })).optional(),
  stipendDeductions: z.array(z.object({
    amount: z.coerce.number().min(0, "المبلغ يجب أن يكون موجبًا"),
    dueDate: z.string().min(1, "التاريخ مطلوب"),
    isPaid: z.boolean(),
  })).optional(),
}).superRefine((data, ctx) => {
    if (data.type === 'deferred' && !data.deferredUntil) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['deferredUntil'],
            message: 'تاريخ الاستحقاق مطلوب لخطة التأجيل',
        });
    }
    if (data.type === 'installment' && (!data.installments || data.installments.length === 0)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['installments'],
            message: 'يجب تحديد قسط واحد على الأقل',
        });
    }
     if (data.type === 'stipend' && (!data.stipendDeductions || data.stipendDeductions.length === 0)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['stipendDeductions'],
            message: 'يجب تحديد خصم واحد على الأقل',
        });
    }
});

export type PaymentPlanFormData = z.infer<typeof formSchema>;

const typeLabels: Record<PaymentPlan['type'], string> = {
  deferred: "تأجيل السداد",
  installment: "تقسيط المبلغ",
  exempt: "إعفاء من السداد",
  stipend: "خصم من المكافأة",
  scholarship: "ابتعاث",
};

interface PaymentPlanFormProps {
  unit: Unit;
  onSubmit: (data: PaymentPlanFormData) => void;
  onCancel: () => void;
}

export const PaymentPlanForm = ({ unit, onSubmit, onCancel }: PaymentPlanFormProps) => {
    const defaultValues: Partial<PaymentPlanFormData> = {
        type: unit.paymentPlan?.type || 'deferred',
        notes: unit.paymentPlan?.notes || '',
        deferredUntil: unit.paymentPlan?.deferredUntil || '',
        installments: unit.paymentPlan?.installments && unit.paymentPlan.installments.length > 0
            ? unit.paymentPlan.installments
            : [],
        stipendDeductions: unit.paymentPlan?.stipendDeductions && unit.paymentPlan.stipendDeductions.length > 0
            ? unit.paymentPlan.stipendDeductions
            : [],
    };

    const form = useForm<PaymentPlanFormData>({
        resolver: zodResolver(formSchema),
        defaultValues,
        mode: "onChange"
    });

    const { fields: installmentFields, append: appendInstallment, remove: removeInstallment, replace: replaceInstallments } = useFieldArray({
        control: form.control,
        name: "installments",
    });

    const { fields: stipendFields, append: appendStipend, remove: removeStipend, replace: replaceStipends } = useFieldArray({
        control: form.control,
        name: "stipendDeductions",
    });


    const watchType = form.watch('type');
    const [numInstallments, setNumInstallments] = useState(installmentFields.length > 0 ? installmentFields.length.toString() : '2');
    const [numStipendMonths, setNumStipendMonths] = useState(stipendFields.length > 0 ? stipendFields.length.toString() : '2');


    useEffect(() => {
        if (watchType === 'installment' && installmentFields.length === 0) {
            replaceInstallments([{ amount: unit.baseRent, dueDate: '', isPaid: false }]);
            setNumInstallments('1');
        }
         if (watchType === 'stipend' && stipendFields.length === 0) {
            replaceStipends([{ amount: unit.baseRent, dueDate: '', isPaid: false }]);
            setNumStipendMonths('1');
        }
    }, [watchType, installmentFields.length, stipendFields.length, replaceInstallments, replaceStipends, unit.baseRent]);


    const generateInstallments = () => {
        const count = parseInt(numInstallments, 10);
        if (isNaN(count) || count <= 0 || count > 10) return;

        const totalRent = unit.baseRent;
        const amountPerInstallment = Math.floor(totalRent / count);
        const remainder = totalRent % count;

        const currentInstallments = form.getValues('installments') || [];
        
        const newInstallments = Array.from({ length: count }, (_, index) => {
            const existing = currentInstallments[index];
            return {
                amount: amountPerInstallment + (index === 0 ? remainder : 0),
                dueDate: existing?.dueDate || '',
                isPaid: existing?.isPaid || false,
            };
        });
        
        replaceInstallments(newInstallments);
    };

     const generateStipendDeductions = () => {
        const count = parseInt(numStipendMonths, 10);
        if (isNaN(count) || count <= 0 || count > 10) return;

        const totalRent = unit.baseRent;
        const amountPerMonth = Math.floor(totalRent / count);
        const remainder = totalRent % count;
        
        const currentDeductions = form.getValues('stipendDeductions') || [];

        const newDeductions = Array.from({ length: count }, (_, index) => {
            const existing = currentDeductions[index];
            return {
                amount: amountPerMonth + (index === 0 ? remainder : 0),
                dueDate: existing?.dueDate || '',
                isPaid: existing?.isPaid || false,
            };
        });

        replaceStipends(newDeductions);
    };
    
    const renderPlanSpecificFields = () => {
        switch (watchType) {
            case 'deferred':
                return (
                     <FormField
                        control={form.control}
                        name="deferredUntil"
                        render={({ field }) => (
                            <FormItem className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <FormLabel>تاريخ الاستحقاق الجديد</FormLabel>
                            <FormControl>
                                <DatePicker 
                                    date={field.value ? new Date(field.value) : undefined}
                                    setDate={(date) => field.onChange(date?.toISOString())}
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                );
            case 'installment':
                return (
                    <Card>
                        <CardHeader className="p-3">
                             <CardTitle className="text-sm font-semibold">جدول الأقساط</CardTitle>
                             <CardDescription className="text-xs">إجمالي المطلوب: {formatCurrency(unit.baseRent)}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-3 space-y-4">
                            <div className="flex items-end gap-2 p-2 border rounded-md bg-white">
                                <div className="flex-grow">
                                    <Label htmlFor="num-installments" className="text-xs">عدد الأقساط</Label>
                                    <Input 
                                        id="num-installments"
                                        type="number"
                                        value={numInstallments}
                                        onChange={(e) => setNumInstallments(e.target.value)}
                                        min="1"
                                        max="10"
                                        className="h-9"
                                    />
                                </div>
                                <Button type="button" onClick={generateInstallments} className="h-9">
                                    <ChevronsRight className="ml-1 h-4 w-4" />
                                    توليد
                                </Button>
                            </div>
                            
                            {installmentFields.map((item, index) => (
                                <div key={item.id} className="grid grid-cols-12 gap-2 items-end p-2 border rounded-md bg-white shadow-sm">
                                    <FormField
                                        control={form.control}
                                        name={`installments.${index}.amount`}
                                        render={({ field }) => (
                                            <FormItem className="col-span-4">
                                                <FormLabel className="text-xs">المبلغ</FormLabel>
                                                <FormControl><Input type="number" {...field} className="h-8" /></FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`installments.${index}.dueDate`}
                                        render={({ field }) => (
                                            <FormItem className="col-span-5">
                                                <FormLabel className="text-xs">الاستحقاق</FormLabel>
                                                <FormControl>
                                                    <DatePicker 
                                                        date={field.value ? new Date(field.value) : undefined}
                                                        setDate={(date) => field.onChange(date?.toISOString())}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <Controller
                                        control={form.control}
                                        name={`installments.${index}.isPaid`}
                                        render={({ field }) => (
                                            <FormItem className="col-span-2 flex flex-col items-center justify-end pb-1">
                                                 <FormControl>
                                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                                 </FormControl>
                                                <FormLabel className="text-xs mt-1">مدفوع؟</FormLabel>
                                            </FormItem>
                                        )}
                                    />
                                    <div className="col-span-1">
                                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeInstallment(index)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                );
            case 'stipend':
                 return (
                     <Card>
                        <CardHeader className="p-3">
                             <CardTitle className="text-sm font-semibold">جدول الخصم من المكافأة</CardTitle>
                             <CardDescription className="text-xs">إجمالي المطلوب: {formatCurrency(unit.baseRent)}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-3 space-y-4">
                            <div className="flex items-end gap-2 p-2 border rounded-md bg-white">
                                <div className="flex-grow">
                                    <Label htmlFor="num-stipend-months" className="text-xs">عدد أشهر الخصم</Label>
                                    <Input 
                                        id="num-stipend-months"
                                        type="number"
                                        value={numStipendMonths}
                                        onChange={(e) => setNumStipendMonths(e.target.value)}
                                        min="1"
                                        max="10"
                                        className="h-9"
                                    />
                                </div>
                                <Button type="button" onClick={generateStipendDeductions} className="h-9">
                                    <ChevronsRight className="ml-1 h-4 w-4" />
                                    توليد
                                </Button>
                            </div>
                            
                            {stipendFields.map((item, index) => (
                                <div key={item.id} className="grid grid-cols-12 gap-2 items-end p-2 border rounded-md bg-white shadow-sm">
                                    <FormField
                                        control={form.control}
                                        name={`stipendDeductions.${index}.amount`}
                                        render={({ field }) => (
                                            <FormItem className="col-span-4">
                                                <FormLabel className="text-xs">المبلغ</FormLabel>
                                                <FormControl><Input type="number" {...field} className="h-8" /></FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`stipendDeductions.${index}.dueDate`}
                                        render={({ field }) => (
                                            <FormItem className="col-span-5">
                                                <FormLabel className="text-xs">تاريخ الخصم</FormLabel>
                                                <FormControl>
                                                   <DatePicker 
                                                        date={field.value ? new Date(field.value) : undefined}
                                                        setDate={(date) => field.onChange(date?.toISOString())}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <Controller
                                        control={form.control}
                                        name={`stipendDeductions.${index}.isPaid`}
                                        render={({ field }) => (
                                            <FormItem className="col-span-2 flex flex-col items-center justify-end pb-1">
                                                 <FormControl>
                                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                                 </FormControl>
                                                <FormLabel className="text-xs mt-1">مدفوع؟</FormLabel>
                                            </FormItem>
                                        )}
                                    />
                                    <div className="col-span-1">
                                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeStipend(index)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={() => appendStipend({ amount: 0, dueDate: '', isPaid: false })}>
                                <PlusCircle className="ml-2 h-4 w-4" />
                                إضافة خصم
                            </Button>
                        </CardContent>
                    </Card>
                );
            case 'exempt':
            case 'scholarship':
                return <p className="text-sm text-muted-foreground p-4 bg-blue-50 border border-blue-200 rounded-md">لا توجد حقول إضافية لهذا النوع. يرجى توثيق التفاصيل في الملاحظات.</p>;
            default:
                return null;
        }
    };


    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>نوع الخطة المالية</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                            <FormControl>
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="اختر نوع الخطة..." />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {Object.entries(typeLabels).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                
                <div className="space-y-4">
                    {renderPlanSpecificFields()}
                </div>

                    <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>ملاحظات</FormLabel>
                        <FormControl>
                            <Textarea placeholder="أضف أي تفاصيل... ستظهر هذه الملاحظات في بطاقة عرض الخطة بصفحة خطط السداد المالية." {...field} className="bg-white" />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <Separator />
                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="ghost" onClick={onCancel}>إلغاء</Button>
                    <Button type="submit">حفظ الخطة</Button>
                </div>
            </form>
        </Form>
    );
};
