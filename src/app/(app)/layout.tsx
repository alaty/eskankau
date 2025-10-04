
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AppDataProvider } from "@/contexts/AppDataContext";
import { SidebarProvider, Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/layout/SidebarNav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppDataProvider>
      <SidebarProvider>
        <div className="flex flex-col min-h-screen bg-background">
          <Header />
          <div className="flex flex-1 overflow-hidden">
             <Sidebar side="right">
                <SidebarContent>
                    <SidebarNav isSidebar={true} />
                </SidebarContent>
            </Sidebar>
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
          <Footer />
        </div>
      </SidebarProvider>
    </AppDataProvider>
  );
}
