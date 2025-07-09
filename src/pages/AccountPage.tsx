import React from 'react';
import { User, MapPin, CreditCard, Settings, Bell, HelpCircle, LogOut, Moon, Sun } from 'lucide-react';
import { PostcodeChecker } from '../components/PostcodeChecker';
import { HeaderIcons } from '../components/HeaderIcons';
import { BottomNavBar } from '../components/BottomNavBar';
import { useDarkMode } from '../hooks/useDarkMode';

export function AccountPage() {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  
  return (
    <div className="flex flex-col min-h-screen bg-[#f9f7f2] dark:bg-dark-soft w-full">
      <header className="w-full bg-[#f9f7f2] dark:bg-dark-soft border-b border-gray-200/30 dark:border-dark-soft-border/30 py-4 sticky top-0 z-20 shadow-sm">
        <div className="px-4 max-w-screen-xl mx-auto w-full flex justify-between items-center">
          <PostcodeChecker />
          <HeaderIcons />
        </div>
      </header>
      
      <main className="flex-1 px-4 pt-6 pb-20 max-w-screen-xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-dark-soft-text flex items-center mb-6">
            <User size={24} className="mr-2 text-[#6DBE45]" />
            Account
          </h1>

          {/* Profile Section */}
          <div className="bg-white dark:bg-dark-soft-light rounded-xl p-6 shadow-sm border border-gray-100 dark:border-dark-soft-border mb-6">
            <div className="flex items-center mb-4">
              <div className="w-16 h-16 bg-[#6DBE45]/10 rounded-full flex items-center justify-center mr-4">
                <User size={32} className="text-[#6DBE45]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-dark-soft-text">John Doe</h2>
                <p className="text-gray-600 dark:text-dark-soft-text-muted">john.doe@example.com</p>
              </div>
            </div>
            <button className="w-full bg-[#6DBE45]/10 hover:bg-[#6DBE45]/20 dark:bg-[#6DBE45]/20 dark:hover:bg-[#6DBE45]/30 text-[#6DBE45] font-medium py-2 px-4 rounded-lg transition-colors">
              Edit Profile
            </button>
          </div>

          {/* Dark Mode Toggle - Top Priority */}
          <div className="mb-6">
            <div className="bg-white dark:bg-dark-soft-light rounded-xl p-4 shadow-sm border border-gray-100 dark:border-dark-soft-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-dark-soft-lighter rounded-lg flex items-center justify-center mr-3 text-gray-600 dark:text-dark-soft-text-muted">
                    {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800 dark:text-dark-soft-text">Dark Mode</h3>
                    <p className="text-sm text-gray-600 dark:text-dark-soft-text-muted">Switch between light and dark themes</p>
                  </div>
                </div>
                <button
                  onClick={toggleDarkMode}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isDarkMode ? 'bg-[#6DBE45]' : 'bg-gray-200 dark:bg-dark-soft-border'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isDarkMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Account Options */}
          <div className="space-y-4">
            <AccountOption
              icon={<MapPin size={20} />}
              title="Delivery Addresses"
              description="Manage your delivery locations"
            />
            <AccountOption
              icon={<CreditCard size={20} />}
              title="Payment Methods"
              description="Cards and payment options"
            />
            <AccountOption
              icon={<Bell size={20} />}
              title="Notifications"
              description="Manage your preferences"
            />
            <AccountOption
              icon={<Settings size={20} />}
              title="Settings"
              description="App settings and preferences"
            />
            <AccountOption
              icon={<HelpCircle size={20} />}
              title="Help & Support"
              description="Get help and contact support"
            />
          </div>

          {/* Sign Out */}
          <div className="mt-8">
            <button className="w-full flex items-center justify-center bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-medium py-3 px-4 rounded-lg transition-colors">
              <LogOut size={18} className="mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </main>
      
      <BottomNavBar />
    </div>
  );
}

interface AccountOptionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function AccountOption({ icon, title, description }: AccountOptionProps) {
  return (
    <button className="w-full bg-white dark:bg-dark-soft-light rounded-xl p-4 shadow-sm border border-gray-100 dark:border-dark-soft-border hover:bg-gray-50 dark:hover:bg-dark-soft-hover transition-colors text-left">
      <div className="flex items-center">
        <div className="w-10 h-10 bg-gray-100 dark:bg-dark-soft-lighter rounded-lg flex items-center justify-center mr-3 text-gray-600 dark:text-dark-soft-text-muted">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-800 dark:text-dark-soft-text">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-dark-soft-text-muted">{description}</p>
        </div>
      </div>
    </button>
  );
} 