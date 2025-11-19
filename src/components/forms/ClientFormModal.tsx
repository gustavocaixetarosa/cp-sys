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
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { useApp } from '../../contexts/AppContext';
import type { Cliente } from '../../types';
import { useEffect } from 'react';

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  cliente?: Cliente;
}

interface ClientFormData {
  nome: string;
  endereco: string;
  registro: string;
  telefone: string;
  data_vencimento: string;
  banco: string;
}

const ClientFormModal = ({ isOpen, onClose, cliente }: ClientFormModalProps) => {
  const { addCliente, updateCliente } = useApp();
  const toast = useToast();
  const isEdit = !!cliente;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ClientFormData>({
    defaultValues: cliente || {
      nome: '',
      endereco: '',
      registro: '',
      telefone: '',
      data_vencimento: '',
      banco: '',
    },
  });

  useEffect(() => {
    if (cliente) {
      reset(cliente);
    } else {
      reset({
        nome: '',
        endereco: '',
        registro: '',
        telefone: '',
        data_vencimento: '',
        banco: '',
      });
    }
  }, [cliente, reset]);

  const onSubmit = async (data: ClientFormData) => {
    try {
      if (isEdit && cliente) {
        updateCliente({ ...cliente, ...data });
        toast({
          title: 'Cliente atualizado',
          description: 'O cliente foi atualizado com sucesso.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        addCliente(data);
        toast({
          title: 'Cliente adicionado',
          description: 'O cliente foi adicionado com sucesso.',
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
        description: 'Ocorreu um erro ao salvar o cliente.',
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
            {isEdit ? 'Editar Cliente' : 'Novo Cliente'}
          </ModalHeader>
          <ModalCloseButton mt={2} />
          
          <ModalBody py={6}>
            <VStack spacing={5}>
              <FormControl isInvalid={!!errors.nome}>
                <FormLabel fontSize="sm" color="gray.600" fontWeight="medium">Nome Completo</FormLabel>
                <Input
                  {...register('nome', {
                    required: 'Nome é obrigatório',
                    minLength: { value: 3, message: 'Nome deve ter pelo menos 3 caracteres' },
                  })}
                  placeholder="Ex: João da Silva"
                  size="lg"
                  borderRadius="lg"
                  bg="gray.50"
                  border="none"
                  _focus={{ bg: 'white', boxShadow: 'outline' }}
                />
                <FormErrorMessage>{errors.nome?.message}</FormErrorMessage>
              </FormControl>

              <SimpleGrid columns={2} spacing={5} w="100%">
                <FormControl isInvalid={!!errors.registro}>
                  <FormLabel fontSize="sm" color="gray.600" fontWeight="medium">CPF / CNPJ</FormLabel>
                  <Input
                    {...register('registro', {
                      required: 'Registro é obrigatório',
                    })}
                    placeholder="000.000.000-00"
                    size="lg"
                    borderRadius="lg"
                    bg="gray.50"
                    border="none"
                    _focus={{ bg: 'white', boxShadow: 'outline' }}
                  />
                  <FormErrorMessage>{errors.registro?.message}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.telefone}>
                  <FormLabel fontSize="sm" color="gray.600" fontWeight="medium">Telefone</FormLabel>
                  <Input
                    {...register('telefone', {
                      required: 'Telefone é obrigatório',
                    })}
                    placeholder="(00) 00000-0000"
                    size="lg"
                    borderRadius="lg"
                    bg="gray.50"
                    border="none"
                    _focus={{ bg: 'white', boxShadow: 'outline' }}
                  />
                  <FormErrorMessage>{errors.telefone?.message}</FormErrorMessage>
                </FormControl>
              </SimpleGrid>

              <FormControl isInvalid={!!errors.endereco}>
                <FormLabel fontSize="sm" color="gray.600" fontWeight="medium">Endereço</FormLabel>
                <Input
                  {...register('endereco', {
                    required: 'Endereço é obrigatório',
                  })}
                  placeholder="Rua, número, bairro, cidade"
                  size="lg"
                  borderRadius="lg"
                  bg="gray.50"
                  border="none"
                  _focus={{ bg: 'white', boxShadow: 'outline' }}
                />
                <FormErrorMessage>{errors.endereco?.message}</FormErrorMessage>
              </FormControl>

              <SimpleGrid columns={2} spacing={5} w="100%">
                <FormControl isInvalid={!!errors.banco}>
                  <FormLabel fontSize="sm" color="gray.600" fontWeight="medium">Banco</FormLabel>
                  <Input
                    {...register('banco', {
                      required: 'Banco é obrigatório',
                    })}
                    placeholder="Ex: Banco do Brasil"
                    size="lg"
                    borderRadius="lg"
                    bg="gray.50"
                    border="none"
                    _focus={{ bg: 'white', boxShadow: 'outline' }}
                  />
                  <FormErrorMessage>{errors.banco?.message}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.data_vencimento}>
                  <FormLabel fontSize="sm" color="gray.600" fontWeight="medium">Dia de Vencimento</FormLabel>
                  <Input
                    {...register('data_vencimento', {
                      required: 'Dia de vencimento é obrigatório',
                      min: { value: 1, message: 'Dia deve ser entre 1 e 31' },
                      max: { value: 31, message: 'Dia deve ser entre 1 e 31' },
                    })}
                    type="number"
                    placeholder="1-31"
                    size="lg"
                    borderRadius="lg"
                    bg="gray.50"
                    border="none"
                    _focus={{ bg: 'white', boxShadow: 'outline' }}
                  />
                  <FormErrorMessage>{errors.data_vencimento?.message}</FormErrorMessage>
                </FormControl>
              </SimpleGrid>
            </VStack>
          </ModalBody>

          <ModalFooter borderTopWidth="1px" borderColor="gray.100" py={4}>
            <Button variant="ghost" mr={3} onClick={onClose} borderRadius="lg">
              Cancelar
            </Button>
            <Button colorScheme="blue" type="submit" isLoading={isSubmitting} borderRadius="lg" px={8}>
              {isEdit ? 'Salvar Alterações' : 'Criar Cliente'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default ClientFormModal;
