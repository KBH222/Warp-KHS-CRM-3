import { Outlet } from 'react-router-dom';
import { useUser } from '../stores/auth.store';

export const AppLayout = () => {
  const user = useUser();

  return (
    <div className="app-layout">
      {/* Header */}
      <header className="app-header bg-white shadow-sm">
        <div className="h-14 flex items-center">
          <div className="w-full max-w-[1200px] mx-auto px-5 flex items-center justify-between sm:justify-between justify-center">
            <h1 
              className="text-lg font-semibold text-gray-900 sm:ml-[375px] ml-0" 
            >
              KHS CRM
            </h1>
            <span className="text-sm text-gray-600 hidden sm:inline">{user?.name}</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
};