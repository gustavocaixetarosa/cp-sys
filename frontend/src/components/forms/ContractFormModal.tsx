import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  VStack,
  useToast,
  SimpleGrid,
  InputGroup,
  InputLeftElement,
  Box,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { useApp } from '../../contexts/AppContext';
import type { Contrato, CreateContratoDTO } from '../../types';
import { useEffect } from 'react';
import { addMonths, format } from 'date-fns';

interface ContractFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  contrato?: Contrato;
}

interface ContractFormData {
  nome_contratante: string;
  cpf_contratante: string;
  data: string; // dataInicioContrato
  dataPrimeiraParcela: string;
  duracao_em_meses: number;
  valor_contrato: number;
}

const ContractFormModal = ({ isOpen, onClose, contrato }: ContractFormModalProps) => {
  const { addContrato, updateContrato, selectedCliente } = useApp();
  const toast = useToast();
  const isEdit = !!contrato;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<ContractFormData>({
    defaultValues: contrato ? {
      nome_contratante: contrato.nome_contratante,
      cpf_contratante: contrato.cpf_contratante,
      data: contrato.data,
      duracao_em_meses: contrato.duracao_em_meses,
      valor_contrato: contrato.valor_contrato,
      dataPrimeiraParcela: '', // Contrato existente pode não ter esse dado fácil, e update não usa
    } : {
      nome_contratante: '',
      cpf_contratante: '',
      data: new Date().toISOString().split('T')[0],
      dataPrimeiraParcela: format(addMonths(new Date(), 1), 'yyyy-MM-dd'),
      duracao_em_meses: 12,
      valor_contrato: 0,
    },
  });

  // Auto-update dataPrimeiraParcela when data changes (if new)
  const dataInicio = watch('data');
  useEffect(() => {
    if (!isEdit && dataInicio) {
      setValue('dataPrimeiraParcela', format(addMonths(new Date(dataInicio), 1), 'yyyy-MM-dd'));
    }
  }, [dataInicio, isEdit, setValue]);

  useEffect(() => {
    if (contrato) {
      reset({
        nome_contratante: contrato.nome_contratante,
        cpf_contratante: contrato.cpf_contratante,
        data: contrato.data,
        duracao_em_meses: contrato.duracao_em_meses,
        valor_contrato: contrato.valor_contrato,
        dataPrimeiraParcela: '',
      });
    } else {
      reset({
        nome_contratante: '',
        cpf_contratante: '',
        data: new Date().toISOString().split('T')[0],
        dataPrimeiraParcela: format(addMonths(new Date(), 1), 'yyyy-MM-dd'),
        duracao_em_meses: 12,
        valor_contrato: 0,
      });
    }
  }, [contrato, reset]);

  const onSubmit = async (data: ContractFormData) => {
    if (!selectedCliente && !isEdit) {
      toast({
        title: 'Erro',
        description: 'Selecione um cliente antes de adicionar um contrato.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      if (isEdit && contrato) {
        await updateContrato({ ...contrato, ...data });
        toast({
          title: 'Contrato atualizado',
          description: 'O contrato foi atualizado com sucesso.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else if (selectedCliente) {
        // Extrair cliente_id de forma segura (pode vir como cliente_id ou id)
        const clienteId = selectedCliente.cliente_id ?? (selectedCliente as any).id;
        
        // Validação explícita do cliente_id
        if (!clienteId || typeof clienteId !== 'number') {
          console.error('Cliente selecionado inválido:', selectedCliente);
          toast({
            title: 'Erro',
            description: `Cliente selecionado inválido (ID: ${clienteId}). Por favor, selecione um cliente novamente.`,
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
          return;
        }

        const createDTO: CreateContratoDTO = {
          clienteId: clienteId,
          nomeContratante: data.nome_contratante,
          cpfContratante: data.cpf_contratante,
          duracaoEmMeses: data.duracao_em_meses,
          dataInicioContrato: data.data,
          dataPrimeiraParcela: data.dataPrimeiraParcela,
          valorContrato: data.valor_contrato,
        };
        
        await addContrato(createDTO);
        toast({
          title: 'Contrato adicionado',
          description: 'O contrato foi adicionado com sucesso e os pagamentos foram gerados.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      onClose();
      reset();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao salvar o contrato.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(5px)" />
      <ModalContent borderRadius="2xl" boxShadow="xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalHeader borderBottomWidth="1px" borderColor="gray.100" pb={4}>
            {isEdit ? 'Editar Contrato' : 'Novo Contrato'}
          </ModalHeader>
          <ModalCloseButton mt={2} />
          
          <ModalBody py={6}>
            <VStack spacing={5}>
              <FormControl isInvalid={!!errors.nome_contratante}>
                <FormLabel fontSize="sm" color="gray.600" fontWeight="medium">Nome do Contratante</FormLabel>
                <Input
                  {...register('nome_contratante', {
                    required: 'Nome do contratante é obrigatório',
                  })}
                  placeholder="Nome completo"
                  size="lg"
                  borderRadius="lg"
                  bg="gray.50"
                  border="none"
                  _focus={{ bg: 'white', boxShadow: 'outline' }}
                />
                <FormErrorMessage>{errors.nome_contratante?.message}</FormErrorMessage>
              </FormControl>

              <SimpleGrid columns={2} spacing={5} w="100%">
                <FormControl isInvalid={!!errors.cpf_contratante}>
                  <FormLabel fontSize="sm" color="gray.600" fontWeight="medium">CPF/CNPJ</FormLabel>
                  <Input
                    {...register('cpf_contratante', {
                      required: 'CPF é obrigatório',
                    })}
                    placeholder="000.000.000-00"
                    size="lg"
                    borderRadius="lg"
                    bg="gray.50"
                    border="none"
                    _focus={{ bg: 'white', boxShadow: 'outline' }}
                  />
                  <FormErrorMessage>{errors.cpf_contratante?.message}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.data}>
                  <FormLabel fontSize="sm" color="gray.600" fontWeight="medium">Data de Início</FormLabel>
                  <Input
                    {...register('data', {
                      required: 'Data é obrigatória',
                    })}
                    type="date"
                    size="lg"
                    borderRadius="lg"
                    bg="gray.50"
                    border="none"
                    _focus={{ bg: 'white', boxShadow: 'outline' }}
                  />
                  <FormErrorMessage>{errors.data?.message}</FormErrorMessage>
                </FormControl>
              </SimpleGrid>

              {!isEdit && (
                <SimpleGrid columns={2} spacing={5} w="100%">
                  <FormControl isInvalid={!!errors.dataPrimeiraParcela}>
                    <FormLabel fontSize="sm" color="gray.600" fontWeight="medium">Data 1ª Parcela</FormLabel>
                    <Input
                      {...register('dataPrimeiraParcela', {
                        required: 'Data da primeira parcela é obrigatória',
                      })}
                      type="date"
                      size="lg"
                      borderRadius="lg"
                      bg="gray.50"
                      border="none"
                      _focus={{ bg: 'white', boxShadow: 'outline' }}
                    />
                    <FormErrorMessage>{errors.dataPrimeiraParcela?.message}</FormErrorMessage>
                  </FormControl>
                  <Box /> 
                </SimpleGrid>
              )}

              <SimpleGrid columns={2} spacing={5} w="100%">
                <FormControl isInvalid={!!errors.duracao_em_meses}>
                  <FormLabel fontSize="sm" color="gray.600" fontWeight="medium">Duração (meses)</FormLabel>
                  <Input
                    {...register('duracao_em_meses', {
                      required: 'Duração é obrigatória',
                      min: { value: 1, message: 'Duração deve ser pelo menos 1 mês' },
                      max: { value: 120, message: 'Duração máxima é 120 meses' },
                    })}
                    type="number"
                    min="1"
                    max="120"
                    size="lg"
                    borderRadius="lg"
                    bg="gray.50"
                    border="none"
                    _focus={{ bg: 'white', boxShadow: 'outline' }}
                  />
                  <FormErrorMessage>{errors.duracao_em_meses?.message}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.valor_contrato}>
                  <FormLabel fontSize="sm" color="gray.600" fontWeight="medium">Valor Total</FormLabel>
                  <InputGroup size="lg">
                    <InputLeftElement pointerEvents="none" color="gray.500" fontSize="sm" mt={1}>R$</InputLeftElement>
                    <Input
                      {...register('valor_contrato', {
                        required: 'Valor é obrigatório',
                        min: { value: 0.01, message: 'Valor deve ser maior que zero' },
                      })}
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      borderRadius="lg"
                      bg="gray.50"
                      border="none"
                      _focus={{ bg: 'white', boxShadow: 'outline' }}
                      pl={10}
                    />
                  </InputGroup>
                  <FormErrorMessage>{errors.valor_contrato?.message}</FormErrorMessage>
                </FormControl>
              </SimpleGrid>
            </VStack>
          </ModalBody>

          <ModalFooter borderTopWidth="1px" borderColor="gray.100" py={4}>
            <Button variant="ghost" mr={3} onClick={onClose} borderRadius="lg">
              Cancelar
            </Button>
            <Button colorScheme="blue" type="submit" isLoading={isSubmitting} borderRadius="lg" px={8}>
              {isEdit ? 'Salvar Alterações' : 'Criar Contrato'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default ContractFormModal;
