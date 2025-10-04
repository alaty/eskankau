"use client";

import React, { useState } from 'react';
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

const deleteBuildingSchema = z.object({
  buildingId: z.string().min(1, "الرجاء اختيار المبنى الذي ترغب في حذفه."),
});

type DeleteBuildingFormData = z.infer<typeof deleteBuildingSchema>;

export function DeleteBuildingForm() {
  const { buildings, deleteBuilding } = useAppContext();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<DeleteBuildingFormData>({
    resolver: zodResolver(deleteBuildingSchema),
    defaultValues: { buildingId: undefined },
  });
  
  const selectedBuildingId = form.watch('buildingId');
  const selectedBuilding = buildings.find(b => b.id.toString() === selectedBuildingId);


  const onSubmit = () => {
    if (!selectedBuilding) return;

    deleteBuilding(selectedBuilding.id);
    
    toast({
        title: 'تم حذف المبنى بنجاح',
        description: `تم حذف ${selectedBuilding.name} وجميع الوحدات التابعة له.`,
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
              <CardTitle>نموذج حذف مبنى</CardTitle>
              <CardDescription className="text-destructive/90">
                اختر المبنى الذي ترغب في حذفه من القائمة. <span className="font-bold">تحذير: هذا الإجراء لا يمكن التراجع عنه.</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-right p-6">
              <FormField
                control={form.control}
                name="buildingId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المبنى المراد حذفه</FormLabel>
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
            </CardContent>
            <CardFooter className="bg-muted/30 px-6 py-4 border-t rounded-b-lg">
               <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <AlertDialogTrigger asChild>
                     <Button type="button" variant="destructive" className="w-full" disabled={!form.formState.isValid}>
                        <Trash2 className="ml-2 h-4 w-4" />
                        حذف المبنى المحدد
                     </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                      <AlertDialogHeader>
                          <AlertDialogTitle>تأكيد عملية الحذف</AlertDialogTitle>
                          <AlertDialogDescription>
                              هل أنت متأكد من رغبتك في حذف <span className="font-bold">{selectedBuilding?.name}</span>؟ سيتم حذف المبنى وجميع الوحدات والغرف التابعة له بشكل نهائي.
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
