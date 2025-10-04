"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type Unit } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Info } from "lucide-react";


const paymentStatusEnum = z.enum(['paid', 'deferred']);
const scopeEnum = z.enum(['all_rented', 'rented_apartments', 'rented_suites']);

const formSchema = z.object({
  paymentStatus: paymentStatusEnum,
  scope: scopeEnum,
});

type FormData = z.infer<typeof formSchema>;

interface BulkPaymentStatusEditorProps {
  onUpdate: (scope: 'all_rented' | 'rented_apartments' | 'rented_suites', status: 'paid' | 'deferred') => void;
}

const statusLabels: Record<z.infer<typeof paymentStatusEnum>, string> = {
  paid: 'تم السداد',
  deferred: 'مؤجل',
};

const scopeLabels: Record<z.infer<typeof scopeEnum>, string> = {
  all_rented: 'جميع الوحدات المؤجرة',
  rented_apartments: 'الشقق المؤجرة فقط',
  rented_suites: 'الأجنحة المؤجرة فقط',
};


export function BulkPaymentStatusEditor({ onUpdate }: BulkPaymentStatusEditorProps) {
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paymentStatus: 'paid',
      scope: 'all_rented',
    },
  });

  const onSubmit = (data: FormData) => {
    onUpdate(data.scope, data.paymentStatus);
    toast({
      title: "تم التحديث بنجاح",
      description: `تم تغيير حالة السداد لـ "${scopeLabels[data.scope]}" إلى "${statusLabels[data.paymentStatus]}".`,
      className: "bg-green-100 border-green-400 text-green-800",
    });
  };

  return (
    <Card className="shadow-md border-primary/20 rounded-t-none border-t-0">
      <CardHeader className="pt-0">
        <CardDescription>
            استخدم النموذج التالي لتغيير حالة السداد لمجموعة من الوحدات المؤجرة دفعة واحدة.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <FormField
              control={form.control}
              name="paymentStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>حالة السداد الجديدة</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                          <SelectTrigger>
                              <SelectValue placeholder="اختر الحالة..." />
                          </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                          <SelectItem value="paid">تم السداد</SelectItem>
                          <SelectItem value="deferred">مؤجل</SelectItem>
                      </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="scope"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نطاق التطبيق</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                          <SelectTrigger>
                              <SelectValue placeholder="اختر النطاق..." />
                          </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                          <SelectItem value="all_rented">جميع الوحدات المؤجرة</SelectItem>
                          <SelectItem value="rented_apartments">الشقق المؤجرة فقط</SelectItem>
                          <SelectItem value="rented_suites">الأجنحة المؤجرة فقط</SelectItem>
                      </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full md:w-auto">
              تطبيق التغييرات
            </Button>
          </form>
        </Form>
        <Alert className="mt-4 bg-blue-50 border-blue-200 text-blue-800">
            <Info className="h-4 w-4 text-blue-800" />
            <AlertTitle className="font-bold">ملاحظة هامة</AlertTitle>
            <AlertDescription>
                هذه الأداة تؤثر فقط على الوحدات التي حالتها "مؤجرة". لن يتم تغيير حالة سداد الوحدات المتاحة أو التي تحت الصيانة.
            </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
