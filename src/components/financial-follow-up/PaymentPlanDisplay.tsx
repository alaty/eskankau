
"use client";

import React, { useState } from 'react';
import { type Unit, type PaymentPlan, type PaymentInstallment } from '@/lib/types';
import { useAppContext } from '@/contexts/AppDataContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { Edit, Trash2, Calendar, FileText, Repeat, GraduationCap, PlusCircle, CheckCircle, XCircle, Printer, AlertTriangle } from 'lucide-react';
import { PaymentPlanDialog } from './PaymentPlanDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


const typeLabels: Record<PaymentPlan['type'], string> = {
  deferred: "تأجيل السداد",
  installment: "تقسيط المبلغ",
  exempt: "إعفاء من السداد",
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

const InstallmentTable = ({ title, installments, totalRent }: { title: string, installments: PaymentInstallment[], totalRent: number }) => {
    const totalPaid = installments.reduce((sum, i) => i.isPaid ? sum + i.amount : sum, 0);
    const remaining = totalRent - totalPaid;
    const today = new Date();
    today.setHours(0,0,0,0);

    return (
        <div className="overflow-x-auto border rounded-lg">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="text-center">المبلغ</TableHead>
                        <TableHead className="text-center">تاريخ الاستحقاق</TableHead>
                        <TableHead className="text-center">حالة الاستحقاق</TableHead>
                        <TableHead className="text-center">الحالة</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {installments.map((inst, index) => {
                        const dueDate = new Date(inst.dueDate);
                        const isOverdue = dueDate < today && !inst.isPaid;
                        return (
                            <TableRow key={index}>
                                <TableCell className="text-center">{formatCurrency(inst.amount)}</TableCell>
                                <TableCell className="text-center">{dueDate.toLocaleDateString('ar-SA')}</TableCell>
                                 <TableCell className="text-center">
                                    {isOverdue 
                                        ? <Badge variant="destructive">مستحق</Badge>
                                        : <Badge variant="secondary" className="bg-green-100 text-green-800">غير مستحق</Badge>
                                    }
                                </TableCell>
                                <TableCell className="text-center">
                                    {inst.isPaid 
                                        ? <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="ml-1 h-3 w-3" />مدفوع</Badge>
                                        : <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><XCircle className="ml-1 h-3 w-3" />غير مدفوع</Badge>
                                    }
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
            <div className="p-2 border-t bg-muted text-sm grid grid-cols-3 gap-2 text-center">
                <p><strong>الإجمالي:</strong> {formatCurrency(totalRent)}</p>
                <p className="text-green-700"><strong>المدفوع:</strong> {formatCurrency(totalPaid)}</p>
                <p className="text-red-700"><strong>المتبقي:</strong> {formatCurrency(remaining)}</p>
            </div>
        </div>
    );
};


export const PaymentPlanDisplay = ({ unit }: { unit: Unit }) => {
    const { updatePaymentPlan } = useAppContext();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleRemovePlan = () => {
        updatePaymentPlan(unit.buildingId, unit.id, null);
    };

    const handlePrint = () => {
        window.print();
    };

    const plan = unit.paymentPlan;

    if (!plan) {
        return (
            <Card className="flex items-center justify-center h-80 animate-in fade-in-50 no-print">
                <div className="text-center text-muted-foreground p-6">
                    <h3 className="text-lg font-semibold mb-2">لا توجد خطة مالية</h3>
                    <p className="mb-4">هذه الوحدة ليس لديها خطة سداد خاصة. يمكنك تعيين واحدة الآن أو إزالة المديونية إذا كانت خاطئة.</p>
                    <div className="flex justify-center gap-2">
                        <Button onClick={() => setIsDialogOpen(true)}>
                            <PlusCircle className="ml-2 h-4 w-4" />
                            تحديد خطة مالية
                        </Button>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                               <Button variant="destructive">
                                    <Trash2 className="ml-2 h-4 w-4" />
                                    ازالة المديونية
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center gap-2">
                                        <AlertTriangle className="h-6 w-6 text-destructive"/>
                                        تأكيد إزالة المديونية
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="pt-2">
                                        هل أنت متأكد من رغبتك في إزالة هذه المديونية؟ <br />
                                        هذا الإجراء سيقوم بالآتي:
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="text-sm text-muted-foreground">
                                    <ul className="list-disc pr-6 my-2 space-y-1">
                                        <li>ستعود حالة الغرفة إلى "مؤجرة" وحالة السداد إلى "تم السداد".</li>
                                        <li>سيتم إلغاء حالة التأجيل المسجلة على الوحدة.</li>
                                    </ul>
                                     <strong className="block mt-3">هذا الإجراء لا يمكن التراجع عنه.</strong>
                                </div>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleRemovePlan} className="bg-destructive hover:bg-destructive/90">تأكيد الإزالة</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
                 <PaymentPlanDialog 
                    unit={unit}
                    isOpen={isDialogOpen}
                    onClose={() => setIsDialogOpen(false)}
                />
            </Card>
        );
    }

    const PlanIcon = typeIcons[plan.type];
    
    return (
        <>
            <Card className="animate-in fade-in-50" id="payment-plan-card">
                <CardHeader>
                    <CardTitle className="flex items-start justify-between">
                       <div className="flex items-center gap-2">
                         <span className="bg-primary text-primary-foreground p-1.5 rounded-md"><PlanIcon className="h-5 w-5"/></span>
                         <div>
                            الخطة المالية للغرفة {unit.unitNumber}
                            <p className="text-sm font-normal text-muted-foreground mt-1">مبنى {unit.buildingId} / {unit.unitType === 'apartment' ? "شقة" : "جناح"}</p>
                         </div>
                       </div>
                       <Button onClick={handlePrint} variant="ghost" size="icon" className="no-print">
                            <Printer className="h-5 w-5" />
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    
                    <div className="font-semibold text-md">
                        <strong>الخطة المختارة:</strong> {typeLabels[plan.type]}
                    </div>
                    
                    {plan.type === 'deferred' && plan.deferredUntil && (
                        <div className="p-4 bg-muted rounded-md">
                            <p>تم تأجيل استحقاق المبلغ حتى تاريخ: <strong>{new Date(plan.deferredUntil).toLocaleDateString('ar-SA')}</strong></p>
                        </div>
                    )}

                    {plan.type === 'installment' && plan.installments && (
                         <div className="space-y-2">
                             <p className="text-sm text-muted-foreground mb-2">مواعيد الاستحقاق:</p>
                            <InstallmentTable title="جدول الأقساط" installments={plan.installments} totalRent={unit.actualRent ?? unit.baseRent} />
                         </div>
                    )}
                     
                    {plan.type === 'stipend' && plan.stipendDeductions && (
                         <div className="space-y-2">
                             <p className="text-sm text-muted-foreground mb-2">مواعيد الاستحقاق:</p>
                            <InstallmentTable title="جدول الخصومات" installments={plan.stipendDeductions} totalRent={unit.actualRent ?? unit.baseRent} />
                         </div>
                    )}
                    
                    {(plan.type === 'exempt' || plan.type === 'scholarship') && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                            <p className="text-sm text-blue-800">تم تطبيق هذه الخطة على الوحدة. التفاصيل مدونة في الملاحظات.</p>
                        </div>
                    )}


                    {plan.notes && (
                        <div className="space-y-2">
                            <h4 className="font-semibold text-md">ملاحظات</h4>
                            <p className="text-sm text-muted-foreground p-3 border rounded-md whitespace-pre-wrap">{plan.notes}</p>
                        </div>
                    )}

                </CardContent>
                <CardFooter className="flex justify-end gap-2 border-t pt-4 no-print">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="destructive">
                                <Trash2 className="ml-2 h-4 w-4" />
                                ازالة المديونية
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-6 w-6 text-destructive"/>
                                    تأكيد حذف الخطة المالية
                                </AlertDialogTitle>
                                <AlertDialogDescription className="pt-2">
                                    هل أنت متأكد من رغبتك في حذف هذه الخطة المالية؟ <br />
                                    هذا الإجراء سيقوم بالآتي:
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="text-sm text-muted-foreground">
                                <ul className="list-disc pr-6 my-2 space-y-1">
                                    <li>سيتم حذف الخطة بشكل نهائي من النظام.</li>
                                    <li>ستعود حالة الغرفة إلى "مؤجرة" وحالة السداد إلى "تم السداد".</li>
                                    <li>لن تظهر هذه الخطة في أرشيف الخطط المكتملة.</li>
                                </ul>
                                 <strong className="block mt-3">هذا الإجراء لا يمكن التراجع عنه.</strong>
                            </div>
                            <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction onClick={handleRemovePlan} className="bg-destructive hover:bg-destructive/90">تأكيد الحذف</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    <Button onClick={() => setIsDialogOpen(true)}>
                        <Edit className="ml-2 h-4 w-4" />
                        تعديل الخطة
                    </Button>
                </CardFooter>
            </Card>

            <PaymentPlanDialog 
                unit={unit}
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
            />
        </>
    );
};

    