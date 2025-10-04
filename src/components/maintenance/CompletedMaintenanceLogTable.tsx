
"use client";

import React from 'react';
import { type Unit, type MaintenanceRecord } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CheckCircle, AlertTriangle, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

interface CompletedMaintenanceLogTableProps {
  records: { unit: Unit, record: MaintenanceRecord }[];
}

const maintenanceTypeLabels: { [key: string]: string } = {
  maintenance: "صيانة عامة",
  furniture: "أثاث",
  electrical: "كهرباء",
  painting: "دهانات",
  none: "أخرى",
};

export const CompletedMaintenanceLogTable = ({ records }: CompletedMaintenanceLogTableProps) => {

    if (records.length === 0) {
        return <p className="text-center text-muted-foreground p-4">لا توجد سجلات صيانة مكتملة.</p>;
    }
    
    const getStatusBadge = (record: MaintenanceRecord) => {
        if (!record.expectedEndDate) {
            return (
                <Badge variant="secondary" className="bg-gray-200 text-gray-800">
                    <CheckCircle className="ml-1 h-3 w-3" />
                    مكتمل
                </Badge>
            )
        }

        const actualEndDate = new Date(record.endDate);
        actualEndDate.setHours(0,0,0,0);
        const expectedEndDate = new Date(record.expectedEndDate);
        expectedEndDate.setHours(0,0,0,0);
        
        if (actualEndDate < expectedEndDate) {
             return (
                <Badge variant="secondary" className="bg-blue-200 text-blue-800">
                    <Sparkles className="ml-1 h-3 w-3" />
                    إنجاز مبكر
                </Badge>
            );
        }
        
        if (actualEndDate > expectedEndDate) {
            return (
                 <Badge variant="destructive" className="bg-red-200 text-red-800">
                    <AlertTriangle className="ml-1 h-3 w-3" />
                    متأخرة
                </Badge>
            );
        }

        return (
             <Badge variant="secondary" className="bg-green-200 text-green-800">
                <CheckCircle className="ml-1 h-3 w-3" />
                في الوقت المحدد
            </Badge>
        );
    };

  return (
    <div className="overflow-x-auto border rounded-lg">
        <Table>
            <TableHeader>
                <TableRow className="bg-muted">
                    <TableHead>المبنى/الغرفة</TableHead>
                    <TableHead className="text-center">نوع الصيانة</TableHead>
                    <TableHead className="text-center">تاريخ البدء</TableHead>
                    <TableHead className="text-center">الانتهاء المتوقع</TableHead>
                    <TableHead className="text-center">الانتهاء الفعلي</TableHead>
                    <TableHead className="text-center">مدة الصيانة (أيام)</TableHead>
                    <TableHead className="text-center">التكلفة</TableHead>
                    <TableHead className="text-center">الحالة</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {records.map(({ unit, record }) => {
                    const startDate = new Date(record.startDate);
                    const actualEndDate = new Date(record.endDate);
                    const durationInDays = Math.round((actualEndDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                    
                    return (
                        <TableRow key={record.id}>
                            <TableCell>
                                 <div className="font-medium">مبنى {unit.buildingId} / {unit.unitNumber}</div>
                                 <div className="text-xs text-muted-foreground">{unit.unitType === 'apartment' ? 'شقة' : 'جناح'}</div>
                            </TableCell>
                            <TableCell className="text-center">
                                <Badge variant="outline">{maintenanceTypeLabels[record.type] || record.type}</Badge>
                            </TableCell>
                            <TableCell className="text-center">{format(startDate, 'yyyy-MM-dd')}</TableCell>
                            <TableCell className="text-center">{record.expectedEndDate ? format(new Date(record.expectedEndDate), 'yyyy-MM-dd') : '-'}</TableCell>
                            <TableCell className="text-center">{format(actualEndDate, 'yyyy-MM-dd')}</TableCell>
                            <TableCell className="text-center font-medium">{durationInDays >= 0 ? durationInDays : 0}</TableCell>
                            <TableCell className="text-center font-semibold text-red-700">{formatCurrency(record.cost)}</TableCell>
                            <TableCell className="text-center">
                                {getStatusBadge(record)}
                            </TableCell>
                        </TableRow>
                    )
                })}
            </TableBody>
        </Table>
    </div>
  );
};
