
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppDataContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, Download, SlidersHorizontal, Eye, EyeOff } from 'lucide-react';
import { type Unit, type BuildingData } from '@/lib/types';
import { UnitsTable } from './UnitsTable';
import { Button } from '../ui/button';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';


export function UnitsClient() {
  const { buildings, loading } = useAppContext();
  const { toast } = useToast();
  
  const [tempSelectedBuildingId, setTempSelectedBuildingId] = useState<string | null>(null);
  const [tempSelectedFloor, setTempSelectedFloor] = useState<string>("all");
  const [tempSelectedUnitType, setTempSelectedUnitType] = useState<string>("all");

  const [activeBuildingId, setActiveBuildingId] = useState<string | null>(null);
  const [activeFloor, setActiveFloor] = useState<string>("all");
  const [activeUnitType, setActiveUnitType] = useState<string>("all");


  const selectedBuilding = useMemo(() => {
    if (loading || !activeBuildingId || !buildings) return null;
    return buildings.find(b => b.id.toString() === activeBuildingId) || null;
  }, [buildings, activeBuildingId, loading]);


  const floorConfig = React.useMemo(() => [
      { floor: 1, apartments: 16, suites: 4 },
      { floor: 2, apartments: 36, suites: 2 },
      { floor: 3, apartments: 36, suites: 2 },
      { floor: 4, apartments: 36, suites: 2 },
  ], []);
  
  const filteredFloorConfig = useMemo(() => {
    if (activeFloor === "all") {
      return floorConfig;
    }
    return floorConfig.filter(f => f.floor.toString() === activeFloor);
  }, [activeFloor, floorConfig]);

  const getUnitsFor = (building: BuildingData, unitType: 'apartments' | 'suites', floor: number): Unit[] => {
      if (!building || !building[unitType]) return [];
      const unitCollection = unitType === 'apartments' ? building.apartments.units : building.suites.units;
      return unitCollection.filter(unit => unit.floor === floor);
  };
  
  const handleApplyFilters = () => {
      setActiveBuildingId(tempSelectedBuildingId);
      setActiveFloor(tempSelectedFloor);
      setActiveUnitType(tempSelectedUnitType);
  };
  
  const handleExportAll = () => {
    if (!buildings) return;
    try {
        const wb = XLSX.utils.book_new();

        buildings.forEach(building => {
            const allUnits = [
                ...building.apartments.units,
                ...building.suites.units
            ];

            const dataToExport = allUnits.map(unit => {
                 const statusMap = { rented: 'مؤجرة', under_maintenance: 'تحت الصيانة', available: 'متاحة', office: 'مكتب إداري' };
                 const typeMap = { apartment: 'شقة', suite: 'جناح' };
                 return {
                    "رقم المبنى": building.id,
                    "اسم المبنى": building.name,
                    "رقم الدور": unit.floor,
                    "رقم الغرفة": unit.unitNumber,
                    "معرف الغرفة": unit.id,
                    "نوع الوحدة": typeMap[unit.unitType],
                    "حالة الغرفة": statusMap[unit.status]
                 }
            });

            const ws = XLSX.utils.json_to_sheet(dataToExport);
            ws["!rtl"] = true;
            XLSX.utils.book_append_sheet(wb, ws, building.name);
        });

        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        saveAs(new Blob([wbout], { type: "application/octet-stream" }), `بيانات_جميع_الوحدات_${new Date().toISOString().split('T')[0]}.xlsx`);

        toast({
            title: "تم التصدير بنجاح",
            description: "تم تصدير بيانات جميع الوحدات بنجاح.",
            className: "bg-green-100 border-green-400 text-green-800",
        });

    } catch (error) {
        console.error("Export failed:", error);
        toast({
            title: "خطأ في التصدير",
            description: "حدث خطأ أثناء محاولة إنشاء ملف Excel.",
            variant: "destructive",
        });
    }
  };


  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="text-right">
          <h1 className="text-3xl font-bold text-primary font-headline">إدارة الوحدات السكنية</h1>
          <p className="text-muted-foreground mt-2 text-base font-medium">
            عرض وتعديل بيانات جميع الوحدات السكنية في كل مبنى.
          </p>
        </div>
        <div className="flex items-center gap-4">
            <Button onClick={handleExportAll} variant="outline" disabled={loading}>
                <Download className="mr-2 h-4 w-4" />
                تصدير الكل
            </Button>
        </div>
      </div>
      
      <div className="mb-8">
        { !loading && buildings && buildings.length > 0 && (
            <>
                {!selectedBuilding && (
                  <div className="text-center p-4 mb-4 bg-blue-50 text-blue-800 rounded-lg border border-blue-200">
                      <p>الرجاء اختيار فلاتر العرض ثم الضغط على "نفذ" لعرض البيانات.</p>
                  </div>
                )}
               <div className="p-4 border rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between gap-4">
                         <h3 className="font-semibold text-primary flex items-center gap-2 shrink-0">
                            <Building2 className="h-5 w-5" />
                            عرض بيانات المباني
                        </h3>
                        <div className="flex items-center gap-x-2 justify-center flex-wrap">
                             <div className="flex items-center gap-x-1 bg-white p-1 rounded-lg border shadow-sm">
                                <label className="font-semibold text-xs shrink-0 text-foreground px-2">اختر المبنى:</label>
                                {buildings.map(b => (
                                    <Button key={b.id} variant={tempSelectedBuildingId === b.id.toString() ? 'default' : 'outline'} onClick={() => setTempSelectedBuildingId(b.id.toString())} className={cn("h-8 px-3 text-xs")}>{b.name.replace('مبنى', 'م')}</Button>
                                ))}
                            </div>
                            
                            <div className="flex items-center gap-x-1 bg-blue-50 p-1 rounded-lg border border-blue-200 shadow-sm">
                                <label className="font-semibold text-xs shrink-0 text-blue-800 px-2">اختر الدور:</label>
                                <Button variant={tempSelectedFloor === 'all' ? 'default' : 'outline'} onClick={() => setTempSelectedFloor('all')} className={cn("h-8 px-3 text-xs")}>الكل</Button>
                                {floorConfig.map(f => (
                                    <Button key={f.floor} variant={tempSelectedFloor === f.floor.toString() ? 'default' : 'outline'} onClick={() => setTempSelectedFloor(f.floor.toString())} className={cn("h-8 px-3 text-xs")}>د {f.floor}</Button>
                                ))}
                            </div>

                            <div className="flex items-center gap-x-1 bg-purple-50 p-1 rounded-lg border border-purple-200 shadow-sm">
                                <label className="font-semibold text-xs shrink-0 text-purple-800 px-2">الفئة:</label>
                                <Button variant={tempSelectedUnitType === 'all' ? 'default' : 'outline'} onClick={() => setTempSelectedUnitType('all')} className={cn("h-8 px-3 text-xs")}>الكل</Button>
                                <Button variant={tempSelectedUnitType === 'apartments' ? 'default' : 'outline'} onClick={() => setTempSelectedUnitType('apartments')} className={cn("h-8 px-3 text-xs")}>شقق</Button>
                                <Button variant={tempSelectedUnitType === 'suites' ? 'default' : 'outline'} onClick={() => setTempSelectedUnitType('suites')} className={cn("h-8 px-3 text-xs")}>أجنحة</Button>
                            </div>
                        </div>
                        
                         <Button onClick={handleApplyFilters} disabled={!tempSelectedBuildingId} className="h-9 px-16 font-bold bg-destructive hover:bg-destructive/90 text-destructive-foreground shrink-0">نفذ</Button>
                    </div>
                </div>
            </>
         )}
      </div>

        {loading ? (
            <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-64 w-full mt-4" />
            </div>
        ) : (
          <div>
            {selectedBuilding ? (
                 <div className="space-y-8">
                    {filteredFloorConfig.map(({ floor }) => (
                         <Card key={floor} className="shadow-md">
                            <CardHeader>
                                <CardTitle className="text-lg text-primary font-semibold">{selectedBuilding.name} - الدور {floor}</CardTitle>
                            </CardHeader>
                            <CardContent className='space-y-6'>
                                {(activeUnitType === 'all' || activeUnitType === 'apartments') && (
                                    <div>
                                        <h5 className="font-semibold mb-2 text-lg">نظام الشقق</h5>
                                        <UnitsTable units={getUnitsFor(selectedBuilding, 'apartments', floor)} buildingId={selectedBuilding.id} unitType="apartments" floor={floor} />
                                    </div>
                                )}
                                {(activeUnitType === 'all' || activeUnitType === 'suites') && (
                                    <div>
                                        <h5 className="font-semibold mb-2 text-lg">نظام الأجنحة</h5>
                                        <UnitsTable units={getUnitsFor(selectedBuilding, 'suites', floor)} buildingId={selectedBuilding.id} unitType="suites" floor={floor} />
                                    </div>
                                )}
                            </CardContent>
                         </Card>
                    ))}
                 </div>
            ) : null}
          </div>
        )}
    </div>
  );
}
