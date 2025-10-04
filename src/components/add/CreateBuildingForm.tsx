"use client";

import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppContext } from '@/contexts/AppDataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Building, BedDouble, Bed, Send, CheckCircle, Building2, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Separator } from '../ui/separator';

const floorSchema = z.object({
  apartments: z.coerce.number().min(0, "يجب أن يكون العدد 0 أو أكثر."),
  suites: z.coerce.number().min(0, "يجب أن يكون العدد 0 أو أكثر."),
});

const createBuildingSchema = z.object({
  name: z.string().min(3, "اسم المبنى مطلوب."),
  floors: z.array(floorSchema).min(1, "يجب أن يحتوي المبنى على دور واحد على الأقل."),
  apartmentRent: z.coerce.number().min(0, "الإيجار يجب أن يكون قيمة موجبة."),
  suiteRent: z.coerce.number().min(0, "الإيجار يجب أن يكون قيمة موجبة."),
});

type CreateBuildingFormData = z.infer<typeof createBuildingSchema>;

const defaultValues: CreateBuildingFormData = {
    name: '',
    floors: [
        { apartments: 16, suites: 4 },
        { apartments: 36, suites: 2 },
        { apartments: 36, suites: 2 },
        { apartments: 36, suites: 2 },
    ],
    apartmentRent: 1700,
    suiteRent: 3000,
};

export function CreateBuildingForm() {
  const { addBuilding } = useAppContext();
  const { toast } = useToast();
  const router = useRouter();
  const [requestSent, setRequestSent] = useState(false);

  const form = useForm<CreateBuildingFormData>({
    resolver: zodResolver(createBuildingSchema),
    defaultValues: defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "floors"
  });

  const onSubmit = (data: CreateBuildingFormData) => {
    const newBuilding: any = {
      name: data.name,
      apartments: {
          total: data.floors.reduce((sum, floor) => sum + floor.apartments, 0),
          rented: 0,
          rent: data.apartmentRent,
          floorConfig: data.floors.map((f, i) => ({ floor: i + 1, count: f.apartments })),
      },
      suites: {
          total: data.floors.reduce((sum, floor) => sum + floor.suites, 0),
          rented: 0,
          rent: data.suiteRent,
          floorConfig: data.floors.map((f, i) => ({ floor: i + 1, count: f.suites })),
      },
    };
    
    addBuilding(newBuilding);
    
    toast({
      title: "تم إنشاء المبنى بنجاح",
      description: `تم إنشاء ${data.name} بالهيكل المخصص.`,
      className: "bg-green-100 border-green-400 text-green-800",
    });

    setRequestSent(true);
    form.reset(defaultValues);
  };
  
  if (requestSent) {
      return (
        <Card className="w-full max-w-lg text-center shadow-2xl animate-in fade-in-50 mx-auto mt-8 border-t-4 border-green-500">
            <CardHeader className="bg-green-50/50">
                <div className="mx-auto bg-green-100 text-green-700 rounded-full h-16 w-16 flex items-center justify-center">
                    <CheckCircle className="h-10 w-10" />
                </div>
                <CardTitle className="mt-4 text-green-800">تم إنشاء المبنى بنجاح</CardTitle>
                <CardDescription>
                    يمكنك الآن إدارة وحدات المبنى الجديد من صفحة إدارة الوحدات.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pt-6">
                <Button onClick={() => router.push('/units')}>
                    <Building2 className="ml-2 h-4 w-4" />
                    الانتقال إلى إدارة الوحدات
                </Button>
                 <Button variant="outline" onClick={() => setRequestSent(false)}>
                    <Building className="ml-2 h-4 w-4" />
                    إنشاء مبنى آخر
                </Button>
            </CardContent>
        </Card>
      )
  }

  return (
      <Card className="mt-6 shadow-xl border-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader className="text-right bg-accent/10 rounded-t-lg">
              <CardTitle>تفاصيل المبنى الجديد</CardTitle>
              <CardDescription>
                أدخل اسم المبنى وهيكل الوحدات لكل دور، بالإضافة إلى قيمة الإيجار الافتراضية.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-right p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem className="md:col-span-1">
                                <FormLabel>اسم المبنى</FormLabel>
                                <FormControl><Input placeholder="مثال: مبنى رقم 10" {...field} value={field.value ?? ''} className="text-right" /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                     />
                    <FormField
                        control={form.control}
                        name="apartmentRent"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>الإيجار الافتراضي للشقق</FormLabel>
                                <FormControl><Input type="number" {...field} value={field.value ?? ''} className="text-right" /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                     />
                     <FormField
                        control={form.control}
                        name="suiteRent"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>الإيجار الافتراضي للأجنحة</FormLabel>
                                <FormControl><Input type="number" {...field} value={field.value ?? ''} className="text-right" /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                     />
                </div>
                
                <Separator />
                
                <div>
                  <div className="flex justify-between items-center mb-4">
                     <h3 className="text-lg font-semibold">توزيع الوحدات على الأدوار</h3>
                     <Button type="button" variant="outline" size="sm" onClick={() => append({ apartments: 0, suites: 0 })}>
                        <PlusCircle className="ml-2 h-4 w-4" />
                        إضافة دور
                    </Button>
                  </div>
                   <div className="space-y-4">
                     {fields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-12 gap-4 items-center p-3 border rounded-lg bg-muted/30">
                            <div className="col-span-12 md:col-span-2 flex items-center gap-2">
                                <h4 className="font-bold">الدور {index + 1}</h4>
                                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(index)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                             </div>
                             <FormField
                                control={form.control}
                                name={`floors.${index}.apartments`}
                                render={({ field }) => (
                                    <FormItem className="col-span-6 md:col-span-5">
                                        <FormLabel className="flex items-center justify-end gap-2 text-sm"><BedDouble className="ml-2 h-4 w-4" /> عدد الشقق</FormLabel>
                                        <FormControl><Input type="number" {...field} className="bg-white text-right" value={field.value ?? ''} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                             />
                             <FormField
                                control={form.control}
                                name={`floors.${index}.suites`}
                                render={({ field }) => (
                                    <FormItem className="col-span-6 md:col-span-5">
                                        <FormLabel className="flex items-center justify-end gap-2 text-sm"><Bed className="ml-2 h-4 w-4" /> عدد الأجنحة</FormLabel>
                                        <FormControl><Input type="number" {...field} className="bg-white text-right" value={field.value ?? ''} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                             />
                        </div>
                    ))}
                    {form.formState.errors.floors?.root && (
                        <p className="text-sm font-medium text-destructive">{form.formState.errors.floors.root.message}</p>
                    )}
                   </div>
                </div>

            </CardContent>
            <CardFooter className="bg-muted/30 px-6 py-4 border-t rounded-b-lg">
              <Button type="submit" className="w-full" size="lg" disabled={!form.formState.isValid}>
                <Send className="ml-2 h-4 w-4" />
                إنشاء المبنى
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
  );
}
