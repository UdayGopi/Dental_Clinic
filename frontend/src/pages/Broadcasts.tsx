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
  useToast,
  Text as ChakraText,
  Badge,
} from '@chakra-ui/react'
import { format } from 'date-fns'
import api from '../services/api'

interface Broadcast {
  id: number
  name: string
  status: string
  total_recipients: number
  sent_count: number
  failed_count: number
  created_at: string
}

interface Template {
  id: number
  name: string
}

export default function Broadcasts() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [, setLoading] = useState(true)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()

  const [formData, setFormData] = useState({
    name: '',
    template_id: '',
    scheduled_at: '',
    only_opted_in: true,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [broadcastsRes, templatesRes] = await Promise.all([
        api.get('/broadcasts/'),
        api.get('/templates/'),
      ])
      // Handle different response formats
      let broadcasts = Array.isArray(broadcastsRes.data) 
        ? broadcastsRes.data 
        : broadcastsRes.data?.broadcasts || []
      
      setBroadcasts(broadcasts)
      
      if (templatesRes.data && templatesRes.data.length > 0) {
        setTemplates(templatesRes.data)
      } else {
        setTemplates([])
      }
    } catch (error: any) {
      console.error('Error fetching broadcasts:', error)
      setBroadcasts([])
      setTemplates([])
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to fetch broadcasts',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.template_id) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        status: 'error',
      })
      return
    }

    try {
      // Format scheduled_at properly
      let scheduled_at = null
      if (formData.scheduled_at) {
        // Convert datetime-local format to ISO string
        scheduled_at = new Date(formData.scheduled_at).toISOString()
      }

      const response = await api.post('/broadcasts/', {
        name: formData.name,
        template_id: parseInt(formData.template_id),
        scheduled_at: scheduled_at,
        filter_criteria: {
          only_opted_in: formData.only_opted_in,
        },
      })

      toast({
        title: 'Success',
        description: 'Broadcast created successfully',
        status: 'success',
        duration: 3000,
      })
      
      onClose()
      setFormData({
        name: '',
        template_id: '',
        scheduled_at: '',
        only_opted_in: true,
      })
      
      // Refresh the list
      await fetchData()
    } catch (error: any) {
      console.error('Error creating broadcast:', error)
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to create broadcast. Please check that a template exists.',
        status: 'error',
        duration: 5000,
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'green'
      case 'processing':
        return 'blue'
      case 'failed':
        return 'red'
      case 'pending':
        return 'yellow'
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
            Broadcast Campaigns
          </Heading>
          <ChakraText color="professional.gray">
            Manage and schedule mass messages to your patient base
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
          Create Broadcast
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
              <Th color="professional.darkTeal" fontWeight="bold">Template</Th>
              <Th color="professional.darkTeal" fontWeight="bold">Scheduled At</Th>
              <Th color="professional.darkTeal" fontWeight="bold">Status</Th>
              <Th color="professional.darkTeal" fontWeight="bold">Recipients</Th>
              <Th color="professional.darkTeal" fontWeight="bold">Sent</Th>
              <Th color="professional.darkTeal" fontWeight="bold">Failed</Th>
            </Tr>
          </Thead>
          <Tbody>
            {broadcasts.length === 0 ? (
              <Tr>
                <Td colSpan={7} textAlign="center" py={8} color="professional.gray">
                  No broadcasts found. Create your first broadcast to get started.
                </Td>
              </Tr>
            ) : (
              broadcasts.map((broadcast) => (
              <Tr 
                key={broadcast.id}
                _hover={{ bg: "professional.lightTeal" }}
                transition="background 0.2s"
              >
                <Td fontWeight="medium" color="professional.darkGray">
                  {broadcast.name}
                </Td>
                <Td color="professional.gray">
                  {broadcast.template_name || 'N/A'}
                </Td>
                <Td color="professional.gray" fontSize="sm">
                  {broadcast.scheduled_at ? format(new Date(broadcast.scheduled_at), 'MMM dd, yyyy HH:mm') : '-'}
                </Td>
                <Td>
                  <Badge 
                    colorScheme={getStatusColor(broadcast.status)}
                    bg={
                      broadcast.status === 'completed' ? 'green.100' :
                      broadcast.status === 'processing' ? 'blue.100' :
                      broadcast.status === 'failed' ? 'red.100' :
                      'yellow.100'
                    }
                    color={
                      broadcast.status === 'completed' ? 'green.700' :
                      broadcast.status === 'processing' ? 'blue.700' :
                      broadcast.status === 'failed' ? 'red.700' :
                      'yellow.700'
                    }
                    px={3}
                    py={1}
                    borderRadius="full"
                    fontSize="xs"
                    fontWeight="semibold"
                  >
                    {broadcast.status}
                  </Badge>
                </Td>
                <Td color="professional.gray">{broadcast.total_recipients}</Td>
                <Td color="professional.gray">{broadcast.sent_count}</Td>
                <Td color="professional.gray">{broadcast.failed_count}</Td>
              </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </TableContainer>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create Broadcast</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Campaign Name</FormLabel>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
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
                <FormControl>
                  <FormLabel>Scheduled At (optional)</FormLabel>
                  <Input
                    type="datetime-local"
                    value={formData.scheduled_at}
                    onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                  />
                  <ChakraText fontSize="sm" color="gray.500" mt={1}>
                    Leave empty to send immediately
                  </ChakraText>
                </FormControl>
                <FormControl>
                  <FormLabel>Filter: Only Opted-In Patients</FormLabel>
                  <Select
                    value={formData.only_opted_in ? 'true' : 'false'}
                    onChange={(e) =>
                      setFormData({ ...formData, only_opted_in: e.target.value === 'true' })
                    }
                  >
                    <option value="true">Yes</option>
                    <option value="false">No (All Patients)</option>
                  </Select>
                </FormControl>
                <Button type="submit" colorScheme="dental" w="100%">
                  Create Broadcast
                </Button>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  )
}

