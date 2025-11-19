import { ChakraProvider } from '@chakra-ui/react';
import { AppProvider } from './contexts/AppContext';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <ChakraProvider>
      <AppProvider>
        <Dashboard />
      </AppProvider>
    </ChakraProvider>
  );
}

export default App;
