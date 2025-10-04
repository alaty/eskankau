
"use client";

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddUnitForm } from './AddUnitForm';
import { CreateBuildingForm } from './CreateBuildingForm';
import { DeleteBuildingForm } from './DeleteBuildingForm';
import { DeleteUnitForm } from './DeleteUnitForm';
import { PlusCircle, Trash2, Building, Home } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export function AddPageClient() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
       <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary font-headline flex items-center justify-center gap-3">
          <PlusCircle className="h-8 w-8" />
          إدارة المباني والوحدات
        </h1>
        <p className="text-muted-foreground mt-2 text-lg max-w-2xl mx-auto">
          من هنا يمكنك إدارة المباني والوحدات السكنية من خلال عمليات الإضافة والحذف.
        </p>
      </div>

      <div className="space-y-12">
        {/* Buildings Management Card */}
        <Card className="shadow-lg border-t-4 border-accent">
            <CardHeader>
                <CardTitle className="flex items-center gap-3 text-accent-foreground">
                    <Building className="h-7 w-7" />
                    إدارة المباني
                </CardTitle>
                <CardDescription>
                    إضافة مبنى جديد إلى النظام أو حذف مبنى قائم.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="add_building" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="add_building">
                            <PlusCircle className="ml-2 h-5 w-5" />
                            إضافة مبنى
                        </TabsTrigger>
                        <TabsTrigger value="delete_building" className="text-destructive">
                            <Trash2 className="ml-2 h-5 w-5" />
                            حذف مبنى
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="add_building">
                        <CreateBuildingForm />
                    </TabsContent>
                    <TabsContent value="delete_building">
                        <DeleteBuildingForm />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>

        {/* Units Management Card */}
        <Card className="shadow-lg border-t-4 border-primary">
            <CardHeader>
                 <CardTitle className="flex items-center gap-3 text-primary">
                    <Home className="h-7 w-7" />
                    إدارة الوحدات السكنية
                </CardTitle>
                <CardDescription>
                    إضافة وحدة جديدة (شقة أو جناح) إلى مبنى محدد أو حذف وحدة قائمة.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="add_unit" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="add_unit">
                            <PlusCircle className="ml-2 h-5 w-5" />
                            إضافة وحدة
                        </TabsTrigger>
                        <TabsTrigger value="delete_unit" className="text-destructive">
                            <Trash2 className="ml-2 h-5 w-5" />
                            حذف وحدة
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="add_unit">
                        <AddUnitForm />
                    </TabsContent>
                    <TabsContent value="delete_unit">
                        <DeleteUnitForm />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
