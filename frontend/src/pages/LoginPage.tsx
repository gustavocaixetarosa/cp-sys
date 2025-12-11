import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
  useColorModeValue,
  InputGroup,
  InputRightElement,
  IconButton,
  Link,
  VStack,
  HStack,
  Divider,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
  });

  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isLogin) {
        await login({ email: formData.email, senha: formData.senha });
      } else {
        await register({ 
          nome: formData.nome, 
          email: formData.email, 
          senha: formData.senha 
        });
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data || 'Erro ao processar requisição');
    } finally {
      setIsLoading(false);
    }
  };

  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const boxBg = useColorModeValue('white', 'gray.700');

  return (
    <Box minH="100vh" bg={bgColor} display="flex" alignItems="center" justifyContent="center">
      <Container maxW="md" py={12}>
        <VStack spacing={8}>
          <VStack spacing={2}>
            <Heading size="xl">{isLogin ? 'Login' : 'Criar Conta'}</Heading>
            <Text color="gray.600">
              {isLogin ? 'Sistema de Cobrança' : 'Crie sua conta para começar'}
            </Text>
          </VStack>

          <Box w="full" bg={boxBg} boxShadow="lg" borderRadius="lg" p={8}>
            {error && (
              <Alert status="error" mb={4} borderRadius="md">
                <AlertIcon />
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Stack spacing={4}>
                {!isLogin && (
                  <FormControl isRequired>
                    <FormLabel>Nome</FormLabel>
                    <Input
                      name="nome"
                      type="text"
                      value={formData.nome}
                      onChange={handleChange}
                      placeholder="Seu nome completo"
                    />
                  </FormControl>
                )}

                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="seu@email.com"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Senha</FormLabel>
                  <InputGroup>
                    <Input
                      name="senha"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.senha}
                      onChange={handleChange}
                      placeholder="••••••••"
                    />
                    <InputRightElement>
                      <IconButton
                        aria-label="Toggle password visibility"
                        icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                        onClick={() => setShowPassword(!showPassword)}
                        variant="ghost"
                        size="sm"
                      />
                    </InputRightElement>
                  </InputGroup>
                  {!isLogin && (
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      Mínimo de 6 caracteres
                    </Text>
                  )}
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="blue"
                  size="lg"
                  fontSize="md"
                  isLoading={isLoading}
                  loadingText={isLogin ? 'Entrando...' : 'Criando conta...'}
                >
                  {isLogin ? 'Entrar' : 'Criar Conta'}
                </Button>
              </Stack>
            </form>

            <Divider my={6} />

            <VStack spacing={2}>
              <HStack>
                <Text fontSize="sm" color="gray.600">
                  {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                </Text>
                <Link
                  color="blue.500"
                  fontSize="sm"
                  fontWeight="semibold"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                    setFormData({ nome: '', email: '', senha: '' });
                  }}
                >
                  {isLogin ? 'Criar conta' : 'Fazer login'}
                </Link>
              </HStack>
            </VStack>
          </Box>

          {isLogin && (
            <Box
              w="full"
              bg={boxBg}
              p={4}
              borderRadius="md"
              borderLeft="4px"
              borderColor="blue.500"
            >
              <Text fontSize="sm" fontWeight="bold" mb={2}>
                Credenciais Padrão (Admin)
              </Text>
              <Text fontSize="xs" color="gray.600">
                Email: admin@cobranca.com
              </Text>
              <Text fontSize="xs" color="gray.600">
                Senha: admin123
              </Text>
            </Box>
          )}
        </VStack>
      </Container>
    </Box>
  );
};

