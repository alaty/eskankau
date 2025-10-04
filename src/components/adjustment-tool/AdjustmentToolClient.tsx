
"use client";

import React from 'react';
import { useAppContext } from '@/contexts/AppDataContext';
import { BulkPaymentStatusEditor } from '@/components/units/BulkPaymentStatusEditor';
import { SlidersHorizontal, Wallet, Home } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BulkBaseRentEditor } from './BulkBaseRentEditor';

export function AdjustmentToolClient() {
  const { loading, updateAllPaymentStatuses, updateAllBaseRents, bulkRentValues } = useAppContext();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="text-right">
          <h1 className="text-3xl font-bold text-primary font-headline flex items-center gap-3">
            <SlidersHorizontal className="h-8 w-8" />
            أداة التعديل العام
          </h1>
          <p className="text-muted-foreground mt-2 text-base font-medium">
            أدوات لتعديل البيانات بشكل جماعي على مستوى النظام.
          </p>
        </div>
      </div>
      
      <div className="space-y-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                أداة تعديل الإيجار الأساسي لجميع الوحدات
            </CardTitle>
          </CardHeader>
          <BulkBaseRentEditor onUpdate={updateAllBaseRents} initialValues={bulkRentValues} />
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                أداة تعديل حالة السداد للوحدات المؤجرة
            </CardTitle>
          </CardHeader>
          <BulkPaymentStatusEditor 
              onUpdate={updateAllPaymentStatuses}
          />
        </Card>
      </div>
    </div>
  );
}
