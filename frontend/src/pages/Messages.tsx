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
  Select,
  VStack,
  useToast,
  Badge,
  Text as ChakraText,
} from '@chakra-ui/react'
import { format } from 'date-fns'
import api from '../services/api'
import { FaPaperPlane } from 'react-icons/fa'
import { formatTemplatePreview } from '../utils/templateFormatter'

interface Message {
  id: number
  patient_id: number
  message_type: string
  status: string
  content: string
  sent_at: string | null
  created_at: string
}

interface Patient {
  id: number
  first_name: string
  last_name: string
  consent_sms: boolean
}

interface Template {
  id: number
  name: string
}

export default function Messages() {
  const [messages, setMessages] = useState<Message[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [, setLoading] = useState(true)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()

  const [formData, setFormData] = useState({
    patient_id: '',
    template_id: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [messagesRes, patientsRes, templatesRes] = await Promise.all([
        api.get('/messages/'),
        api.get('/patients/'),
        api.get('/templates/'),
      ])
      // Handle paginated response format
      const messagesData = messagesRes.data?.items || (Array.isArray(messagesRes.data) ? messagesRes.data : [])
      const patientsData = patientsRes.data?.items || (Array.isArray(patientsRes.data) ? patientsRes.data : [])
      setMessages(messagesData)
      setPatients(patientsData)
      setTemplates(templatesRes.data && templatesRes.data.length > 0 ? templatesRes.data : [])
    } catch (error: any) {
      console.error('Error fetching data:', error)
      setMessages([])
      setPatients([])
      setTemplates([])
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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/messages/send', {
        patient_id: parseInt(formData.patient_id),
        template_id: parseInt(formData.template_id),
      })
      toast({
        title: 'Success',
        description: 'Message sent successfully',
        status: 'success',
      })
      onClose()
      setFormData({
        patient_id: '',
        template_id: '',
      })
      fetchData()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to send message',
        status: 'error',
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'green'
      case 'delivered':
        return 'blue'
      case 'failed':
        return 'red'
      case 'pending':
        return 'yellow'
      default:
        return 'gray'
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
            Messages
          </Heading>
          <ChakraText color="professional.gray">
            View sent messages and send new ones to patients
          </ChakraText>
        </Box>
        <Button 
          colorScheme="dental" 
          bg="professional.teal"
          color="white"
          _hover={{ bg: "professional.darkTeal" }}
          leftIcon={<FaPaperPlane />} 
          onClick={onOpen}
          size="lg"
        >
          Send Message
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
              <Th color="professional.darkTeal" fontWeight="bold">Type</Th>
              <Th color="professional.darkTeal" fontWeight="bold">Status</Th>
              <Th color="professional.darkTeal" fontWeight="bold">Content Preview</Th>
              <Th color="professional.darkTeal" fontWeight="bold">Sent At</Th>
              <Th color="professional.darkTeal" fontWeight="bold">Created</Th>
            </Tr>
          </Thead>
          <Tbody>
            {messages.length === 0 ? (
              <Tr>
                <Td colSpan={6} textAlign="center" py={8} color="professional.gray">
                  No messages found. Send your first message to get started.
                </Td>
              </Tr>
            ) : (
              messages.map((message) => (
              <Tr 
                key={message.id}
                _hover={{ bg: "professional.lightTeal" }}
                transition="background 0.2s"
              >
                <Td fontWeight="medium" color="professional.darkGray">
                  {getPatientName(message.patient_id)}
                </Td>
                <Td>
                  <Badge 
                    colorScheme="purple"
                    bg="purple.100"
                    color="purple.700"
                    px={3}
                    py={1}
                    borderRadius="full"
                    fontSize="xs"
                    fontWeight="semibold"
                  >
                    {message.message_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}
                  </Badge>
                </Td>
                <Td>
                  <Badge 
                    colorScheme={getStatusColor(message.status)}
                    bg={
                      message.status === 'delivered' ? 'green.100' :
                      message.status === 'sent' ? 'blue.100' :
                      message.status === 'failed' ? 'red.100' :
                      'yellow.100'
                    }
                    color={
                      message.status === 'delivered' ? 'green.700' :
                      message.status === 'sent' ? 'blue.700' :
                      message.status === 'failed' ? 'red.700' :
                      'yellow.700'
                    }
                    px={3}
                    py={1}
                    borderRadius="full"
                    fontSize="xs"
                    fontWeight="semibold"
                  >
                    {message.status}
                  </Badge>
                </Td>
                <Td color="professional.gray" maxW="300px">
                  <ChakraText noOfLines={1} fontSize="sm">
                    {formatTemplatePreview(message.content)}
                  </ChakraText>
                </Td>
                <Td color="professional.gray" fontSize="sm">
                  {message.sent_at
                    ? format(new Date(message.sent_at), 'MMM dd, yyyy HH:mm')
                    : '-'}
                </Td>
                <Td color="professional.gray" fontSize="sm">
                  {format(new Date(message.created_at), 'MMM dd, yyyy')}
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
          <ModalHeader>Send Message</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <form onSubmit={handleSend}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Patient</FormLabel>
                  <Select
                    value={formData.patient_id}
                    onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                  >
                    <option value="">Select patient</option>
                    {patients
                      .filter((p) => p.consent_sms)
                      .map((patient) => (
                        <option key={patient.id} value={patient.id}>
                          {patient.first_name} {patient.last_name}
                        </option>
                      ))}
                  </Select>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Template</FormLabel>
                  <Select
                    value={formData.template_id}
                    onChange={(e) => setFormData({ ...formData, template_id: e.target.value })}
                  >
                    <option value="">Select template</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <Button type="submit" colorScheme="dental" w="100%">
                  Send Message
                </Button>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  )
}

