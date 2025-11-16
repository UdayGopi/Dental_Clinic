import {
  Container,
  Heading,
  VStack,
  SimpleGrid,
  Box,
  Text as ChakraText,
  Card,
  CardBody,
  Button,
  HStack,
} from '@chakra-ui/react'
import { Link } from 'react-router-dom'
import { FaCalendarCheck, FaEnvelope, FaClock, FaSmile } from 'react-icons/fa'
import { useAuth } from '../contexts/AuthContext'

export default function PatientDashboard() {
  const { user } = useAuth()

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
            Welcome, {user?.name || 'Patient'}! 👋
          </Heading>
          <ChakraText color="professional.gray" fontSize="lg">
            Manage your appointments and view your messages
          </ChakraText>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <Card 
            bg="white" 
            boxShadow="lg" 
            borderRadius="xl"
            border="2px solid"
            borderColor="professional.lightTeal"
            _hover={{ transform: 'translateY(-4px)', boxShadow: 'xl' }}
            transition="all 0.3s"
          >
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Box color="professional.teal" fontSize="3xl">
                  <FaCalendarCheck />
                </Box>
                <Heading size="md" color="professional.darkTeal">
                  My Appointments
                </Heading>
                <ChakraText color="professional.gray" fontSize="sm">
                  View and manage your scheduled appointments
                </ChakraText>
                <Button
                  as={Link}
                  to="/patient-appointments"
                  bg="professional.teal"
                  color="white"
                  _hover={{ bg: "professional.darkTeal" }}
                  size="sm"
                  w="100%"
                >
                  View Appointments
                </Button>
              </VStack>
            </CardBody>
          </Card>

          <Card 
            bg="white" 
            boxShadow="lg" 
            borderRadius="xl"
            border="2px solid"
            borderColor="professional.lightTeal"
            _hover={{ transform: 'translateY(-4px)', boxShadow: 'xl' }}
            transition="all 0.3s"
          >
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Box color="professional.teal" fontSize="3xl">
                  <FaEnvelope />
                </Box>
                <Heading size="md" color="professional.darkTeal">
                  My Messages
                </Heading>
                <ChakraText color="professional.gray" fontSize="sm">
                  View appointment reminders and clinic messages
                </ChakraText>
                <Button
                  as={Link}
                  to="/patient-messages"
                  bg="professional.teal"
                  color="white"
                  _hover={{ bg: "professional.darkTeal" }}
                  size="sm"
                  w="100%"
                >
                  View Messages
                </Button>
              </VStack>
            </CardBody>
          </Card>

          <Card 
            bg="white" 
            boxShadow="lg" 
            borderRadius="xl"
            border="2px solid"
            borderColor="professional.lightTeal"
            _hover={{ transform: 'translateY(-4px)', boxShadow: 'xl' }}
            transition="all 0.3s"
          >
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Box color="professional.teal" fontSize="3xl">
                  <FaClock />
                </Box>
                <Heading size="md" color="professional.darkTeal">
                  Book Appointment
                </Heading>
                <ChakraText color="professional.gray" fontSize="sm">
                  Schedule a new appointment online
                </ChakraText>
                <Button
                  as={Link}
                  to="/patient-appointments"
                  bg="professional.teal"
                  color="white"
                  _hover={{ bg: "professional.darkTeal" }}
                  size="sm"
                  w="100%"
                >
                  Book Now
                </Button>
              </VStack>
            </CardBody>
          </Card>

          <Card 
            bg="white" 
            boxShadow="lg" 
            borderRadius="xl"
            border="2px solid"
            borderColor="professional.lightTeal"
            _hover={{ transform: 'translateY(-4px)', boxShadow: 'xl' }}
            transition="all 0.3s"
          >
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Box color="professional.teal" fontSize="3xl">
                  <FaSmile />
                </Box>
                <Heading size="md" color="professional.darkTeal">
                  SMS Reminders
                </Heading>
                <ChakraText color="professional.gray" fontSize="sm">
                  You'll receive automatic SMS reminders for your appointments
                </ChakraText>
                <ChakraText color="professional.teal" fontSize="xs" fontWeight="semibold">
                  ✓ 3 days before<br />
                  ✓ 1 day before<br />
                  ✓ 3 hours before
                </ChakraText>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        <Card 
          bg="professional.lightGray" 
          borderRadius="xl"
          border="2px solid"
          borderColor="professional.lightTeal"
          p={6}
        >
          <VStack spacing={4} align="stretch">
            <Heading size="md" color="professional.darkTeal">
              📱 What to Expect
            </Heading>
            <VStack align="stretch" spacing={2}>
              <ChakraText color="professional.gray" fontSize="sm">
                • <strong>Appointment Reminders:</strong> You'll receive SMS reminders 3 days before, 1 day before, and 3 hours before your appointment
              </ChakraText>
              <ChakraText color="professional.gray" fontSize="sm">
                • <strong>Thank You Message:</strong> After your visit, you'll receive a thank-you message automatically
              </ChakraText>
              <ChakraText color="professional.gray" fontSize="sm">
                • <strong>Follow-up Reminders:</strong> We'll send you reminders when it's time for your next checkup
              </ChakraText>
              <ChakraText color="professional.gray" fontSize="sm">
                • <strong>Opt-Out:</strong> Reply STOP to any message if you no longer wish to receive SMS reminders
              </ChakraText>
            </VStack>
          </VStack>
        </Card>
      </VStack>
    </Container>
  )
}

