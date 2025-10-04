
import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-accent-foreground py-4 px-4 sm:px-6 md:px-8 mt-auto no-print">
      <div className="container mx-auto text-center text-sm text-primary-foreground">
        <p>
          &copy; {currentYear} نظام الاسكان الطلابي. جميع الحقوق محفوظة.
        </p>
        <p>
          تم التطوير لعمادة شؤون الطلاب - جامعة الملك عبدالعزيز.
        </p>
      </div>
    </footer>
  );
}
