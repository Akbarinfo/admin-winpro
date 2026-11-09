import { useQuery } from '@tanstack/react-query'
import { workshopServiceApi, workshopServiceKeys } from './api'

// Enums of this section: change only with a backend release.
export const useServiceTypes = () =>
  useQuery({
    queryKey: [...workshopServiceKeys.all, 'service-types'],
    queryFn: ({ signal }) => workshopServiceApi.serviceTypes(signal),
    staleTime: Infinity,
  })

export const useCalculationTypes = () =>
  useQuery({
    queryKey: [...workshopServiceKeys.all, 'calculation-types'],
    queryFn: ({ signal }) => workshopServiceApi.calculationTypes(signal),
    staleTime: Infinity,
  })
