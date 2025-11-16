import { useEffect, useState } from 'react'
import {
  Box,
  Container,
  Heading,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Switch,
  useToast,
  Text as ChakraText,
  Badge,
} from '@chakra-ui/react'
import { format } from 'date-fns'
import api from '../services/api'

interface Patient {
  id: number
  first_name: string
  last_name: string
  phone_number: string
  email: string
  consent_sms: boolean
  appointment_count?: number
  last_appointment_date?: string
  last_appointment_status?: string
  message_count?: number
  created_at?: string
}

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [, setLoading] = useState(true)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    email: '',
    consent_sms: false,
  })

  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    try {
      const response = await api.get('/patients/')
      // Handle paginated response format
      const patientsData = response.data?.items || (Array.isArray(response.data) ? response.data : [])
      setPatients(patientsData)
    } catch (error: any) {
      console.error('Error fetching patients:', error)
      setPatients([])
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to fetch patients',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/patients/', formData)
      toast({
        title: 'Success',
        description: 'Patient created successfully',
        status: 'success',
      })
      onClose()
      setFormData({
        first_name: '',
        last_name: '',
        phone_number: '',
        email: '',
        consent_sms: false,
      })
      fetchPatients()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to create patient',
        status: 'error',
      })
    }
  }

  return (
    <Container maxW="container.xl">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={6}>
        <Box>
          <Heading 
            size="xl" 
            color="professional.darkTeal" 
            fontWeight="bold"
            mb={2}
          >
            Patients
          </Heading>
          <ChakraText color="professional.gray">
            Manage patient records and SMS consent
          </ChakraText>
        </Box>
        <Button 
          colorScheme="dental" 
          bg="professional.teal"
          color="white"
          _hover={{ bg: "professional.darkTeal" }}
          onClick={onOpen}
          size="lg"
        >
          Add Patient
        </Button>
      </Box>

      <TableContainer 
        bg="white" 
        borderRadius="xl" 
        boxShadow="lg"
        border="1px solid"
        borderColor="professional.lightTeal"
      >
        <Table variant="simple">
          <Thead bg="professional.lightTeal">
            <Tr>
              <Th color="professional.darkTeal" fontWeight="bold">Name</Th>
              <Th color="professional.darkTeal" fontWeight="bold">Phone</Th>
              <Th color="professional.darkTeal" fontWeight="bold">Email</Th>
              <Th color="professional.darkTeal" fontWeight="bold">Appointments</Th>
              <Th color="professional.darkTeal" fontWeight="bold">Last Visit</Th>
              <Th color="professional.darkTeal" fontWeight="bold">Messages</Th>
              <Th color="professional.darkTeal" fontWeight="bold">SMS Consent</Th>
            </Tr>
          </Thead>
          <Tbody>
            {patients.length === 0 ? (
              <Tr>
                <Td colSpan={7} textAlign="center" py={8} color="professional.gray">
                  No patients found. Patients will appear here when they register and book appointments.
                </Td>
              </Tr>
            ) : (
              patients.map((patient) => (
                <Tr 
                  key={patient.id}
                  _hover={{ bg: "professional.lightTeal" }}
                  transition="background 0.2s"
                >
                  <Td fontWeight="medium" color="professional.darkGray">
                    {`${patient.first_name} ${patient.last_name}`}
                  </Td>
                  <Td color="professional.gray">{patient.phone_number}</Td>
                  <Td color="professional.gray">{patient.email || '-'}</Td>
                  <Td color="professional.gray" fontWeight="medium">
                    {patient.appointment_count || 0}
                  </Td>
                  <Td color="professional.gray" fontSize="sm">
                    {patient.last_appointment_date 
                      ? (() => {
                          try {
                            return format(new Date(patient.last_appointment_date), 'MMM dd, yyyy')
                          } catch {
                            return '-'
                          }
                        })()
                      : 'Never'}
                    {patient.last_appointment_status && (
                      <Badge 
                        ml={2}
                        colorScheme={patient.last_appointment_status === 'completed' ? 'green' : 'blue'}
                        fontSize="xs"
                      >
                        {patient.last_appointment_status}
                      </Badge>
                    )}
                  </Td>
                  <Td color="professional.gray" fontWeight="medium">
                    {patient.message_count || 0}
                  </Td>
                  <Td>
                    <Box
                      as="span"
                      px={3}
                      py={1}
                      borderRadius="full"
                      fontSize="xs"
                      fontWeight="semibold"
                      bg={patient.consent_sms ? "green.100" : "gray.100"}
                      color={patient.consent_sms ? "green.700" : "gray.700"}
                    >
                      {patient.consent_sms ? 'Yes' : 'No'}
                    </Box>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </TableContainer>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add New Patient</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>First Name</FormLabel>
                  <Input
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Last Name</FormLabel>
                  <Input
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Phone Number</FormLabel>
                  <Input
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </FormControl>
                <FormControl display="flex" alignItems="center">
                  <FormLabel mb={0}>SMS Consent</FormLabel>
                  <Switch
                    isChecked={formData.consent_sms}
                    onChange={(e) => setFormData({ ...formData, consent_sms: e.target.checked })}
                  />
                </FormControl>
                <Button type="submit" colorScheme="dental" w="100%">
                  Create Patient
                </Button>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  )
}

