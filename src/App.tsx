/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CheckIn } from './components/CheckIn';
import { Dashboard } from './components/Dashboard';
import { History } from './components/History';
import { Settings } from './components/Settings';
import { Login } from './components/Login';
import { LayoutList, Flame, CalendarDays, Settings as SettingsIcon } from 'lucide-react';
import { cn } from './lib/utils';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './lib/firebase';

export default function App() {
  const [activeTab, setActiveTab] = useState<'checkin' | 'dashboard' | 'history' | 'settings'>('checkin');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const tabs = [
    { id: 'checkin', label: 'Check-In', icon: LayoutList },
    { id: 'dashboard', label: 'Dashboard', icon: Flame },
    { id: 'history', label: 'History', icon: CalendarDays },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ] as const;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Flame className="w-12 h-12 text-yellow-500 animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-yellow-500/30 pb-20">
      <main className="max-w-md mx-auto min-h-screen relative overflow-x-hidden">

        <div className="p-6">
          {activeTab === 'checkin' && <CheckIn />}
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'history' && <History />}
          {activeTab === 'settings' && <Settings />}
        </div>
        
        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md border-t border-zinc-900 pb-safe">
          <div className="max-w-md mx-auto flex justify-around items-center p-3">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex flex-col items-center p-2 rounded-xl transition-all duration-200",
                    isActive ? "text-yellow-500 scale-110" : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  <Icon className={cn("w-6 h-6 mb-1", isActive ? "drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" : "")} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </main>
    </div>
  );
}
