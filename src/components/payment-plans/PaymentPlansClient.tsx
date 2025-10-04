
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppDataContext';
import { Skeleton } from '@/components/ui/skeleton';
import { WalletCards, UserCheck, Search, BellRing, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import { type Unit } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { PaymentPlanDisplay } from '../financial-follow-up/PaymentPlanDisplay';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CompletedPlansTable } from '../financial-follow-up/CompletedPlansTable';


export function PaymentPlansClient() {
  const { buildings, loading } = useAppContext();
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // This effect runs when `buildings` data changes.
    // If a unit is currently selected, we find its latest version from the
    // updated `buildings` array and update our local `selectedUnit` state.
    // This ensures the view always shows the freshest data after any update.
    if (selectedUnit) {
      const allUnits = buildings.flatMap(b => [...b.apartments.units, ...b.suites.units]);
      const freshUnit = allUnits.find(u => u.id === selectedUnit.id);
      setSelectedUnit(freshUnit || null);
    }
  }, [buildings, selectedUnit]);


  const isUnitOverdue = (unit: Unit): boolean => {
    if (!unit.paymentPlan) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today's date

    if (unit.paymentPlan.type === 'deferred' && unit.paymentPlan.deferredUntil) {
        const dueDate = new Date(unit.paymentPlan.deferredUntil);
        return dueDate < today;
    }

    const installments = unit.paymentPlan.installments || unit.paymentPlan.stipendDeductions;
    if (installments) {
        return installments.some(inst => {
            const dueDate = new Date(inst.dueDate);
            return !inst.isPaid && dueDate < today;
        });
    }

    return false;
  };

  const { activeUnits, completedUnits } = useMemo(() => {
     if (loading) return { activeUnits: [], completedUnits: [] };
     
     const allUnits = buildings.flatMap(b => [...b.apartments.units, ...b.suites.units]);
     
     const active: Unit[] = [];
     const completed: Unit[] = [];

     allUnits.forEach(u => {
        if (u.paymentStatus && (u.paymentStatus === 'deferred' || u.paymentStatus === 'payment_plan')) {
          active.push(u);
        } else if (
            u.paymentStatus === 'paid_in_full' || 
            u.paymentStatus === 'exempt' || 
            u.paymentStatus === 'scholarship' || 
            (u.planArchived && u.paymentStatus !== 'deferred' && u.paymentStatus !== 'payment_plan')
        ) {
          completed.push(u);
        }
     });

     return { activeUnits: active, completedUnits: completed };

  }, [buildings, loading]);


  const filteredActiveUnits = useMemo(() => {
    const filtered = activeUnits.filter(u => 
      searchTerm === '' || u.buildingId.toString().includes(searchTerm) || u.unitNumber.toString().includes(searchTerm)
    );

    // Sort to bring overdue units to the top
    return filtered.sort((a, b) => {
      const aIsOverdue = isUnitOverdue(a);
      const bIsOverdue = isUnitOverdue(b);
      const aNeedsPlan = !a.paymentPlan && a.paymentStatus === 'deferred';
      const bNeedsPlan = !b.paymentPlan && b.paymentStatus === 'deferred';

      if (aIsOverdue !== bIsOverdue) return aIsOverdue ? -1 : 1;
      if (aNeedsPlan !== bNeedsPlan) return aNeedsPlan ? -1 : 1;
      
      // If both are overdue or not, sort by building and unit number
      return a.buildingId - b.buildingId || a.unitNumber - b.unitNumber;
    });

  }, [activeUnits, searchTerm]);

  const overdueUnits = useMemo(() => {
    return filteredActiveUnits.filter(isUnitOverdue);
  }, [filteredActiveUnits]);


  const handleSelectUnit = (unit: Unit) => {
    setSelectedUnit(unit);
  };
  
   const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, unit: Unit) => {
    if (event.key === 'Enter' || event.key === ' ') {
      handleSelectUnit(unit);
    }
  };


  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6">
        <Skeleton className="h-10 w-1/3 mb-4" />
        <Skeleton className="h-6 w-2/3 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Skeleton className="h-96 md:col-span-1" />
            <Skeleton className="h-96 md:col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="mb-8 no-print">
        <h1 className="text-3xl font-bold text-primary font-headline flex items-center gap-3">
          <WalletCards className="h-8 w-8" />
          خطط السداد المالية
        </h1>
        <p className="text-muted-foreground mt-2 text-base font-medium">
          إدارة ومتابعة خطط السداد الخاصة والاستثناءات للوحدات ذات السداد المؤجل أو التي لديها خطط خاصة.
        </p>
      </div>
      
       <div className="print-header hidden print:flex">
          <span className="print-title">تقرير الخطط المالية</span>
          <img src="https://j.top4top.io/p_35298zyqb1.png" alt="Logo" className="print-logo" />
      </div>


      {overdueUnits.length > 0 && (
         <Alert variant="destructive" className="mb-8 no-print animate-in fade-in-50">
            <BellRing className="h-4 w-4" />
            <AlertTitle className="font-bold">تنبيه بمستحقات متأخرة</AlertTitle>
            <AlertDescription>
                يوجد حاليًا <strong>{overdueUnits.length}</strong> وحدة قد تجاوزت تاريخ الاستحقاق المحدد لها. تظهر هذه الوحدات في أعلى القائمة.
            </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start no-print">
        <div className="lg:col-span-1 lg:sticky top-24">
          <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                      <UserCheck className="h-6 w-6" />
                      وحدات بخطط نشطة
                  </CardTitle>
                  <CardDescription>
                      قائمة بالوحدات التي عليها مديونية. اضغط على وحدة لعرض أو تعديل خطتها المالية.
                  </CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                          placeholder="ابحث برقم المبنى أو الغرفة..." 
                          className="pl-9"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                      />
                  </div>
                  <TooltipProvider>
                    <div className="max-h-[70vh] overflow-y-auto space-y-2 pr-2">
                        {filteredActiveUnits.length > 0 ? (
                            filteredActiveUnits.map(unit => {
                                const isOverdue = overdueUnits.some(ou => ou.id === unit.id);
                                const needsPlan = !unit.paymentPlan && unit.paymentStatus === 'deferred';
                                
                                return (
                                    <div 
                                        key={unit.id}
                                        onClick={() => handleSelectUnit(unit)}
                                        onKeyDown={(e) => handleKeyDown(e, unit)}
                                        role="button"
                                        tabIndex={0}
                                        className={`w-full text-right p-3 rounded-lg border transition-all flex items-center justify-between text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary ${
                                          selectedUnit?.id === unit.id 
                                              ? 'bg-primary text-primary-foreground border-primary' 
                                              : isOverdue 
                                                  ? 'bg-red-100 border-red-400 hover:bg-red-200/70'
                                                  : needsPlan
                                                      ? 'bg-yellow-100 border-yellow-400 hover:bg-yellow-200/70'
                                                      : 'bg-muted/40 hover:bg-muted'
                                        }`}
                                    >
                                      <div>
                                        <div className="font-semibold">مبنى {unit.buildingId} - غرفة {unit.unitNumber}</div>
                                        <div className="flex items-center gap-2 text-xs opacity-80">
                                            <span>{unit.unitType === 'apartment' ? 'شقة' : 'جناح'}</span>
                                            {isOverdue && (
                                                <span className="flex items-center gap-1 text-red-700">
                                                    <AlertTriangle className="h-3 w-3" />
                                                    <span>(مستحقة)</span>
                                                </span>
                                            )}
                                            {needsPlan && (
                                                <span className="font-bold text-orange-800">(لا يوجد خطة)</span>
                                            )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {needsPlan && !isOverdue && (
                                           <Tooltip>
                                              <TooltipTrigger asChild>
                                                <span tabIndex={-1}>
                                                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                                                </span>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>تحتاج إلى تحديد خطة</p>
                                              </TooltipContent>
                                          </Tooltip>
                                        )}
                                        {isOverdue && (
                                           <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <span tabIndex={-1}><BellRing className="h-5 w-5 text-red-600 animate-pulse" /></span>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                  <p>الدفع مستحق ومتأخر</p>
                                                </TooltipContent>
                                           </Tooltip>
                                        )}
                                      </div>
                                    </div>
                                )
                            })
                        ) : (
                            <p className="text-center text-muted-foreground p-4">لا توجد وحدات ذات مديونية مطابقة للبحث.</p>
                        )}
                    </div>
                  </TooltipProvider>
              </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
            {selectedUnit ? (
                <PaymentPlanDisplay unit={selectedUnit} key={selectedUnit.id} />
            ) : (
                <Card className="flex items-center justify-center h-96">
                    <div className="text-center text-muted-foreground">
                        <WalletCards className="h-16 w-16 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold">الرجاء اختيار وحدة</h3>
                        <p>اختر وحدة من القائمة على اليمين لعرض أو إدارة خطتها المالية.</p>
                    </div>
                </Card>
            )}
        </div>
      </div>
       
        <div className="mt-12">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-primary font-headline flex items-center gap-3">
                        <CheckCircle className="h-7 w-7" />
                        أرشيف الخطط المكتملة
                    </CardTitle>
                    <CardDescription>
                        سجل بجميع الخطط المالية التي تم إكمال سدادها أو تم إعفاؤها.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <CompletedPlansTable unitsWithCompletedPlans={completedUnits} />
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
