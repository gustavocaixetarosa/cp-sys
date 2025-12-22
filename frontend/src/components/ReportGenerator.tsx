import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  Text,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  useToast,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Icon,
} from '@chakra-ui/react';
import { FiFileText, FiTrendingUp, FiTrendingDown, FiDollarSign, FiAlertCircle } from 'react-icons/fi';
import { relatorioService } from '../services/api';
import type { RelatorioRequest, RelatorioResponse } from '../types';
import { useApp } from '../contexts/AppContext';
import { format } from 'date-fns';

const ReportGenerator: React.FC = () => {
  const { clientes } = useApp();
  const toast = useToast();
  const isMountedRef = useRef(true);
  
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<RelatorioResponse | null>(null);
  
  // Form state
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [clienteId, setClienteId] = useState<string>('');

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleGenerateReport = async () => {
    // Validation
    if (!dataInicio || !dataFim) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha as datas de início e fim.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (new Date(dataInicio) > new Date(dataFim)) {
      toast({
        title: 'Datas inválidas',
        description: 'A data de início deve ser anterior à data de fim.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    setReportData(null); // Clear previous report data
    
    try {
      const request: RelatorioRequest = {
        dataInicio,
        dataFim,
        clienteId: clienteId ? Number(clienteId) : undefined,
      };

      const response = await relatorioService.gerar(request);
      
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setReportData(response);
        
        toast({
          title: 'Relatório gerado',
          description: 'O relatório foi gerado com sucesso.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      
      if (isMountedRef.current) {
        toast({
          title: 'Erro ao gerar relatório',
          description: 'Não foi possível gerar o relatório. Tente novamente.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <Box p={{ base: 4, md: 6 }} bg="white" borderRadius="2xl" boxShadow="sm" border="1px solid" borderColor="gray.100" mb={8}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack spacing={3}>
          <Icon as={FiFileText} boxSize={6} color="blue.500" />
          <Heading size={{ base: "sm", md: "md" }} color="gray.800">
            Gerador de Relatórios
          </Heading>
        </HStack>

        <Divider />

        {/* Form */}
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl isRequired>
            <FormLabel fontSize="sm" fontWeight="600" color="gray.700">
              Data Início
            </FormLabel>
            <Input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              size="md"
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel fontSize="sm" fontWeight="600" color="gray.700">
              Data Fim
            </FormLabel>
            <Input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              size="md"
            />
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm" fontWeight="600" color="gray.700">
              Cliente (Opcional)
            </FormLabel>
            <Select
              placeholder="Todos os clientes"
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              size="md"
            >
              {clientes.map((cliente) => (
                <option key={cliente.cliente_id} value={cliente.cliente_id}>
                  {cliente.nome}
                </option>
              ))}
            </Select>
          </FormControl>
        </SimpleGrid>

        <Button
          colorScheme="blue"
          size="lg"
          onClick={handleGenerateReport}
          isLoading={isLoading}
          leftIcon={<Icon as={FiFileText} />}
          loadingText="Gerando relatório..."
        >
          Gerar Relatório
        </Button>

        {/* Report Results */}
        {reportData && !isLoading && (
          <>
            <Divider />

            <Card bg="blue.50" borderRadius="xl">
              <CardHeader pb={2}>
                <Heading size="sm" color="blue.800">
                  Período: {format(new Date(reportData.dataInicio + 'T00:00:00'), 'dd/MM/yyyy')} até{' '}
                  {format(new Date(reportData.dataFim + 'T00:00:00'), 'dd/MM/yyyy')}
                </Heading>
                <Text fontSize="sm" color="blue.600" mt={1}>
                  {reportData.nomeCliente || 'Todos os clientes'}
                </Text>
              </CardHeader>
              <CardBody pt={2}>
                <Text fontSize="sm" color="gray.600">
                  Total de pagamentos no período: <strong>{reportData.totalPagamentos}</strong>
                </Text>
              </CardBody>
            </Card>

            {/* Statistics Grid */}
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
              {/* Inadimplência */}
              <Card borderRadius="xl" border="1px solid" borderColor="red.200" bg="red.50">
                <CardBody>
                  <Stat>
                    <HStack spacing={2} mb={2}>
                      <Icon as={FiAlertCircle} color="red.500" boxSize={5} />
                      <StatLabel fontSize="sm" fontWeight="600" color="red.800">
                        Inadimplência
                      </StatLabel>
                    </HStack>
                    <StatNumber fontSize="2xl" color="red.600">
                      {reportData.quantidadeInadimplentes}
                    </StatNumber>
                    <StatHelpText fontSize="md" fontWeight="600" color="red.500">
                      {formatPercentage(reportData.percentualInadimplencia)}
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              {/* Pagamentos Antecipados */}
              <Card borderRadius="xl" border="1px solid" borderColor="green.200" bg="green.50">
                <CardBody>
                  <Stat>
                    <HStack spacing={2} mb={2}>
                      <Icon as={FiTrendingUp} color="green.500" boxSize={5} />
                      <StatLabel fontSize="sm" fontWeight="600" color="green.800">
                        Pagos Antecipados
                      </StatLabel>
                    </HStack>
                    <StatNumber fontSize="2xl" color="green.600">
                      {reportData.quantidadePagosAntecipados}
                    </StatNumber>
                    <StatHelpText fontSize="md" fontWeight="600" color="green.500">
                      {formatPercentage(reportData.percentualPagosAntecipados)}
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              {/* Valor Recebido */}
              <Card borderRadius="xl" border="1px solid" borderColor="blue.200" bg="blue.50">
                <CardBody>
                  <Stat>
                    <HStack spacing={2} mb={2}>
                      <Icon as={FiDollarSign} color="blue.500" boxSize={5} />
                      <StatLabel fontSize="sm" fontWeight="600" color="blue.800">
                        Total Recebido
                      </StatLabel>
                    </HStack>
                    <StatNumber fontSize="xl" color="blue.600">
                      {formatCurrency(reportData.valorTotalRecebido)}
                    </StatNumber>
                    <StatHelpText fontSize="sm" color="blue.500">
                      {reportData.quantidadePagos} pagamentos
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              {/* Valor Em Aberto */}
              <Card borderRadius="xl" border="1px solid" borderColor="orange.200" bg="orange.50">
                <CardBody>
                  <Stat>
                    <HStack spacing={2} mb={2}>
                      <Icon as={FiTrendingDown} color="orange.500" boxSize={5} />
                      <StatLabel fontSize="sm" fontWeight="600" color="orange.800">
                        Total Em Aberto
                      </StatLabel>
                    </HStack>
                    <StatNumber fontSize="xl" color="orange.600">
                      {formatCurrency(reportData.valorTotalEmAberto)}
                    </StatNumber>
                    <StatHelpText fontSize="sm" color="orange.500">
                      {reportData.quantidadeEmAberto + reportData.quantidadeAtrasados} pagamentos
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            </SimpleGrid>

            {/* Additional Details */}
            <Card bg="gray.50" borderRadius="xl">
              <CardBody>
                <Heading size="xs" color="gray.700" mb={3}>
                  Detalhamento
                </Heading>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  <Box>
                    <Text fontSize="sm" color="gray.600">
                      Pagos
                    </Text>
                    <Text fontSize="lg" fontWeight="600" color="green.600">
                      {reportData.quantidadePagos}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.600">
                      Atrasados
                    </Text>
                    <Text fontSize="lg" fontWeight="600" color="red.600">
                      {reportData.quantidadeAtrasados}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.600">
                      Em Aberto
                    </Text>
                    <Text fontSize="lg" fontWeight="600" color="blue.600">
                      {reportData.quantidadeEmAberto}
                    </Text>
                  </Box>
                </SimpleGrid>
              </CardBody>
            </Card>
          </>
        )}
      </VStack>
    </Box>
  );
};

export default ReportGenerator;
