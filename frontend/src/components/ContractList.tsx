import {
  Box,
  Button,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  useDisclosure,
  HStack,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Text,
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Skeleton,
  Stack,
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon, HamburgerIcon } from '@chakra-ui/icons';
import { useApp } from '../contexts/AppContext';
import ContractFormModal from './forms/ContractFormModal';
import { useState, useRef } from 'react';
import type { Contrato } from '../types';
import { format } from 'date-fns';

const ContractList = () => {
  const {
    selectedCliente,
    getContratosByCliente,
    deleteContrato,
    selectedContrato,
    selectContrato,
    isLoading,
    contratoTemPagamentoAtrasado,
  } = useApp();
  
  const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [contratoToEdit, setContratoToEdit] = useState<Contrato | null>(null);
  const [contratoToDelete, setContratoToDelete] = useState<Contrato | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  if (!selectedCliente) return null;

  const contratos = getContratosByCliente(selectedCliente.cliente_id);

  const handleEdit = (contrato: Contrato) => {
    setContratoToEdit(contrato);
    onEditOpen();
  };

  const handleDeleteClick = (contrato: Contrato) => {
    setContratoToDelete(contrato);
    onDeleteOpen();
  };

  const handleDelete = () => {
    if (contratoToDelete) {
      deleteContrato(contratoToDelete.contrato_id);
      setContratoToDelete(null);
      onDeleteClose();
    }
  };

  const handleRowClick = (contrato: Contrato) => {
    selectContrato(contrato);
  };

  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <Heading size="sm" color="gray.700">Contratos ({isLoading ? '...' : contratos.length})</Heading>
        <Button 
          leftIcon={<AddIcon />} 
          colorScheme="blue" 
          size="sm" 
          onClick={onAddOpen}
          borderRadius="lg"
          isDisabled={isLoading}
        >
          Novo Contrato
        </Button>
      </HStack>

      {isLoading ? (
        <Stack spacing={4}>
          <Skeleton height="40px" />
          <Skeleton height="40px" />
          <Skeleton height="40px" />
        </Stack>
      ) : contratos.length === 0 ? (
        <Box textAlign="center" py={12} bg="gray.50" borderRadius="xl" border="1px dashed" borderColor="gray.200">
          <Text color="gray.500" mb={2}>Nenhum contrato encontrado</Text>
          <Button size="sm" variant="link" colorScheme="blue" onClick={onAddOpen}>Criar primeiro contrato</Button>
        </Box>
      ) : (
        <Box overflowX="auto" mx={-6} px={6}>
          <Table variant="simple" size="md">
            <Thead>
              <Tr>
                <Th borderBottomWidth="1px" borderColor="gray.100" fontSize="xs" textTransform="uppercase" color="gray.400" fontWeight="bold">ID</Th>
                <Th borderBottomWidth="1px" borderColor="gray.100" fontSize="xs" textTransform="uppercase" color="gray.400" fontWeight="bold">Contratante</Th>
                <Th borderBottomWidth="1px" borderColor="gray.100" fontSize="xs" textTransform="uppercase" color="gray.400" fontWeight="bold">Início</Th>
                <Th borderBottomWidth="1px" borderColor="gray.100" fontSize="xs" textTransform="uppercase" color="gray.400" fontWeight="bold" isNumeric>Duração</Th>
                <Th borderBottomWidth="1px" borderColor="gray.100" fontSize="xs" textTransform="uppercase" color="gray.400" fontWeight="bold" isNumeric>Valor</Th>
                <Th borderBottomWidth="1px" borderColor="gray.100" w="50px"></Th>
              </Tr>
            </Thead>
            <Tbody>
              {contratos.map((contrato) => {
                const temPagamentoAtrasado = contratoTemPagamentoAtrasado(contrato.contrato_id);
                const isSelected = selectedContrato?.contrato_id === contrato.contrato_id;
                
                return (
                  <Tr
                    key={contrato.contrato_id}
                    cursor="pointer"
                    bg={isSelected ? (temPagamentoAtrasado ? 'red.50' : 'blue.50') : 'transparent'}
                    _hover={{ bg: isSelected ? (temPagamentoAtrasado ? 'red.50' : 'blue.50') : (temPagamentoAtrasado ? 'red.50' : 'gray.50') }}
                    onClick={() => handleRowClick(contrato)}
                    transition="all 0.2s"
                    borderLeft={temPagamentoAtrasado ? '4px solid' : 'none'}
                    borderLeftColor={temPagamentoAtrasado ? 'red.500' : 'transparent'}
                  >
                    <Td borderBottomWidth="1px" borderColor="gray.100" fontWeight="medium" color={temPagamentoAtrasado ? 'red.600' : 'gray.500'}>
                      #{contrato.contrato_id}
                    </Td>
                    <Td borderBottomWidth="1px" borderColor="gray.100">
                      <Box>
                        <Text fontWeight="600" color={temPagamentoAtrasado ? 'red.700' : 'gray.700'}>
                          {contrato.nome_contratante}
                        </Text>
                        <Text fontSize="xs" color="gray.400">{contrato.cpf_contratante}</Text>
                      </Box>
                    </Td>
                    <Td borderBottomWidth="1px" borderColor="gray.100" color="gray.600">
                      {format(new Date(contrato.data), 'dd/MM/yyyy')}
                    </Td>
                    <Td borderBottomWidth="1px" borderColor="gray.100" isNumeric>
                      <Badge colorScheme="purple" variant="subtle" borderRadius="full" px={2}>
                        {contrato.duracao_em_meses} meses
                      </Badge>
                    </Td>
                    <Td borderBottomWidth="1px" borderColor="gray.100" isNumeric fontWeight="bold" color={temPagamentoAtrasado ? 'red.700' : 'gray.700'}>
                      R$ {contrato.valor_contrato.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Td>
                    <Td borderBottomWidth="1px" borderColor="gray.100">
                      <Menu>
                        <MenuButton
                          as={IconButton}
                          aria-label="Opções"
                          icon={<HamburgerIcon />}
                          variant="ghost"
                          size="sm"
                          color="gray.400"
                          onClick={(e) => e.stopPropagation()}
                          _hover={{ color: 'gray.600', bg: 'gray.100' }}
                        />
                        <MenuList fontSize="sm" boxShadow="lg" borderRadius="xl" border="none">
                          <MenuItem icon={<EditIcon />} onClick={(e) => { e.stopPropagation(); handleEdit(contrato); }}>
                            Editar
                          </MenuItem>
                          <MenuItem icon={<DeleteIcon />} color="red.500" onClick={(e) => { e.stopPropagation(); handleDeleteClick(contrato); }}>
                            Excluir
                          </MenuItem>
                        </MenuList>
                      </Menu>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </Box>
      )}

      {/* Add Contract Modal */}
      <ContractFormModal isOpen={isAddOpen} onClose={onAddClose} />

      {/* Edit Contract Modal */}
      <ContractFormModal
        isOpen={isEditOpen}
        onClose={() => {
          onEditClose();
          setContratoToEdit(null);
        }}
        contrato={contratoToEdit || undefined}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent borderRadius="xl">
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Excluir Contrato
            </AlertDialogHeader>

            <AlertDialogBody color="gray.600">
              Tem certeza que deseja excluir o contrato #{contratoToDelete?.contrato_id}? Todos os
              pagamentos associados serão excluídos.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose} borderRadius="lg">
                Cancelar
              </Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3} borderRadius="lg">
                Excluir
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default ContractList;
