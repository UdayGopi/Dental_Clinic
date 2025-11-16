import { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Heading,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
  Link,
  Alert,
  AlertIcon,
  HStack,
} from '@chakra-ui/react'
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth, UserRole } from '../contexts/AuthContext'
import { FaUser, FaUserShield, FaUserMd, FaArrowLeft } from 'react-icons/fa'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  // Get role from URL parameter, default to patient
  const roleParam = searchParams.get('role') as UserRole | null
  const role: UserRole = roleParam && ['patient', 'staff', 'admin'].includes(roleParam) 
    ? roleParam 
    : 'patient'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password, role)
      // Small delay to ensure user state is updated
      setTimeout(() => {
        // Navigate based on role
        if (role === 'patient') {
          navigate('/patient-dashboard')
        } else {
          navigate('/dashboard')
        }
      }, 100)
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  // Get role-specific details
  const getRoleDetails = () => {
    switch (role) {
      case 'patient':
        return {
          title: 'Patient Login',
          icon: <FaUser />,
          placeholder: 'patient@email.com',
          buttonText: 'Login as Patient',
          buttonColor: 'professional.teal',
          subtitle: 'Access your appointments and messages',
        }
      case 'staff':
        return {
          title: 'Staff Login',
          icon: <FaUserMd />,
          placeholder: 'staff@dentalclinic.com',
          buttonText: 'Login as Staff',
          buttonColor: 'professional.teal',
          subtitle: 'Manage clinic operations',
        }
      case 'admin':
        return {
          title: 'Admin Login',
          icon: <FaUserShield />,
          placeholder: 'admin@dentalclinic.com',
          buttonText: 'Login as Admin',
          buttonColor: 'professional.darkTeal',
          subtitle: 'Full system access',
        }
      default:
        return {
          title: 'Login',
          icon: <FaUser />,
          placeholder: 'your@email.com',
          buttonText: 'Login',
          buttonColor: 'professional.teal',
          subtitle: 'Access your account',
        }
    }
  }

  const roleDetails = getRoleDetails()

  return (
    <Box minH="100vh" bgGradient="linear(135deg, professional.lightGray 0%, white 100%)" display="flex" alignItems="center" py={12}>
      <Container maxW="md">
        <VStack spacing={8}>
          <VStack spacing={2}>
            <HStack spacing={3} color="professional.teal" fontSize="4xl">
              {roleDetails.icon}
            </HStack>
            <Heading size="xl" color="professional.darkTeal" fontWeight="bold">
              {roleDetails.title}
            </Heading>
            <Text color="professional.gray" textAlign="center">
              {roleDetails.subtitle}
            </Text>
          </VStack>
          
          <Box w="100%" bg="white" p={8} borderRadius="2xl" boxShadow="xl" border="2px solid" borderColor="professional.lightTeal">
            {error && (
              <Alert status="error" mb={4} borderRadius="md">
                <AlertIcon />
                {error}
              </Alert>
            )}
            
            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel color="professional.darkGray">Email</FormLabel>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={roleDetails.placeholder}
                    borderColor="professional.lightTeal"
                    _focus={{ borderColor: "professional.teal", boxShadow: "0 0 0 1px professional.teal" }}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel color="professional.darkGray">Password</FormLabel>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    borderColor="professional.lightTeal"
                    _focus={{ borderColor: "professional.teal", boxShadow: "0 0 0 1px professional.teal" }}
                  />
                </FormControl>
                <Button 
                  type="submit" 
                  bg={roleDetails.buttonColor} 
                  color="white" 
                  w="100%" 
                  isLoading={loading}
                  _hover={{ bg: role === 'admin' ? "professional.teal" : "professional.darkTeal" }}
                  size="lg"
                  mt={4}
                  leftIcon={roleDetails.icon}
                >
                  {roleDetails.buttonText}
                </Button>
              </VStack>
            </form>
            
            <HStack mt={6} justify="space-between" flexWrap="wrap" spacing={4}>
              <Button
                as={RouterLink}
                to="/"
                variant="ghost"
                size="sm"
                leftIcon={<FaArrowLeft />}
                color="professional.gray"
                _hover={{ color: "professional.teal" }}
              >
                Back to Home
              </Button>
              <Text fontSize="sm" color="professional.gray">
                Don't have an account?{' '}
                <Link as={RouterLink} to={`/register?role=${role}`} color="professional.teal" fontWeight="semibold">
                  Register {role === 'patient' ? '' : `as ${role === 'staff' ? 'Staff' : 'Admin'}`}
                </Link>
              </Text>
            </HStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  )
}

