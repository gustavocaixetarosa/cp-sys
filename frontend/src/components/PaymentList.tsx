import {
  Box,
  Heading,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  IconButton,
  useDisclosure,
  Flex,
  Icon,
  Skeleton,
  Stack,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  Collapse,
  Tooltip,
} from '@chakra-ui/react';
import { CheckIcon, EditIcon, TimeIcon, CloseIcon, CalendarIcon } from '@chakra-ui/icons';
import { FiFilter } from 'react-icons/fi';
import { useApp, type PaymentFilterStatus } from '../contexts/AppContext';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import PaymentFormModal from './forms/PaymentFormModal';
import React, { useState } from 'react';
import type { Pagamento } from '../types';

const PaymentList = () => {
  const { 
    selectedContrato, 
    getPagamentosByContrato, 
    getFilteredPagamentosByContrato,
    marcarPagamentoComoPago, 
    isLoading,
    paymentFilters,
    setPaymentFilters,
    clearPaymentFilters,
  } = useApp();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isFilterOpen, onToggle: onFilterToggle } = useDisclosure();
  const [pagamentoToEdit, setPagamentoToEdit] = useState<Pagamento | null>(null);

  const hasActiveFilters = paymentFilters.status !== 'TODOS' || paymentFilters.dateFrom || paymentFilters.dateTo;

  if (!selectedContrato) {
    return (
      <Box h="100%" display="flex" flexDirection="column" alignItems="center" justifyContent="center" p={8} color="gray.400">
        <Icon as={TimeIcon} boxSize={10} mb={4} color="gray.300" />
        <Text textAlign="center" fontWeight="medium">Selecione um contrato</Text>
        <Text textAlign="center" fontSize="sm" mt={1}>Os pagamentos aparecerão aqui</Text>
      </Box>
    );
  }

  const allPagamentos = getPagamentosByContrato(selectedContrato.contrato_id);
  const pagamentos = getFilteredPagamentosByContrato(selectedContrato.contrato_id);
  const hoje = new Date();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAGO':
        return 'green';
      case 'PAGO_COM_ATRASO':
        return 'orange';
      case 'ATRASADO':
        return 'red';
      case 'EM_ABERTO':
        return 'blue';
      default:
        return 'gray';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PAGO':
        return 'Pago';
      case 'PAGO_COM_ATRASO':
        return 'Pago c/ atraso';
      case 'ATRASADO':
        return 'Atrasado';
      case 'EM_ABERTO':
        return 'Aberto';
      default:
        return status;
    }
  };

  const handleMarcarPago = (pagamento_id: number) => {
    const dataAtual = format(new Date(), 'yyyy-MM-dd');
    marcarPagamentoComoPago(pagamento_id, dataAtual);
  };

  const handleEdit = (pagamento: Pagamento) => {
    setPagamentoToEdit(pagamento);
    onOpen();
  };

  // Calcular totais (usando todos os pagamentos, sem filtro)
  const totalPago = allPagamentos
    .filter((p: Pagamento) => p.status === 'PAGO' || p.status === 'PAGO_COM_ATRASO')
    .reduce((sum: number, p: Pagamento) => sum + p.valor, 0);
  
  const totalAtrasado = allPagamentos
    .filter((p: Pagamento) => {
      if (p.status === 'ATRASADO') return true;
      if (p.status === 'EM_ABERTO') {
        const vencimento = parseISO(p.data_vencimento);
        return isBefore(vencimento, startOfDay(hoje));
      }
      return false;
    })
    .reduce((sum: number, p: Pagamento) => sum + p.valor, 0);
  
  const totalAberto = allPagamentos
    .filter((p: Pagamento) => {
      if (p.status !== 'EM_ABERTO') return false;
      const vencimento = parseISO(p.data_vencimento);
      return !isBefore(vencimento, startOfDay(hoje));
    })
    .reduce((sum: number, p: Pagamento) => sum + p.valor, 0);

  const handleStatusFilterChange = (status: PaymentFilterStatus) => {
    setPaymentFilters({ status });
  };

  return (
    <Flex direction="column" h="100%">
      <Box p={5} borderBottom="1px solid" borderColor="gray.100">
        <HStack justify="space-between" mb={4}>
          <Heading size="sm" color="gray.700">Pagamentos</Heading>
          <HStack spacing={2}>
            {hasActiveFilters && (
              <Tooltip label="Limpar filtros">
                <IconButton
                  aria-label="Limpar filtros"
                  icon={<CloseIcon />}
                  size="xs"
                  variant="ghost"
                  colorScheme="red"
                  onClick={clearPaymentFilters}
                />
              </Tooltip>
            )}
            <Tooltip label={isFilterOpen ? "Ocultar filtros" : "Mostrar filtros"}>
              <IconButton
                aria-label="Filtros"
                icon={<Icon as={FiFilter} />}
                size="sm"
                variant={hasActiveFilters ? 'solid' : 'ghost'}
                colorScheme={hasActiveFilters ? 'blue' : 'gray'}
                onClick={onFilterToggle}
              />
            </Tooltip>
          </HStack>
        </HStack>

        {/* Filtros */}
        <Collapse in={isFilterOpen} animateOpacity>
          <Box bg="blue.50" p={4} borderRadius="xl" mb={4}>
            <Text fontSize="xs" color="blue.600" textTransform="uppercase" fontWeight="bold" mb={3}>
              Filtros
            </Text>
            <VStack spacing={3} align="stretch">
              <Box>
                <Text fontSize="xs" color="gray.600" mb={1}>Status</Text>
                <Select
                  size="sm"
                  value={paymentFilters.status}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleStatusFilterChange(e.target.value as PaymentFilterStatus)}
                  bg="white"
                  borderRadius="lg"
                >
                  <option value="TODOS">Todos</option>
                  <option value="EM_ABERTO">Em Aberto</option>
                  <option value="ATRASADO">Atrasado</option>
                  <option value="PAGO">Pago</option>
                  <option value="PAGO_COM_ATRASO">Pago c/ Atraso</option>
                </Select>
              </Box>
              <HStack spacing={2}>
                <Box flex={1}>
                  <Text fontSize="xs" color="gray.600" mb={1}>Vencimento de</Text>
                  <InputGroup size="sm">
                    <InputLeftElement pointerEvents="none">
                      <CalendarIcon color="gray.400" />
                    </InputLeftElement>
                    <Input
                      type="date"
                      value={paymentFilters.dateFrom || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPaymentFilters({ dateFrom: e.target.value || null })}
                      bg="white"
                      borderRadius="lg"
                      pl={8}
                    />
                  </InputGroup>
                </Box>
                <Box flex={1}>
                  <Text fontSize="xs" color="gray.600" mb={1}>até</Text>
                  <InputGroup size="sm">
                    <InputLeftElement pointerEvents="none">
                      <CalendarIcon color="gray.400" />
                    </InputLeftElement>
                    <Input
                      type="date"
                      value={paymentFilters.dateTo || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPaymentFilters({ dateTo: e.target.value || null })}
                      bg="white"
                      borderRadius="lg"
                      pl={8}
                    />
                  </InputGroup>
                </Box>
              </HStack>
            </VStack>
          </Box>
        </Collapse>

        <Box bg="gray.50" p={4} borderRadius="xl">
          <Text fontSize="xs" color="gray.500" textTransform="uppercase" fontWeight="bold" mb={3}>
            Resumo do Contrato
          </Text>
          
          <VStack spacing={3} align="stretch">
            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.600">Total Pago</Text>
              <Text fontSize="sm" fontWeight="600" color="green.600">
                R$ {totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </HStack>
            <HStack 
              justify="space-between" 
              cursor="pointer" 
              _hover={{ bg: 'red.100' }}
              p={1}
              mx={-1}
              borderRadius="md"
              onClick={() => handleStatusFilterChange(paymentFilters.status === 'ATRASADO' ? 'TODOS' : 'ATRASADO')}
              transition="all 0.2s"
            >
              <Text fontSize="sm" color="gray.600">Em Atraso</Text>
              <HStack>
                <Text fontSize="sm" fontWeight="600" color="red.600">
                  R$ {totalAtrasado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
                {paymentFilters.status === 'ATRASADO' && (
                  <Badge colorScheme="red" fontSize="2xs">Filtrado</Badge>
                )}
              </HStack>
            </HStack>
            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.600">A Vencer</Text>
              <Text fontSize="sm" fontWeight="600" color="blue.600">
                R$ {totalAberto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </HStack>
          </VStack>
        </Box>

        {hasActiveFilters && (
          <Text fontSize="xs" color="blue.600" mt={2} textAlign="center">
            Mostrando {pagamentos.length} de {allPagamentos.length} pagamentos
          </Text>
        )}
      </Box>

      <Box flex={1} overflowY="auto" p={5}>
        {isLoading ? (
          <Stack spacing={4}>
            <Skeleton height="100px" borderRadius="xl" />
            <Skeleton height="100px" borderRadius="xl" />
            <Skeleton height="100px" borderRadius="xl" />
          </Stack>
        ) : (
          <VStack spacing={3} align="stretch">
            {pagamentos.map((pagamento: Pagamento) => {
              const vencimento = parseISO(pagamento.data_vencimento);
              const statusOriginal = pagamento.status;
              
              // backend deve ter atualizado via job diário.
              // Se não rodou, frontend pode mostrar aviso ou calcular.
              // Vou manter a lógica visual de atraso apenas para destaque se o backend não tiver atualizado.
              const estaAtrasadoCalculado = (statusOriginal === 'EM_ABERTO') && isBefore(vencimento, hoje);
              const statusFinal = estaAtrasadoCalculado ? 'ATRASADO' : statusOriginal;

              return (
                <Box
                  key={pagamento.pagamento_id}
                  bg="white"
                  p={4}
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="gray.100"
                  position="relative"
                  _hover={{ borderColor: 'blue.200', boxShadow: 'sm' }}
                  transition="all 0.2s"
                >
                  <Flex justify="space-between" mb={3}>
                    <HStack>
                      <Box 
                        w={8} 
                        h={8} 
                        borderRadius="full" 
                        bg={`${getStatusColor(statusFinal)}.50`} 
                        color={`${getStatusColor(statusFinal)}.500`}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        fontSize="xs"
                        fontWeight="bold"
                      >
                        {pagamento.numero_parcela}
                      </Box>
                      <Text fontWeight="600" fontSize="sm" color="gray.700">
                        Parcela
                      </Text>
                    </HStack>
                    <Badge 
                      colorScheme={getStatusColor(statusFinal)} 
                      variant="subtle" 
                      borderRadius="full" 
                      px={2}
                      py={0.5}
                      fontSize="xs"
                    >
                      {getStatusLabel(statusFinal)}
                    </Badge>
                  </Flex>

                  <Flex justify="space-between" align="flex-end">
                    <Box>
                      <Text fontSize="xs" color="gray.500" mb={0.5}>Vencimento</Text>
                      <Text fontSize="sm" fontWeight="medium" color="gray.700">
                        {format(vencimento, 'dd/MM/yyyy')}
                      </Text>
                    </Box>
                    <Box textAlign="right">
                      <Text fontSize="xs" color="gray.500" mb={0.5}>Valor</Text>
                      <Text fontWeight="700" color="gray.800">
                        R$ {pagamento.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Text>
                    </Box>
                  </Flex>

                  {(statusFinal === 'EM_ABERTO' || statusFinal === 'ATRASADO') && (
                    <HStack mt={4} pt={3} borderTop="1px dashed" borderColor="gray.100">
                      <Button
                        size="sm"
                        variant="ghost"
                        colorScheme="green"
                        leftIcon={<CheckIcon />}
                        onClick={() => handleMarcarPago(pagamento.pagamento_id)}
                        flex={1}
                        fontSize="xs"
                        h={8}
                      >
                        Pagar
                      </Button>
                      <IconButton
                        aria-label="Editar pagamento"
                        icon={<EditIcon />}
                        size="sm"
                        variant="ghost"
                        colorScheme="gray"
                        onClick={() => handleEdit(pagamento)}
                        h={8}
                      />
                    </HStack>
                  )}
                </Box>
              );
            })}

            {pagamentos.length === 0 && (
              <Box textAlign="center" py={8} color="gray.400">
                <Text fontSize="sm">Nenhum pagamento registrado</Text>
              </Box>
            )}
          </VStack>
        )}
      </Box>

      {/* Edit Payment Modal */}
      <PaymentFormModal
        isOpen={isOpen}
        onClose={() => {
          onClose();
          setPagamentoToEdit(null);
        }}
        pagamento={pagamentoToEdit || undefined}
      />
    </Flex>
  );
};

export default PaymentList;
