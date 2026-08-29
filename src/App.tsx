import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { DemoScenarioBar } from './components/common/DemoScenarioBar';
import { ToastContainer } from './components/common/ToastContainer';

// Views
import { LoginView } from './components/views/LoginView';
import { DashboardView } from './components/views/DashboardView';
import { OrdersListView } from './components/views/OrdersListView';
import { OrderFormView } from './components/views/OrderFormView';
import { OrderDetailView } from './components/views/OrderDetailView';
import { ComponentsView } from './components/views/ComponentsView';
import { ClientsView } from './components/views/ClientsView';
import { CalendarView } from './components/views/CalendarView';
import { ReportsView } from './components/views/ReportsView';
import { UsersView } from './components/views/UsersView';
import { ProfileView } from './components/views/ProfileView';

const AppContent: React.FC = () => {
  const { currentUser, activeView, selectedOrderId } = useApp();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // If no logged in user, show Login Screen
  if (!currentUser) {
    return (
      <>
        <LoginView />
        <ToastContainer />
      </>
    );
  }

  // Render view dynamically
  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'orders':
        return <OrdersListView />;
      case 'order-new':
        return <OrderFormView />;
      case 'order-edit':
        return <OrderFormView orderIdToEdit={selectedOrderId} />;
      case 'order-detail':
        return <OrderDetailView orderId={selectedOrderId || ''} />;
      case 'components':
        return <ComponentsView />;
      case 'clients':
        return <ClientsView />;
      case 'calendar':
        return <CalendarView />;
      case 'reports':
        return <ReportsView />;
      case 'users':
        return <UsersView />;
      case 'profile':
        return <ProfileView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div id="emila-app-root" className="min-h-screen bg-[#FBECEF] flex flex-col font-sans">
      {/* Validation banner on top for demo test cases */}
      <DemoScenarioBar />

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Navigation Sidebar */}
        <Sidebar
          isOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        {/* Right side: Top Navbar + Main Content Viewport */}
        <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
          <Navbar onToggleMobileSidebar={() => setMobileSidebarOpen((prev) => !prev)} />

          <main
            id="main-content-viewport"
            className="flex-1 min-w-0 px-4 sm:px-8 py-2 pb-14 transition-all"
          >
            <div className="max-w-7xl mx-auto">{renderActiveView()}</div>
          </main>
        </div>
      </div>

      {/* Feedback Toast Notification System */}
      <ToastContainer />
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
