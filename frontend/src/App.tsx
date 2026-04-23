import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import CustomersPage from './pages/Customers';
import OpportunitiesPage from './pages/Opportunities';
import ContractsPage from './pages/Contracts';
import PaymentsPage from './pages/Payments';
import ActivitiesPage from './pages/Activities';
import { UserManagement, DictManagement } from './pages/Settings';
import ProfilePage from './pages/Profile';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster position="top-center" richColors />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              
              {/* Protected Routes */}
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/opportunities" element={<OpportunitiesPage />} />
                <Route path="/contracts" element={<ContractsPage />} />
                <Route path="/payments" element={<PaymentsPage />} />
                <Route path="/activities" element={<ActivitiesPage />} />
                <Route path="/settings/users" element={<UserManagement />} />
                <Route path="/settings/dict" element={<DictManagement />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
              
              {/* Redirect root to dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App
