import {
  Box,
  Select,
  FormControl,
  FormLabel,
  VStack,
  Button,
} from '@chakra-ui/react';
import { useState } from 'react';
import type { FilterState } from '../contexts/AppContext';

interface FilterPanelProps {
  onFilterChange: (filters: FilterState) => void;
}

const FilterPanel = ({ onFilterChange }: FilterPanelProps) => {
  const [filters, setFilters] = useState<FilterState>({
    statusPagamento: 'todos',
    statusContrato: 'todos',
    periodo: 'todos',
  });

  const handleChange = (field: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters: FilterState = {
      statusPagamento: 'todos',
      statusContrato: 'todos',
      periodo: 'todos',
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <Box bg="gray.50" p={4} borderRadius="md">
      <VStack spacing={3} align="stretch">
        <FormControl size="sm">
          <FormLabel fontSize="sm">Status do Pagamento</FormLabel>
          <Select
            size="sm"
            value={filters.statusPagamento}
            onChange={(e) => handleChange('statusPagamento', e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="ATRASADO">Atrasado</option>
            <option value="EM_ABERTO">Aberto</option>
            <option value="PAGO">Pago</option>
            <option value="PAGO_COM_ATRASO">Pago com Atraso</option>
          </Select>
        </FormControl>

        <FormControl size="sm">
          <FormLabel fontSize="sm">Período</FormLabel>
          <Select
            size="sm"
            value={filters.periodo}
            onChange={(e) => handleChange('periodo', e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="mes_atual">Mês Atual</option>
            <option value="mes_passado">Mês Passado</option>
            <option value="ultimos_3_meses">Últimos 3 Meses</option>
            <option value="ano_atual">Ano Atual</option>
          </Select>
        </FormControl>

        <Button size="sm" onClick={handleReset} variant="outline">
          Limpar Filtros
        </Button>
      </VStack>
    </Box>
  );
};

export default FilterPanel;

