import { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Search, Filter } from 'lucide-react';
import { VesselFilters } from '../../types/vessel';

interface VesselSearchProps {
  onFiltersChange: (filters: VesselFilters) => void;
  className?: string;
}

export function VesselSearch({ onFiltersChange, className = '' }: VesselSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [vesselType, setVesselType] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    onFiltersChange({
      searchQuery,
      type: vesselType,
      status,
    });
  }, [searchQuery, vesselType, status, onFiltersChange]);

  const clearFilters = () => {
    setSearchQuery('');
    setVesselType('');
    setStatus('');
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search vessel by name or IMO..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 focus:ring-2 focus:ring-navy-600 focus:border-transparent"
        />
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vessel Type
          </label>
          <Select value={vesselType || "all"} onValueChange={(value) => setVesselType(value === "all" ? "" : value)}>
            <SelectTrigger className="focus:ring-2 focus:ring-navy-600">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Cargo">Cargo</SelectItem>
              <SelectItem value="Tanker">Tanker</SelectItem>
              <SelectItem value="Container">Container</SelectItem>
              <SelectItem value="Passenger">Passenger</SelectItem>
              <SelectItem value="Fishing">Fishing</SelectItem>
              <SelectItem value="Tug">Tug</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <Select value={status || "all"} onValueChange={(value) => setStatus(value === "all" ? "" : value)}>
            <SelectTrigger className="focus:ring-2 focus:ring-navy-600">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Under Way">Under Way</SelectItem>
              <SelectItem value="Anchored">Anchored</SelectItem>
              <SelectItem value="Moored">Moored</SelectItem>
              <SelectItem value="Aground">Aground</SelectItem>
              <SelectItem value="Not Under Command">Not Under Command</SelectItem>
              <SelectItem value="Restricted Manoeuvrability">Restricted Manoeuvrability</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(searchQuery || vesselType || status) && (
          <Button
            variant="outline"
            onClick={clearFilters}
            className="w-full"
          >
            <Filter className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
}
