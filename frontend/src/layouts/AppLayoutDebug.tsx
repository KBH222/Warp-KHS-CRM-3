import { Outlet } from 'react-router-dom';
import { BottomTabBar } from '../components/BottomTabBar';

export const AppLayoutDebug = () => {
  return (
    <div className="h-screen bg-gray-50 flex flex-col" style={{ position: 'fixed', inset: 0 }}>
      {/* Fixed Header */}
      <header className="bg-blue-600 text-white h-14 flex-shrink-0 flex items-center px-4">
        <h1 className="text-lg font-bold">Fixed Header (56px)</h1>
      </header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-auto bg-white">
        <div className="p-4">
          <div className="bg-yellow-200 p-4 mb-4">
            <h2 className="font-bold">This is the scrollable content area</h2>
            <p>The header and bottom tabs should always be visible.</p>
          </div>
          <Outlet />
          {/* Add lots of content to test scrolling */}
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i} className="bg-gray-100 p-4 mb-2 rounded">
              <p>Content block {i + 1}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Fixed Bottom Tabs */}
      <div className="bg-red-500 text-white h-16 flex-shrink-0 flex items-center justify-center font-bold">
        TABS SHOULD BE HERE (64px)
      </div>
      
      {/* Actual Bottom Tab Bar */}
      <BottomTabBar />
    </div>
  );
};