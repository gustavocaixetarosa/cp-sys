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
} from '@chakra-ui/react';
import { CheckIcon, EditIcon, TimeIcon } from '@chakra-ui/icons';
import { useApp } from '../contexts/AppContext';
import { format, parseISO, isBefore } from 'date-fns';
import PaymentFormModal from './forms/PaymentFormModal';
import { useState } from 'react';
import type { Pagamento } from '../types';

const PaymentList = () => {
  const { selectedContrato, getPagamentosByContrato, marcarPagamentoComoPago } = useApp();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [pagamentoToEdit, setPagamentoToEdit] = useState<Pagamento | null>(null);

  if (!selectedContrato) {
    return (
      <Box h="100%" display="flex" flexDirection="column" alignItems="center" justifyContent="center" p={8} color="gray.400">
        <Icon as={TimeIcon} boxSize={10} mb={4} color="gray.300" />
        <Text textAlign="center" fontWeight="medium">Selecione um contrato</Text>
        <Text textAlign="center" fontSize="sm" mt={1}>Os pagamentos aparecerão aqui</Text>
      </Box>
    );
  }

  const pagamentos = getPagamentosByContrato(selectedContrato.contrato_id);
  const hoje = new Date();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAGO':
        return 'green';
      case 'PAGO_COM_ATRASO':
        return 'orange';
      case 'ATRASADO':
        return 'red';
      case 'ABERTO':
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
      case 'ABERTO':
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

  // Calcular totais
  const totalPago = pagamentos
    .filter((p) => p.status === 'PAGO' || p.status === 'PAGO_COM_ATRASO')
    .reduce((sum, p) => sum + p.valor, 0);
  
  const totalAtrasado = pagamentos
    .filter((p) => p.status === 'ATRASADO')
    .reduce((sum, p) => sum + p.valor, 0);
  
  const totalAberto = pagamentos
    .filter((p) => p.status === 'ABERTO')
    .reduce((sum, p) => sum + p.valor, 0);

  return (
    <Flex direction="column" h="100%">
      <Box p={5} borderBottom="1px solid" borderColor="gray.100">
        <Heading size="sm" color="gray.700" mb={4}>Pagamentos</Heading>

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
            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.600">Em Atraso</Text>
              <Text fontSize="sm" fontWeight="600" color="red.600">
                R$ {totalAtrasado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </HStack>
            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.600">A Vencer</Text>
              <Text fontSize="sm" fontWeight="600" color="blue.600">
                R$ {totalAberto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </HStack>
          </VStack>
        </Box>
      </Box>

      <Box flex={1} overflowY="auto" p={5}>
        <VStack spacing={3} align="stretch">
          {pagamentos.map((pagamento) => {
            const vencimento = parseISO(pagamento.data_vencimento);
            const estaAtrasado =
              pagamento.status === 'ABERTO' && isBefore(vencimento, hoje);
            
            const statusFinal = estaAtrasado ? 'ATRASADO' : pagamento.status;

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

                {(pagamento.status === 'ABERTO' || pagamento.status === 'ATRASADO') && (
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
