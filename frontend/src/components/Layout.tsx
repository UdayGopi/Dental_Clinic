import { Box, Flex, Heading, Button, HStack, Text as ChakraText, VStack, useColorModeValue } from '@chakra-ui/react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { FaHome, FaUsers, FaCalendar, FaFileAlt, FaBullhorn, FaChartBar, FaEnvelope, FaHistory, FaTooth, FaSignOutAlt, FaUserShield } from 'react-icons/fa'
import ThemeToggle from './ThemeToggle'
import NotificationBell from './NotificationBell'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  // Determine user role explicitly
  const userRole = user?.role || 'patient'
  // Patient is true ONLY if role is explicitly 'patient'
  const isPatientUser = userRole === 'patient'
  const isAdmin = userRole === 'admin'
  const isStaff = userRole === 'staff'
  
  // Admin navigation items (full access)
  const adminNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: FaHome },
    { path: '/patients', label: 'Patients', icon: FaUsers },
    { path: '/appointments', label: 'Appointments', icon: FaCalendar },
    { path: '/messages', label: 'Messages', icon: FaEnvelope },
    { path: '/templates', label: 'Templates', icon: FaFileAlt },
    { path: '/broadcasts', label: 'Broadcasts', icon: FaBullhorn },
    { path: '/analytics', label: 'Analytics', icon: FaChartBar },
    { path: '/audit-logs', label: 'Audit Logs', icon: FaHistory },
    { path: '/admin-management', label: 'Admin Management', icon: FaUserShield },
  ]

  // Staff navigation items (limited access - no admin management)
  const staffNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: FaHome },
    { path: '/patients', label: 'Patients', icon: FaUsers },
    { path: '/appointments', label: 'Appointments', icon: FaCalendar },
    { path: '/messages', label: 'Messages', icon: FaEnvelope },
    { path: '/templates', label: 'Templates', icon: FaFileAlt },
    { path: '/broadcasts', label: 'Broadcasts', icon: FaBullhorn },
    { path: '/analytics', label: 'Analytics', icon: FaChartBar },
    { path: '/audit-logs', label: 'Audit Logs', icon: FaHistory },
  ]

  // Patient navigation items
  const patientNavItems = [
    { path: '/patient-dashboard', label: 'My Dashboard', icon: FaHome },
    { path: '/patient-appointments', label: 'My Appointments', icon: FaCalendar },
    { path: '/patient-messages', label: 'My Messages', icon: FaEnvelope },
  ]

  // Determine which nav items to show based on user role
  let navItems = patientNavItems
  if (isAdmin) {
    navItems = adminNavItems
  } else if (isStaff) {
    navItems = staffNavItems
  } else if (isPatientUser) {
    navItems = patientNavItems
  } else {
    // Default to admin for safety
    navItems = adminNavItems
  }

  const headerBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('professional.lightTeal', 'gray.700')
  const bgColor = useColorModeValue('professional.lightGray', 'gray.900')
  const textColor = useColorModeValue('professional.darkGray', 'gray.100')
  const grayText = useColorModeValue('professional.gray', 'gray.400')

  return (
    <Box minH="100vh" bg={bgColor} transition="background-color 0.3s">
      {/* Professional Header */}
      <Box 
        bg={headerBg}
        boxShadow="md" 
        position="sticky" 
        top={0} 
        zIndex={1000}
        borderBottom="2px solid"
        borderColor={borderColor}
        transition="all 0.3s"
      >
        <Flex justify="space-between" align="center" px={8} py={4}>
          <HStack spacing={3}>
            <Box as={FaTooth} boxSize={6} color="professional.teal" />
            <VStack spacing={0} align="start">
              <Heading size="md" color="professional.darkTeal" fontWeight="bold">
                Dental Clinic
              </Heading>
              <ChakraText fontSize="xs" color={grayText}>
                {isPatientUser ? 'Patient Portal' : userRole === 'admin' ? 'Admin Portal' : userRole === 'staff' ? 'Staff Portal' : 'Messaging System'}
              </ChakraText>
            </VStack>
          </HStack>
          <HStack spacing={3}>
            <NotificationBell />
            <ThemeToggle />
            <Box textAlign="right">
              <ChakraText fontSize="sm" fontWeight="medium" color={textColor}>
                {user?.name || 'User'}
              </ChakraText>
              <ChakraText fontSize="xs" color={grayText}>
                {user?.email}
              </ChakraText>
            </Box>
            <Button 
              size="sm" 
              onClick={handleLogout} 
              variant="outline"
              leftIcon={<FaSignOutAlt />}
              borderColor="professional.teal"
              color="professional.teal"
              _hover={{ 
                bg: "professional.lightTeal",
                borderColor: "professional.darkTeal"
              }}
            >
              Logout
            </Button>
          </HStack>
        </Flex>
        
        {/* Navigation Tabs */}
        <Box 
          borderTop="1px solid" 
          borderColor={borderColor}
          bg={headerBg}
          overflowX="auto"
          transition="all 0.3s"
        >
          <HStack spacing={0} px={8} py={0}>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              const IconComponent = item.icon
              return (
                <Button
                  key={item.path}
                  as={Link}
                  to={item.path}
                  variant="ghost"
                  leftIcon={<IconComponent />}
                  borderRadius={0}
                  borderBottom="3px solid"
                  borderColor={isActive ? 'professional.teal' : 'transparent'}
                  color={isActive ? 'professional.darkTeal' : 'professional.gray'}
                  fontWeight={isActive ? 'semibold' : 'normal'}
                  bg={isActive ? 'professional.lightTeal' : 'transparent'}
                  _hover={{
                    bg: 'professional.lightTeal',
                    color: 'professional.darkTeal',
                  }}
                  px={6}
                  py={4}
                >
                  {item.label}
                </Button>
              )
            })}
          </HStack>
        </Box>
      </Box>
      
      {/* Main Content */}
      <Box p={8} minH="calc(100vh - 140px)">
        {children}
      </Box>
    </Box>
  )
}

