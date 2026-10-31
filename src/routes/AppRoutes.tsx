import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AppLayout } from '../components/layout/AppLayout';
import { Login } from '../pages/auth/Login';
import { Register } from '../pages/auth/Register';
import { Overview } from '../pages/dashboard/Overview';
import { CustomerList } from '../pages/customers/CustomerList';
import { ProductList } from '../pages/products/ProductList';
import { PlanList } from '../pages/plans/PlanList';
import { QuotationList } from '../pages/quotations/QuotationList';
import { SubscriptionList } from '../pages/subscriptions/SubscriptionList';
import { BillingOperations } from '../pages/billing/BillingOperations';
import { InvoiceList } from '../pages/invoices/InvoiceList';
import { PaymentList } from '../pages/payments/PaymentList';
import { TaxList } from '../pages/taxes/TaxList';
import { DiscountList } from '../pages/discounts/DiscountList';
import { Reports } from '../pages/reports/Reports';
import { StaffManagement } from '../pages/staff/StaffManagement';
import { CustomerPortal } from '../pages/customer/CustomerPortal';
import { BusinessSettings } from '../pages/settings/BusinessSettings';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="text-xs text-muted-foreground font-medium">Authenticating Brightloop session...</span>
        </div>
      </div>
    );
  }

  // If not logged in and not in simulated review session, redirect to login
  if (!currentUser && !userProfile) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  const { isCustomer } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Authenticated Application routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to={isCustomer ? '/portal' : '/dashboard'} replace />} />
        <Route path="dashboard" element={<Overview />} />
        <Route path="customers" element={<CustomerList />} />
        <Route path="products" element={<ProductList />} />
        <Route path="plans" element={<PlanList />} />
        <Route path="quotations" element={<QuotationList />} />
        <Route path="subscriptions" element={<SubscriptionList />} />
        <Route path="billing-engine" element={<BillingOperations />} />
        <Route path="invoices" element={<InvoiceList />} />
        <Route path="payments" element={<PaymentList />} />
        <Route path="taxes" element={<TaxList />} />
        <Route path="discounts" element={<DiscountList />} />
        <Route path="reports" element={<Reports />} />
        <Route path="staff" element={<StaffManagement />} />
        <Route path="portal" element={<CustomerPortal />} />
        <Route path="settings" element={<BusinessSettings />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
