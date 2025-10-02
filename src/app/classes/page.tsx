// app/classes/page.tsx
"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Classes from "@/components/Classes";

export default function ClassesPage() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] min-h-screen">
      {/* Sidebar - fixed on large screens, hidden on mobile (or use a drawer) */}
      <div className="lg:sticky lg:top-0 lg:h-screen lg:z-40">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      </div>
      
      {/* Main Content */}
      <div className="w-full overflow-auto">
        <div className="p-4 md:p-6 lg:p-0=8">
          <Classes />
        </div>
      </div>
    </div>
  );
}