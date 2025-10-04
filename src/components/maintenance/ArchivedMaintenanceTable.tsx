
"use client";

import React from 'react';
import { type Unit } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface AggregatedRecord {
    unit: Unit;
    count: number;
    totalCost: number;
    actualRevenue: number;
}

interface ArchivedMaintenanceTableProps {
  records: AggregatedRecord[];
}

export const ArchivedMaintenanceTable = ({ records }: ArchivedMaintenanceTableProps) => {

    if (records.length === 0) {
        return <p className="text-center text-muted-foreground p-4">لا توجد سجلات صيانة مؤرشفة لتحليلها.</p>;
    }
  
    const ProfitLoss = ({ value }: { value: number }) => {
        const isLoss = value < 0;
        return (
            <span className={cn(
                "font-bold",
                isLoss ? "text-red-600" : "text-green-600"
            )}>
                {formatCurrency(value)}
            </span>
        );
    };

  return (
    <div className="overflow-x-auto border rounded-lg">
        <Table>
            <TableHeader>
                <TableRow className="bg-muted">
                    <TableHead>المبنى/الغرفة</TableHead>
                    <TableHead className="text-center">عدد مرات الصيانة</TableHead>
                    <TableHead className="text-center">إجمالي تكاليف الصيانة</TableHead>
                    <TableHead className="text-center">الإيراد الفعلي</TableHead>
                    <TableHead className="text-center">الربح / الخسارة</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {records.map(({ unit, count, totalCost, actualRevenue }) => {
                    const profitLoss = actualRevenue - totalCost;
                    return (
                        <TableRow key={unit.id}>
                            <TableCell>
                                 <div className="font-medium">مبنى {unit.buildingId} - {unit.unitNumber}</div>
                                 <div className="text-xs text-muted-foreground">{unit.unitType === 'apartment' ? 'شقة' : 'جناح'}</div>
                            </TableCell>
                            <TableCell className="text-center font-medium">{count}</TableCell>
                            <TableCell className="text-center font-semibold text-red-700">{formatCurrency(totalCost)}</TableCell>
                            <TableCell className="text-center font-semibold text-blue-700">{formatCurrency(actualRevenue)}</TableCell>
                            <TableCell className="text-center">
                                <ProfitLoss value={profitLoss} />
                            </TableCell>
                        </TableRow>
                    )
                })}
            </TableBody>
        </Table>
    </div>
  );
};
