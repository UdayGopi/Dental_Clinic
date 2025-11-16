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
  Select,
  HStack,
  Icon,
} from '@chakra-ui/react'
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth, UserRole } from '../contexts/AuthContext'
import { FaUser, FaUserMd, FaUserShield, FaArrowLeft, FaIdCard, FaBuilding, FaClock, FaShieldAlt } from 'react-icons/fa'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('patient')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Staff-specific fields
  const [employeeId, setEmployeeId] = useState('')
  const [department, setDepartment] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [shiftTiming, setShiftTiming] = useState('')

  // Admin-specific fields
  const [adminCode, setAdminCode] = useState('')
  const [accessLevel, setAccessLevel] = useState('')
  const [designation, setDesignation] = useState('')

  useEffect(() => {
    const roleParam = searchParams.get('role')
    if (roleParam === 'patient' || roleParam === 'admin' || roleParam === 'staff') {
      setRole(roleParam as UserRole)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validation for staff
    if (role === 'staff') {
      if (!employeeId || !department || !phoneNumber || !shiftTiming) {
        setError('Please fill all required fields')
        setLoading(false)
        return
      }
    }

    // Validation for admin
    if (role === 'admin') {
      if (!adminCode || !accessLevel || !designation) {
        setError('Please fill all required fields')
        setLoading(false)
        return
      }
      // Admin code validation (can be customized)
      if (adminCode !== 'ADMIN2024') {
        setError('Invalid admin code. Please contact system administrator.')
        setLoading(false)
        return
      }
    }

    try {
      // Prepare user data with role-specific fields
      const userData: any = {
        email,
        password,
        name,
        role,
      }
      
      // Add staff-specific fields
      if (role === 'staff') {
        userData.employee_id = employeeId
        userData.department = department
        userData.phone_number = phoneNumber
        userData.shift_timing = shiftTiming
      }
      
      // Add admin-specific fields
      if (role === 'admin') {
        userData.admin_code = adminCode
        userData.designation = designation
        userData.access_level = accessLevel
      }
      
      await register(email, password, name, role, userData)
      // Navigate based on role
      if (role === 'patient') {
        navigate('/patient-dashboard')
      } else {
        navigate('/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const getRoleDetails = () => {
    switch (role) {
      case 'staff':
        return {
          title: 'Staff Registration',
          icon: FaUserMd,
          description: 'Register as clinic staff member',
          buttonText: 'Register as Staff',
        }
      case 'admin':
        return {
          title: 'Admin Registration',
          icon: FaUserShield,
          description: 'Register as system administrator',
          buttonText: 'Register as Admin',
        }
      default:
        return {
          title: 'Patient Registration',
          icon: FaUser,
          description: 'Register to book appointments and receive SMS reminders',
          buttonText: 'Register as Patient',
        }
    }
  }

  const roleDetails = getRoleDetails()
  const RoleIcon = roleDetails.icon

  return (
    <Box minH="100vh" bgGradient="linear(135deg, professional.lightGray 0%, white 100%)" display="flex" alignItems="center" py={12}>
      <Container maxW="md">
        <VStack spacing={8}>
          <VStack spacing={2}>
            <Icon as={RoleIcon} boxSize={10} color="professional.teal" />
            <Heading size="xl" color="professional.darkTeal" fontWeight="bold">
              {roleDetails.title}
            </Heading>
            <Text color="professional.gray" textAlign="center">
              {roleDetails.description}
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
                {/* Common Fields */}
                <FormControl isRequired>
                  <FormLabel color="professional.darkGray">Full Name</FormLabel>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={role === 'patient' ? "John Doe" : role === 'staff' ? "Dr. Jane Smith" : "Admin Name"}
                    borderColor="professional.lightTeal"
                    _focus={{ borderColor: "professional.teal", boxShadow: "0 0 0 1px professional.teal" }}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel color="professional.darkGray">Email</FormLabel>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={role === 'patient' ? "patient@email.com" : role === 'staff' ? "staff@clinic.com" : "admin@clinic.com"}
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
                    placeholder="Create a password"
                    borderColor="professional.lightTeal"
                    _focus={{ borderColor: "professional.teal", boxShadow: "0 0 0 1px professional.teal" }}
                  />
                </FormControl>

                {/* Staff-Specific Fields */}
                {role === 'staff' && (
                  <>
                    <FormControl isRequired>
                      <FormLabel color="professional.darkGray">
                        <HStack spacing={2}>
                          <Icon as={FaIdCard} />
                          <Text>Employee ID</Text>
                        </HStack>
                      </FormLabel>
                      <Input
                        type="text"
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                        placeholder="EMP-001"
                        borderColor="professional.lightTeal"
                        _focus={{ borderColor: "professional.teal", boxShadow: "0 0 0 1px professional.teal" }}
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel color="professional.darkGray">
                        <HStack spacing={2}>
                          <Icon as={FaBuilding} />
                          <Text>Department</Text>
                        </HStack>
                      </FormLabel>
                      <Select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="Select Department"
                        borderColor="professional.lightTeal"
                        _focus={{ borderColor: "professional.teal", boxShadow: "0 0 0 1px professional.teal" }}
                      >
                        <option value="reception">Reception</option>
                        <option value="dental">Dental</option>
                        <option value="hygiene">Hygiene</option>
                        <option value="administration">Administration</option>
                        <option value="support">Support Staff</option>
                      </Select>
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel color="professional.darkGray">Phone Number</FormLabel>
                      <Input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        borderColor="professional.lightTeal"
                        _focus={{ borderColor: "professional.teal", boxShadow: "0 0 0 1px professional.teal" }}
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel color="professional.darkGray">
                        <HStack spacing={2}>
                          <Icon as={FaClock} />
                          <Text>Shift Timing</Text>
                        </HStack>
                      </FormLabel>
                      <Select
                        value={shiftTiming}
                        onChange={(e) => setShiftTiming(e.target.value)}
                        placeholder="Select Shift"
                        borderColor="professional.lightTeal"
                        _focus={{ borderColor: "professional.teal", boxShadow: "0 0 0 1px professional.teal" }}
                      >
                        <option value="morning">Morning (9:00 AM - 2:00 PM)</option>
                        <option value="afternoon">Afternoon (2:00 PM - 6:00 PM)</option>
                        <option value="full">Full Day (9:00 AM - 6:00 PM)</option>
                        <option value="flexible">Flexible Hours</option>
                      </Select>
                    </FormControl>
                  </>
                )}

                {/* Admin-Specific Fields */}
                {role === 'admin' && (
                  <>
                    <FormControl isRequired>
                      <FormLabel color="professional.darkGray">
                        <HStack spacing={2}>
                          <Icon as={FaShieldAlt} />
                          <Text>Admin Code</Text>
                        </HStack>
                      </FormLabel>
                      <Input
                        type="text"
                        value={adminCode}
                        onChange={(e) => setAdminCode(e.target.value)}
                        placeholder="Enter admin authorization code"
                        borderColor="professional.lightTeal"
                        _focus={{ borderColor: "professional.teal", boxShadow: "0 0 0 1px professional.teal" }}
                      />
                      <Text fontSize="xs" color="professional.gray" mt={1}>
                        Contact system administrator for admin code
                      </Text>
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel color="professional.darkGray">Designation</FormLabel>
                      <Select
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        placeholder="Select Designation"
                        borderColor="professional.lightTeal"
                        _focus={{ borderColor: "professional.teal", boxShadow: "0 0 0 1px professional.teal" }}
                      >
                        <option value="clinic_manager">Clinic Manager</option>
                        <option value="system_admin">System Administrator</option>
                        <option value="operations_manager">Operations Manager</option>
                        <option value="super_admin">Super Administrator</option>
                      </Select>
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel color="professional.darkGray">Access Level</FormLabel>
                      <Select
                        value={accessLevel}
                        onChange={(e) => setAccessLevel(e.target.value)}
                        placeholder="Select Access Level"
                        borderColor="professional.lightTeal"
                        _focus={{ borderColor: "professional.teal", boxShadow: "0 0 0 1px professional.teal" }}
                      >
                        <option value="full">Full Access</option>
                        <option value="limited">Limited Access</option>
                        <option value="read_only">Read Only</option>
                      </Select>
                    </FormControl>
                  </>
                )}

                <Button 
                  type="submit" 
                  bg="professional.teal" 
                  color="white" 
                  w="100%" 
                  isLoading={loading}
                  _hover={{ bg: "professional.darkTeal" }}
                  size="lg"
                  mt={4}
                  leftIcon={<RoleIcon />}
                >
                  {roleDetails.buttonText}
                </Button>
              </VStack>
            </form>
            <HStack mt={6} justify="center" spacing={4}>
              <Link as={RouterLink} to="/" color="professional.gray" fontSize="sm">
                <HStack spacing={1}>
                  <Icon as={FaArrowLeft} />
                  <Text>Back to Home</Text>
                </HStack>
              </Link>
              <Text color="professional.gray" fontSize="sm">|</Text>
              <Text fontSize="sm" color="professional.gray">
                Already have an account?{' '}
                <Link as={RouterLink} to={`/login?role=${role}`} color="professional.teal" fontWeight="semibold">
                  Login
                </Link>
              </Text>
            </HStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  )
}

