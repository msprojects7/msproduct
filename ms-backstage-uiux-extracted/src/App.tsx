import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { FloatingDock } from './components/navigation/FloatingDock';
import { ToastContainer } from './components/ui/ToastContainer';
import { ConfirmDialog } from './components/ui/ConfirmDialog';

// Marketing pages
import { HomePage } from './components/marketing/HomePage';
import { FeaturesPage } from './components/marketing/FeaturesPage';
import { PricingPage } from './components/marketing/PricingPage';

// Auth pages
import { SignInPage } from './components/auth/SignInPage';
import { SignUpPage } from './components/auth/SignUpPage';
import { ForgotPasswordPage } from './components/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './components/auth/ResetPasswordPage';

// Platform Core pages
import { DashboardPage } from './components/dashboard/DashboardPage';
import { AttendeesListPage } from './components/attendees/AttendeesListPage';
import { SpotRegistrationPage } from './components/registration/SpotRegistrationPage';
import { QrScannerPage } from './components/scanner/QrScannerPage';
import { BadgeDeskPage } from './components/badges/BadgeDeskPage';
import { BadgeDesignerPage } from './components/badges/BadgeDesignerPage';
import { PrintPreviewPage } from './components/badges/PrintPreviewPage';
import { ImportsExportsPage } from './components/imports/ImportsExportsPage';
import { ReportsAnalyticsPage } from './components/reports/ReportsAnalyticsPage';
import { AuditLogsPage } from './components/audit/AuditLogsPage';
import { StaffManagementPage } from './components/staff/StaffManagementPage';

// Organization & Event management
import { OrganizationsPage } from './components/organizations/OrganizationsPage';
import { OrgSettingsPage } from './components/organizations/OrgSettingsPage';
import { OrgSubscriptionPage } from './components/organizations/OrgSubscriptionPage';
import { EventsListPage } from './components/events/EventsListPage';
import { EventCreateEditPage } from './components/events/EventCreateEditPage';
import { EventDashboardPage } from './components/events/EventDashboardPage';
import { EventSettingsPage } from './components/events/EventSettingsPage';
import { AccountProfilePage } from './components/account/AccountProfilePage';
import { EventWebsiteBuilderPage } from './components/website/EventWebsiteBuilderPage';
import { EventPublicWebsitePage } from './components/website/EventPublicWebsitePage';

const AppContent: React.FC = () => {
  const { currentRoute, theme } = useApp();

  const renderCurrentView = () => {
    switch (currentRoute) {
      // Marketing
      case 'home':
        return <HomePage />;
      case 'features':
        return <FeaturesPage />;
      case 'pricing':
        return <PricingPage />;

      // Auth
      case 'signin':
        return <SignInPage />;
      case 'signup':
        return <SignUpPage />;
      case 'forgot-password':
        return <ForgotPasswordPage />;
      case 'reset-password':
      case 'verify-email':
        return <ResetPasswordPage />;

      // Platform Core pages
      case 'dashboard':
        return <DashboardPage />;
      case 'attendees':
        return <AttendeesListPage />;
      case 'spot-registration':
        return <SpotRegistrationPage />;
      case 'scanner':
        return <QrScannerPage />;
      case 'badges':
        return <BadgeDeskPage />;
      case 'badge-designer':
        return <BadgeDesignerPage />;
      case 'print-preview':
        return <PrintPreviewPage />;
      case 'imports':
        return <ImportsExportsPage />;
      case 'reports':
        return <ReportsAnalyticsPage />;
      case 'audit-logs':
        return <AuditLogsPage />;
      case 'staff':
      case 'orgs-members':
        return <StaffManagementPage />;

      // Organizations
      case 'orgs-list':
      case 'orgs-overview':
        return <OrganizationsPage />;
      case 'orgs-settings':
        return <OrgSettingsPage />;
      case 'orgs-subscription':
        return <OrgSubscriptionPage />;

      // Events
      case 'events-list':
        return <EventsListPage />;
      case 'events-create':
      case 'events-edit':
        return <EventCreateEditPage />;
      case 'events-dashboard':
        return <EventDashboardPage />;
      case 'events-settings':
        return <EventSettingsPage />;

      // Website Builder & Public Event Microsite
      case 'event-builder':
        return <EventWebsiteBuilderPage />;
      case 'event-public':
        return <EventPublicWebsitePage />;

      // Account
      case 'account':
        return <AccountProfilePage />;

      default:
        return <HomePage />;
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'} flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200 transition-colors duration-200`}>
      {/* Signature Global Floating Dock */}
      <FloatingDock />

      {/* Main Page Viewport */}
      <main className="flex-1 w-full flex flex-col">
        {renderCurrentView()}
      </main>

      {/* Toast Notifications Surface */}
      <ToastContainer />

      {/* Reusable Confirmation Dialog Surface */}
      <ConfirmDialog />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
