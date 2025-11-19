import {
  Box,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  List,
  ListItem,
  Text,
  useDisclosure,
  Avatar,
  Flex,
  IconButton,
} from '@chakra-ui/react';
import { SearchIcon, AddIcon } from '@chakra-ui/icons';
import { useApp } from '../contexts/AppContext';
import ClientFormModal from './forms/ClientFormModal';

const ClientList = () => {
  const { getFilteredClientes, selectedCliente, selectCliente, searchTerm, setSearchTerm } = useApp();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const clientes = getFilteredClientes();

  return (
    <Flex direction="column" h="100%">
      <Box p={5} borderBottom="1px solid" borderColor="gray.100">
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="sm" color="gray.700">Clientes</Heading>
          <IconButton 
            aria-label="Adicionar cliente"
            icon={<AddIcon />} 
            size="sm" 
            colorScheme="blue" 
            variant="ghost"
            bg="blue.50"
            color="blue.600"
            _hover={{ bg: 'blue.100' }}
            borderRadius="full"
            onClick={onOpen}
          />
        </Flex>

        <InputGroup size="sm">
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            borderRadius="full"
            bg="gray.50"
            border="none"
            _focus={{ bg: 'white', boxShadow: 'outline' }}
            fontSize="sm"
          />
        </InputGroup>
      </Box>

      <Box flex={1} overflowY="auto" px={2}>
        <List spacing={1} py={2}>
          {clientes.map((cliente) => (
            <ListItem
              key={cliente.cliente_id}
              px={3}
              py={3}
              mx={1}
              cursor="pointer"
              borderRadius="xl"
              bg={selectedCliente?.cliente_id === cliente.cliente_id ? 'blue.50' : 'transparent'}
              _hover={{ bg: selectedCliente?.cliente_id === cliente.cliente_id ? 'blue.50' : 'gray.50' }}
              onClick={() => selectCliente(cliente)}
              transition="all 0.2s"
            >
              <Flex align="center" gap={3}>
                <Avatar 
                  size="sm" 
                  name={cliente.nome} 
                  bg={selectedCliente?.cliente_id === cliente.cliente_id ? 'blue.500' : 'gray.200'}
                  color={selectedCliente?.cliente_id === cliente.cliente_id ? 'white' : 'gray.600'}
                />
                <Box flex={1} minW={0}>
                  <Text 
                    fontWeight="600" 
                    fontSize="sm" 
                    color={selectedCliente?.cliente_id === cliente.cliente_id ? 'blue.700' : 'gray.700'}
                    isTruncated
                  >
                    {cliente.nome}
                  </Text>
                  <Text fontSize="xs" color="gray.500" isTruncated>
                    CPF: {cliente.registro}
                  </Text>
                </Box>
              </Flex>
            </ListItem>
          ))}

          {clientes.length === 0 && (
            <Box p={8} textAlign="center">
              <Text color="gray.400" fontSize="sm">Nenhum cliente encontrado</Text>
            </Box>
          )}
        </List>
      </Box>

      <ClientFormModal isOpen={isOpen} onClose={onClose} />
    </Flex>
  );
};

export default ClientList;
