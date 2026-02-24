"use client";

import { AdminSidebar } from "@/components/admin/AdminSidebar";

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen bg-muted/40">
      <AdminSidebar />
      <main className="flex-1 flex flex-col p-4 sm:p-6">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
