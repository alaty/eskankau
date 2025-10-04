
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppDataContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Map, TrendingUp, Wallet, Home, Wrench, Repeat } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UnitCard } from './UnitCard';
import type { Unit, BuildingData } from '@/lib/types';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

interface TiedBuilding {
    id: string;
    name: string;
}

interface PerformanceStat {
    name: string;
    value: number;
    id: string | null;
    count: number;
    tiedBuildings: TiedBuilding[];
}

const StatCard = ({
    title,
    primaryStat,
    secondaryStat,
    unit,
    icon: Icon,
    primaryColor,
    secondaryColor,
    isFlipped,
    onFlip,
    onBuildingClick,
}: {
    title: string;
    primaryStat: PerformanceStat;
    secondaryStat: PerformanceStat;
    unit: string;
    icon: React.ElementType;
    primaryColor: string;
    secondaryColor: string;
    isFlipped: boolean;
    onFlip: () => void;
    onBuildingClick: (id: string) => void;
}) => {
    const stat = isFlipped ? secondaryStat : primaryStat;
    const colorClass = isFlipped ? secondaryColor : primaryColor;
    const cardTitle = isFlipped ? `الأقل ${title}` : `الأعلى ${title}`;

    return (
        <Card className={cn("shadow-md flex flex-col transition-all duration-300 ease-in-out overflow-hidden relative text-white", colorClass)}>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-white/80" />
                        <CardTitle className="text-sm font-bold">{cardTitle}</CardTitle>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-white/80 hover:bg-white/20 hover:text-white" onClick={onFlip}>
                        <Repeat className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-center relative">
                <div 
                    className={cn(
                        "transition-all duration-300 ease-in-out",
                        isFlipped ? "opacity-0 -translate-y-4 absolute" : "opacity-100 translate-y-0"
                    )}
                >
                    <p className="text-2xl font-bold">
                        {typeof primaryStat.value === 'number' && (unit === '%' || unit === ' ريال') ? primaryStat.value.toFixed(1) : primaryStat.value}{unit}
                    </p>
                    <div className="mt-2">
                        {primaryStat.count === 0 ? (
                            <span className="text-sm text-white/80">لا يوجد</span>
                        ) : primaryStat.count === 1 && primaryStat.id ? (
                            <Button variant="ghost" className="h-auto p-1 px-2 text-xl font-black text-white hover:bg-white/20" onClick={() => onBuildingClick(primaryStat.id!)}>{primaryStat.name}</Button>
                        ) : (
                            <div>
                                <span className="text-sm text-white/90 block mb-2">{primaryStat.name}:</span>
                                <div className="flex flex-wrap gap-1.5 items-center">
                                    {primaryStat.tiedBuildings.map(b => (
                                        <Button key={b.id} variant="outline" className="h-7 w-7 p-0 text-xs font-bold bg-white/20 text-white border-white/50 hover:bg-white/30" onClick={() => onBuildingClick(b.id)}>{b.name.replace('مبنى ', '')}</Button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                 </div>
                 <div 
                    className={cn(
                        "transition-all duration-300 ease-in-out",
                        isFlipped ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 absolute"
                    )}
                >
                     <p className="text-2xl font-bold">
                        {typeof secondaryStat.value === 'number' && (unit === '%' || unit === ' ريال') ? secondaryStat.value.toFixed(1) : secondaryStat.value}{unit}
                    </p>
                    <div className="mt-2">
                        {secondaryStat.count === 0 ? (
                            <span className="text-sm text-white/80">لا يوجد</span>
                        ) : secondaryStat.count === 1 && secondaryStat.id ? (
                            <Button variant="ghost" className="h-auto p-1 px-2 text-xl font-black text-white hover:bg-white/20" onClick={() => onBuildingClick(secondaryStat.id!)}>{secondaryStat.name}</Button>
                        ) : (
                            <div>
                                <span className="text-sm text-white/90 block mb-2">{secondaryStat.name}:</span>
                                <div className="flex flex-wrap gap-1.5 items-center">
                                    {secondaryStat.tiedBuildings.map(b => (
                                        <Button key={b.id} variant="outline" className="h-7 w-7 p-0 text-xs font-bold bg-white/20 text-white border-white/50 hover:bg-white/30" onClick={() => onBuildingClick(b.id)}>{b.name.replace('مبنى ', '')}</Button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                 </div>
            </CardContent>
        </Card>
    );
};


const UnitsGrid = ({ units }: { units: Unit[] }) => {
    if (units.length === 0) {
        return <p className="text-center text-muted-foreground p-4">لا توجد وحدات من هذا النوع في هذا الدور.</p>
    }
    return (
        <div className="grid grid-cols-25 gap-2">
            {units.map(unit => (
                <UnitCard key={unit.id} unit={unit} />
            ))}
        </div>
    )
};

const Legend = () => (
    <div className="flex flex-wrap items-center justify-start gap-x-6 gap-y-2 mt-4 pt-4 border-t text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-green-200/80 border-2 border-green-500/0"></div>
            <span>مؤجرة</span>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-blue-500/80 border border-blue-700"></div>
            <span>متاحة</span>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-yellow-400/80 border border-yellow-600"></div>
            <span>تحت الصيانة</span>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-gray-400/80 border border-gray-600"></div>
            <span>مكتب إداري</span>
        </div>
         <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md border-2 border-yellow-500 bg-white"></div>
            <span>جناح</span>
        </div>
    </div>
);


export function VisualPlanClient() {
  const { buildings, loading } = useAppContext();

  const [activeBuildingId, setActiveBuildingId] = useState<string | null>(null);
  const [activeFloor, setActiveFloor] = useState<string>("all");
  const [flippedStates, setFlippedStates] = useState({
      occupancy: false,
      revenue: false,
      available: false,
      maintenance: false
  });

  const handleFlip = (card: keyof typeof flippedStates) => {
      setFlippedStates(prev => ({ ...prev, [card]: !prev[card] }));
  };

  useEffect(() => {
    if (!loading && buildings.length > 0 && !activeBuildingId) {
      setActiveBuildingId(buildings[0].id.toString());
    }
  }, [loading, buildings, activeBuildingId]);


  const summaryStats = useMemo(() => {
      if (loading || buildings.length === 0) return null;

      const stats = buildings.map(b => {
          const allUnits = [...b.apartments.units, ...b.suites.units];
          const rentableUnitsCount = allUnits.filter(u => u.status !== 'office').length;
          const rentedUnitsCount = allUnits.filter(u => u.status === 'rented').length;
          const availableUnitsCount = allUnits.filter(u => u.status === 'available').length;
          const maintenanceUnitsCount = allUnits.filter(u => u.status === 'under_maintenance').length;
          const occupancyRate = rentableUnitsCount > 0 ? (rentedUnitsCount / rentableUnitsCount) * 100 : 0;
          const actualRevenue = allUnits.filter(u => u.status === 'rented').reduce((sum, u) => sum + (u.actualRent ?? u.baseRent), 0);

          return {
              id: b.id.toString(),
              name: b.name,
              available: availableUnitsCount,
              maintenance: maintenanceUnitsCount,
              occupancy: occupancyRate,
              revenue: actualRevenue,
          };
      });

      const getPerformer = (field: keyof Omit<typeof stats[0], 'id' | 'name'>, order: 'high' | 'low'): PerformanceStat => {
          const sorted = [...stats].sort((a, b) => order === 'high' ? (b[field] as number) - (a[field] as number) : (a[field] as number) - (b[field] as number));
          if (sorted.length === 0) return { name: 'لا يوجد', value: 0, id: null, count: 0, tiedBuildings: [] };
          
          const topValue = sorted[0][field] as number;
          if (topValue === 0 && (field === 'available' || field === 'maintenance') && order === 'high') {
             return { name: 'لا يوجد', value: 0, id: null, count: 0, tiedBuildings: [] };
          }
          
          const tied = sorted.filter(s => s[field] === topValue);
          
          let name: string;
          if (tied.length === 1) {
              name = tied[0].name;
          } else {
              name = `${tied.length} مبانٍ`;
          }

          return { name, value: topValue, id: tied.length === 1 ? tied[0].id : null, count: tied.length, tiedBuildings: tied.map(t => ({ id: t.id, name: t.name })) };
      };

      return {
          highestOccupancy: getPerformer('occupancy', 'high'),
          lowestOccupancy: getPerformer('occupancy', 'low'),
          highestRevenue: getPerformer('revenue', 'high'),
          lowestRevenue: getPerformer('revenue', 'low'),
          mostMaintenance: getPerformer('maintenance', 'high'),
          leastMaintenance: getPerformer('maintenance', 'low'),
          mostAvailable: getPerformer('available', 'high'),
          leastAvailable: getPerformer('available', 'low'),
      };

  }, [buildings, loading]);


  const selectedBuilding = useMemo(() => {
    if (loading || !activeBuildingId) return null;
    return buildings.find(b => b.id.toString() === activeBuildingId) || null;
  }, [buildings, activeBuildingId, loading]);

  const floorConfig = useMemo(() => [
    { floor: 1 }, { floor: 2 }, { floor: 3 }, { floor: 4 }
  ], []);
  
    const getUnitsFor = (building: BuildingData, floor: number): Unit[] => {
      const allUnits = [...building.apartments.units, ...building.suites.units];
      return allUnits
        .filter(unit => unit.floor === floor)
        .sort((a,b) => a.unitNumber - b.unitNumber);
  };

   const getUnitCountForFloor = (building: BuildingData, floor: number) => {
        const unitsOnFloor = getUnitsFor(building, floor);
        const apartments = unitsOnFloor.filter(u => u.unitType === 'apartment').length;
        const suites = unitsOnFloor.filter(u => u.unitType === 'suite').length;
        return { apartments, suites };
    };

  
  const allUnitsInBuilding = useMemo(() => {
    if (!selectedBuilding) return [];
    
    const allUnits = [...selectedBuilding.apartments.units, ...selectedBuilding.suites.units];
    allUnits.sort((a, b) => {
        if (a.floor !== b.floor) {
            return a.floor - b.floor;
        }
        return a.unitNumber - b.unitNumber;
    });

    return allUnits;
  }, [selectedBuilding]);


  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6">
        <Skeleton className="h-10 w-1/3 mb-8" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 space-y-8">
       <div>
            <h1 className="text-3xl font-bold text-primary font-headline flex items-center gap-3">
              <Map className="h-8 w-8" />
              التخطيط المرئي للمباني
            </h1>
            <p className="text-muted-foreground mt-2 text-base font-medium">
                استعراض مرئي وتفاعلي لحالة الغرف في جميع المباني والأدوار.
            </p>
        </div>

        {summaryStats && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" style={{ minHeight: '180px' }}>
                 <StatCard
                    title="إشغالاً"
                    primaryStat={summaryStats.highestOccupancy}
                    secondaryStat={summaryStats.lowestOccupancy}
                    unit="%"
                    icon={TrendingUp}
                    primaryColor="bg-gradient-to-br from-cyan-600 to-blue-700"
                    secondaryColor="bg-gradient-to-br from-rose-500 to-rose-700"
                    isFlipped={flippedStates.occupancy}
                    onFlip={() => handleFlip('occupancy')}
                    onBuildingClick={setActiveBuildingId}
                />
                 <StatCard
                    title="إيراداً"
                    primaryStat={summaryStats.highestRevenue}
                    secondaryStat={summaryStats.lowestRevenue}
                    unit=" ريال"
                    icon={Wallet}
                    primaryColor="bg-gradient-to-br from-emerald-600 to-teal-700"
                    secondaryColor="bg-gradient-to-br from-amber-500 to-orange-600"
                    isFlipped={flippedStates.revenue}
                    onFlip={() => handleFlip('revenue')}
                    onBuildingClick={setActiveBuildingId}
                />
                <StatCard
                    title="شواغر"
                    primaryStat={summaryStats.mostAvailable}
                    secondaryStat={summaryStats.leastAvailable}
                    unit=" وحدة"
                    icon={Home}
                    primaryColor="bg-gradient-to-br from-rose-500 to-orange-600"
                    secondaryColor="bg-gradient-to-br from-lime-600 to-green-600"
                    isFlipped={flippedStates.available}
                    onFlip={() => handleFlip('available')}
                    onBuildingClick={setActiveBuildingId}
                />
                <StatCard
                    title="صيانة"
                    primaryStat={summaryStats.mostMaintenance}
                    secondaryStat={summaryStats.leastMaintenance}
                    unit=" وحدة"
                    icon={Wrench}
                    primaryColor="bg-gradient-to-br from-amber-500 to-yellow-600"
                    secondaryColor="bg-gradient-to-br from-sky-500 to-indigo-600"
                    isFlipped={flippedStates.maintenance}
                    onFlip={() => handleFlip('maintenance')}
                    onBuildingClick={setActiveBuildingId}
                />
            </div>
        )}
        
        <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-muted/50">
                 <div className="flex flex-col md:flex-row items-center justify-start gap-x-4 gap-y-4">
                     <div className="flex items-center gap-2 bg-white p-1 rounded-lg border shadow-sm">
                        <label className="font-semibold text-sm shrink-0 text-foreground px-2">اختر المبنى:</label>
                        <div className="flex items-center gap-x-1 flex-wrap">
                            {buildings.map(b => (
                                <Button key={b.id} variant={activeBuildingId === b.id.toString() ? 'default' : 'outline'} onClick={() => setActiveBuildingId(b.id.toString())} className={cn("h-9 px-4 text-sm")}>{b.name.replace('مبنى', 'م')}</Button>
                            ))}
                        </div>
                    </div>
                     <div className="flex items-center gap-2 bg-white p-1 rounded-lg border shadow-sm">
                        <label className="font-semibold text-sm shrink-0 text-foreground px-2">اختر الدور:</label>
                        <div className="flex items-center gap-x-1 flex-wrap">
                            <Button variant={activeFloor === 'all' ? 'default' : 'outline'} onClick={() => setActiveFloor('all')} className={cn("h-9 px-4 text-sm")}>الكل</Button>
                            {floorConfig.map(f => (
                                <Button key={f.floor} variant={activeFloor === f.floor.toString() ? 'default' : 'outline'} onClick={() => setActiveFloor(f.floor.toString())} className={cn("h-9 px-4 text-sm")}>د {f.floor}</Button>
                            ))}
                        </div>
                    </div>
                 </div>
            </div>
        </div>

        {selectedBuilding ? (
            <div className="space-y-8">
                {activeFloor === 'all' ? (
                     <Card className="shadow-md">
                        <CardHeader>
                            <CardTitle className="text-xl text-primary font-bold">{selectedBuilding.name} - جميع الأدوار</CardTitle>
                             <CardDescription>
                                إجمالي الشقق: {selectedBuilding.apartments.units.length} | إجمالي الأجنحة: {selectedBuilding.suites.units.length}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                           <UnitsGrid units={allUnitsInBuilding} />
                           <Legend />
                        </CardContent>
                     </Card>
                ) : (
                    (() => {
                        const floorNum = parseInt(activeFloor);
                        const counts = getUnitCountForFloor(selectedBuilding, floorNum);
                        return (
                             <Card className="shadow-md">
                                <CardHeader>
                                    <CardTitle className="text-xl text-primary font-bold">{selectedBuilding.name} - الدور {activeFloor}</CardTitle>
                                    <CardDescription>
                                        إجمالي الشقق: {counts.apartments} | إجمالي الأجنحة: {counts.suites}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <UnitsGrid units={getUnitsFor(selectedBuilding, floorNum)} />
                                    <Legend />
                                </CardContent>
                            </Card>
                        )
                    })()
                )}
            </div>
        ) : (
             <div className="text-center p-4 mb-4 bg-blue-50 text-blue-800 rounded-lg border border-blue-200">
                <p>الرجاء اختيار مبنى لعرض بياناته.</p>
            </div>
        )}
    </div>
  );
}
