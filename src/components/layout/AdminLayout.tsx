import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Outlet } from "react-router-dom";

const AdminLayout = () => {
  return (
    <div className="flex min-h-screen bg-muted/40">
      <AdminSidebar />
      <main className="flex-1 flex flex-col p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;