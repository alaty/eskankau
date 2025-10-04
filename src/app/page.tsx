import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { User } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="flex flex-col items-center justify-center">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="items-center text-center space-y-4">
            <div className="bg-white p-2 rounded-lg shadow-sm">
              <Image
                src="https://j.top4top.io/p_35298zyqb1.png"
                alt="شعار جامعة الملك عبدالعزيز"
                width={120}
                height={120}
                data-ai-hint="university logo"
              />
            </div>
            <CardTitle className="text-2xl font-headline text-accent-foreground">
              نظام الاسكان الطلابي
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-6">
              مرحباً بك. قم بإدارة ومتابعة الجوانب التشغيلية والمالية لمباني السكن بكل سهولة.
            </p>
            <Button asChild size="lg" className="w-full font-bold text-lg bg-accent-foreground hover:bg-accent-foreground/90">
              <Link href="/units">
                <User className="ml-2 h-5 w-5" />
                دخول مدير الإدارة
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
