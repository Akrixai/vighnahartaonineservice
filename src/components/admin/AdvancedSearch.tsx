'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, X, Calendar, ChevronDown } from 'lucide-react';

interface SearchFilter {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'daterange';
  options?: string[];
  placeholder?: string;
}

interface AdvancedSearchProps {
  filters: SearchFilter[];
  onSearch: (searchParams: Record<string, any>) => void;
  onReset: () => void;
  className?: string;
}

export default function AdvancedSearch({ 
  filters, 
  onSearch, 
  onReset, 
  className = '' 
}: AdvancedSearchProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchParams, setSearchParams] = useState<Record<string, any>>({});

  const handleInputChange = (key: string, value: any) => {
    setSearchParams(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSearch = () => {
    // Filter out empty values
    const filteredParams = Object.entries(searchParams).reduce((acc, [key, value]) => {
      if (value && value !== '' && value !== 'All') {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);

    onSearch(filteredParams);
  };

  const handleReset = () => {
    setSearchParams({});
    onReset();
  };

  const hasActiveFilters = Object.values(searchParams).some(value => 
    value && value !== '' && value !== 'All'
  );

  return (
    <Card className={`border-blue-200 ${className}`}>
      <CardContent className="p-6">
        {/* Basic Search */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search..."
              value={searchParams.search || ''}
              onChange={(e) => handleInputChange('search', e.target.value)}
              className="pl-10"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          
          <Button
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Advanced</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </Button>

          <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700">
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>

          {hasActiveFilters && (
            <Button variant="outline" onClick={handleReset}>
              <X className="w-4 h-4 mr-2" />
              Reset
            </Button>
          )}
        </div>

        {/* Advanced Filters */}
        {isExpanded && (
          <div className="border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filters.map((filter) => (
                <div key={filter.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {filter.label}
                  </label>
                  
                  {filter.type === 'text' && (
                    <Input
                      type="text"
                      placeholder={filter.placeholder}
                      value={searchParams[filter.key] || ''}
                      onChange={(e) => handleInputChange(filter.key, e.target.value)}
                    />
                  )}

                  {filter.type === 'select' && (
                    <select
                      value={searchParams[filter.key] || 'All'}
                      onChange={(e) => handleInputChange(filter.key, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="All">All</option>
                      {filter.options?.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  )}

                  {filter.type === 'date' && (
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        type="date"
                        value={searchParams[filter.key] || ''}
                        onChange={(e) => handleInputChange(filter.key, e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  )}

                  {filter.type === 'daterange' && (
                    <div className="space-y-2">
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          type="date"
                          placeholder="From date"
                          value={searchParams[`${filter.key}_from`] || ''}
                          onChange={(e) => handleInputChange(`${filter.key}_from`, e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          type="date"
                          placeholder="To date"
                          value={searchParams[`${filter.key}_to`] || ''}
                          onChange={(e) => handleInputChange(`${filter.key}_to`, e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center space-x-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-600">Active filters:</span>
                  {Object.entries(searchParams).map(([key, value]) => {
                    if (!value || value === '' || value === 'All') return null;
                    
                    const filter = filters.find(f => f.key === key || key.startsWith(f.key));
                    const label = filter?.label || key;
                    
                    return (
                      <span
                        key={key}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {label}: {value}
                        <button
                          onClick={() => handleInputChange(key, '')}
                          className="ml-2 hover:text-blue-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
