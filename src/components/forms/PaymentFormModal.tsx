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
  Select,
  Textarea,
  FormErrorMessage,
  VStack,
  useToast,
  SimpleGrid,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { useApp } from '../../contexts/AppContext';
import type { Pagamento } from '../../types';
import { useEffect } from 'react';

interface PaymentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  pagamento?: Pagamento;
}

interface PaymentFormData {
  data_vencimento: string;
  data_pagamento: string;
  valor: number;
  status: 'ABERTO' | 'PAGO' | 'PAGO_COM_ATRASO' | 'ATRASADO';
  observacao?: string;
}

const PaymentFormModal = ({ isOpen, onClose, pagamento }: PaymentFormModalProps) => {
  const { updatePagamento } = useApp();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PaymentFormData>({
    defaultValues: pagamento || {
      data_vencimento: '',
      data_pagamento: '',
      valor: 0,
      status: 'ABERTO',
      observacao: '',
    },
  });

  useEffect(() => {
    if (pagamento) {
      reset({
        data_vencimento: pagamento.data_vencimento,
        data_pagamento: pagamento.data_pagamento,
        valor: pagamento.valor,
        status: pagamento.status,
        observacao: pagamento.observacao || '',
      });
    }
  }, [pagamento, reset]);

  const onSubmit = async (data: PaymentFormData) => {
    if (!pagamento) return;

    try {
      updatePagamento({
        ...pagamento,
        ...data,
      });
      toast({
        title: 'Pagamento atualizado',
        description: 'O pagamento foi atualizado com sucesso.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onClose();
      reset();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao atualizar o pagamento.',
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
            Editar Pagamento #{pagamento?.numero_parcela}
          </ModalHeader>
          <ModalCloseButton mt={2} />
          
          <ModalBody py={6}>
            <VStack spacing={5}>
              <SimpleGrid columns={2} spacing={5} w="100%">
                <FormControl isInvalid={!!errors.valor}>
                  <FormLabel fontSize="sm" color="gray.600" fontWeight="medium">Valor</FormLabel>
                  <InputGroup size="lg">
                    <InputLeftElement pointerEvents="none" color="gray.500" fontSize="sm" mt={1}>R$</InputLeftElement>
                    <Input
                      {...register('valor', {
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
                  <FormErrorMessage>{errors.valor?.message}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.status}>
                  <FormLabel fontSize="sm" color="gray.600" fontWeight="medium">Status</FormLabel>
                  <Select 
                    {...register('status', { required: 'Status é obrigatório' })}
                    size="lg"
                    borderRadius="lg"
                    bg="gray.50"
                    border="none"
                    _focus={{ bg: 'white', boxShadow: 'outline' }}
                  >
                    <option value="ABERTO">Aberto</option>
                    <option value="PAGO">Pago</option>
                    <option value="PAGO_COM_ATRASO">Pago com Atraso</option>
                    <option value="ATRASADO">Atrasado</option>
                  </Select>
                  <FormErrorMessage>{errors.status?.message}</FormErrorMessage>
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={2} spacing={5} w="100%">
                <FormControl isInvalid={!!errors.data_vencimento}>
                  <FormLabel fontSize="sm" color="gray.600" fontWeight="medium">Data de Vencimento</FormLabel>
                  <Input
                    {...register('data_vencimento', {
                      required: 'Data de vencimento é obrigatória',
                    })}
                    type="date"
                    size="lg"
                    borderRadius="lg"
                    bg="gray.50"
                    border="none"
                    _focus={{ bg: 'white', boxShadow: 'outline' }}
                  />
                  <FormErrorMessage>{errors.data_vencimento?.message}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.data_pagamento}>
                  <FormLabel fontSize="sm" color="gray.600" fontWeight="medium">Data do Pagamento</FormLabel>
                  <Input 
                    {...register('data_pagamento')} 
                    type="date" 
                    size="lg"
                    borderRadius="lg"
                    bg="gray.50"
                    border="none"
                    _focus={{ bg: 'white', boxShadow: 'outline' }}
                  />
                  <FormErrorMessage>{errors.data_pagamento?.message}</FormErrorMessage>
                </FormControl>
              </SimpleGrid>

              <FormControl isInvalid={!!errors.observacao}>
                <FormLabel fontSize="sm" color="gray.600" fontWeight="medium">Observação</FormLabel>
                <Textarea 
                  {...register('observacao')} 
                  placeholder="Observações adicionais..." 
                  size="lg"
                  borderRadius="lg"
                  bg="gray.50"
                  border="none"
                  _focus={{ bg: 'white', boxShadow: 'outline' }}
                  resize="none"
                  rows={3}
                />
                <FormErrorMessage>{errors.observacao?.message}</FormErrorMessage>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter borderTopWidth="1px" borderColor="gray.100" py={4}>
            <Button variant="ghost" mr={3} onClick={onClose} borderRadius="lg">
              Cancelar
            </Button>
            <Button colorScheme="blue" type="submit" isLoading={isSubmitting} borderRadius="lg" px={8}>
              Atualizar Pagamento
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default PaymentFormModal;
