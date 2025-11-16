import { useState, useEffect } from 'react'
import {
  Container,
  Heading,
  VStack,
  Box,
  Text as ChakraText,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  Card,
  CardBody,
  HStack,
} from '@chakra-ui/react'
import { format } from 'date-fns'
import { FaUserShield, FaClock, FaEnvelope } from 'react-icons/fa'
import api from '../services/api'

interface Admin {
  id: string
  name: string
  email: string
  role: string
  lastLogin?: string
  loginCount?: number
  workingHours?: {
    start: string
    end: string
    days: string[]
  }
}

export default function AdminManagement() {
  const [admins, setAdmins] = useState<Admin[]>([])

  useEffect(() => {
    fetchAdmins()
  }, [])

  const fetchAdmins = async () => {
    try {
      // Fetch admins and staff from API
      const [adminsRes, staffRes] = await Promise.all([
        api.get('/users/', { params: { role: 'admin' } }).catch(() => ({ data: { items: [] } })),
        api.get('/users/', { params: { role: 'staff' } }).catch(() => ({ data: { items: [] } })),
      ])
      
      // Handle paginated response format
      const adminsData = adminsRes.data?.items || (Array.isArray(adminsRes.data) ? adminsRes.data : [])
      const staffData = staffRes.data?.items || (Array.isArray(staffRes.data) ? staffRes.data : [])
      
      // Combine admins and staff, format for display
      const allUsers = [...adminsData, ...staffData]
      
      // Format users with working hours (default for now)
      const formattedAdmins: Admin[] = allUsers
        .filter((user: any) => user && typeof user === 'object' && user.id && user.email)
        .map((user: any) => ({
          id: String(user.id || ''),
          name: String(user.name || 'Unknown'),
          email: String(user.email || ''),
          role: String(user.role || 'staff'),
          lastLogin: user.last_login ? String(user.last_login) : undefined,
          loginCount: Number(user.login_count) || 0,
          department: user.department ? String(user.department) : undefined,
          designation: user.designation ? String(user.designation) : undefined,
          shiftTiming: user.shift_timing ? String(user.shift_timing) : undefined,
          created_at: user.created_at ? String(user.created_at) : undefined,
          workingHours: {
            start: '09:00', // Default - can be customized later
            end: '17:00',
            days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          },
        }))
      
      setAdmins(formattedAdmins)
    } catch (error: any) {
      console.error('Error fetching admins:', error)
      // If error response has detail, log it
      if (error.response?.data) {
        console.error('API Error:', error.response.data)
      }
      setAdmins([])
    }
  }

  return (
    <Container maxW="container.xl">
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading 
            size="xl" 
            color="professional.darkTeal" 
            fontWeight="bold"
            mb={2}
          >
            Admin & Staff Management
          </Heading>
          <ChakraText color="professional.gray" fontSize="lg">
            View and manage admin and staff accounts with their working schedules
          </ChakraText>
        </Box>

        <Card 
          bg="white" 
          boxShadow="lg" 
          borderRadius="xl"
          border="1px solid"
          borderColor="professional.lightTeal"
        >
          <CardBody>
            <TableContainer>
              <Table variant="simple">
                <Thead bg="professional.lightTeal">
                  <Tr>
                    <Th color="professional.darkTeal" fontWeight="bold">Name</Th>
                    <Th color="professional.darkTeal" fontWeight="bold">Email</Th>
                    <Th color="professional.darkTeal" fontWeight="bold">Role</Th>
                    <Th color="professional.darkTeal" fontWeight="bold">Department/Designation</Th>
                    <Th color="professional.darkTeal" fontWeight="bold">Working Hours</Th>
                    <Th color="professional.darkTeal" fontWeight="bold">Last Login</Th>
                    <Th color="professional.darkTeal" fontWeight="bold">Login Count</Th>
                    <Th color="professional.darkTeal" fontWeight="bold">Status</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {admins.length === 0 ? (
                    <Tr>
                      <Td colSpan={9} textAlign="center" py={8} color="professional.gray">
                        No admins or staff found. Register new users to see them here.
                      </Td>
                    </Tr>
                  ) : (
                    admins.map((admin) => (
                      <Tr 
                        key={admin.id}
                        _hover={{ bg: "professional.lightTeal" }}
                        transition="background 0.2s"
                      >
                        <Td fontWeight="medium" color="professional.darkGray">
                          <HStack spacing={2}>
                            <Box as={FaUserShield} color="professional.teal" />
                            <ChakraText>{admin.name}</ChakraText>
                          </HStack>
                        </Td>
                        <Td color="professional.gray">{admin.email}</Td>
                        <Td>
                          <Badge 
                            colorScheme={admin.role === 'admin' ? 'purple' : 'blue'}
                            bg={admin.role === 'admin' ? 'purple.100' : 'blue.100'}
                            color={admin.role === 'admin' ? 'purple.700' : 'blue.700'}
                            px={3}
                            py={1}
                            borderRadius="full"
                            fontSize="xs"
                            fontWeight="semibold"
                          >
                            {admin.role.toUpperCase()}
                          </Badge>
                        </Td>
                        <Td color="professional.gray" fontSize="sm">
                          {admin.role === 'staff' 
                            ? (admin.department || 'Not set')
                            : (admin.designation || 'Not set')
                          }
                        </Td>
                        <Td color="professional.gray">
                          {admin.workingHours ? (
                            <HStack spacing={1}>
                              <Box as={FaClock} color="professional.teal" fontSize="sm" />
                              <ChakraText fontSize="sm">
                                {admin.workingHours.start} - {admin.workingHours.end}
                              </ChakraText>
                            </HStack>
                          ) : (
                            admin.shiftTiming || 'Not set'
                          )}
                        </Td>
                        <Td color="professional.gray" fontSize="sm">
                          {admin.lastLogin && admin.lastLogin !== 'null' && admin.lastLogin !== 'undefined'
                            ? (() => {
                                try {
                                  return format(new Date(admin.lastLogin), 'MMM dd, yyyy HH:mm')
                                } catch {
                                  return 'Invalid date'
                                }
                              })()
                            : 'Never'}
                        </Td>
                        <Td color="professional.gray">{admin.loginCount || 0}</Td>
                        <Td>
                          <Badge 
                            colorScheme="green"
                            bg="green.100"
                            color="green.700"
                            px={3}
                            py={1}
                            borderRadius="full"
                            fontSize="xs"
                            fontWeight="semibold"
                          >
                            Active
                          </Badge>
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </TableContainer>
          </CardBody>
        </Card>

        <Card 
          bg="professional.lightGray" 
          borderRadius="xl"
          border="2px solid"
          borderColor="professional.lightTeal"
          p={6}
        >
          <VStack spacing={4} align="stretch">
            <Heading size="md" color="professional.darkTeal">
              <HStack spacing={2}>
                <Box as={FaEnvelope} color="professional.teal" />
                <ChakraText>Admin Information</ChakraText>
              </HStack>
            </Heading>
            <VStack align="stretch" spacing={2}>
              <ChakraText color="professional.gray" fontSize="sm">
                • <strong>Working Hours:</strong> Displayed in 24-hour format (HH:MM)
              </ChakraText>
              <ChakraText color="professional.gray" fontSize="sm">
                • <strong>Last Login:</strong> Shows the most recent login timestamp
              </ChakraText>
              <ChakraText color="professional.gray" fontSize="sm">
                • <strong>Login Count:</strong> Total number of logins for this admin
              </ChakraText>
              <ChakraText color="professional.gray" fontSize="sm">
                • <strong>Status:</strong> Current account status (Active/Inactive)
              </ChakraText>
            </VStack>
          </VStack>
        </Card>
      </VStack>
    </Container>
  )
}

