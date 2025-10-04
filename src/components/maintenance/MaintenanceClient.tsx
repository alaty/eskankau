
"use client";

import React, { useMemo } from 'react';
import { useAppContext } from '@/contexts/AppDataContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Wrench } from 'lucide-react';
import { type Unit } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ActiveMaintenanceTable } from './ActiveMaintenanceTable';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertTriangle } from 'lucide-react';

export function MaintenanceClient() {
  const { buildings, loading } = useAppContext();

  const maintenanceStats = useMemo(() => {
    if (loading) {
      return { activeUnits: [], overdueCount: 0 };
    }
    const active: Unit[] = [];
    let overdueCount = 0;
    const today = new Date();
    today.setHours(0,0,0,0);

    buildings.forEach(building => {
      const allUnits = [...building.apartments.units, ...building.suites.units];
      allUnits.forEach(unit => {
        if (unit.status === 'under_maintenance') {
          active.push(unit);
          if (unit.maintenanceEndDate && new Date(unit.maintenanceEndDate) < today) {
            overdueCount++;
          }
        }
      });
    });
    
    return { 
        activeUnits: active, 
        overdueCount,
    };
  }, [buildings, loading]);
  
  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6">
        <Skeleton className="h-10 w-1/3 mb-4" />
        <Skeleton className="h-24" />
        <Skeleton className="h-64 w-full mt-8" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 space-y-12">
      <div>
        <h1 className="text-3xl font-bold text-primary font-headline">متابعة حالات الصيانة</h1>
        <p className="text-muted-foreground mt-2">
            إدارة وتتبع جميع الوحدات التي هي قيد الصيانة حالياً.
        </p>
      </div>

      {maintenanceStats.overdueCount > 0 && (
          <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>تنبيه</AlertTitle>
              <AlertDescription>
                  يوجد {maintenanceStats.overdueCount} وحدة صيانة تجاوزت تاريخ الانتهاء المتوقع. تظهر هذه الوحدات باللون الأحمر في الجدول أدناه.
              </AlertDescription>
          </Alert>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-primary">
            <Wrench className="h-6 w-6" />
            الصيانة الحالية (تحت التنفيذ)
          </CardTitle>
          <CardDescription>
            قائمة بالوحدات التي هي قيد الصيانة حاليًا. قم بتحديث بيانات الصيانة وحالة التنفيذ من هنا.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ActiveMaintenanceTable units={maintenanceStats.activeUnits} />
        </CardContent>
      </Card>
    </div>
  );
}
