
"use client";

import React from 'react';
import { type Unit } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileWarning, Download, Printer } from 'lucide-react';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';


interface ArchivedClaimsTableProps {
  unitsWithClaims: Unit[];
}

export const ArchivedClaimsTable = ({ unitsWithClaims }: ArchivedClaimsTableProps) => {
    const { toast } = useToast();

    if (unitsWithClaims.length === 0) {
        return (
            <div className="border rounded-lg p-4 text-center text-muted-foreground">
                لا توجد مطالبات مؤرشفة حتى الآن.
            </div>
        );
    }
    
    const handlePrint = () => {
        window.print();
    };

    const handleExport = () => {
        try {
            const dataToExport = unitsWithClaims.map(unit => {
                return {
                    'المبنى/الغرفة': `${unit.buildingId} / ${unit.unitNumber}`,
                    'نوع الوحدة': unit.unitType === 'apartment' ? 'شقة' : 'جناح',
                    'إجمالي عدد المطالبات': unit.claimHistory?.length || 0,
                };
            });

            const ws = XLSX.utils.json_to_sheet(dataToExport);
            ws["!rtl"] = true;
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "أرشيف المطالبات");

            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            saveAs(new Blob([wbout], { type: "application/octet-stream" }), `أرشيف_المطالبات_${new Date().toISOString().split('T')[0]}.xlsx`);

            toast({
                title: "تم التصدير بنجاح",
                description: "تم تصدير أرشيف المطالبات إلى ملف Excel.",
                className: "bg-green-100 border-green-400 text-green-800",
            });

        } catch (error) {
            console.error("Export failed:", error);
            toast({
                variant: "destructive",
                title: "خطأ في التصدير"
            });
        }
    };


    return (
         <div className="space-y-4">
            <div className="flex justify-end gap-2 no-print">
                 <Button onClick={handleExport} variant="outline"><Download className="ml-2 h-4 w-4" /> تصدير إكسل</Button>
                 <Button onClick={handlePrint}><Printer className="ml-2 h-4 w-4" /> طباعة</Button>
            </div>
            <div className="overflow-x-auto border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted">
                            <TableHead className="text-center">المبنى/الغرفة</TableHead>
                            <TableHead className="text-center">نوع الوحدة</TableHead>
                            <TableHead className="text-center">إجمالي عدد المطالبات الموثقة</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {unitsWithClaims.map(unit => (
                            <TableRow key={unit.id}>
                                <TableCell className="font-medium text-center">
                                    {unit.buildingId} / {unit.unitNumber}
                                </TableCell>
                                <TableCell className="text-center">
                                    {unit.unitType === 'apartment' ? 'شقة' : 'جناح'}
                                </TableCell>
                                <TableCell className="text-center font-bold text-lg text-primary">
                                    {unit.claimHistory?.length || 0}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};
