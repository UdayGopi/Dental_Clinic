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
  Select,
  Switch,
  useToast,
  Text as ChakraText,
} from '@chakra-ui/react'
import { format } from 'date-fns'
import api from '../services/api'

interface Appointment {
  id: number
  patient_id: number
  appointment_date: string
  status: string
  followup_required: boolean
}

interface Patient {
  id: number
  first_name: string
  last_name: string
}

interface Appointment {
  id: number
  patient_id: number
  appointment_date: string
  status: string
  followup_required: boolean
  followup_interval_days: number
  doctor_name?: string
  appointment_type?: string
}

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [, setLoading] = useState(true)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()

  const [formData, setFormData] = useState({
    patient_id: '',
    appointment_date: '',
    followup_required: true,
    followup_interval_days: 180,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [appointmentsRes, patientsRes] = await Promise.all([
        api.get('/appointments/'),
        api.get('/patients/'),
      ])
      // Handle paginated response format
      const appointmentsData = appointmentsRes.data?.items || (Array.isArray(appointmentsRes.data) ? appointmentsRes.data : [])
      const patientsData = patientsRes.data?.items || (Array.isArray(patientsRes.data) ? patientsRes.data : [])
      setAppointments(appointmentsData)
      setPatients(patientsData)
    } catch (error: any) {
      console.error('Error fetching data:', error)
      setAppointments([])
      setPatients([])
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to fetch data',
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
      await api.post('/appointments/', {
        ...formData,
        patient_id: parseInt(formData.patient_id),
        followup_interval_days: parseInt(formData.followup_interval_days.toString()),
      })
      toast({
        title: 'Success',
        description: 'Appointment created successfully',
        status: 'success',
      })
      onClose()
      setFormData({
        patient_id: '',
        appointment_date: '',
        followup_required: true,
        followup_interval_days: 180,
      })
      fetchData()
    } catch (error: any) {
      console.error('Appointment creation error:', error)
      
      // Handle different error formats
      let errorMsg = 'Failed to create appointment'
      
      if (error.response?.data) {
        const errorData = error.response.data
        
        // Handle FastAPI validation errors (array of error objects)
        if (Array.isArray(errorData.detail)) {
          errorMsg = errorData.detail
            .map((err: any) => {
              if (typeof err === 'string') return err
              if (err.msg) return `${err.loc?.join('.') || 'Field'}: ${err.msg}`
              return JSON.stringify(err)
            })
            .join(', ')
        }
        // Handle single error detail (string)
        else if (typeof errorData.detail === 'string') {
          errorMsg = errorData.detail
        }
        // Handle error object
        else if (errorData.detail && typeof errorData.detail === 'object') {
          errorMsg = errorData.detail.message || errorData.detail.msg || JSON.stringify(errorData.detail)
        }
        // Handle other error formats
        else if (errorData.message) {
          errorMsg = errorData.message
        }
      } else if (error.message) {
        errorMsg = error.message
      }
      
      toast({
        title: 'Error',
        description: String(errorMsg),
        status: 'error',
        duration: 5000,
      })
    }
  }

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      await api.put(`/appointments/${id}/status`, { status })
      toast({
        title: 'Success',
        description: 'Appointment status updated',
        status: 'success',
      })
      fetchData()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to update status',
        status: 'error',
      })
    }
  }

  const getPatientName = (patientId: number) => {
    const patient = patients.find((p) => p.id === patientId)
    return patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown'
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
            Appointments
          </Heading>
          <ChakraText color="professional.gray">
            Schedule and manage patient appointments
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
          Create Appointment
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
              <Th color="professional.darkTeal" fontWeight="bold">Patient</Th>
              <Th color="professional.darkTeal" fontWeight="bold">Date & Time</Th>
              <Th color="professional.darkTeal" fontWeight="bold">Doctor</Th>
              <Th color="professional.darkTeal" fontWeight="bold">Type</Th>
              <Th color="professional.darkTeal" fontWeight="bold">Status</Th>
              <Th color="professional.darkTeal" fontWeight="bold">Follow-up</Th>
              <Th color="professional.darkTeal" fontWeight="bold">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {appointments.length === 0 ? (
              <Tr>
                <Td colSpan={7} textAlign="center" py={8} color="professional.gray">
                  No appointments found. Create your first appointment to get started.
                </Td>
              </Tr>
            ) : (
              appointments.map((appointment) => (
              <Tr 
                key={appointment.id}
                _hover={{ bg: "professional.lightTeal" }}
                transition="background 0.2s"
              >
                <Td fontWeight="medium" color="professional.darkGray">
                  {getPatientName(appointment.patient_id)}
                </Td>
                <Td color="professional.gray">
                  {format(new Date(appointment.appointment_date), 'MMM dd, yyyy HH:mm')}
                </Td>
                <Td color="professional.gray" fontWeight="medium">
                  {appointment.doctor_name || 'TBD'}
                </Td>
                <Td color="professional.gray">
                  {appointment.appointment_type || 'General Checkup'}
                </Td>
                <Td>
                  <Box
                    as="span"
                    px={3}
                    py={1}
                    borderRadius="full"
                    fontSize="xs"
                    fontWeight="semibold"
                    bg={
                      appointment.status === 'completed' ? 'green.100' :
                      appointment.status === 'scheduled' ? 'blue.100' :
                      'gray.100'
                    }
                    color={
                      appointment.status === 'completed' ? 'green.700' :
                      appointment.status === 'scheduled' ? 'blue.700' :
                      'gray.700'
                    }
                  >
                    {appointment.status}
                  </Box>
                </Td>
                <Td>
                  <Box
                    as="span"
                    px={3}
                    py={1}
                    borderRadius="full"
                    fontSize="xs"
                    fontWeight="semibold"
                    bg={appointment.followup_required ? "green.100" : "gray.100"}
                    color={appointment.followup_required ? "green.700" : "gray.700"}
                  >
                    {appointment.followup_required ? 'Yes' : 'No'}
                  </Box>
                </Td>
                <Td>
                  {appointment.status !== 'completed' && (
                    <Button
                      size="sm"
                      colorScheme="green"
                      bg="green.500"
                      color="white"
                      _hover={{ bg: "green.600" }}
                      onClick={() => handleStatusUpdate(appointment.id, 'completed')}
                    >
                      Mark Complete
                    </Button>
                  )}
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
          <ModalHeader>Create Appointment</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Patient</FormLabel>
                  <Select
                    value={formData.patient_id}
                    onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                  >
                    <option value="">Select patient</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.first_name} {patient.last_name}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Appointment Date & Time</FormLabel>
                  <Input
                    type="datetime-local"
                    value={formData.appointment_date}
                    onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                  />
                </FormControl>
                <FormControl display="flex" alignItems="center">
                  <FormLabel mb={0}>Follow-up Required</FormLabel>
                  <Switch
                    isChecked={formData.followup_required}
                    onChange={(e) =>
                      setFormData({ ...formData, followup_required: e.target.checked })
                    }
                  />
                </FormControl>
                {formData.followup_required && (
                  <FormControl>
                    <FormLabel>Follow-up Interval (days)</FormLabel>
                    <Input
                      type="number"
                      value={formData.followup_interval_days}
                      onChange={(e) =>
                        setFormData({ ...formData, followup_interval_days: parseInt(e.target.value) })
                      }
                    />
                  </FormControl>
                )}
                <Button type="submit" colorScheme="dental" w="100%">
                  Create Appointment
                </Button>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  )
}

