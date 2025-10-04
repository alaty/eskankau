
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
  
    const Evaluation = ({ ratio }: { ratio: number }) => {
        if (ratio < 5) {
            return <Badge variant="secondary" className="bg-green-100 text-green-800"><TrendingUp className="ml-1 h-3 w-3" /> تكلفة منخفضة</Badge>;
        }
        if (ratio < 15) {
            return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><TrendingDown className="ml-1 h-3 w-3" /> تكلفة متوسطة</Badge>;
        }
        return <Badge variant="destructive"><TrendingDown className="ml-1 h-3 w-3" /> تكلفة مرتفعة</Badge>;
    }


  return (
    <div className="overflow-x-auto border rounded-lg">
        <Table>
            <TableHeader>
                <TableRow className="bg-muted">
                    <TableHead>المبنى/الغرفة</TableHead>
                    <TableHead className="text-center">عدد الصيانات</TableHead>
                    <TableHead className="text-center">التكلفة الإجمالية</TableHead>
                    <TableHead className="text-center">نسبة التكلفة/الإيجار</TableHead>
                    <TableHead className="text-center">التقييم</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {records.map(({ unit, count, totalCost }) => {
                    const costToRentRatio = unit.baseRent > 0 ? (totalCost / unit.baseRent) * 100 : 0;
                    return (
                        <TableRow key={unit.id}>
                            <TableCell>
                                <div className="font-medium">مبنى {unit.buildingId} / {unit.unitNumber}</div>
                            </TableCell>
                            <TableCell className="text-center font-medium">{count}</TableCell>
                            <TableCell className="text-center font-semibold text-red-600">{formatCurrency(totalCost)}</TableCell>
                            <TableCell className="text-center font-bold text-gray-700">{costToRentRatio.toFixed(1)}%</TableCell>
                            <TableCell className="text-center">
                                <Evaluation ratio={costToRentRatio} />
                            </TableCell>
                        </TableRow>
                    )
                })}
            </TableBody>
        </Table>
    </div>
  );
};
