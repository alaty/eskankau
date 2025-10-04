
"use client";

import React, { useState, useEffect } from 'react';
import { type Unit } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppContext } from '@/contexts/AppDataContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save, CheckCircle, AlertTriangle, Trash2, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DatePicker } from '../ui/datepicker';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
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


export const ActiveMaintenanceTable = ({ units }: { units: Unit[] }) => {
    const { updateUnit, completeMaintenance, cancelMaintenance } = useAppContext();
    const { toast } = useToast();
    const [editedUnits, setEditedUnits] = useState<Record<string, Partial<Unit>>>({});

    useEffect(() => {
        // When the parent 'units' prop changes (e.g., after a save),
        // we should clear the local 'editedUnits' state to avoid stale data.
        setEditedUnits({});
    }, [units]);

    const handleInputChange = (unitId: string, field: keyof Unit, value: any) => {
        let processedValue = value;
        // Ensure dates are handled as ISO strings
        if ((field === 'maintenanceStartDate' || field === 'maintenanceEndDate') && value instanceof Date) {
            processedValue = value.toISOString();
        } else if (field === 'maintenanceCost') {
            processedValue = Number(value); 
        }

        setEditedUnits(prev => ({
            ...prev,
            [unitId]: {
                ...(prev[unitId] || {}),
                [field]: processedValue
            }
        }));
    };
    
    const handleSave = (unitId: string) => {
        const originalUnit = units.find(u => u.id === unitId);
        const changes = editedUnits[unitId];
        if (!originalUnit || !changes) return;

        // The updateUnit function in context handles merging and saving.
        // We only need to pass the changes.
        updateUnit(originalUnit.buildingId, originalUnit.id, changes);
        
        toast({
            title: "تم الحفظ",
            description: `تم حفظ التغييرات للوحدة ${originalUnit.unitNumber}.`,
            className: "bg-green-100 border-green-400 text-green-800",
        });
    };

    const handleComplete = (unit: Unit) => {
        if (!unit.maintenanceEndDate || !unit.vacancyReason || unit.vacancyReason === 'none') {
             toast({
                variant: "destructive",
                title: "بيانات غير مكتملة",
                description: `الرجاء تحديد نوع الصيانة وتاريخ الانتهاء المتوقع قبل إتمام العملية.`,
            });
            return;
        }
        completeMaintenance(unit);
    };

    const handleCancelMaintenance = (unitId: string) => {
        const unit = units.find(u => u.id === unitId);
        if (unit) {
            cancelMaintenance(unit.buildingId, unit.id);
        }
    };

    if (units.length === 0) {
        return <p className="text-center text-muted-foreground p-4">لا توجد وحدات في الصيانة حاليًا.</p>;
    }

    const isOverdue = (unit: Unit) => {
        if (!unit.maintenanceEndDate) return false;
        const today = new Date();
        today.setHours(0,0,0,0);
        const endDate = new Date(unit.maintenanceEndDate);
        return endDate < today;
    };


    return (
        <div className="overflow-x-auto border rounded-lg">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted">
                        <TableHead className="w-[15%]">المبنى/الغرفة</TableHead>
                        <TableHead className="w-[20%]">نوع الصيانة</TableHead>
                        <TableHead className="w-[17%]">تاريخ البدء</TableHead>
                        <TableHead className="w-[17%]">تاريخ الانتهاء المتوقع</TableHead>
                        <TableHead className="w-[12%]">التكلفة</TableHead>
                        <TableHead className="w-[19%]">الإجراءات</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {units.map(unit => {
                        // The source of truth is the 'unit' from props.
                        // We layer the 'editedUnitData' on top for display purposes until saved.
                        const editedUnitData = editedUnits[unit.id] || {};
                        const currentUnitStateToDisplay = { ...unit, ...editedUnitData };
                        const hasUnsavedChanges = Object.keys(editedUnitData).length > 0;
                        const overdue = isOverdue(currentUnitStateToDisplay);
                        
                        const isSaveDisabled = 
                            !hasUnsavedChanges || 
                            !currentUnitStateToDisplay.maintenanceEndDate || 
                            !currentUnitStateToDisplay.vacancyReason || 
                            currentUnitStateToDisplay.vacancyReason === 'none' ||
                            currentUnitStateToDisplay.maintenanceCost === undefined;


                        return (
                            <TableRow key={unit.id} className={cn(overdue ? 'bg-red-100 hover:bg-red-200/60' : 'bg-yellow-50 hover:bg-yellow-100/60')}>
                                <TableCell>
                                    <div className="font-medium">مبنى {unit.buildingId} / {unit.unitNumber}</div>
                                    <div className="text-xs text-muted-foreground">{unit.unitType === 'apartment' ? 'شقة' : 'جناح'}</div>
                                </TableCell>
                                <TableCell>
                                    <Select 
                                        value={currentUnitStateToDisplay.vacancyReason || 'none'} 
                                        onValueChange={(value) => handleInputChange(unit.id, 'vacancyReason', value)}
                                    >
                                        <SelectTrigger className="h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="maintenance">صيانة عامة</SelectItem>
                                            <SelectItem value="furniture">أثاث</SelectItem>
                                            <SelectItem value="electrical">كهرباء</SelectItem>
                                            <SelectItem value="painting">دهانات</SelectItem>
                                            <SelectItem value="none">أخرى</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "w-[150px] justify-start text-left font-normal h-9 text-xs bg-gray-100 text-gray-500 cursor-not-allowed"
                                      )}
                                      disabled={true}
                                    >
                                      <Calendar className="mr-2 h-4 w-4" />
                                      {currentUnitStateToDisplay.maintenanceStartDate ? format(new Date(currentUnitStateToDisplay.maintenanceStartDate), "PPP") : 'غير محدد'}
                                    </Button>
                                </TableCell>
                                 <TableCell className="relative">
                                    {overdue && <AlertTriangle className="absolute top-1 right-1 h-4 w-4 text-destructive" />}
                                    <DatePicker
                                        date={currentUnitStateToDisplay.maintenanceEndDate ? new Date(currentUnitStateToDisplay.maintenanceEndDate) : undefined}
                                        setDate={(date) => handleInputChange(unit.id, 'maintenanceEndDate', date)}
                                        disablePastDates={true}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input 
                                        type="number" 
                                        value={currentUnitStateToDisplay.maintenanceCost ?? ''}
                                        onChange={(e) => handleInputChange(unit.id, 'maintenanceCost', e.target.value)}
                                        placeholder="0"
                                        className="h-9 w-full"
                                    />
                                </TableCell>
                                <TableCell>
                                    <div className="flex gap-2">
                                        <Button size="sm" onClick={() => handleSave(unit.id)} disabled={isSaveDisabled} variant="outline">
                                            <Save className="ml-1 h-4 w-4" /> حفظ
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                                    <CheckCircle className="ml-1 h-4 w-4" /> تمت الصيانة
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>هل أنت متأكد من إنهاء الصيانة؟</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        سيؤدي هذا الإجراء إلى إنهاء عملية الصيانة لهذه الوحدة وترحيلها إلى الأرشيف. لا يمكن التراجع عن هذا الإجراء.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>تراجع</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleComplete(currentUnitStateToDisplay)} className="bg-green-600 hover:bg-green-700">تأكيد الإنهاء</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                 <Button size="sm" variant="destructive" className="bg-red-500 hover:bg-red-600">
                                                    <Trash2 className="ml-1 h-4 w-4" /> إلغاء
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>إلغاء الصيانة</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        هل أنت متأكد من إلغاء عملية الصيانة لهذه الوحدة؟ سيؤدي هذا إلى إعادة حالتها إلى حالتها السابقة قبل الصيانة، ولن يتم أرشفة هذه العملية.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>تراجع</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleCancelMaintenance(unit.id)} className="bg-blue-600 hover:bg-blue-700">تأكيد الإلغاء</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
};
