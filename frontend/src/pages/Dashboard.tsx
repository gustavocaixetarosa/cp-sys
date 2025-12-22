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
      <Box w={{ base: "60px", md: "70px" }} bg="white" borderRight="1px solid" borderColor="gray.100" py={6} display="flex" flexDirection="column" alignItems="center" justifyContent="space-between" boxShadow="sm" zIndex={10}>
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
        <Flex px={{ base: 4, md: 8 }} py={4} bg="white" borderBottom="1px solid" borderColor="gray.100" align="center" justify="space-between">
          <Box>
            <Heading size={{ base: "sm", md: "md" }} color="gray.800" fontWeight="600">Dashboard</Heading>
            <Text fontSize="sm" color="gray.500" display={{ base: "none", md: "block" }}>Bem-vindo ao CP Acessoria</Text>
          </Box>
          <HStack spacing={4}>
            <Text fontSize="sm" fontWeight="500" color="gray.600" display={{ base: "none", md: "block" }}>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
          </HStack>
        </Flex>

        {/* Main Content with Tabs */}
        <Box flex={1} overflow="hidden" display="flex" flexDirection="column">
          <Tabs colorScheme="blue" variant="soft-rounded" display="flex" flexDirection="column" flex={1} overflow="hidden">
            <Box px={{ base: 4, md: 6 }} pt={{ base: 4, md: 6 }}>
              <TabList bg="white" p={2} borderRadius="xl" boxShadow="sm" border="1px solid" borderColor="gray.100">
                <Tab fontWeight="600">Dashboard</Tab>
                <Tab fontWeight="600">
                  <Icon as={FiFileText} mr={2} />
                  Relatórios
                </Tab>
              </TabList>
            </Box>

            <TabPanels flex={1} overflow="hidden">
              {/* Dashboard Tab */}
              <TabPanel p={{ base: 4, md: 6 }} h="100%" display="flex" flexDirection="column" overflow="hidden">
                <Flex 
                  flex={1} 
                  gap={{ base: 4, md: 6 }} 
                  overflow="hidden"
                  direction={{ base: "column", lg: "row" }}
                >
                  {/* Left Column - Client List */}
                  <Box 
                    w={{ base: "100%", lg: "320px" }} 
                    h={{ base: "300px", lg: "100%" }}
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
                    overflow="auto" 
                    display="flex" 
                    flexDirection="column"
                    borderRadius="2xl"
                    css={{
                      '&::-webkit-scrollbar': { width: '6px' },
                      '&::-webkit-scrollbar-track': { width: '8px', background: 'transparent' },
                      '&::-webkit-scrollbar-thumb': { background: '#cbd5e0', borderRadius: '24px' },
                    }}
                  >
                    <ClientDetail />
                  </Box>

                  {/* Right Column - Payments */}
                  <Box 
                    w={{ base: "100%", lg: "360px" }} 
                    h={{ base: "400px", lg: "100%" }}
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
              <TabPanel p={{ base: 4, md: 6 }} h="100%" overflow="auto" pb={8}>
                <Box 
                  maxW="1200px" 
                  mx="auto"
                  pb={8}
                  css={{
                    '&::-webkit-scrollbar': { width: '6px' },
                    '&::-webkit-scrollbar-track': { width: '8px', background: 'transparent' },
                    '&::-webkit-scrollbar-thumb': { background: '#cbd5e0', borderRadius: '24px' },
                  }}
                >
                  <ReportGenerator />
                </Box>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </Flex>
    </Flex>
  );
};

export default Dashboard;
