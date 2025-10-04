
"use client";

import React, { useState, useMemo } from 'react';
import { useAppContext } from '@/contexts/AppDataContext';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Hammer, Building2, Send, CheckCircle, DoorOpen, ListChecks } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { type Unit } from '@/lib/types';
import { Label } from '@/components/ui/label';


const maintenanceRequestSchema = z.object({
  unitId: z.string().min(1, "الرجاء اختيار الوحدة."),
  maintenanceType: z.enum(['maintenance', 'furniture', 'electrical', 'painting', 'none']),
});

type MaintenanceRequestFormData = z.infer<typeof maintenanceRequestSchema>;

export function MaintenanceRequestClient() {
  const { buildings, loading, updateUnitStatus } = useAppContext();
  const { toast } = useToast();
  const router = useRouter();

  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [requestSent, setRequestSent] = useState(false);

  const form = useForm<MaintenanceRequestFormData>({
    resolver: zodResolver(maintenanceRequestSchema),
    defaultValues: {
      unitId: '',
      maintenanceType: 'maintenance',
    },
  });

  const availableUnits = useMemo(() => {
    if (!selectedBuildingId) return [];
    const building = buildings.find(b => b.id.toString() === selectedBuildingId);
    if (!building) return [];
    
    const units = [...building.apartments.units, ...building.suites.units];
    return units.filter(u => u.status === 'available' || u.status === 'rented');
  }, [buildings, selectedBuildingId]);

  const onSubmit = (data: MaintenanceRequestFormData) => {
    const building = buildings.find(b => b.id.toString() === selectedBuildingId);
    const unit = availableUnits.find(u => u.id === data.unitId);

    if (!building || !unit) {
        toast({ variant: 'destructive', title: 'خطأ', description: 'لم يتم العثور على الوحدة المحددة.' });
        return;
    }

    updateUnitStatus(building.id, unit.unitType === 'apartment' ? 'apartments' : 'suites', unit.id, 'under_maintenance', data.maintenanceType);
    
    toast({
        title: 'تم إرسال الطلب بنجاح',
        description: `تم تغيير حالة الوحدة ${unit.unitNumber} إلى "تحت الصيانة".`,
        className: 'bg-green-100 border-green-400 text-green-800'
    });
    
    setRequestSent(true);
    form.reset();
    setSelectedBuildingId('');
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (requestSent) {
      return (
        <div className="container mx-auto py-8 px-4 md:px-6 flex justify-center items-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
            <Card className="w-full max-w-lg text-center shadow-2xl animate-in fade-in-50">
                <CardHeader>
                    <div className="mx-auto bg-green-100 text-green-700 rounded-full h-16 w-16 flex items-center justify-center">
                        <CheckCircle className="h-10 w-10" />
                    </div>
                    <CardTitle className="mt-4">تم إرسال طلب الصيانة</CardTitle>
                    <CardDescription>
                        يمكنك الآن الانتقال إلى صفحة متابعة الصيانة لإدخال تفاصيل التكلفة وتاريخ الانتهاء المتوقع.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <Button onClick={() => router.push('/maintenance')}>
                        <ListChecks className="ml-2 h-4 w-4" />
                        الانتقال إلى صفحة المتابعة
                    </Button>
                     <Button variant="outline" onClick={() => setRequestSent(false)}>
                        <Hammer className="ml-2 h-4 w-4" />
                        إنشاء طلب صيانة جديد
                    </Button>
                </CardContent>
            </Card>
        </div>
      )
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary font-headline flex items-center justify-center gap-3">
          <Hammer className="h-8 w-8" />
          طلب صيانة
        </h1>
        <p className="text-muted-foreground mt-2 text-lg max-w-2xl mx-auto">
          أرسل طلب صيانة جديد لوحدة سكنية ليتم تحويل حالتها إلى "تحت الصيانة" وتظهر في جدول المتابعة.
        </p>
      </div>

      <Card className="max-w-2xl mx-auto shadow-xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>نموذج طلب الصيانة</CardTitle>
              <CardDescription>
                اختر المبنى والوحدة ونوع الصيانة المطلوب.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>المبنى</Label>
                <Select onValueChange={setSelectedBuildingId} value={selectedBuildingId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر مبنى..." />
                  </SelectTrigger>
                  <SelectContent>
                    {buildings.map(b => (
                      <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <FormField
                control={form.control}
                name="unitId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الوحدة (الغرفة)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedBuildingId}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر وحدة..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>الشقق</SelectLabel>
                          {availableUnits.filter(u => u.unitType === 'apartment').map(u => (
                            <SelectItem key={u.id} value={u.id}>غرفة {u.unitNumber}</SelectItem>
                          ))}
                        </SelectGroup>
                         <SelectGroup>
                          <SelectLabel>الأجنحة</SelectLabel>
                           {availableUnits.filter(u => u.unitType === 'suite').map(u => (
                            <SelectItem key={u.id} value={u.id}>جناح {u.unitNumber}</SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maintenanceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع الصيانة</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                       <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر نوع الصيانة..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="maintenance">صيانة عامة</SelectItem>
                        <SelectItem value="furniture">أثاث</SelectItem>
                        <SelectItem value="electrical">كهرباء</SelectItem>
                        <SelectItem value="painting">دهانات</SelectItem>
                        <SelectItem value="none">أخرى</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={!form.formState.isValid}>
                <Send className="ml-2 h-4 w-4" />
                إرسال الطلب وتحويل الحالة
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
