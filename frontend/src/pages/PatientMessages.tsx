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
} from '@chakra-ui/react'
import { format } from 'date-fns'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'

interface Message {
  id: number
  patient_id: number
  message_type: string
  content: string
  status: string
  sent_at: string
  created_at: string
}

export default function PatientMessages() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    if (user?.email) {
      fetchMessages()
    }
  }, [user])

  const fetchMessages = async () => {
    try {
      // Filter by logged-in patient email
      const patientEmail = user?.email
      if (!patientEmail) {
        throw new Error('User email not found')
      }
      
      const response = await api.get('/messages/', {
        params: { patient_email: patientEmail }
      })
      // Handle paginated response format
      const messagesData = response.data?.items || (Array.isArray(response.data) ? response.data : [])
      setMessages(messagesData)
    } catch (error: any) {
      console.error('Error fetching messages:', error)
      setMessages([])
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'green'
      case 'sent':
        return 'blue'
      case 'failed':
        return 'red'
      case 'pending':
        return 'yellow'
      default:
        return 'gray'
    }
  }

  const formatMessageType = (type: string) => {
    return type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'
  }

  return (
    <Container maxW="container.xl">
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading 
            size="xl" 
            color="professional.darkTeal" 
            fontWeight="bold"
            mb={2}
          >
            My Messages
          </Heading>
          <ChakraText color="professional.gray">
            View appointment reminders and messages from the clinic
          </ChakraText>
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
                <Th color="professional.darkTeal" fontWeight="bold">Type</Th>
                <Th color="professional.darkTeal" fontWeight="bold">Message</Th>
                <Th color="professional.darkTeal" fontWeight="bold">Status</Th>
                <Th color="professional.darkTeal" fontWeight="bold">Sent At</Th>
              </Tr>
            </Thead>
            <Tbody>
              {messages.length === 0 ? (
                <Tr>
                  <Td colSpan={4} textAlign="center" py={8} color="professional.gray">
                    No messages yet. You'll see appointment reminders and clinic messages here.
                  </Td>
                </Tr>
              ) : (
                messages.map((message) => (
                  <Tr 
                    key={message.id}
                    _hover={{ bg: "professional.lightTeal" }}
                    transition="background 0.2s"
                  >
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
                        {formatMessageType(message.message_type)}
                      </Badge>
                    </Td>
                    <Td color="professional.gray" maxW="400px">
                      <ChakraText noOfLines={2} fontSize="sm">
                        {message.content}
                      </ChakraText>
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
                    <Td color="professional.gray" fontSize="sm">
                      {message.sent_at
                        ? format(new Date(message.sent_at), 'MMM dd, yyyy HH:mm')
                        : 'Pending'}
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </TableContainer>

        <Box 
          p={6} 
          bg="professional.lightGray" 
          borderRadius="xl"
          border="2px solid"
          borderColor="professional.lightTeal"
        >
          <VStack spacing={3} align="stretch">
            <Heading size="sm" color="professional.darkTeal">
              📱 About SMS Messages
            </Heading>
            <ChakraText fontSize="sm" color="professional.gray">
              • <strong>Appointment Reminders:</strong> You'll automatically receive reminders 3 days before, 1 day before, and 3 hours before your appointment
            </ChakraText>
            <ChakraText fontSize="sm" color="professional.gray">
              • <strong>Thank You Messages:</strong> After your visit, you'll receive a thank-you message
            </ChakraText>
            <ChakraText fontSize="sm" color="professional.gray">
              • <strong>Follow-up Reminders:</strong> We'll remind you when it's time for your next checkup
            </ChakraText>
            <ChakraText fontSize="sm" color="professional.gray">
              • <strong>Opt-Out:</strong> Reply <strong>STOP</strong> to any message if you no longer wish to receive SMS reminders
            </ChakraText>
          </VStack>
        </Box>
      </VStack>
    </Container>
  )
}

