import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
  HStack,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Avatar,
  Flex,
  Grid,
  Icon,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon, DownloadIcon, TimeIcon, WarningIcon } from '@chakra-ui/icons';
import { useApp } from '../contexts/AppContext';
import ContractList from './ContractList';
import ClientFormModal from './forms/ClientFormModal';
import { useRef } from 'react';
import { generateClientReport } from '../utils/reportGenerator';

const ClientDetail = () => {
  const { selectedCliente, deleteCliente, getTotalReceber, getTotalAtrasado, getContratosByCliente, pagamentos } = useApp();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);

  if (!selectedCliente) {
    return (
      <Box
        h="100%"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        color="gray.400"
        bg="white"
        borderRadius="2xl"
        p={8}
      >
        <Icon as={WarningIcon} boxSize={12} mb={4} color="gray.300" />
        <Text fontSize="lg" fontWeight="medium">Selecione um cliente para ver os detalhes</Text>
        <Text fontSize="sm" mt={2}>Clique em um cliente na lista à esquerda</Text>
      </Box>
    );
  }

  const totalReceber = getTotalReceber(selectedCliente.cliente_id);
  const totalAtrasado = getTotalAtrasado(selectedCliente.cliente_id);

  const handleDelete = () => {
    deleteCliente(selectedCliente.cliente_id);
    onDeleteClose();
  };

  const handleGenerateReport = () => {
    const contratos = getContratosByCliente(selectedCliente.cliente_id);
    const contratoIds = contratos.map((c) => c.contrato_id);
    const clientePagamentos = pagamentos.filter((p) => contratoIds.includes(p.contrato_id));
    
    generateClientReport({
      cliente: selectedCliente,
      contratos,
      pagamentos: clientePagamentos,
    });
  };

  return (
    <Box>
      <VStack align="stretch" spacing={6}>
        {/* Header Card */}
        <Box bg="white" p={6} borderRadius="2xl" boxShadow="sm">
          <Flex justify="space-between" align="start" mb={6}>
            <HStack spacing={4}>
              <Avatar size="lg" name={selectedCliente.nome} bg="blue.500" />
              <Box>
                <Heading size="md" mb={1} color="gray.800">{selectedCliente.nome}</Heading>
                <HStack spacing={4} color="gray.500" fontSize="sm">
                  <HStack>
                    <Icon viewBox="0 0 24 24" fill="currentColor" boxSize={4}>
                      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                    </Icon>
                    <Text>{selectedCliente.telefone}</Text>
                  </HStack>
                  <Text>•</Text>
                  <Text>{selectedCliente.registro}</Text>
                </HStack>
              </Box>
            </HStack>

            <HStack>
              <Button
                leftIcon={<DownloadIcon />}
                colorScheme="gray"
                variant="ghost"
                size="sm"
                onClick={handleGenerateReport}
              >
                Relatório
              </Button>
              <Button
                leftIcon={<EditIcon />}
                colorScheme="blue"
                variant="ghost"
                size="sm"
                onClick={onEditOpen}
              >
                Editar
              </Button>
              <Button
                leftIcon={<DeleteIcon />}
                colorScheme="red"
                variant="ghost"
                size="sm"
                onClick={onDeleteOpen}
              >
                Excluir
              </Button>
            </HStack>
          </Flex>

          <Grid templateColumns="repeat(2, 1fr)" gap={6} mb={4}>
             <Box>
                <Text fontSize="xs" textTransform="uppercase" fontWeight="bold" color="gray.400" mb={1}>Endereço</Text>
                <Text fontSize="sm" color="gray.700">{selectedCliente.endereco}</Text>
             </Box>
             <Box>
                <Text fontSize="xs" textTransform="uppercase" fontWeight="bold" color="gray.400" mb={1}>Dados Bancários</Text>
                <Text fontSize="sm" color="gray.700">{selectedCliente.banco} • Vencimento dia {selectedCliente.data_vencimento}</Text>
             </Box>
          </Grid>

          <SimpleGrid columns={2} spacing={4} mt={6}>
            <Stat bg="blue.50" p={4} borderRadius="xl">
              <StatLabel color="blue.600" fontWeight="medium">Total a Receber</StatLabel>
              <StatNumber color="blue.700" fontSize="2xl">
                R$ {totalReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </StatNumber>
              <StatHelpText color="blue.600" mb={0} fontSize="xs">
                <HStack>
                   <TimeIcon /> <Text>Pagamentos pendentes</Text>
                </HStack>
              </StatHelpText>
            </Stat>

            <Stat bg="red.50" p={4} borderRadius="xl">
              <StatLabel color="red.600" fontWeight="medium">Total Atrasado</StatLabel>
              <StatNumber color="red.700" fontSize="2xl">
                R$ {totalAtrasado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </StatNumber>
                {totalAtrasado > 0 && (
                <StatHelpText color="red.600" mb={0} fontSize="xs">
                  <HStack>
                    <WarningIcon /> <Text>Requer atenção</Text>
                  </HStack>
                </StatHelpText>
              )}
              
            </Stat>
          </SimpleGrid>
        </Box>

        {/* Contracts Section */}
        <Box bg="white" p={6} borderRadius="2xl" boxShadow="sm">
          <ContractList />
        </Box>
      </VStack>

      {/* Edit Modal */}
      <ClientFormModal
        isOpen={isEditOpen}
        onClose={onEditClose}
        cliente={selectedCliente}
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
              Excluir Cliente
            </AlertDialogHeader>

            <AlertDialogBody color="gray.600">
              Tem certeza que deseja excluir o cliente <strong>{selectedCliente.nome}</strong>? Esta
              ação não pode ser desfeita e todos os contratos e pagamentos associados serão excluídos.
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

export default ClientDetail;
