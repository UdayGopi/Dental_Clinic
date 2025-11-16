import { useEffect, useState } from 'react'
import {
  Container,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  Box,
  Select,
  FormControl,
  FormLabel,
  VStack,
  Text as ChakraText,
} from '@chakra-ui/react'
import { format } from 'date-fns'
import api from '../services/api'
import { useToast } from '@chakra-ui/react'

interface AuditLog {
  id: number
  action: string
  entity_type: string
  entity_id: number
  details: string
  created_at: string
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [, setLoading] = useState(true)
  const toast = useToast()

  useEffect(() => {
    fetchLogs()
  }, [filter])

  const fetchLogs = async () => {
    try {
      const response = await api.get('/audit-logs/')
      // Handle paginated response format
      let logs = response.data?.items || (Array.isArray(response.data) ? response.data : [])

      // Use mock data if API returns empty
      if (logs.length === 0) {
        const { mockAuditLogs } = await import('../utils/mockData')
        logs = mockAuditLogs
      }

      if (filter !== 'all') {
        logs = logs.filter((log: AuditLog) => log.action === filter)
      }

      setLogs(logs)
    } catch (error: any) {
      console.error('Error fetching audit logs:', error)
      setLogs([])
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to fetch audit logs',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'message_sent':
        return 'green'
      case 'opt_out':
        return 'red'
      case 'opt_in':
        return 'blue'
      case 'broadcast_created':
        return 'purple'
      default:
        return 'gray'
    }
  }

  return (
    <Container maxW="container.xl">
      <VStack spacing={6} align="stretch">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Heading 
              size="xl" 
              color="professional.darkTeal" 
              fontWeight="bold"
              mb={2}
            >
              Audit Logs
            </Heading>
            <ChakraText color="professional.gray">
              Track all significant actions and system events
            </ChakraText>
          </Box>
          <FormControl w="200px">
            <FormLabel>Filter by Action</FormLabel>
            <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All Actions</option>
              <option value="message_sent">Message Sent</option>
              <option value="opt_out">Opt Out</option>
              <option value="opt_in">Opt In</option>
              <option value="broadcast_created">Broadcast Created</option>
            </Select>
          </FormControl>
        </Box>

        {logs.length === 0 ? (
          <Box textAlign="center" py={12} bg="white" borderRadius="xl" boxShadow="lg" border="1px solid" borderColor="professional.lightTeal">
            <ChakraText color="professional.gray" fontSize="lg">No audit logs found</ChakraText>
            <ChakraText fontSize="sm" color="professional.gray" mt={2}>
              Audit logs will appear here as actions are performed
            </ChakraText>
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
                  <Th color="professional.darkTeal" fontWeight="bold">Timestamp</Th>
                  <Th color="professional.darkTeal" fontWeight="bold">Action</Th>
                  <Th color="professional.darkTeal" fontWeight="bold">Entity Type</Th>
                  <Th color="professional.darkTeal" fontWeight="bold">Entity ID</Th>
                  <Th color="professional.darkTeal" fontWeight="bold">Details</Th>
                </Tr>
              </Thead>
              <Tbody>
                {logs.map((log) => (
                  <Tr 
                    key={log.id}
                    _hover={{ bg: "professional.lightTeal" }}
                    transition="background 0.2s"
                  >
                    <Td color="professional.gray" fontSize="sm">
                      {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm:ss')}
                    </Td>
                    <Td>
                      <Badge 
                        colorScheme={getActionColor(log.action)}
                        bg={
                          log.action === 'message_sent' ? 'blue.100' :
                          log.action === 'opt_out' ? 'red.100' :
                          log.action === 'opt_in' ? 'green.100' :
                          log.action === 'patient_created' ? 'purple.100' :
                          log.action === 'appointment_scheduled' ? 'orange.100' :
                          'gray.100'
                        }
                        color={
                          log.action === 'message_sent' ? 'blue.700' :
                          log.action === 'opt_out' ? 'red.700' :
                          log.action === 'opt_in' ? 'green.700' :
                          log.action === 'patient_created' ? 'purple.700' :
                          log.action === 'appointment_scheduled' ? 'orange.700' :
                          'gray.700'
                        }
                        px={3}
                        py={1}
                        borderRadius="full"
                        fontSize="xs"
                        fontWeight="semibold"
                      >
                        {log.action?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}
                      </Badge>
                    </Td>
                    <Td color="professional.gray">{log.entity_type}</Td>
                    <Td color="professional.gray">{log.entity_id}</Td>
                    <Td color="professional.gray" maxW="400px">
                      <ChakraText noOfLines={2} fontSize="sm">
                        {log.details ? (() => {
                          try {
                            const parsed = JSON.parse(log.details)
                            if (typeof parsed === 'object' && parsed !== null) {
                              return JSON.stringify(parsed, null, 2)
                            }
                            return String(parsed)
                          } catch {
                            return log.details
                          }
                        })() : '-'}
                      </ChakraText>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        )}
      </VStack>
    </Container>
  )
}

