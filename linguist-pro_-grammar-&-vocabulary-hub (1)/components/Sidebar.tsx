
import React from 'react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  side: 'left' | 'right';
  title: string;
  children: React.ReactNode;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, side, title, children }) => {
  const isLeft = side === 'left';
  
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      <div 
        className={`fixed top-0 bottom-0 z-50 bg-white shadow-xl transition-all duration-300 ease-in-out border-slate-200
          ${isLeft ? 'left-0 border-r' : 'right-0 border-l'}
          ${isOpen ? 'w-72' : 'w-0'} 
          overflow-hidden`}
      >
        <div className="flex flex-col h-full w-72">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-700 uppercase tracking-wider text-sm">{title}</h2>
            <button 
              onClick={onToggle}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
            >
              <i className={`fa-solid ${isLeft ? 'fa-angles-left' : 'fa-angles-right'}`}></i>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
            {children}
          </div>
        </div>
      </div>

      {/* Toggle Button when closed */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className={`fixed top-1/2 -translate-y-1/2 z-50 p-3 bg-white border border-slate-200 shadow-md rounded-full text-blue-600 hover:bg-blue-50 transition-all
            ${isLeft ? 'left-4' : 'right-4'}`}
        >
          <i className={`fa-solid ${isLeft ? 'fa-history' : 'fa-link'}`}></i>
        </button>
      )}
    </>
  );
};

export default Sidebar;
