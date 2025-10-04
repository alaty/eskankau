"use client";

import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppContext } from '@/contexts/AppDataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import type { Unit } from '@/lib/types';

const deleteUnitSchema = z.object({
  buildingId: z.string().min(1, "الرجاء اختيار المبنى."),
  unitId: z.string().min(1, "الرجاء اختيار الوحدة."),
});

type DeleteUnitFormData = z.infer<typeof deleteUnitSchema>;

export function DeleteUnitForm() {
  const { buildings, deleteUnit } = useAppContext();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<DeleteUnitFormData>({
    resolver: zodResolver(deleteUnitSchema),
    defaultValues: { buildingId: undefined, unitId: undefined },
  });
  
  const selectedBuildingId = form.watch('buildingId');
  
  const unitsInBuilding = useMemo(() => {
    if (!selectedBuildingId) return [];
    const building = buildings.find(b => b.id.toString() === selectedBuildingId);
    if (!building) return [];
    return [...building.apartments.units, ...building.suites.units].sort((a,b) => a.unitNumber - b.unitNumber);
  }, [buildings, selectedBuildingId]);
  
  const selectedUnitId = form.watch('unitId');
  const selectedUnit = unitsInBuilding.find(u => u.id === selectedUnitId);

  const onSubmit = () => {
    if (!selectedUnit) return;

    deleteUnit(selectedUnit.buildingId, selectedUnit.id);
    
    toast({
        title: 'تم حذف الوحدة بنجاح',
        description: `تم حذف الوحدة رقم ${selectedUnit.unitNumber} من مبنى ${selectedUnit.buildingId}.`,
        className: 'bg-green-100 border-green-400 text-green-800'
    });

    form.reset();
    setIsDialogOpen(false);
  };

  return (
      <Card className="mt-6 shadow-xl border-0">
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()}>
             <CardHeader className="text-right bg-destructive/10 rounded-t-lg">
              <CardTitle>نموذج حذف وحدة</CardTitle>
              <CardDescription className="text-destructive/90">
                اختر المبنى ثم الوحدة التي ترغب في حذفها. <span className="font-bold">هذا الإجراء لا يمكن التراجع عنه.</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-right p-6">
               <FormField
                control={form.control}
                name="buildingId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اختر المبنى أولاً</FormLabel>
                    <Select onValueChange={(value) => { field.onChange(value); form.resetField('unitId'); }} defaultValue={field.value} dir="rtl">
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
              <FormField
                control={form.control}
                name="unitId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الوحدة المراد حذفها</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} dir="rtl" disabled={!selectedBuildingId}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر وحدة..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {unitsInBuilding.map(u => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.unitType === 'apartment' ? 'شقة' : 'جناح'} رقم {u.unitNumber} (الدور {u.floor})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="bg-muted/30 px-6 py-4 border-t rounded-b-lg">
               <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <AlertDialogTrigger asChild>
                     <Button type="button" variant="destructive" className="w-full" disabled={!form.formState.isValid}>
                        <Trash2 className="ml-2 h-4 w-4" />
                        حذف الوحدة المحددة
                     </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                      <AlertDialogHeader>
                          <AlertDialogTitle>تأكيد عملية الحذف</AlertDialogTitle>
                          <AlertDialogDescription>
                              هل أنت متأكد من رغبتك في حذف الوحدة رقم <span className="font-bold">{selectedUnit?.unitNumber}</span>؟ سيتم حذفها بشكل نهائي.
                          </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          <AlertDialogAction onClick={onSubmit} className="bg-destructive hover:bg-destructive/90">تأكيد الحذف</AlertDialogAction>
                      </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
          </form>
        </Form>
      </Card>
  );
}
