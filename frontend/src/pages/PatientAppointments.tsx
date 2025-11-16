import { useState, useEffect } from 'react'
import {
  Container,
  Heading,
  VStack,
  Box,
  Text as ChakraText,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
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
  useToast,
  Spinner,
  HStack,
  Select,
  Textarea,
} from '@chakra-ui/react'
import { format } from 'date-fns'
import { FaCalendarPlus } from 'react-icons/fa'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'

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

export default function PatientAppointments() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [appointmentDate, setAppointmentDate] = useState('')
  const [appointmentReason, setAppointmentReason] = useState('')
  const [serviceType, setServiceType] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [specialNotes, setSpecialNotes] = useState('')
  const [emergencyContact, setEmergencyContact] = useState('')
  const [insuranceInfo, setInsuranceInfo] = useState('')
  const [showOtherFields, setShowOtherFields] = useState(false)
  const toast = useToast()

  useEffect(() => {
    if (user?.email) {
      fetchAppointments()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      // Filter by logged-in patient email
      const patientEmail = user?.email
      if (!patientEmail) {
        throw new Error('User email not found')
      }
      
      const response = await api.get('/appointments/', {
        params: { patient_email: patientEmail }
      })
      // Handle paginated response format
      const appointmentsData = response.data?.items || (Array.isArray(response.data) ? response.data : [])
      setAppointments(appointmentsData)
    } catch (error: any) {
      console.error('Error fetching appointments:', error)
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  const handleBookAppointment = async () => {
    if (!appointmentDate) {
      toast({
        title: 'Error',
        description: 'Please select an appointment date and time',
        status: 'error',
        duration: 3000,
      })
      return
    }

    if (!appointmentReason) {
      toast({
        title: 'Error',
        description: 'Please select a reason for your appointment',
        status: 'error',
        duration: 3000,
      })
      return
    }

    if (!serviceType) {
      toast({
        title: 'Error',
        description: 'Please select a service type',
        status: 'error',
        duration: 3000,
      })
      return
    }

    if (!phoneNumber) {
      toast({
        title: 'Error',
        description: 'Please provide your phone number',
        status: 'error',
        duration: 3000,
      })
      return
    }

    if (!user?.email) {
      toast({
        title: 'Error',
        description: 'User email not found. Please log in again.',
        status: 'error',
        duration: 3000,
      })
      return
    }

    try {
      // Use patient email to link appointment
      await api.post('/appointments/', {
        patient_id: user.patient_id || null, // Use patient_id if available
        appointment_date: new Date(appointmentDate).toISOString(),
        followup_required: true,
        followup_interval_days: 180,
        status: 'scheduled',
        appointment_type: serviceType || appointmentReason, // Use serviceType as appointment_type
        doctor_name: null, // Will be assigned by staff/admin
        appointment_reason: appointmentReason,
        service_type: serviceType,
        phone_number: phoneNumber,
        special_notes: specialNotes,
        emergency_contact: emergencyContact,
        insurance_info: insuranceInfo,
      }, {
        params: { patient_email: user.email } // Pass patient_email as a query parameter
      })
      
      toast({
        title: 'Success',
        description: 'Appointment booked successfully! You will receive SMS reminders 3 days before, 1 day before, and 3 hours before your appointment.',
        status: 'success',
        duration: 5000,
      })
      
      onClose()
      // Reset all form fields
      setAppointmentDate('')
      setAppointmentReason('')
      setServiceType('')
      setPhoneNumber('')
      setSpecialNotes('')
      setEmergencyContact('')
      setInsuranceInfo('')
      setShowOtherFields(false)
      fetchAppointments()
    } catch (error: any) {
      console.error('Appointment booking error:', error)
      
      // Handle different error formats
      let errorMsg = 'Failed to book appointment'
      
      if (error.response?.data) {
        const errorData = error.response.data
        
        // Handle FastAPI validation errors (array of error objects)
        if (Array.isArray(errorData.detail)) {
          const validationErrors = errorData.detail
            .map((err: any) => {
              if (typeof err === 'string') return err
              if (err.msg) return `${err.loc?.join('.') || 'Field'}: ${err.msg}`
              return JSON.stringify(err)
            })
            .join(', ')
          errorMsg = validationErrors || 'Validation error occurred'
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
        description: errorMsg.includes('Patient not found') || errorMsg.includes('patient')
          ? 'Please complete your patient profile first. Contact the clinic to set up your profile.'
          : String(errorMsg),
        status: 'error',
        duration: 5000,
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'green'
      case 'scheduled':
        return 'blue'
      case 'cancelled':
        return 'red'
      default:
        return 'gray'
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
            My Appointments
          </Heading>
          <ChakraText color="professional.gray">
            View and manage your dental appointments
          </ChakraText>
        </Box>
        <Button 
          bg="professional.teal"
          color="white"
          _hover={{ bg: "professional.darkTeal" }}
          leftIcon={<FaCalendarPlus />} 
          onClick={onOpen}
          size="lg"
        >
          Book Appointment
        </Button>
      </Box>

      {loading ? (
        <Box textAlign="center" py={12}>
          <Spinner size="xl" color="professional.teal" />
          <ChakraText mt={4} color="professional.gray">Loading appointments...</ChakraText>
        </Box>
      ) : (
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
                <Th color="professional.darkTeal" fontWeight="bold">Date & Time</Th>
                <Th color="professional.darkTeal" fontWeight="bold">Doctor</Th>
                <Th color="professional.darkTeal" fontWeight="bold">Type</Th>
                <Th color="professional.darkTeal" fontWeight="bold">Status</Th>
                <Th color="professional.darkTeal" fontWeight="bold">Follow-up</Th>
              </Tr>
            </Thead>
            <Tbody>
              {appointments.length === 0 ? (
                <Tr>
                  <Td colSpan={5} textAlign="center" py={8} color="professional.gray">
                    No appointments found. Book your first appointment to get started.
                  </Td>
                </Tr>
              ) : (
                appointments.map((appointment) => (
                <Tr 
                  key={appointment.id}
                  _hover={{ bg: "professional.lightTeal" }}
                  transition="background 0.2s"
                >
                  <Td color="professional.gray" fontWeight="medium">
                    {format(new Date(appointment.appointment_date), 'MMM dd, yyyy HH:mm')}
                  </Td>
                  <Td color="professional.gray" fontWeight="medium">
                    {appointment.doctor_name || 'TBD'}
                  </Td>
                  <Td color="professional.gray">
                    {appointment.appointment_type || 'General Checkup'}
                  </Td>
                  <Td>
                    <Badge 
                      colorScheme={getStatusColor(appointment.status)}
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
                      px={3}
                      py={1}
                      borderRadius="full"
                      fontSize="xs"
                      fontWeight="semibold"
                    >
                      {appointment.status}
                    </Badge>
                  </Td>
                  <Td color="professional.gray">
                    {appointment.followup_required ? 'Yes' : 'No'}
                  </Td>
                </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </TableContainer>
      )}

      {/* Book Appointment Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader color="professional.darkTeal" fontSize="xl" fontWeight="bold">
            Book New Appointment
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel color="professional.darkGray" fontWeight="medium">
                  Appointment Date & Time
                </FormLabel>
                <Input
                  type="datetime-local"
                  value={appointmentDate}
                  onChange={(e) => {
                    setAppointmentDate(e.target.value)
                    if (e.target.value) {
                      setShowOtherFields(true)
                    }
                  }}
                  min={new Date().toISOString().slice(0, 16)}
                  borderColor="professional.lightTeal"
                  _focus={{ borderColor: "professional.teal", boxShadow: "0 0 0 1px professional.teal" }}
                />
              </FormControl>

              {showOtherFields && (
                <>
              <FormControl isRequired>
                <FormLabel color="professional.darkGray" fontWeight="medium">
                  Reason for Appointment
                </FormLabel>
                <Select
                  placeholder="Select reason for visit"
                  value={appointmentReason}
                  onChange={(e) => setAppointmentReason(e.target.value)}
                  borderColor="professional.lightTeal"
                  _focus={{ borderColor: "professional.teal", boxShadow: "0 0 0 1px professional.teal" }}
                >
                  <option value="routine_checkup">Routine Checkup</option>
                  <option value="cleaning">Teeth Cleaning</option>
                  <option value="toothache">Toothache / Pain</option>
                  <option value="cavity_filling">Cavity Filling</option>
                  <option value="root_canal">Root Canal Treatment</option>
                  <option value="extraction">Tooth Extraction</option>
                  <option value="whitening">Teeth Whitening</option>
                  <option value="orthodontic">Orthodontic Consultation</option>
                  <option value="emergency">Emergency</option>
                  <option value="follow_up">Follow-up Visit</option>
                  <option value="other">Other</option>
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel color="professional.darkGray" fontWeight="medium">
                  Service Type
                </FormLabel>
                <Select
                  placeholder="Select service type"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  borderColor="professional.lightTeal"
                  _focus={{ borderColor: "professional.teal", boxShadow: "0 0 0 1px professional.teal" }}
                >
                  <option value="general_dentistry">General Dentistry</option>
                  <option value="cosmetic_dentistry">Cosmetic Dentistry</option>
                  <option value="orthodontics">Orthodontics</option>
                  <option value="oral_surgery">Oral Surgery</option>
                  <option value="periodontics">Periodontics</option>
                  <option value="endodontics">Endodontics</option>
                  <option value="pediatric_dentistry">Pediatric Dentistry</option>
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel color="professional.darkGray" fontWeight="medium">
                  Phone Number
                </FormLabel>
                <Input
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  borderColor="professional.lightTeal"
                  _focus={{ borderColor: "professional.teal", boxShadow: "0 0 0 1px professional.teal" }}
                />
                <ChakraText fontSize="xs" color="professional.gray" mt={1}>
                  We'll send SMS reminders to this number
                </ChakraText>
              </FormControl>

              <FormControl>
                <FormLabel color="professional.darkGray" fontWeight="medium">
                  Emergency Contact
                </FormLabel>
                <Input
                  type="text"
                  placeholder="Name and phone number"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  borderColor="professional.lightTeal"
                  _focus={{ borderColor: "professional.teal", boxShadow: "0 0 0 1px professional.teal" }}
                />
              </FormControl>

              <FormControl>
                <FormLabel color="professional.darkGray" fontWeight="medium">
                  Insurance Information (Optional)
                </FormLabel>
                <Input
                  type="text"
                  placeholder="Insurance provider and policy number"
                  value={insuranceInfo}
                  onChange={(e) => setInsuranceInfo(e.target.value)}
                  borderColor="professional.lightTeal"
                  _focus={{ borderColor: "professional.teal", boxShadow: "0 0 0 1px professional.teal" }}
                />
              </FormControl>

              <FormControl>
                <FormLabel color="professional.darkGray" fontWeight="medium">
                  Special Notes or Concerns
                </FormLabel>
                <Textarea
                  placeholder="Any specific concerns, allergies, or information we should know..."
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  rows={4}
                  borderColor="professional.lightTeal"
                  _focus={{ borderColor: "professional.teal", boxShadow: "0 0 0 1px professional.teal" }}
                />
              </FormControl>

              <Box 
                bg="professional.lightGray" 
                p={4} 
                borderRadius="md" 
                border="1px solid" 
                borderColor="professional.lightTeal"
              >
                <ChakraText fontSize="sm" color="professional.darkTeal" fontWeight="medium" mb={2}>
                  📱 SMS Reminders:
                </ChakraText>
                <ChakraText fontSize="xs" color="professional.gray">
                  You will receive automatic SMS reminders 3 days before, 1 day before, and 3 hours before your appointment.
                </ChakraText>
              </Box>
              </>
              )}

              <HStack spacing={4} w="100%" pt={2}>
                <Button
                  onClick={handleBookAppointment}
                  bg="professional.teal"
                  color="white"
                  _hover={{ bg: "professional.darkTeal" }}
                  w="100%"
                  size="lg"
                  fontWeight="bold"
                >
                  Book Appointment
                </Button>
                <Button 
                  onClick={onClose} 
                  variant="outline" 
                  w="100%"
                  borderColor="professional.lightTeal"
                  color="professional.darkTeal"
                  _hover={{ bg: "professional.lightTeal" }}
                  size="lg"
                >
                  Cancel
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  )
}

