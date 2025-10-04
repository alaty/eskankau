
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { KeyRound, ShieldCheck, NotebookPen, AlertTriangle, PlusCircle, Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '../ui/textarea';
import { useToast } from '@/hooks/use-toast';

const CORRECT_PASSWORD = "0200";
const NOTES_STORAGE_KEY = "siteStructureNotesArray";

interface Note {
    id: string;
    title: string;
    content: string;
}

const defaultContent: Note[] = [{
    id: `note-${Date.now()}`,
    title: "بنية التطبيق ومركزية البيانات",
    content: `لقد تم تصميم التطبيق بحيث تكون جميع بيانات المباني والغرف مُدارة مركزيًا من خلال ما يعرف بـ \`AppDataContext\`. هذا المكون يعمل كـ "مصدر الحقيقة الوحيد" في النظام. أي تغيير يحدث على حالة غرفة يتم تسجيله في هذا المركز. وبالتالي, ينعكس هذا التغيير تلقائيًا وفورًا في كل الصفحات الأخرى التي تستهلك هذه البيانات.`
},
{
    id: `note-${Date.now() + 1}`,
    title: "بنية الموقع القوية",
    content: `بنية الموقع القوية: تمامًا كما ناقشنا سابقًا بخصوص "هيكلة الموقع"، فإن النظام بأكمله يعتمد على مصدر بيانات مركزي واحد (AppDataContext).
التأثير المباشر والآمن: عندما تقوم الأداة الجديدة بتغيير حالة السداد لمجموعة من الغرف (مثلاً من "تم السداد" إلى "مؤجل")، فإنها ستقوم بتحديث هذه المعلومة في مصدر البيانات المركزي.
استجابة صفحة المتابعة المالية: صفحة "المتابعة المالية" مصممة لكي "تستمع" لأي تغييرات تحدث في البيانات المركزية. بمجرد تغيير حالة السداد، ستقوم صفحة المتابعة المالية بالتالي:
إعادة فرز القوائم: ستنتقل الغرف التي تم تغيير حالتها تلقائيًا إلى القائمة المناسبة (مثلاً، من قائمة "المسدد بالكامل" إلى قائمة "وحدات عليها مستحقات نشطة").
تحديث الواجهة: ستعرض لك الواجهة أحدث حالة للغرف دون الحاجة لأي تحديث يدوي.
باختصار: إضافة هذه الأداة هي بالضبط نوع التطوير الذي تم تصميم بنية الموقع لدعمه بسهولة وأمان. لن يحدث أي تعارض أو أخطاء، بل ستحصل على أداة قوية تزيد من كفاءة استخدامك للنظام.`
}];


const SiteStructureContent = () => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        try {
            const savedNotes = localStorage.getItem(NOTES_STORAGE_KEY);
            if (savedNotes) {
                setNotes(JSON.parse(savedNotes));
            } else {
                setNotes(defaultContent);
            }
        } catch (error) {
            console.error("Could not access localStorage", error);
            setNotes(defaultContent);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const saveNotes = (updatedNotes: Note[]) => {
        try {
            localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(updatedNotes));
            setNotes(updatedNotes);
        } catch (error) {
            console.error("Failed to save notes to localStorage", error);
            toast({
                variant: 'destructive',
                title: 'خطأ في الحفظ',
                description: 'لم نتمكن من حفظ ملاحظاتك.',
            });
        }
    };

    const addNote = () => {
        const newNote: Note = {
            id: `note-${Date.now()}`,
            title: 'ملاحظة جديدة',
            content: ''
        };
        const updatedNotes = [...notes, newNote];
        saveNotes(updatedNotes);
    };

    const updateNote = (id: string, field: 'title' | 'content', value: string) => {
        const updatedNotes = notes.map(note => 
            note.id === id ? { ...note, [field]: value } : note
        );
        saveNotes(updatedNotes);
    };

    const deleteNote = (id: string) => {
        const updatedNotes = notes.filter(note => note.id !== id);
        saveNotes(updatedNotes);
        toast({
            title: 'تم الحذف',
            description: 'تم حذف الملاحظة بنجاح.',
            className: 'bg-red-100 border-red-400 text-red-800'
        });
    };
    
    if (isLoading) {
        return <p>جاري تحميل الملاحظات...</p>;
    }


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-primary flex items-center gap-3">
                    <NotebookPen className="h-7 w-7" />
                    دفتر ملاحظات الموقع
                </h1>
                <Button onClick={addNote}>
                    <PlusCircle className="ml-2 h-4 w-4" />
                    إضافة ملاحظة جديدة
                </Button>
            </div>
             {notes.length === 0 && (
                <Card className="flex items-center justify-center h-64 border-dashed">
                    <div className="text-center text-muted-foreground">
                        <p>لا توجد ملاحظات. ابدأ بإضافة واحدة!</p>
                    </div>
                </Card>
            )}
            {notes.map(note => (
                <Card key={note.id} className="shadow-lg animate-in fade-in-50">
                    <CardHeader className="flex flex-row items-center justify-between bg-muted/50">
                        <Input 
                            value={note.title}
                            onChange={(e) => updateNote(note.id, 'title', e.target.value)}
                            className="text-lg font-bold border-0 focus-visible:ring-1 focus-visible:ring-ring"
                        />
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => deleteNote(note.id)}>
                            <Trash2 className="h-5 w-5" />
                        </Button>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <Textarea
                            value={note.content}
                            onChange={(e) => updateNote(note.id, 'content', e.target.value)}
                            placeholder="اكتب ملاحظاتك هنا..."
                            className="min-h-[200px] text-base leading-relaxed"
                            dir="rtl"
                        />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

export function SiteStructureClient() {
    const [password, setPassword] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [error, setError] = useState(false);

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === CORRECT_PASSWORD) {
            setIsAuthenticated(true);
            setError(false);
        } else {
            setError(true);
        }
    };

    if (isAuthenticated) {
        return (
             <div className="container mx-auto py-8 px-4 md:px-6">
                <SiteStructureContent />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4 md:px-6 flex justify-center items-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
            <Card className="w-full max-w-md shadow-2xl">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-primary text-primary-foreground rounded-full h-16 w-16 flex items-center justify-center">
                        <ShieldCheck className="h-10 w-10" />
                    </div>
                    <CardTitle className="mt-4">صفحة محمية</CardTitle>
                    <CardDescription>
                        الرجاء إدخال كلمة المرور للوصول إلى محتوى هذه الصفحة.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">كلمة المرور</Label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-9"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                        {error && (
                            <Alert variant="destructive" className="animate-in fade-in-50">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>خطأ</AlertTitle>
                                <AlertDescription>
                                    كلمة المرور غير صحيحة.
                                </AlertDescription>
                            </Alert>
                        )}
                        <Button type="submit" className="w-full">
                            الدخول
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
