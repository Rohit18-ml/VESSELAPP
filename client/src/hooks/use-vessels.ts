import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { VesselData, VesselFilters } from '../types/vessel';
import { apiRequest } from '../lib/queryClient';

export function useVessels(refetchInterval: number = 10000) {
  return useQuery<VesselData[]>({
    queryKey: ['/api/vessels'],
    staleTime: 30000, // 30 seconds
    refetchInterval: refetchInterval, // Auto-refresh interval
  });
}

export function useVessel(id: number) {
  return useQuery<VesselData>({
    queryKey: ['/api/vessels', id],
    enabled: !!id,
  });
}

export function useVesselTrail(vesselId: number) {
  return useQuery({
    queryKey: ['/api/vessels', vesselId, 'trail'],
    enabled: !!vesselId,
  });
}

export function useSearchVessels(query: string) {
  return useQuery<VesselData[]>({
    queryKey: ['/api/vessels/search', { q: query }],
    enabled: !!query && query.length > 0,
  });
}

export function useFilterVessels(filters: VesselFilters) {
  const queryParams = new URLSearchParams();
  if (filters.type) queryParams.append('type', filters.type);
  if (filters.status) queryParams.append('status', filters.status);
  
  return useQuery<VesselData[]>({
    queryKey: ['/api/vessels/filter', queryParams.toString()],
    enabled: !!(filters.type || filters.status),
  });
}

export function useCreateVessel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (vesselData: any) => {
      const response = await apiRequest('POST', '/api/vessels', vesselData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vessels'] });
    },
  });
}

export function useUpdateVessel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest('PUT', `/api/vessels/${id}`, data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/vessels'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vessels', data.id] });
    },
  });
}

export function useDeleteVessel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/vessels/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vessels'] });
    },
  });
}
