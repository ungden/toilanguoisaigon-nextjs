import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
        <div className="container mx-auto p-4 space-y-4">
            <Skeleton className="h-12 w-1/2" />
            <Skeleton className="h-64 w-full" />
        </div>
    );
  }

  if (role !== 'admin') {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};