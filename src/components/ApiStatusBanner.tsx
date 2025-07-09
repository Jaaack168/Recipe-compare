import React, { useState, useEffect } from 'react';
import { AlertCircle, Info, X, Wifi, WifiOff } from 'lucide-react';
import { checkApiStatus } from '../utils/staticApi';

interface ApiStatusBannerProps {
  className?: string;
}

export function ApiStatusBanner({ className = '' }: ApiStatusBannerProps) {
  const [apiStatus, setApiStatus] = useState<{
    isWorking: boolean;
    reason?: string;
    suggestion?: string;
    isChecking: boolean;
  }>({
    isWorking: true,
    isChecking: true
  });
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await checkApiStatus();
        setApiStatus({
          ...status,
          isChecking: false
        });
        
        // Show banner if API is not working and user hasn't dismissed it
        if (!status.isWorking && !dismissed) {
          setShowBanner(true);
        }
      } catch (error) {
        setApiStatus({
          isWorking: false,
          reason: 'Network error',
          suggestion: 'Check your internet connection. Using offline recipes.',
          isChecking: false
        });
        if (!dismissed) {
          setShowBanner(true);
        }
      }
    };

    checkStatus();
  }, [dismissed]);

  const handleDismiss = () => {
    setDismissed(true);
    setShowBanner(false);
  };

  if (!showBanner || apiStatus.isWorking || apiStatus.isChecking) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {apiStatus.reason?.includes('limit') ? (
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            ) : (
              <WifiOff className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
              Using Offline Recipe Collection
            </h3>
            
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
              {apiStatus.reason && (
                <p>
                  <strong>Reason:</strong> {apiStatus.reason}
                </p>
              )}
              
              {apiStatus.suggestion && (
                <p>{apiStatus.suggestion}</p>
              )}
              
              <div className="bg-blue-100 dark:bg-blue-800/30 rounded p-2 mt-2">
                <p className="font-medium mb-1">What this means:</p>
                <ul className="text-xs space-y-1">
                  <li>• You're seeing our curated recipe collection</li>
                  <li>• All recipes are still fully functional</li>
                  <li>• Price comparison and cart features work normally</li>
                  <li>• New recipes will appear when API access is restored</li>
                </ul>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
            aria-label="Dismiss notification"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
} 