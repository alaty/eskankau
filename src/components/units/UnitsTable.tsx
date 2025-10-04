
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { type Unit } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppContext } from '@/contexts/AppDataContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { Save, Trash2, PlusCircle, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PaymentPlanInfo } from './PaymentPlanInfo';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { DatePicker } from '../ui/datepicker';
import { format } from 'date-fns';


export const UnitsTable = ({ units, buildingId, unitType, floor }: { units: Unit[], buildingId: number, unitType: 'apartments' | 'suites', floor: number }) => {
    const { setBuildings, buildings, deleteUnit } = useAppContext();
    const { toast } = useToast();

    const [editedUnits, setEditedUnits] = useState<Record<string, Unit>>({});
    const [editingRentUnitId, setEditingRentUnitId] = useState<string | null>(null);


    useEffect(() => {
        // Reset changes when units prop changes
        setEditedUnits({});
    }, [units]);

    const handleInputChange = (unitId: string, field: keyof Unit, value: any) => {
        const originalUnit = units.find(u => u.id === unitId);
        if (!originalUnit) return;
        
        let processedValue = value;
        if (['baseRent', 'actualRent'].includes(field)) {
            processedValue = Number(value);
        }
        
        if (field === 'rentDate' && value instanceof Date) {
            processedValue = value.toISOString();
        }

        const newEditedUnit: Unit = {
            ...(editedUnits[unitId] || originalUnit),
            [field]: processedValue,
        };

        // When status changes, update related fields
        if (field === 'status') {
            if (value === 'rented') {
                newEditedUnit.actualRent = newEditedUnit.baseRent;
                if (!newEditedUnit.paymentStatus) {
                  newEditedUnit.paymentStatus = 'paid';
                }
            } else {
                newEditedUnit.actualRent = 0;
            }
             if (value === 'under_maintenance') {
                newEditedUnit.maintenanceStartDate = new Date().toISOString();
                newEditedUnit.statusBeforeMaintenance = originalUnit.status;
            } else {
                delete newEditedUnit.vacancyReason;
                delete newEditedUnit.maintenanceCost;
                delete newEditedUnit.maintenanceStartDate;
                delete newEditedUnit.maintenanceEndDate;
                delete newEditedUnit.statusBeforeMaintenance;
            }
        }
        
        if (field === 'paymentStatus') {
            if (value === 'paid') {
                newEditedUnit.paymentStatus = 'paid';
                newEditedUnit.actualRent = newEditedUnit.baseRent;
                delete newEditedUnit.paymentPlan;
            } else if (value === 'exempt') {
                newEditedUnit.paymentStatus = 'exempt';
                newEditedUnit.actualRent = 0;
            } else if (value === 'scholarship') {
                newEditedUnit.paymentStatus = 'scholarship';
                newEditedUnit.actualRent = 0;
            } else if (value === 'deferred') {
                newEditedUnit.paymentStatus = 'deferred';
                newEditedUnit.actualRent = 0;
                delete newEditedUnit.paymentPlan;
            }
        }
        
        if (field === 'baseRent' && newEditedUnit.status === 'rented' && newEditedUnit.paymentStatus === 'paid') {
            newEditedUnit.actualRent = processedValue;
        }


        setEditedUnits(prev => ({
            ...prev,
            [unitId]: newEditedUnit,
        }));
    };
    
    const handleSave = () => {
        const building = buildings.find(b => b.id === buildingId);
        if (!building) return;

        const updatedBuildings = buildings.map(b => {
            if (b.id === buildingId) {
                const updatedBuilding = { ...b };
                Object.values(editedUnits).forEach(editedUnit => {
                    const unitTypeKey = editedUnit.unitType === 'apartment' ? 'apartments' : 'suites';
                    const unitIndex = updatedBuilding[unitTypeKey].units.findIndex(u => u.id === editedUnit.id);
                    if (unitIndex !== -1) {
                         updatedBuilding[unitTypeKey].units[unitIndex] = editedUnit;
                    }
                });
                // Recalculate rented count
                updatedBuilding.apartments.rented = updatedBuilding.apartments.units.filter(u => u.status === 'rented').length;
                updatedBuilding.suites.rented = updatedBuilding.suites.units.filter(u => u.status === 'rented').length;

                return updatedBuilding;
            }
            return b;
        });

        setBuildings(updatedBuildings);
        setEditedUnits({});
        setEditingRentUnitId(null);
        toast({
            title: "تم الحفظ بنجاح",
            description: `تم تحديث بيانات ${Object.keys(editedUnits).length} وحدة في مبنى ${building.name}.`,
            className: "bg-green-100 border-green-400 text-green-800",
        });
    };
    
    const getStatusClass = (status: Unit['status']) => {
        switch (status) {
            case 'rented':
                return 'bg-green-100/30 text-green-800';
            case 'available':
                return 'bg-blue-100/60 text-blue-800';
            case 'under_maintenance':
                return 'bg-red-100/60 text-red-800';
            case 'office':
                return 'bg-gray-200/80 text-gray-800';
            default:
                return 'bg-transparent';
        }
    };
    
    const getPaymentStatusInfo = (unit: Unit): { label: string, className: string, isPlan: boolean, isEditable: boolean } => {
        // Priority for completed plans
        if (unit.paymentStatus === 'paid_in_full') {
            return { label: 'مسدد بالكامل', className: 'bg-green-200 text-green-900 cursor-pointer hover:bg-green-300', isPlan: true, isEditable: false };
        }

        switch (unit.paymentStatus) {
            case 'paid': 
                return { label: 'تم السداد', className: 'bg-green-200 text-green-900', isPlan: false, isEditable: true };
            case 'deferred': 
                return { label: 'مؤجل', className: 'bg-orange-200 text-orange-900', isPlan: false, isEditable: true };
            case 'exempt': 
                return { label: 'إعفاء', className: 'bg-blue-200 text-blue-900 cursor-pointer hover:bg-blue-300', isPlan: true, isEditable: false };
            case 'scholarship': 
                return { label: 'ابتعاث', className: 'bg-purple-200 text-purple-900 cursor-pointer hover:bg-purple-300', isPlan: true, isEditable: false };
            case 'payment_plan': 
                return { label: 'خطة سداد', className: 'bg-yellow-200 text-yellow-900 cursor-pointer hover:bg-yellow-300', isPlan: true, isEditable: true };
            default: 
                return { label: 'N/A', className: 'bg-gray-200 text-gray-900', isPlan: false, isEditable: false };
        }
    };
    
    const PaymentStatusCell = ({ unit }: { unit: Unit }) => {
        const paymentStatusInfo = getPaymentStatusInfo(unit);
        const isRented = unit.status === 'rented';

        if (!isRented) {
             return <span className="text-gray-400 text-xs">N/A</span>
        }
        
        if (paymentStatusInfo.isPlan) {
            return (
                <Popover>
                    <PopoverTrigger asChild>
                         <Badge variant="secondary" className={cn("h-8 w-24 text-xs justify-center rounded-md", paymentStatusInfo.className)}>
                            {paymentStatusInfo.label}
                        </Badge>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="end">
                       <PaymentPlanInfo unit={unit} />
                    </PopoverContent>
                </Popover>
            );
        }

        return (
             <Select 
                value={unit.paymentStatus || 'paid'} 
                onValueChange={(value) => handleInputChange(unit.id, 'paymentStatus', value)}
                disabled={!paymentStatusInfo.isEditable}
            >
                <SelectTrigger className={cn("h-8 w-24 text-xs rounded-md", paymentStatusInfo.className)} disabled={!paymentStatusInfo.isEditable}>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="paid" className="text-green-800 bg-green-100">تم السداد</SelectItem>
                    <SelectItem value="deferred" className="text-orange-800 bg-orange-100">مؤجل</SelectItem>
                </SelectContent>
            </Select>
        );
    }

    const renderUnitRow = (unitData: Unit) => {
        const unit = editedUnits[unitData.id] || unitData;
        const isOffice = unit.status === 'office';
        const isRented = unit.status === 'rented';
        const isEditingRent = editingRentUnitId === unit.id;

        const actualRent = unit.actualRent ?? 0;
        const lostValue = (unit.baseRent - actualRent) > 0 ? (unit.baseRent - actualRent) : 0;
        const netRent = actualRent;
        
        return (
            <TableRow key={unit.id} className="even:bg-gray-50/50">
                <TableCell className="font-mono text-xs p-1 w-[8%] text-center">{unit.unitNumber}</TableCell>
                <TableCell className="p-1 w-[13%] text-center">
                   <div className="flex items-center justify-center gap-1">
                     {isEditingRent ? (
                        <Input 
                            type="number" 
                            value={isOffice ? 0 : unit.baseRent}
                            onChange={(e) => handleInputChange(unit.id, 'baseRent', e.target.value)}
                            className="h-8 w-20 text-center bg-white"
                            autoFocus
                            onBlur={() => setEditingRentUnitId(null)}
                        />
                     ) : (
                        <span className="w-20 text-center">{formatCurrency(unit.baseRent)}</span>
                     )}
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingRentUnitId(isEditingRent ? null : unit.id)} disabled={isOffice}>
                        <Pencil className="h-3 w-3" />
                    </Button>
                   </div>
                </TableCell>
                <TableCell className="p-1 w-[12%] text-center">
                    <div className="flex justify-center">
                     <Select value={unit.status} onValueChange={(value) => handleInputChange(unit.id, 'status', value)}>
                        <SelectTrigger className={cn("h-8 w-28 text-xs", getStatusClass(unit.status))}>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="rented" className="text-green-800 bg-green-100">مؤجرة</SelectItem>
                            <SelectItem value="available" className="text-blue-800 bg-blue-100">متاحة</SelectItem>
                            <SelectItem value="under_maintenance" className="text-red-800 bg-red-100">تحت الصيانة</SelectItem>
                             <SelectItem value="office" className="text-gray-800 bg-gray-200">مكتب إداري</SelectItem>
                        </SelectContent>
                    </Select>
                    </div>
                </TableCell>
                <TableCell className="p-1 w-[12%] text-center">
                    <div className="flex justify-center">
                        <PaymentStatusCell unit={unit} />
                    </div>
                </TableCell>
                 <TableCell className="p-1 w-[12%] text-center">
                    <div className="flex justify-center">
                      <DatePicker 
                        date={unit.rentDate ? new Date(unit.rentDate) : undefined}
                        setDate={(date) => handleInputChange(unit.id, 'rentDate', date)}
                        disabled={!isRented || isOffice}
                      />
                    </div>
                </TableCell>
                <TableCell className="p-1 w-[10%] text-center">
                    <Input 
                        type="number" 
                        value={actualRent}
                        className="h-8 w-24 text-center font-semibold bg-gray-100 border-gray-200 cursor-not-allowed text-gray-700"
                        readOnly
                    />
                </TableCell>
                <TableCell className={cn("font-semibold p-1 w-[10%] text-center", lostValue > 0 ? "text-red-700" : "text-gray-500")}>{formatCurrency(lostValue)}</TableCell>
                <TableCell className="font-bold text-green-700 p-1 w-[10%] text-center">{formatCurrency(netRent)}</TableCell>
            </TableRow>
        );
    }
    
    const TableHeaderComponent = () => (
         <Table className="w-full table-fixed">
            <TableHeader>
                <TableRow>
                    <TableHead className="text-center text-xs text-muted-foreground font-bold p-2 w-[8%]">الغرفة</TableHead>
                    <TableHead className="text-center text-xs text-muted-foreground font-bold p-2 w-[13%]">قيمة الايجار الاساسي</TableHead>
                    <TableHead className="text-center text-xs text-muted-foreground font-bold p-2 w-[12%]">حالة الغرفة</TableHead>
                    <TableHead className="text-center text-xs text-muted-foreground font-bold p-2 w-[12%]">حالة السداد</TableHead>
                    <TableHead className="text-center text-xs text-muted-foreground font-bold p-2 w-[12%]">تاريخ الايجار</TableHead>
                    <TableHead className="text-center text-xs text-muted-foreground font-bold p-2 w-[10%]">المبلغ المسدد</TableHead>
                    <TableHead className="text-center text-xs text-muted-foreground font-bold p-2 w-[10%]">القيمة المفقودة</TableHead>
                    <TableHead className="text-center text-xs text-muted-foreground font-bold p-2 w-[10%]">الإيجار المحقق</TableHead>
                </TableRow>
            </TableHeader>
        </Table>
    );

    return (
        <div dir="rtl">
             <div className="border rounded-lg bg-background">
                <div className="sticky top-0 z-10 bg-muted">
                    <TableHeaderComponent />
                </div>
                <div>
                    <Table className="w-full table-fixed">
                        <TableBody>
                            {units.map(renderUnitRow)}
                        </TableBody>
                    </Table>
                </div>
            </div>
             <div className="mt-4 flex justify-end">
                {Object.keys(editedUnits).length > 0 && (
                     <Button onClick={handleSave}>
                        <Save className="ml-2 h-4 w-4" />
                        حفظ التعديلات ({Object.keys(editedUnits).length})
                    </Button>
                )}
            </div>
        </div>
    );
}
