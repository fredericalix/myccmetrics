"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-72 flex-col border-r border-border bg-card overflow-y-auto custom-scrollbar">
        <div className="px-6 py-8">
          <h2 className="text-lg font-bold text-foreground">MyCCmetrics</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Monitoring Dashboard</p>
        </div>
        <Sidebar />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0 bg-card">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="px-6 py-8">
            <h2 className="text-lg font-bold text-foreground">MyCCmetrics</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Monitoring Dashboard</p>
          </div>
          <div className="overflow-y-auto h-full custom-scrollbar">
            <Sidebar />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6 2xl:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
