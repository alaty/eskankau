"use client";

import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppDataContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PlusSquare, Send, CheckCircle, ListChecks } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const addUnitSchema = z.object({
  buildingId: z.string().min(1, "الرجاء اختيار المبنى."),
  unitType: z.enum(['apartments', 'suites'], { required_error: "الرجاء اختيار نوع الوحدة." }),
  floor: z.coerce.number().min(1, "الرجاء اختيار الدور."),
  unitNumber: z.coerce.number().min(1, "رقم الغرفة مطلوب."),
  baseRent: z.coerce.number().min(0, "قيمة الإيجار مطلوبة."),
});

type AddUnitFormData = z.infer<typeof addUnitSchema>;

const defaultValues: Partial<AddUnitFormData> = {
    buildingId: undefined,
    unitType: undefined,
    floor: undefined,
    unitNumber: undefined,
    baseRent: undefined,
};

export function AddUnitForm() {
  const { buildings, loading, addUnit } = useAppContext();
  const { toast } = useToast();
  const router = useRouter();

  const [requestSent, setRequestSent] = useState(false);

  const form = useForm<AddUnitFormData>({
    resolver: zodResolver(addUnitSchema),
    defaultValues,
  });

  const onSubmit = (data: AddUnitFormData) => {
    addUnit(parseInt(data.buildingId), data.unitType, data.floor, {
        unitNumber: data.unitNumber,
        baseRent: data.baseRent,
    });
    
    toast({
        title: 'تمت إضافة الوحدة بنجاح',
        description: `تمت إضافة الوحدة رقم ${data.unitNumber} في مبنى ${data.buildingId} بنجاح.`,
        className: 'bg-green-100 border-green-400 text-green-800'
    });
    
    setRequestSent(true);
    form.reset(defaultValues);
  };

  if (loading) {
    return <p>Loading...</p>;
  }
  
  if (requestSent) {
      return (
        <Card className="w-full max-w-lg text-center shadow-2xl animate-in fade-in-50 mx-auto mt-8 border-t-4 border-green-500">
            <CardHeader className="bg-green-50/50">
                <div className="mx-auto bg-green-100 text-green-700 rounded-full h-16 w-16 flex items-center justify-center">
                    <CheckCircle className="h-10 w-10" />
                </div>
                <CardTitle className="mt-4 text-green-800">تمت إضافة الوحدة بنجاح</CardTitle>
                <CardDescription>
                    يمكنك الآن الانتقال إلى صفحة إدارة الوحدات لعرض الوحدة الجديدة وتعديل بياناتها.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pt-6">
                <Button onClick={() => router.push('/units')}>
                    <ListChecks className="ml-2 h-4 w-4" />
                    الانتقال إلى إدارة الوحدات
                </Button>
                 <Button variant="outline" onClick={() => setRequestSent(false)}>
                    <PlusSquare className="ml-2 h-4 w-4" />
                    إضافة وحدة أخرى
                </Button>
            </CardContent>
        </Card>
      )
  }

  return (
      <Card className="mt-6 shadow-xl border-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader className="text-right bg-primary/10 rounded-t-lg">
              <CardTitle>نموذج إضافة وحدة</CardTitle>
              <CardDescription>
                املأ البيانات التالية لإضافة وحدة جديدة.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-right p-6">
              <FormField
                control={form.control}
                name="buildingId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المبنى</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر مبنى..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {buildings.map(b => (
                          <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="unitType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع الوحدة</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                         <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر النوع..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="apartments">شقة</SelectItem>
                          <SelectItem value="suites">جناح</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="floor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الدور</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value?.toString()} dir="rtl">
                         <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الدور..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="4">4</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="unitNumber"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>رقم الغرفة/الجناح الجديد</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="مثال: 101" {...field} value={field.value ?? ''} className="text-right" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                 />
                 <FormField
                    control={form.control}
                    name="baseRent"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>قيمة الإيجار الأساسي</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="مثال: 1700" {...field} value={field.value ?? ''} className="text-right" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                 />
              </div>

            </CardContent>
            <CardFooter className="bg-muted/30 px-6 py-4 border-t rounded-b-lg">
              <Button type="submit" className="w-full" disabled={!form.formState.isValid}>
                <Send className="ml-2 h-4 w-4" />
                إضافة الوحدة
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
  );
}
