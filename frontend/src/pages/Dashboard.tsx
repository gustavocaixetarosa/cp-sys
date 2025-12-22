import { Box, Flex, Heading, Text, HStack, Icon, Avatar, Menu, MenuButton, MenuList, MenuItem, MenuDivider, Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import { SettingsIcon, BellIcon } from '@chakra-ui/icons';
import { FiLogOut, FiUser, FiFileText } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import ClientList from '../components/ClientList';
import ClientDetail from '../components/ClientDetail';
import PaymentList from '../components/PaymentList';
import ReportGenerator from '../components/ReportGenerator';

const Dashboard = () => {
  const { user, logout } = useAuth();
  
  return (
    <Flex h="100vh" bg="#f3f4f6" overflow="hidden">
      {/* Sidebar (Navigation) - Simplificado para este exemplo */}
      <Box w="70px" bg="white" borderRight="1px solid" borderColor="gray.100" py={6} display="flex" flexDirection="column" alignItems="center" justifyContent="space-between" boxShadow="sm" zIndex={10}>
        <Flex direction="column" align="center" gap={8}>
          <Box p={2} bg="blue.500" borderRadius="xl" color="white">
            <Icon viewBox="0 0 24 24" boxSize={6} fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.75l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" />
            </Icon>
          </Box>
          {/* Nav Items would go here */}
        </Flex>
        
        <Flex direction="column" align="center" gap={6}>
          <Icon as={BellIcon} boxSize={5} color="gray.400" cursor="pointer" _hover={{ color: 'blue.500' }} />
          <Icon as={SettingsIcon} boxSize={5} color="gray.400" cursor="pointer" _hover={{ color: 'blue.500' }} />
          <Menu>
            <MenuButton>
              <Avatar size="sm" name={user?.nome} cursor="pointer" />
            </MenuButton>
            <MenuList>
              <MenuItem icon={<Icon as={FiUser} />} isDisabled>
                {user?.nome}
              </MenuItem>
              <MenuItem fontSize="xs" color="gray.500" isDisabled>
                {user?.email}
              </MenuItem>
              <MenuDivider />
              <MenuItem icon={<Icon as={FiLogOut} />} onClick={logout} color="red.500">
                Sair
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Box>

      <Flex flex={1} direction="column" overflow="hidden">
        {/* Header Minimalista */}
        <Flex px={8} py={4} bg="white" borderBottom="1px solid" borderColor="gray.100" align="center" justify="space-between">
          <Box>
            <Heading size="md" color="gray.800" fontWeight="600">Dashboard</Heading>
            <Text fontSize="sm" color="gray.500">Bem-vindo ao CP Acessoria</Text>
          </Box>
          <HStack spacing={4}>
            <Text fontSize="sm" fontWeight="500" color="gray.600">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
          </HStack>
        </Flex>

        {/* Main Content with Tabs */}
        <Flex flex={1} p={6} gap={6} overflow="hidden" direction="column">
          <Tabs colorScheme="blue" variant="soft-rounded">
            <TabList bg="white" p={2} borderRadius="xl" boxShadow="sm" border="1px solid" borderColor="gray.100">
              <Tab fontWeight="600">Dashboard</Tab>
              <Tab fontWeight="600">
                <Icon as={FiFileText} mr={2} />
                Relatórios
              </Tab>
            </TabList>

            <TabPanels flex={1} overflow="hidden" mt={4}>
              {/* Dashboard Tab */}
              <TabPanel p={0} h="100%" display="flex" overflow="hidden">
                <Flex flex={1} gap={6} overflow="hidden">
                  {/* Left Column - Client List */}
                  <Box 
                    w="320px" 
                    bg="white" 
                    borderRadius="2xl" 
                    boxShadow="sm" 
                    overflow="hidden" 
                    display="flex" 
                    flexDirection="column"
                    border="1px solid"
                    borderColor="gray.100"
                  >
                    <ClientList />
                  </Box>

                  {/* Middle Column - Client Detail */}
                  <Box 
                    flex={1} 
                    bg="transparent" 
                    overflow="hidden" 
                    display="flex" 
                    flexDirection="column"
                    borderRadius="2xl"
                  >
                    <Box 
                      flex={1} 
                      overflowY="auto" 
                      pr={2} 
                      css={{
                        '&::-webkit-scrollbar': { width: '4px' },
                        '&::-webkit-scrollbar-track': { width: '6px' },
                        '&::-webkit-scrollbar-thumb': { background: '#cbd5e0', borderRadius: '24px' },
                      }}
                    >
                      <ClientDetail />
                    </Box>
                  </Box>

                  {/* Right Column - Payments */}
                  <Box 
                    w="360px" 
                    bg="white" 
                    borderRadius="2xl" 
                    boxShadow="sm" 
                    overflow="hidden" 
                    display="flex" 
                    flexDirection="column"
                    border="1px solid"
                    borderColor="gray.100"
                  >
                    <PaymentList />
                  </Box>
                </Flex>
              </TabPanel>

              {/* Reports Tab */}
              <TabPanel p={0} h="100%" overflow="auto">
                <Box 
                  maxW="1200px" 
                  mx="auto"
                  css={{
                    '&::-webkit-scrollbar': { width: '4px' },
                    '&::-webkit-scrollbar-track': { width: '6px' },
                    '&::-webkit-scrollbar-thumb': { background: '#cbd5e0', borderRadius: '24px' },
                  }}
                >
                  <ReportGenerator />
                </Box>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default Dashboard;
