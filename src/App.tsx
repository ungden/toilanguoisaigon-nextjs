import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";

import Index from "@/pages/Index";
import SearchPage from "@/pages/Search";
import PlaceDetailPage from "@/pages/PlaceDetail";
import CollectionsPage from "@/pages/Collections";
import CollectionDetailPage from "@/pages/CollectionDetail";
import LoginPage from "@/pages/Login";
import ProfilePage from "@/pages/Profile";
import MyNotebookPage from "@/pages/MyNotebook";
import BlogPage from "@/pages/Blog";
import PostDetailPage from "@/pages/PostDetail";
import SubmitLocationPage from "@/pages/SubmitLocation";
import NotFound from "@/pages/NotFound";
import AboutPage from "@/pages/About";
import ContactPage from "@/pages/Contact";
import TermsPage from "@/pages/Terms";
import PrivacyPage from "@/pages/Privacy";
import FaqPage from "@/pages/Faq";

// Admin Pages
import AdminLayout from "@/components/layout/AdminLayout";
import AdminDashboardPage from "@/pages/admin/Dashboard";
import AdminLocationsPage from "@/pages/admin/locations/LocationsPage";
import AdminUsersPage from "@/pages/admin/users/UsersPage";
import AdminPostsPage from "@/pages/admin/posts/PostsPage";
import AdminCollectionsPage from "@/pages/admin/collections/CollectionsPage";
import AdminReviewsPage from "@/pages/admin/reviews/ReviewsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/place/:slug" element={<PlaceDetailPage />} />
            <Route path="/collections" element={<CollectionsPage />} />
            <Route path="/collection/:slug" element={<CollectionDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<PostDetailPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/faq" element={<FaqPage />} />
            
            {/* Protected User Routes */}
            <Route 
              path="/profile" 
              element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} 
            />
            <Route 
              path="/my-notebook" 
              element={<ProtectedRoute><MyNotebookPage /></ProtectedRoute>} 
            />
            <Route 
              path="/submit-location" 
              element={<ProtectedRoute><SubmitLocationPage /></ProtectedRoute>} 
            />
            
            {/* Admin Routes */}
            <Route 
              path="/admin"
              element={<AdminRoute><AdminLayout /></AdminRoute>}
            >
              <Route index element={<AdminDashboardPage />} />
              <Route path="locations" element={<AdminLocationsPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="posts" element={<AdminPostsPage />} />
              <Route path="collections" element={<AdminCollectionsPage />} />
              <Route path="reviews" element={<AdminReviewsPage />} />
            </Route>

            {/* Catch-all Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;