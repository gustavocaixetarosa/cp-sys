import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, Spinner, Center } from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <Center h="100vh">
        <Box textAlign="center">
          <Spinner size="xl" color="blue.500" thickness="4px" />
        </Box>
      </Center>
    );
  }

  if (!isAuthenticated) {
    // Redireciona para login e salva a localização original
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

