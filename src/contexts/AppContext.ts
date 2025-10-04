
"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { BuildingData, NewBuildingData, YearlyForecastInput, Unit, MaintenanceRecord, PaymentPlan, PaymentInstallment, NewUnitData, ClaimRecord } from '@/lib/types';
import { initialBuildings } from '@/lib/defaults';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';

interface BulkRentValues {
    apartmentRent: number;
    suiteRent: number;
}

interface AppContextType {
  buildings: BuildingData[];
  updateUnit: (buildingId: number, unitId: string, updatedFields: Partial<Unit>) => void;
  updateUnitStatus: (buildingId: number, unitType: 'apartments' | 'suites', unitId: string, status: Unit['status'], reason?: Unit['vacancyReason']) => void;
  updatePaymentPlan: (buildingId: number, unitId: string, plan: PaymentPlan | null) => void;
  archiveCompletedPlan: (buildingId: number, unitId: string) => void;
  completeMaintenance: (unit: Unit) => void;
  addBuilding: (newBuildingData: any) => void;
  deleteBuilding: (id: number) => void;
  addUnit: (buildingId: number, unitType: 'apartments' | 'suites', floor: number, newData: NewUnitData) => void;
  deleteUnit: (buildingId: number, unitId: string) => void;
  setBuildings: (buildings: BuildingData[]) => void;
  loading: boolean;
  forecastInputs: YearlyForecastInput[];
  saveForecastInputs: (forecasts: YearlyForecastInput[]) => void;
  updateAllBaseRents: (apartmentRent: number, suiteRent: number) => void;
  bulkRentValues: BulkRentValues;
  updateAllPaymentStatuses: (scope: 'all_rented' | 'rented_apartments' | 'rented_suites', paymentStatus: 'paid' | 'deferred') => void;
  logClaimAction: (buildingId: number, unitId:string, action: string) => void;
  cancelMaintenance: (buildingId: number, unitId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [forecastInputs, setForecastInputsState] = useState<YearlyForecastInput[]>([]);
  const [bulkRentValues, setBulkRentValuesState] = useState<BulkRentValues>({ apartmentRent: 1700, suiteRent: 3000 });
  
  const { toast } = useToast();

  useEffect(() => {
    try {
        const storedData = localStorage.getItem('appData');
        if (storedData) {
            const parsedData = JSON.parse(storedData);
            setBuildings(parsedData.buildings || initialBuildings);
            setForecastInputsState(parsedData.forecastInputs || []);
            setBulkRentValuesState(parsedData.bulkRentValues || { apartmentRent: 1700, suiteRent: 3000 });
        } else {
            setBuildings(initialBuildings);
        }
    } catch (error) {
        console.error("Failed to load data from localStorage, falling back to initial data.", error);
        setBuildings(initialBuildings);
    }
    setLoading(false);
  }, []);

  const saveData = (newBuildings: BuildingData[], newForecasts?: YearlyForecastInput[], newBulkRents?: BulkRentValues) => {
      try {
          const dataToSave = {
              buildings: newBuildings,
              forecastInputs: newForecasts ?? forecastInputs,
              bulkRentValues: newBulkRents ?? bulkRentValues,
          };
          localStorage.setItem('appData', JSON.stringify(dataToSave));
          setBuildings(newBuildings);
          if (newForecasts) setForecastInputsState(newForecasts);
          if (newBulkRents) setBulkRentValuesState(newBulkRents);
      } catch (error) {
          console.error("Failed to save data to localStorage", error);
          toast({
              variant: 'destructive',
              title: 'خطأ في الحفظ',
              description: 'لا يمكن حفظ البيانات في المتصفح.'
          });
      }
  };

  const saveForecastInputs = (forecasts: YearlyForecastInput[]) => {
    saveData(buildings, forecasts);
  };
  
   const updateUnit = (buildingId: number, unitId: string, updatedFields: Partial<Unit>) => {
    const newBuildings = buildings.map(b => {
      if (b.id === buildingId) {
        const unitType = b.apartments.units.some(u => u.id === unitId) ? 'apartments' : 'suites';
        const updatedUnits = b[unitType].units.map(u => u.id === unitId ? { ...u, ...updatedFields } : u);
        return { ...b, [unitType]: { ...b[unitType], units: updatedUnits } };
      }
      return b;
    });
    saveData(newBuildings);
  };
  
   const addBuilding = (newBuildingData: any) => {
    const nextId = buildings.length > 0 ? Math.max(...buildings.map(b => b.id)) + 1 : 1;
    
    const generateUnits = (buildingId: number, unitType: 'apartment' | 'suite', floorConfig: { floor: number, count: number }[], baseRent: number): Unit[] => {
        let units: Unit[] = [];
        let startNumber = 1;
        floorConfig.forEach(({ floor, count }) => {
            for (let i = 0; i < count; i++) {
                const unitNumber = startNumber + i;
                units.push({
                    id: `B${buildingId}-F${floor}-${unitType.charAt(0).toUpperCase()}${unitNumber.toString().padStart(3, '0')}-${Date.now()}`,
                    buildingId: buildingId,
                    floor: floor,
                    unitType: unitType,
                    unitNumber: unitNumber,
                    status: 'available',
                    baseRent: baseRent,
                    maintenanceHistory: [],
                    claimHistory: [],
                });
            }
            startNumber += count;
        });
        return units;
    };

    const apartmentsUnits = generateUnits(nextId, 'apartment', newBuildingData.apartments.floorConfig, newBuildingData.apartments.rent);
    const suitesUnits = generateUnits(nextId, 'suite', newBuildingData.suites.floorConfig, newBuildingData.suites.rent);

    const newBuilding: BuildingData = {
        id: nextId,
        name: newBuildingData.name,
        apartments: {
            total: newBuildingData.apartments.total,
            rented: 0,
            rent: newBuildingData.apartments.rent,
            units: apartmentsUnits,
        },
        suites: {
            total: newBuildingData.suites.total,
            rented: 0,
            rent: newBuildingData.suites.rent,
            units: suitesUnits,
        },
    };
    saveData([...buildings, newBuilding]);
  };
  
  const deleteBuilding = (id: number) => {
    saveData(buildings.filter(building => building.id !== id));
  };
  
  const addUnit = (buildingId: number, unitType: 'apartments' | 'suites', floor: number, newData: NewUnitData) => {
    const newBuildings = buildings.map(b => {
        if (b.id === buildingId) {
            const newUnit: Unit = {
                id: `B${buildingId}-F${floor}-${unitType.charAt(0).toUpperCase()}${newData.unitNumber.toString().padStart(3, '0')}-${Date.now()}`,
                buildingId: buildingId,
                floor: floor,
                unitType: unitType === 'apartments' ? 'apartment' : 'suite',
                unitNumber: newData.unitNumber,
                status: 'available',
                baseRent: newData.baseRent,
                maintenanceHistory: [],
                claimHistory: [],
            };

            const updatedUnits = [...b[unitType].units, newUnit].sort((a,b) => a.unitNumber - b.unitNumber);

            return {
                ...b,
                [unitType]: {
                    ...b[unitType],
                    units: updatedUnits,
                    total: updatedUnits.length
                }
            };
        }
        return b;
    });
    saveData(newBuildings);
  };

  const updateUnitStatus = (buildingId: number, unitType: 'apartments' | 'suites', unitId: string, status: Unit['status'], reason?: Unit['vacancyReason']) => {
    const newBuildings = buildings.map(building => {
        if (building.id === buildingId) {
            const updatedUnits = building[unitType].units.map(unit => {
                if (unit.id === unitId) {
                    const updatedUnit: Unit = { ...unit, status };
                    if (status === 'under_maintenance') {
                        updatedUnit.vacancyReason = reason || 'none';
                        updatedUnit.maintenanceStartDate = new Date().toISOString();
                        updatedUnit.statusBeforeMaintenance = unit.status;
                    } else {
                        delete updatedUnit.vacancyReason;
                        delete updatedUnit.maintenanceCost;
                        delete updatedUnit.maintenanceStartDate;
                        delete updatedUnit.maintenanceEndDate;
                        delete updatedUnit.statusBeforeMaintenance;
                    }
                    return updatedUnit;
                }
                return unit;
            });
            return { ...building, [unitType]: { ...building[unitType], units: updatedUnits } };
        }
        return building;
    });
    saveData(newBuildings);
  };

  const updatePaymentPlan = (buildingId: number, unitId: string, plan: PaymentPlan | null) => {
    const newBuildings = buildings.map(b => {
      if (b.id === buildingId) {
        const unitType = b.apartments.units.some(u => u.id === unitId) ? 'apartments' : 'suites';
        const updatedUnits = b[unitType].units.map(u => {
          if (u.id === unitId) {
            const updatedUnit: Unit = { ...u };
            if (plan) {
              updatedUnit.paymentPlan = { ...plan, completedDate: undefined };
              delete updatedUnit.planArchived;
              
              const installments = plan.installments || plan.stipendDeductions;
              const areAllInstallmentsPaid = installments ? installments.every(inst => inst.isPaid) : false;

              if ((plan.type === 'installment' || plan.type === 'stipend') && areAllInstallmentsPaid) {
                  updatedUnit.paymentStatus = 'paid_in_full';
                  updatedUnit.paymentPlan.completedDate = new Date().toISOString();
                  updatedUnit.actualRent = updatedUnit.baseRent;
              } else if (plan.type === 'exempt' || plan.type === 'scholarship') {
                  updatedUnit.paymentStatus = plan.type;
                  updatedUnit.actualRent = 0;
              } else if (plan.type === 'installment' || plan.type === 'stipend') {
                  const totalPaidFromInstallments = (installments || []).filter(inst => inst.isPaid).reduce((sum, inst) => sum + inst.amount, 0);
                  updatedUnit.paymentStatus = 'payment_plan';
                  updatedUnit.actualRent = totalPaidFromInstallments;
              } else if (plan.type === 'deferred') {
                  updatedUnit.paymentStatus = 'deferred';
                  updatedUnit.actualRent = 0;
              }
            } else {
                updatedUnit.paymentStatus = 'paid';
                updatedUnit.actualRent = updatedUnit.baseRent;
                delete updatedUnit.paymentPlan;
            }
            return updatedUnit;
          }
          return u;
        });
        return { ...b, [unitType]: { ...b[unitType], units: updatedUnits } };
      }
      return b;
    });
    saveData(newBuildings);
  };
  
  const archiveCompletedPlan = (buildingId: number, unitId: string) => {
    const newBuildings = buildings.map(b => {
      if (b.id === buildingId) {
        const unitType = b.apartments.units.some(u => u.id === unitId) ? 'apartments' : 'suites';
        const updatedUnits = b[unitType].units.map(u => {
          if (u.id === unitId) {
            return { ...u, paymentStatus: 'paid', actualRent: u.baseRent, planArchived: true };
          }
          return u;
        });
        return { ...b, [unitType]: { ...b[unitType], units: updatedUnits } };
      }
      return b;
    });
    saveData(newBuildings);
  };

  const completeMaintenance = (unitToUpdate: Unit) => {
    const archiveRecord: MaintenanceRecord = {
      id: `maint-${unitToUpdate.id}-${new Date().getTime()}`,
      startDate: unitToUpdate.maintenanceStartDate || new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      expectedEndDate: unitToUpdate.maintenanceEndDate,
      cost: unitToUpdate.maintenanceCost || 0,
      type: unitToUpdate.vacancyReason || 'none',
      description: `Completed maintenance for unit ${unitToUpdate.unitNumber}`
    };

    const newBuildings = buildings.map(building => {
        if (building.id === unitToUpdate.buildingId) {
            const unitTypeKey = unitToUpdate.unitType === 'apartment' ? 'apartments' : 'suites';
            const updatedUnits = building[unitTypeKey].units.map(unit => {
                if (unit.id === unitToUpdate.id) {
                    const updatedUnit: Unit = { 
                      ...unit, 
                      status: unit.statusBeforeMaintenance || 'available',
                      maintenanceHistory: [...(unit.maintenanceHistory || []), archiveRecord],
                    };
                    delete updatedUnit.vacancyReason;
                    delete updatedUnit.maintenanceCost;
                    delete updatedUnit.maintenanceStartDate;
                    delete updatedUnit.maintenanceEndDate;
                    delete updatedUnit.statusBeforeMaintenance;
                    return updatedUnit;
                }
                return unit;
            });
            return { ...building, [unitTypeKey]: { ...building[unitTypeKey], units: updatedUnits } };
        }
        return building;
    });
    saveData(newBuildings);
  };

  const cancelMaintenance = (buildingId: number, unitId: string) => {
    const unit = buildings.flatMap(b => [...b.apartments.units, ...b.suites.units]).find(u => u.id === unitId);
    if (!unit) return;

    updateUnit(buildingId, unitId, {
      status: unit.statusBeforeMaintenance || 'available',
      vacancyReason: undefined,
      maintenanceCost: undefined,
      maintenanceStartDate: undefined,
      maintenanceEndDate: undefined,
      statusBeforeMaintenance: undefined,
    });
  };
  
  const deleteUnit = (buildingId: number, unitId: string) => {
    const newBuildings = buildings.map(b => {
        if (b.id === buildingId) {
            const unitType = b.apartments.units.some(u => u.id === unitId) ? 'apartments' : 'suites';
            const updatedUnits = b[unitType].units.filter(u => u.id !== unitId);
            return { ...b, [unitType]: { ...b[unitType], units: updatedUnits } };
        }
        return b;
    });
    saveData(newBuildings);
  };

  const updateAllBaseRents = (apartmentRent: number, suiteRent: number) => {
    const updatedBuildings = buildings.map(b => {
        const updatedAptUnits = b.apartments.units.map(u => ({ ...u, baseRent: apartmentRent }));
        const updatedSuiteUnits = b.suites.units.map(u => ({ ...u, baseRent: suiteRent }));
        return {
            ...b,
            apartments: { ...b.apartments, units: updatedAptUnits },
            suites: { ...b.suites, units: updatedSuiteUnits }
        };
    });
    const newBulkValues = { apartmentRent, suiteRent };
    setBulkRentValuesState(newBulkValues);
    saveData(updatedBuildings, undefined, newBulkValues);
  };
  
  const updateAllPaymentStatuses = (scope: 'all_rented' | 'rented_apartments' | 'rented_suites', paymentStatus: 'paid' | 'deferred') => {
      const updatedBuildings = buildings.map(b => {
        const updateUnits = (units: Unit[]) => units.map(u => {
            if (u.status === 'rented') {
                const updatedUnit = { ...u, paymentStatus };
                if (paymentStatus === 'paid') {
                    updatedUnit.actualRent = updatedUnit.baseRent;
                    delete updatedUnit.paymentPlan;
                } else if (paymentStatus === 'deferred') {
                    updatedUnit.actualRent = 0;
                    delete updatedUnit.paymentPlan;
                }
                return updatedUnit;
            }
            return u;
        });

        let updatedApartments = b.apartments;
        if (scope === 'all_rented' || scope === 'rented_apartments') {
            updatedApartments = { ...b.apartments, units: updateUnits(b.apartments.units) };
        }

        let updatedSuites = b.suites;
        if (scope === 'all_rented' || scope === 'rented_suites') {
            updatedSuites = { ...b.suites, units: updateUnits(b.suites.units) };
        }

        return { ...b, apartments: updatedApartments, suites: updatedSuites };
      });
      saveData(updatedBuildings);
  };

  const logClaimAction = (buildingId: number, unitId: string, action: string) => {
    const newClaim: ClaimRecord = {
        id: `claim-${Date.now()}`,
        date: new Date().toISOString(),
        action: action,
    };
    
    const unit = buildings.flatMap(b => [...b.apartments.units, ...b.suites.units]).find(u => u.id === unitId);
    if (!unit) return;
    
    updateUnit(buildingId, unitId, { claimHistory: [...(unit.claimHistory || []), newClaim] });
  };

  return (
    <AppContext.Provider value={{ 
        buildings, 
        updateUnit,
        updateUnitStatus,
        updatePaymentPlan,
        archiveCompletedPlan,
        completeMaintenance,
        cancelMaintenance,
        addBuilding, 
        deleteBuilding,
        addUnit,
        deleteUnit,
        setBuildings: saveData, 
        loading, 
        forecastInputs,
        saveForecastInputs,
        updateAllBaseRents,
        bulkRentValues,
        updateAllPaymentStatuses,
        logClaimAction
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppDataProvider');
  }
  return context;
};
