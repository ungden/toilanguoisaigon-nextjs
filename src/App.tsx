import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { HelmetProvider } from "react-helmet-async";

// Eagerly loaded pages (critical path)
import Index from "@/pages/Index";
import SearchPage from "@/pages/Search";
import NotFound from "@/pages/NotFound";

// Lazy loaded pages
const PlaceDetailPage = lazy(() => import("@/pages/PlaceDetail"));
const CollectionsPage = lazy(() => import("@/pages/Collections"));
const CollectionDetailPage = lazy(() => import("@/pages/CollectionDetail"));
const LoginPage = lazy(() => import("@/pages/Login"));
const ProfilePage = lazy(() => import("@/pages/Profile"));
const MyNotebookPage = lazy(() => import("@/pages/MyNotebook"));
const BlogPage = lazy(() => import("@/pages/Blog"));
const PostDetailPage = lazy(() => import("@/pages/PostDetail"));
const SubmitLocationPage = lazy(() => import("@/pages/SubmitLocation"));
const LeaderboardPage = lazy(() => import("@/pages/Leaderboard"));
const AboutPage = lazy(() => import("@/pages/About"));
const ContactPage = lazy(() => import("@/pages/Contact"));
const TermsPage = lazy(() => import("@/pages/Terms"));
const PrivacyPage = lazy(() => import("@/pages/Privacy"));
const FaqPage = lazy(() => import("@/pages/Faq"));

// Admin Pages (lazy loaded - rarely accessed)
const AdminLayout = lazy(() => import("@/components/layout/AdminLayout"));
const AdminDashboardPage = lazy(() => import("@/pages/admin/Dashboard"));
const AdminLocationsPage = lazy(() => import("@/pages/admin/locations/LocationsPage"));
const AdminUsersPage = lazy(() => import("@/pages/admin/users/UsersPage"));
const AdminPostsPage = lazy(() => import("@/pages/admin/posts/PostsPage"));
const AdminCollectionsPage = lazy(() => import("@/pages/admin/collections/CollectionsPage"));
const AdminReviewsPage = lazy(() => import("@/pages/admin/reviews/ReviewsPage"));
const AdminSubmissionsPage = lazy(() => import("@/pages/admin/submissions/SubmissionsPage"));
const AdminLevelsPage = lazy(() => import("@/pages/admin/levels/LevelsPage"));
const AdminXpActionsPage = lazy(() => import("@/pages/admin/xp-actions/XpActionsPage"));
const AdminBadgesPage = lazy(() => import("@/pages/admin/badges/BadgesPage"));

const PageLoader = () => (
  <div className="container mx-auto p-4 space-y-4">
    <Skeleton className="h-12 w-1/2" />
    <Skeleton className="h-64 w-full" />
    <div className="flex gap-4">
      <Skeleton className="h-32 w-1/2" />
      <Skeleton className="h-32 w-1/2" />
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
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
              <Route path="/leaderboard" element={<LeaderboardPage />} />

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
                <Route path="submissions" element={<AdminSubmissionsPage />} />
                <Route path="levels" element={<AdminLevelsPage />} />
                <Route path="xp-actions" element={<AdminXpActionsPage />} />
                <Route path="badges" element={<AdminBadgesPage />} />
              </Route>

              {/* Catch-all Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
