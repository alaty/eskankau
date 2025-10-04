
"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  apartmentRent: z.coerce.number().min(0, "الإيجار يجب أن يكون قيمة موجبة."),
  suiteRent: z.coerce.number().min(0, "الإيجار يجب أن يكون قيمة موجبة."),
});

type FormData = z.infer<typeof formSchema>;

interface BulkBaseRentEditorProps {
  onUpdate: (apartmentRent: number, suiteRent: number) => void;
  initialValues: { apartmentRent: number; suiteRent: number };
}

export function BulkBaseRentEditor({ onUpdate, initialValues }: BulkBaseRentEditorProps) {
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues,
  });

  useEffect(() => {
    form.reset(initialValues);
  }, [initialValues, form]);

  const onSubmit = (data: FormData) => {
    onUpdate(data.apartmentRent, data.suiteRent);
    toast({
      title: "تم تحديث الإيجارات",
      description: "تم تحديث قيمة الإيجار الأساسي لجميع الشقق والأجنحة في النظام.",
      className: "bg-green-100 border-green-400 text-green-800",
    });
  };

  return (
    <Card className="shadow-md border-primary/20 rounded-t-none border-t-0">
      <CardHeader className="pt-0">
        <CardDescription>
            استخدم هذا النموذج لتحديث سعر الإيجار الأساسي لجميع الشقق وجميع الأجنحة في النظام دفعة واحدة.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <FormField
              control={form.control}
              name="apartmentRent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>إيجار جميع الشقق</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="suiteRent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>إيجار جميع الأجنحة</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full md:w-auto">
              تحديث جميع الإيجارات
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
