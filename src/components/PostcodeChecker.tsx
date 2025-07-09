import React, { useState, useEffect } from 'react';
import { MapPin, Check, X, Loader2 } from 'lucide-react';
import { Store, PostcodeInfo } from '../types';
import { mockApiServices } from '../services/mockApiServices';
import { isValidUKPostcode, formatUKPostcode, autoFormatPostcode, getPostcodeError } from '../utils/postcodeUtils';
import { checkPostcodeExists, getPostcodeData } from '../api/postcodeLookup';

interface PostcodeContextType {
  postcode: string;
  postcodeInfo: PostcodeInfo | null;
  nearbyStores: Store[];
  isLoading: boolean;
  error: string | null;
  radius: number;
  updatePostcode: (postcode: string, radius?: number) => void;
}

// Context for sharing postcode data across components
export const PostcodeContext = React.createContext<PostcodeContextType | null>(null);

// Provider component to wrap the entire app
export function PostcodeProvider({ children }: { children: React.ReactNode }) {
  const [postcode, setPostcode] = useState(() => {
    return localStorage.getItem('userPostcode') || '';
  });
  const [radius, setRadius] = useState(() => {
    const savedRadius = localStorage.getItem('userRadius');
    return savedRadius ? parseInt(savedRadius, 10) : 5; // Default 5 miles
  });
  const [postcodeInfo, setPostcodeInfo] = useState<PostcodeInfo | null>(null);
  const [nearbyStores, setNearbyStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved postcode info on component mount
  useEffect(() => {
    const savedPostcodeInfo = localStorage.getItem('postcodeInfo');
    const savedNearbyStores = localStorage.getItem('nearbyStores');
    
    if (savedPostcodeInfo) {
      setPostcodeInfo(JSON.parse(savedPostcodeInfo));
    }
    
    if (savedNearbyStores) {
      setNearbyStores(JSON.parse(savedNearbyStores));
    }
  }, []);

  const validateAndUpdatePostcode = async (newPostcode: string, newRadius?: number) => {
    const trimmedPostcode = newPostcode.trim();
    const searchRadius = newRadius ?? radius;
    
    setIsLoading(true);
    setError(null);

    // Check format first
    if (!isValidUKPostcode(trimmedPostcode)) {
      setError('Invalid UK postcode format');
      setIsLoading(false);
      return;
    }

    try {
      // Format the postcode
      const formattedPostcode = formatUKPostcode(trimmedPostcode);

      // Get postcode data from the real API
      const postcodeData = await getPostcodeData(formattedPostcode);
      
      if (!postcodeData) {
        setError('This postcode was not found. Please check and try again.');
        setIsLoading(false);
        return;
      }

      // Convert PostcodeData to PostcodeInfo format
      const info: PostcodeInfo = {
        postcode: postcodeData.postcode,
        latitude: postcodeData.latitude,
        longitude: postcodeData.longitude,
        area: postcodeData.area,
        district: postcodeData.district
      };

      // Get nearby stores with radius
      const stores = await mockApiServices.getStoresNearPostcode(formattedPostcode, searchRadius);

      // Update state with formatted postcode and radius
      setPostcodeInfo(info);
      setNearbyStores(stores);
      setPostcode(formattedPostcode);
      if (newRadius !== undefined) {
        setRadius(newRadius);
        localStorage.setItem('userRadius', newRadius.toString());
      }

      // Save to localStorage
      localStorage.setItem('userPostcode', formattedPostcode);
      localStorage.setItem('postcodeInfo', JSON.stringify(info));
      localStorage.setItem('nearbyStores', JSON.stringify(stores));

    } catch (err) {
      setError('Failed to validate postcode. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const contextValue: PostcodeContextType = {
    postcode,
    postcodeInfo,
    nearbyStores,
    isLoading,
    error,
    radius,
    updatePostcode: validateAndUpdatePostcode
  };

  return (
    <PostcodeContext.Provider value={contextValue}>
      {children}
    </PostcodeContext.Provider>
  );
}

export function PostcodeChecker() {
  const { postcode, postcodeInfo, nearbyStores, isLoading, error, radius, updatePostcode } = usePostcode();
  const [localPostcode, setLocalPostcode] = useState(postcode);
  const [localRadius, setLocalRadius] = useState(radius);
  const [isValidated, setIsValidated] = useState(!!postcodeInfo);
  const [localError, setLocalError] = useState<string | null>(null);

  // Sync local state with context
  useEffect(() => {
    setLocalPostcode(postcode);
    setLocalRadius(radius);
    setIsValidated(!!postcodeInfo);
    setLocalError(null); // Clear local error when context updates
  }, [postcode, radius, postcodeInfo]);

  const handlePostcodeCheck = async () => {
    const trimmedPostcode = localPostcode.trim();
    
    // Clear any previous local errors
    setLocalError(null);
    
    // Apply regex validation before making any fetch calls
    if (!isValidUKPostcode(trimmedPostcode)) {
      setLocalError("Invalid UK postcode format");
      setIsValidated(false);
      return;
    }
    
    // If validation passes, proceed with the API-based validation
    updatePostcode(localPostcode, localRadius);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handlePostcodeCheck();
  };

  const handleInputChange = (newPostcode: string) => {
    // Auto-format as user types
    const formatted = autoFormatPostcode(newPostcode);
    setLocalPostcode(formatted);
    if (isValidated) setIsValidated(false);
    if (localError) setLocalError(null); // Clear local error when user starts typing
  };

  return (
      <div>
        <h2 className="text-sm font-medium text-gray-600 dark:text-dark-soft-text-muted mb-2">
          Delivery Location
        </h2>
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-[200px]">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <MapPin size={16} className="text-gray-400 dark:text-dark-soft-text-muted" />
              </div>
              <input
                type="text"
                value={localPostcode}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Enter postcode"
                className={`pl-9 pr-9 py-2 w-full rounded-lg border focus:ring-2 focus:ring-[#6DBE45] focus:border-transparent outline-none text-sm transition-colors placeholder:text-gray-400 dark:placeholder:text-dark-soft-text-muted ${
                  (localError || error)
                    ? 'border-red-300 bg-red-50 dark:border-red-400 dark:bg-red-900/20 dark:text-red-200'
                    : isValidated
                    ? 'border-green-300 bg-green-50 dark:border-green-400 dark:bg-green-900/20 dark:text-green-200'
                    : 'border-gray-200 bg-white dark:border-dark-soft-input-border dark:bg-dark-soft-input dark:text-dark-soft-input-text'
                }`}
              />
              {/* Status icon */}
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                {isLoading ? (
                  <Loader2 size={16} className="text-gray-400 animate-spin" />
                ) : isValidated ? (
                  <Check size={16} className="text-green-500" />
                ) : (localError || error) ? (
                  <X size={16} className="text-red-500" />
                ) : null}
              </div>
            </div>
            
            {/* Radius selector */}
            <div className="flex items-center gap-1">
              <select
                value={localRadius}
                onChange={(e) => setLocalRadius(parseInt(e.target.value, 10))}
                className="px-2 py-2 text-sm border border-gray-200 dark:border-dark-soft-input-border bg-white dark:bg-dark-soft-input dark:text-dark-soft-input-text rounded-lg focus:ring-2 focus:ring-[#6DBE45] focus:border-transparent outline-none"
              >
                <option value={5}>5 mi</option>
                <option value={6}>6 mi</option>
                <option value={7}>7 mi</option>
                <option value={8}>8 mi</option>
                <option value={9}>9 mi</option>
                <option value={10}>10 mi</option>
              </select>
            </div>
            
            <button
              type="submit"
              disabled={isLoading || !localPostcode.trim()}
              className="bg-[#6DBE45] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#5ca93a] dark:bg-[#6DBE45] dark:hover:bg-[#5ca93a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Checking...' : 'Check'}
            </button>
          </div>
        </form>

        {/* Error message */}
        {(localError || error) && (
          <p className="text-red-600 dark:text-red-400 text-xs mt-1">{localError || error}</p>
        )}

        {/* Validation success message */}
        {isValidated && postcodeInfo && (
          <div className="mt-2 text-xs text-green-600 dark:text-green-400">
            ✓ {postcodeInfo.area}, {postcodeInfo.district} - {nearbyStores.length} stores nearby
          </div>
        )}
      </div>
  );
}

// Hook for using postcode context
export function usePostcode() {
  const context = React.useContext(PostcodeContext);
  if (!context) {
    throw new Error('usePostcode must be used within a PostcodeProvider');
  }
  return context;
}