import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  Box,
  Container,
  Heading,
  Text as ChakraText,
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
  Textarea,
  VStack,
  Select,
  useToast,
} from '@chakra-ui/react'
import api from '../services/api'
import { getTemplatePreview } from '../utils/templateFormatter'

interface Template {
  id: number
  name: string
  message_type: string
  content: string
  reminder_stage?: string | null
  is_active: boolean
  created_at?: string
}

export default function Templates() {
  const { user } = useAuth()
  const [templates, setTemplates] = useState<Template[]>([])
  const [, setLoading] = useState(true)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()
  
  // Templates are read-only - only view, no create/edit for staff/admin
  const isReadOnly = user?.role === 'staff' || user?.role === 'admin'

  const [formData, setFormData] = useState({
    name: '',
    message_type: 'post_visit',
    content: '',
  })

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/templates/')
      if (response.data && response.data.length > 0) {
        setTemplates(response.data)
      } else {
        setTemplates([])
      }
    } catch (error: any) {
      console.error('Error fetching templates:', error)
      setTemplates([])
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to fetch templates',
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
      await api.post('/templates/', {
        name: formData.name,
        message_type: formData.message_type,
        content: formData.content,
      })
      toast({
        title: 'Success',
        description: 'Template created successfully',
        status: 'success',
      })
      onClose()
      setFormData({
        name: '',
        message_type: 'post_visit',
        content: '',
      })
      fetchTemplates()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to create template',
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
            Message Templates
          </Heading>
          <ChakraText color="professional.gray">
            {isReadOnly ? 'View pre-configured message templates' : 'Create and manage reusable message templates'}
          </ChakraText>
        </Box>
        {!isReadOnly && (
          <Button 
            colorScheme="dental" 
            bg="professional.teal"
            color="white"
            _hover={{ bg: "professional.darkTeal" }}
            onClick={onOpen}
            size="lg"
          >
            Create Template
          </Button>
        )}
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
              <Th color="professional.darkTeal" fontWeight="bold">Type</Th>
              <Th color="professional.darkTeal" fontWeight="bold">Content Preview</Th>
              <Th color="professional.darkTeal" fontWeight="bold">Status</Th>
            </Tr>
          </Thead>
          <Tbody>
            {templates.length === 0 ? (
              <Tr>
                <Td colSpan={4} textAlign="center" py={8} color="professional.gray">
                  No templates found. Create your first template to get started.
                </Td>
              </Tr>
            ) : (
              templates.map((template) => (
                <Tr 
                  key={template.id}
                  _hover={{ bg: "professional.lightTeal" }}
                  transition="background 0.2s"
                >
                  <Td fontWeight="medium" color="professional.darkGray">
                    {template.name}
                  </Td>
                  <Td color="professional.gray">
                    {template.message_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}
                  </Td>
                  <Td color="professional.gray" maxW="300px">
                    {getTemplatePreview(template.content, 60)}
                  </Td>
                  <Td>
                    <Box
                      as="span"
                      px={3}
                      py={1}
                      borderRadius="full"
                      fontSize="xs"
                      fontWeight="semibold"
                      bg={template.is_active ? "green.100" : "gray.100"}
                      color={template.is_active ? "green.700" : "gray.700"}
                    >
                      {template.is_active ? 'Active' : 'Inactive'}
                    </Box>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </TableContainer>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create Template</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Template Name</FormLabel>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Message Type</FormLabel>
                  <Select
                    value={formData.message_type}
                    onChange={(e) => setFormData({ ...formData, message_type: e.target.value })}
                  >
                    <option value="post_visit">Post Visit</option>
                    <option value="recall">Recall</option>
                    <option value="appointment_reminder">Appointment Reminder</option>
                    <option value="broadcast">Broadcast</option>
                  </Select>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Template Content</FormLabel>
                  <Textarea
                    rows={6}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Use {{patient_first_name}} for personalization"
                  />
                  <Box fontSize="sm" color="gray.500" mt={2}>
                    Available variables: {'{{patient_first_name}}'}, {'{{patient_last_name}}'}, {'{{patient_phone}}'}, {'{{appointment_date}}'}, {'{{appointment_time}}'}, {'{{doctor_name}}'}, {'{{appointment_type}}'}
                  </Box>
                </FormControl>
                <Button type="submit" colorScheme="dental" w="100%">
                  Create Template
                </Button>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  )
}

