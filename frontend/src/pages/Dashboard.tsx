import { useEffect, useState } from 'react'
import {
  Container,
  Heading,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  VStack,
  Card,
  CardBody,
  Box,
  Text as ChakraText,
  HStack,
  Button,
  useColorModeValue,
} from '@chakra-ui/react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { FaUsers, FaCalendar, FaEnvelope, FaChartLine, FaPlus, FaBullhorn, FaFileAlt } from 'react-icons/fa'
import ActivityFeed from '../components/ActivityFeed'
import SearchBar from '../components/SearchBar'

export default function Dashboard() {
  const [stats, setStats] = useState({
    patients: 0,
    appointments: 0,
    messages: 0,
    deliveryRate: 0,
  })
  const [, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [patientsRes, appointmentsRes, metricsRes] = await Promise.all([
        api.get('/patients/'),
        api.get('/appointments/'),
        api.get('/metrics/messages'),
      ])

      const patients = patientsRes.data && patientsRes.data.length > 0 ? patientsRes.data : []
      const appointments = appointmentsRes.data && appointmentsRes.data.length > 0 ? appointmentsRes.data : []

      setStats({
        patients: patients.length,
        appointments: appointments.length,
        messages: metricsRes.data?.total || 0,
        deliveryRate: metricsRes.data?.delivery_rate || 0,
      })
    } catch (error: any) {
      console.error('Error fetching stats:', error)
      setStats({
        patients: 0,
        appointments: 0,
        messages: 0,
        deliveryRate: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  const bgGradient = useColorModeValue(
    'linear(135deg, #f0fdfa 0%, #ccfbf1 100%)',
    'linear(135deg, #1a202c 0%, #2d3748 100%)'
  )

  return (
    <Container maxW="container.xl">
      <VStack spacing={8} align="stretch">
        {/* Header with Search */}
        <Box>
          <HStack justify="space-between" mb={4} flexWrap="wrap" gap={4}>
            <Box flex={1} minW="200px">
              <Heading 
                size="xl" 
                color="professional.darkTeal" 
                fontWeight="bold"
                mb={2}
                bgGradient="linear(135deg, #14b8a6 0%, #0d9488 100%)"
                bgClip="text"
              >
                Dashboard
              </Heading>
              <ChakraText color="professional.gray" fontSize="lg">
                Welcome back! Here's an overview of your clinic's messaging activity.
              </ChakraText>
            </Box>
            <SearchBar placeholder="Search patients, appointments..." />
          </HStack>
        </Box>
        
        {/* Stats Grid */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <StatCard
            title="Total Patients"
            value={stats.patients}
            icon={<FaUsers />}
            color="professional.teal"
            gradient="linear(135deg, professional.teal 0%, professional.darkTeal 100%)"
          />
          <StatCard
            title="Appointments"
            value={stats.appointments}
            icon={<FaCalendar />}
            color="professional.darkTeal"
            gradient="linear(135deg, professional.darkTeal 0%, #0f766e 100%)"
          />
          <StatCard
            title="Messages Sent"
            value={stats.messages}
            icon={<FaEnvelope />}
            color="#0d9488"
            gradient="linear(135deg, #0d9488 0%, #14b8a6 100%)"
          />
          <StatCard
            title="Delivery Rate"
            value={`${stats.deliveryRate.toFixed(1)}%`}
            icon={<FaChartLine />}
            color="#14b8a6"
            gradient="linear(135deg, #14b8a6 0%, professional.teal 100%)"
          />
        </SimpleGrid>
        
        {/* Main Content Grid */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          {/* Recent Activity */}
          <Card 
            bg={useColorModeValue('white', 'gray.800')}
            boxShadow="xl" 
            borderRadius="xl"
            border="1px solid"
            borderColor={useColorModeValue('professional.lightTeal', 'gray.700')}
            _hover={{ boxShadow: '2xl', transform: 'translateY(-4px)' }}
            transition="all 0.3s"
            overflow="hidden"
            position="relative"
          >
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              h="4px"
              bgGradient="linear(135deg, #14b8a6 0%, #0d9488 100%)"
            />
            <CardBody>
              <Heading size="md" mb={4} color="professional.darkTeal">
                Recent Activity
              </Heading>
              <ActivityFeed />
            </CardBody>
          </Card>

          {/* Quick Actions */}
          <Card 
            bg={useColorModeValue('white', 'gray.800')}
            boxShadow="xl" 
            borderRadius="xl"
            border="1px solid"
            borderColor={useColorModeValue('professional.lightTeal', 'gray.700')}
            _hover={{ boxShadow: '2xl', transform: 'translateY(-4px)' }}
            transition="all 0.3s"
            overflow="hidden"
            position="relative"
          >
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              h="4px"
              bgGradient="linear(135deg, #0d9488 0%, #0f766e 100%)"
            />
            <CardBody>
              <Heading size="md" mb={4} color="professional.darkTeal">
                Quick Actions
              </Heading>
              <VStack align="stretch" spacing={3}>
                <Button
                  as={Link}
                  to="/patients"
                  leftIcon={<FaPlus />}
                  variant="gradient"
                  size="md"
                  w="100%"
                >
                  Create New Patient
                </Button>
                <Button
                  as={Link}
                  to="/appointments"
                  leftIcon={<FaCalendar />}
                  variant="gradient"
                  size="md"
                  w="100%"
                >
                  Schedule Appointment
                </Button>
                <Button
                  as={Link}
                  to="/broadcasts"
                  leftIcon={<FaBullhorn />}
                  variant="gradient"
                  size="md"
                  w="100%"
                >
                  Send Broadcast
                </Button>
                <Button
                  as={Link}
                  to="/templates"
                  leftIcon={<FaFileAlt />}
                  variant="outline"
                  colorScheme="teal"
                  size="md"
                  w="100%"
                >
                  Manage Templates
                </Button>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>
      </VStack>
    </Container>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  color: string
  gradient?: string
}

function StatCard({ title, value, icon, color, gradient }: StatCardProps) {
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('professional.lightTeal', 'gray.700')
  
  return (
    <Card
      bg={cardBg}
      boxShadow="xl"
      borderRadius="xl"
      border="1px solid"
      borderColor={borderColor}
      _hover={{ 
        boxShadow: '2xl', 
        transform: 'translateY(-6px) scale(1.02)',
        borderColor: color
      }}
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      overflow="hidden"
      position="relative"
    >
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        h="4px"
        bgGradient={gradient || `linear(to-r, ${color}, ${color})`}
      />
      <CardBody>
        <Stat>
          <Box 
            display="flex" 
            alignItems="center" 
            mb={3} 
            color={color}
            fontSize="3xl"
            filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
            transition="transform 0.3s"
            _groupHover={{ transform: 'scale(1.1)' }}
          >
            {icon}
          </Box>
          <StatLabel 
            fontSize="sm" 
            color="professional.gray"
            fontWeight="medium"
            mb={1}
          >
            {title}
          </StatLabel>
          <StatNumber 
            fontSize="4xl" 
            bgGradient={gradient || `linear(to-r, ${color}, ${color})`}
            bgClip="text"
            fontWeight="bold"
            lineHeight="1.2"
          >
            {value}
          </StatNumber>
        </Stat>
      </CardBody>
    </Card>
  )
}

