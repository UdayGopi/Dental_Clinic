import React from 'react'
import { Box, Container, Heading, Text as ChakraText, Button, VStack, HStack, Image, SimpleGrid, Menu, MenuButton, MenuList, MenuItem } from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { FaTooth, FaCalendarCheck, FaBell, FaSmile, FaShieldAlt, FaClock, FaChevronDown, FaUserShield, FaUserMd, FaMapMarkerAlt, FaPhone, FaEnvelope, FaDirections } from 'react-icons/fa'

const scroll = keyframes`
  0% { transform: translateX(100%); }
  100% { transform: translateX(-100%); }
`

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
`

export default function LandingPage() {
  const { isAuthenticated, logout } = useAuth()

  const dentalImages = [
    {
      url: 'https://images.unsplash.com/photo-1606811971618-4486c4e48e98?w=1200&q=90&auto=format&fit=crop',
      name: 'Modern Dental Examination Room',
      fallback: 'https://images.pexels.com/photos/3845557/pexels-photo-3845557.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop'
    },
    {
      url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1200&q=90&auto=format&fit=crop',
      name: 'Advanced Dental Equipment',
      fallback: 'https://images.pexels.com/photos/3845736/pexels-photo-3845736.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop'
    },
    {
      url: 'https://images.unsplash.com/photo-1609840114035-3c981b782dfb?w=1200&q=90&auto=format&fit=crop',
      name: 'Professional Dental Care',
      fallback: 'https://images.pexels.com/photos/3845737/pexels-photo-3845737.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop'
    },
    {
      url: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=1200&q=90&auto=format&fit=crop',
      name: 'Teeth Cleaning & Hygiene',
      fallback: 'https://images.pexels.com/photos/3845738/pexels-photo-3845738.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop'
    },
    {
      url: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=1200&q=90&auto=format&fit=crop',
      name: 'Dental Consultation & Treatment',
      fallback: 'https://images.pexels.com/photos/3845739/pexels-photo-3845739.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop'
    },
    {
      url: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=1200&q=90&auto=format&fit=crop',
      name: 'Comprehensive Dental Services',
      fallback: 'https://images.pexels.com/photos/3845740/pexels-photo-3845740.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop'
    },
  ]

  const scrollingTexts = [
    'Professional Dental Care',
    'Expert Dentists',
    'Modern Equipment',
    'Patient-Centered Approach',
    'Quality Service',
  ]

  return (
    <Box bg="white">
      {/* Top Navigation Bar with Logo and Tabs */}
      <Box
        as="nav"
        bg="white"
        boxShadow="sm"
        position="sticky"
        top={0}
        zIndex={1000}
        borderBottom="1px solid"
        borderColor="professional.lightTeal"
      >
        <Container maxW="container.xl">
          <HStack
            justify="space-between"
            align="center"
            py={4}
            spacing={8}
            flexWrap="wrap"
          >
            {/* Logo */}
            <HStack spacing={3} as={Link} to="/" _hover={{ opacity: 0.8 }}>
              <Box as={FaTooth} boxSize={8} color="professional.teal" />
              <VStack spacing={0} align="start">
                <Heading size="md" color="professional.darkTeal" fontWeight="bold">
                  Dental Clinic
                </Heading>
                <ChakraText fontSize="xs" color="professional.gray">
                  Messaging System
                </ChakraText>
              </VStack>
            </HStack>

            {/* Simplified Navigation for Patients */}
            <HStack spacing={2} display={{ base: 'none', md: 'flex' }}>
                <Button
                  as={Link}
                  to="/"
                  variant="ghost"
                  color="professional.darkGray"
                  _hover={{ color: 'professional.teal', bg: 'professional.lightTeal' }}
                  fontWeight="medium"
                >
                  Home
                </Button>
                
                <Button
                  variant="ghost"
                  color="professional.darkGray"
                  _hover={{ color: 'professional.teal', bg: 'professional.lightTeal' }}
                  fontWeight="medium"
                  onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Services
                </Button>

                <Button
                  variant="ghost"
                  color="professional.darkGray"
                  _hover={{ color: 'professional.teal', bg: 'professional.lightTeal' }}
                  fontWeight="medium"
                  onClick={() => document.getElementById('book-appointment')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Book Appointment
                </Button>

                <Button
                  variant="ghost"
                  color="professional.darkGray"
                  _hover={{ color: 'professional.teal', bg: 'professional.lightTeal' }}
                  fontWeight="medium"
                  onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Contact
                </Button>
              {isAuthenticated ? (
                <>
                  <Button
                    as={Link}
                    to="/dashboard"
                    colorScheme="dental"
                    bg="professional.teal"
                    color="white"
                    _hover={{ bg: 'professional.darkTeal' }}
                    fontWeight="semibold"
                  >
                    Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    borderColor="professional.teal"
                    color="professional.teal"
                    _hover={{ bg: 'professional.lightTeal' }}
                    onClick={() => {
                      logout()
                      window.location.href = '/'
                    }}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    as={Link}
                    to="/login?role=patient"
                    variant="ghost"
                    color="professional.darkGray"
                    _hover={{ color: 'professional.teal', bg: 'professional.lightTeal' }}
                    fontWeight="medium"
                  >
                    Patient Login
                  </Button>
                  <Menu>
                    <MenuButton
                      as={Button}
                      variant="ghost"
                      color="professional.darkGray"
                      _hover={{ color: 'professional.teal', bg: 'professional.lightTeal' }}
                      fontWeight="medium"
                      rightIcon={<FaChevronDown />}
                    >
                      Staff/Admin
                    </MenuButton>
                    <MenuList bg="white" borderColor="professional.lightTeal" borderWidth="2px" boxShadow="xl">
                      <MenuItem 
                        as={Link} 
                        to="/login?role=staff" 
                        icon={<FaUserMd />}
                        bg="white"
                        color="professional.darkTeal"
                        fontWeight="medium"
                        _hover={{ bg: "professional.lightTeal", color: "professional.darkTeal" }}
                        py={3}
                      >
                        Staff Login
                      </MenuItem>
                      <MenuItem 
                        as={Link} 
                        to="/login?role=admin" 
                        icon={<FaUserShield />}
                        bg="white"
                        color="professional.darkTeal"
                        fontWeight="medium"
                        _hover={{ bg: "professional.lightTeal", color: "professional.darkTeal" }}
                        py={3}
                      >
                        Admin Login
                      </MenuItem>
                    </MenuList>
                  </Menu>
                  <Button
                    as={Link}
                    to="/register?role=patient"
                    colorScheme="dental"
                    bg="professional.teal"
                    color="white"
                    _hover={{ bg: 'professional.darkTeal' }}
                    fontWeight="semibold"
                    borderRadius="full"
                    px={6}
                  >
                    Register
                  </Button>
                </>
              )}
            </HStack>

            {/* Mobile Menu Button */}
            <Box display={{ base: 'block', md: 'none' }}>
              <Button
                variant="ghost"
                color="professional.darkGray"
                aria-label="Menu"
              >
                <Box as={FaTooth} />
              </Button>
            </Box>
          </HStack>
        </Container>
      </Box>

      {/* Hero Section - Professional Dental Theme with HD Background Image */}
      <Box
        color="white"
        py={{ base: 16, md: 24 }}
        position="relative"
        overflow="hidden"
        minH={{ base: "500px", md: "600px" }}
        display="flex"
        alignItems="center"
      >
        {/* Background Image - HD Quality Dental Clinic */}
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          zIndex={0}
          overflow="hidden"
        >
          <Image
            src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1920&q=95&auto=format&fit=crop"
            alt="Modern Dental Clinic - Professional dental care facility"
            w="100%"
            h="100%"
            objectFit="cover"
            objectPosition="center"
            fallbackSrc="https://images.pexels.com/photos/3845736/pexels-photo-3845736.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop"
            loading="eager"
            ignoreFallback={false}
          />
        </Box>
        
        {/* Light overlay for text readability only */}
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="rgba(0, 0, 0, 0.3)"
          zIndex={1}
          pointerEvents="none"
        />
        <Container maxW="container.xl" position="relative" zIndex={2}>
          <VStack spacing={8} textAlign="center">
              <Box
                animation={`${float} 3s ease-in-out infinite`}
                mb={4}
                filter="drop-shadow(0 4px 8px rgba(0,0,0,0.3))"
              >
                <Box as={FaTooth} boxSize={20} color="white" opacity={0.95} />
              </Box>
            <Heading
              as="h1"
              size={{ base: "xl", md: "2xl", lg: "3xl" }}
              fontWeight="bold"
              letterSpacing="tight"
              animation={`${fadeIn} 1s ease-out`}
              textShadow="0 4px 12px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3)"
              px={4}
            >
              Welcome to Our Dental Clinic
              <br />
              <ChakraText 
                as="span" 
                color="white"
                textShadow="0 4px 12px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3)"
                display="inline-block"
                mt={2}
              >
                Your Smile is Our Priority
              </ChakraText>
            </Heading>
            <ChakraText 
              fontSize={{ base: "lg", md: "xl" }} 
              maxW="3xl" 
              opacity={0.98}
              lineHeight="tall"
              animation={`${fadeIn} 1s ease-out 0.2s both`}
              textShadow="0 2px 8px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.3)"
              px={4}
              fontWeight="medium"
            >
              Expert dental care with modern facilities. Book your appointment online and receive 
              automated reminders via SMS. We make dental care convenient and accessible for you.
            </ChakraText>
            <HStack spacing={4} animation={`${fadeIn} 1s ease-out 0.4s both`} flexWrap="wrap" justify="center">
              <Button 
                onClick={() => document.getElementById('book-appointment')?.scrollIntoView({ behavior: 'smooth' })}
                size="lg"
                bg="white"
                color="professional.darkTeal"
                _hover={{ bg: "professional.lightTeal", transform: "translateY(-2px)", boxShadow: "xl" }}
                px={8}
                py={6}
                fontSize="lg"
                fontWeight="semibold"
                borderRadius="full"
                boxShadow="0 8px 24px rgba(0,0,0,0.4)"
                leftIcon={<FaCalendarCheck />}
              >
                Book Appointment
              </Button>
              {!isAuthenticated ? (
                <Button 
                  as={Link} 
                  to="/login?role=patient" 
                  variant="outline" 
                  size="lg"
                  bg="rgba(255,255,255,0.15)"
                  backdropFilter="blur(10px)"
                  borderColor="white"
                  color="white"
                  borderWidth="2px"
                  _hover={{ bg: "rgba(255,255,255,0.25)", borderColor: "white", transform: "translateY(-2px)", boxShadow: "xl" }}
                  px={8}
                  py={6}
                  fontSize="lg"
                  fontWeight="semibold"
                  borderRadius="full"
                  boxShadow="0 4px 16px rgba(0,0,0,0.3)"
                >
                  Patient Login
                </Button>
              ) : (
                <Button 
                  as={Link} 
                  to="/dashboard" 
                  variant="outline" 
                  size="lg"
                  borderColor="white"
                  color="white"
                  borderWidth="2px"
                  _hover={{ bg: "whiteAlpha.200", borderColor: "white" }}
                  px={8}
                  py={6}
                  fontSize="lg"
                  borderRadius="full"
                >
                  My Dashboard
                </Button>
              )}
            </HStack>
          </VStack>
        </Container>
      </Box>

      {/* Scrolling Text Banner - Separate Section */}
      <Box
        bg="professional.darkTeal"
        py={5}
        overflow="hidden"
      >
        <Box
          display="flex"
          animation={`${scroll} 40s linear infinite`}
          whiteSpace="nowrap"
        >
          {scrollingTexts.map((text, index) => (
            <ChakraText 
              key={index}
              fontSize={{ base: "lg", md: "xl" }} 
              fontWeight="bold" 
              color="white"
              whiteSpace="nowrap"
              mx={10}
            >
              ✨ {text} ✨
            </ChakraText>
          ))}
          {scrollingTexts.map((text, index) => (
            <ChakraText 
              key={`dup-${index}`}
              fontSize={{ base: "lg", md: "xl" }} 
              fontWeight="bold" 
              color="white"
              whiteSpace="nowrap"
              mx={10}
            >
              ✨ {text} ✨
            </ChakraText>
          ))}
        </Box>
      </Box>

      {/* Features Section - Patient Focused */}
      <Box id="features" bg="professional.lightGray" py={20} scrollMarginTop="80px">
        <Container maxW="container.xl">
          <VStack spacing={12}>
            <VStack spacing={4}>
              <Heading 
                as="h2" 
                size={{ base: "lg", md: "xl", lg: "2xl" }} 
                textAlign="center"
                color="professional.darkTeal"
                fontWeight="bold"
              >
                Why Choose Our Dental Clinic?
              </Heading>
              <ChakraText fontSize="lg" color="professional.gray" maxW="2xl" textAlign="center">
                Experience exceptional dental care with modern technology and personalized service
              </ChakraText>
            </VStack>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={8} w="100%">
              <FeatureCard
                icon={<FaTooth size={50} />}
                title="Expert Dentists"
                description="Highly qualified and experienced dental professionals dedicated to your oral health"
                color="professional.teal"
              />
              <FeatureCard
                icon={<FaCalendarCheck size={50} />}
                title="Easy Booking"
                description="Book appointments online anytime. Receive SMS reminders so you never miss your visit"
                color="professional.darkTeal"
              />
              <FeatureCard
                icon={<FaBell size={50} />}
                title="Follow-up Care"
                description="Personalized follow-up messages and reminders for your next checkup"
                color="#0d9488"
              />
              <FeatureCard
                icon={<FaSmile size={50} />}
                title="Patient-Centered"
                description="Your comfort and satisfaction are our top priorities. We care about your smile"
                color="#14b8a6"
              />
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* Dental Images Gallery - Professional Showcase */}
      <Box id="services" bg="white" py={20} scrollMarginTop="80px">
        <Container maxW="container.xl">
          <VStack spacing={12}>
            <VStack spacing={4}>
              <Heading 
                as="h2" 
                size={{ base: "lg", md: "xl", lg: "2xl" }} 
                textAlign="center"
                color="professional.darkTeal"
                fontWeight="bold"
              >
                Modern Dental Care
              </Heading>
              <ChakraText fontSize="lg" color="professional.gray" maxW="2xl" textAlign="center">
                State-of-the-art facilities and expert care for your dental health
              </ChakraText>
            </VStack>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8} w="100%">
              {dentalImages.map((imgData, index) => (
                <Box
                  key={index}
                  borderRadius="xl"
                  overflow="hidden"
                  boxShadow="2xl"
                  position="relative"
                  _hover={{ 
                    transform: 'translateY(-8px)', 
                    transition: 'all 0.3s',
                    boxShadow: '2xl'
                  }}
                  border="3px solid"
                  borderColor="professional.lightTeal"
                >
                  <Image
                    src={imgData.url}
                    alt={imgData.name}
                    w="100%"
                    h="320px"
                    objectFit="cover"
                    loading="lazy"
                    onError={(e) => {
                      // Fallback to Pexels if Unsplash fails
                      const target = e.target as HTMLImageElement
                      target.src = imgData.fallback
                    }}
                  />
                  <Box
                    position="absolute"
                    bottom={0}
                    left={0}
                    right={0}
                    bgGradient="linear(to-t, professional.darkTeal, transparent)"
                    p={4}
                    color="white"
                  >
                    <ChakraText fontWeight="bold" fontSize="lg">
                      {imgData.name}
                    </ChakraText>
                  </Box>
                </Box>
              ))}
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* Book Appointment Section */}
      <Box id="book-appointment" bg="white" py={20} scrollMarginTop="80px">
        <Container maxW="container.lg">
          <VStack spacing={12}>
            <VStack spacing={4}>
              <Heading 
                as="h2" 
                size={{ base: "lg", md: "xl", lg: "2xl" }} 
                textAlign="center"
                color="professional.darkTeal"
                fontWeight="bold"
              >
                📅 Book Your Appointment
              </Heading>
              <ChakraText fontSize="lg" color="professional.gray" maxW="2xl" textAlign="center">
                Schedule your visit online. We'll send you SMS reminders before your appointment
              </ChakraText>
            </VStack>
            <Box 
              w="100%" 
              maxW="600px" 
              p={8} 
              bg="professional.lightGray" 
              borderRadius="2xl" 
              boxShadow="xl"
              border="2px solid"
              borderColor="professional.lightTeal"
            >
              <VStack spacing={6}>
                <ChakraText fontSize="md" color="professional.gray" textAlign="center">
                  To book an appointment, please login or register as a patient. 
                  You'll receive SMS reminders for your scheduled visits.
                </ChakraText>
                <HStack spacing={4} w="100%" justify="center">
                  {!isAuthenticated ? (
                    <>
                      <Button 
                        as={Link} 
                        to="/register" 
                        size="lg"
                        bg="professional.teal"
                        color="white"
                        _hover={{ bg: "professional.darkTeal", transform: "translateY(-2px)" }}
                        px={8}
                        py={6}
                        fontSize="lg"
                        fontWeight="semibold"
                        borderRadius="full"
                        boxShadow="lg"
                        w={{ base: "100%", md: "auto" }}
                      >
                        Register & Book
                      </Button>
                      <Button 
                        as={Link} 
                        to="/login" 
                        variant="outline"
                        size="lg"
                        borderColor="professional.teal"
                        color="professional.teal"
                        borderWidth="2px"
                        _hover={{ bg: "professional.lightTeal" }}
                        px={8}
                        py={6}
                        fontSize="lg"
                        borderRadius="full"
                        w={{ base: "100%", md: "auto" }}
                      >
                        Login
                      </Button>
                    </>
                  ) : (
                    <Button 
                      as={Link} 
                      to="/appointments" 
                      size="lg"
                      bg="professional.teal"
                      color="white"
                      _hover={{ bg: "professional.darkTeal", transform: "translateY(-2px)" }}
                      px={8}
                      py={6}
                      fontSize="lg"
                      fontWeight="semibold"
                      borderRadius="full"
                      boxShadow="lg"
                      w={{ base: "100%", md: "auto" }}
                    >
                      Go to Appointments
                    </Button>
                  )}
                </HStack>
                <VStack spacing={3} mt={4} align="stretch" w="100%">
                  <Box p={4} bg="white" borderRadius="lg" border="1px solid" borderColor="professional.lightTeal">
                    <ChakraText fontSize="sm" fontWeight="semibold" color="professional.darkTeal" mb={2}>
                      ✨ What to Expect:
                    </ChakraText>
                    <VStack align="stretch" spacing={2}>
                      <ChakraText fontSize="sm" color="professional.gray">
                        • Easy online appointment booking
                      </ChakraText>
                      <ChakraText fontSize="sm" color="professional.gray">
                        • SMS reminders 3 days before, 1 day before, and 3 hours before your appointment
                      </ChakraText>
                      <ChakraText fontSize="sm" color="professional.gray">
                        • Thank you message after your visit
                      </ChakraText>
                      <ChakraText fontSize="sm" color="professional.gray">
                        • Follow-up reminders for your next checkup
                      </ChakraText>
                    </VStack>
                  </Box>
                </VStack>
              </VStack>
            </Box>
          </VStack>
        </Container>
      </Box>

      {/* Benefits Section - Patient Focused */}
      <Box id="about" bg="professional.lightGray" py={20} scrollMarginTop="80px">
        <Container maxW="container.xl">
          <VStack spacing={8} mb={12}>
            <Heading 
              as="h2" 
              size={{ base: "lg", md: "xl", lg: "2xl" }} 
              textAlign="center"
              color="professional.darkTeal"
              fontWeight="bold"
            >
              Why Patients Choose Us
            </Heading>
          </VStack>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10}>
            <BenefitCard
              icon={<FaSmile size={40} />}
              title="Comfortable Experience"
              description="We prioritize your comfort and make every visit as pleasant as possible. Your smile matters to us"
            />
            <BenefitCard
              icon={<FaShieldAlt size={40} />}
              title="Safe & Secure"
              description="Your personal information is protected. We follow strict privacy guidelines to keep your data safe"
            />
            <BenefitCard
              icon={<FaClock size={40} />}
              title="Convenient Reminders"
              description="Never miss an appointment! We send you SMS reminders so you're always prepared for your visit"
            />
          </SimpleGrid>
        </Container>
      </Box>

      {/* Contact & Location Section */}
      <Box id="contact" bg="professional.lightGray" py={20} scrollMarginTop="80px">
        <Container maxW="container.xl">
          <VStack spacing={12}>
            <VStack spacing={4}>
              <Heading 
                as="h2" 
                size={{ base: "lg", md: "xl", lg: "2xl" }} 
                textAlign="center"
                color="professional.darkTeal"
                fontWeight="bold"
              >
                📍 Find Us & Contact
              </Heading>
              <ChakraText fontSize="lg" color="professional.gray" maxW="2xl" textAlign="center">
                Visit us at our clinic or reach out to us. We're here to help you with all your dental care needs.
              </ChakraText>
            </VStack>

            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8} w="100%">
              {/* Left Side - Contact Info & Timings */}
              <VStack spacing={6} align="stretch">
                {/* Contact Information */}
                <Box 
                  p={6} 
                  bg="white" 
                  borderRadius="xl" 
                  border="2px solid" 
                  borderColor="professional.lightTeal"
                  boxShadow="lg"
                  _hover={{ boxShadow: 'xl', transform: 'translateY(-2px)' }}
                  transition="all 0.3s"
                >
                  <Heading as="h3" size="md" mb={4} color="professional.darkTeal" display="flex" alignItems="center" gap={2}>
                    <FaPhone /> Contact Information
                  </Heading>
                  <VStack align="stretch" spacing={4}>
                    <HStack spacing={3}>
                      <Box color="professional.teal" fontSize="xl">
                        <FaPhone />
                      </Box>
                      <VStack align="start" spacing={0}>
                        <ChakraText fontWeight="semibold" color="professional.darkTeal">Phone</ChakraText>
                        <ChakraText 
                          as="a" 
                          href="tel:+15551234567" 
                          color="professional.teal"
                          _hover={{ textDecoration: 'underline' }}
                        >
                          +1 (555) 123-4567
                        </ChakraText>
                      </VStack>
                    </HStack>
                    <HStack spacing={3}>
                      <Box color="professional.teal" fontSize="xl">
                        <FaEnvelope />
                      </Box>
                      <VStack align="start" spacing={0}>
                        <ChakraText fontWeight="semibold" color="professional.darkTeal">Email</ChakraText>
                        <ChakraText 
                          as="a" 
                          href="mailto:info@dentalclinic.com" 
                          color="professional.teal"
                          _hover={{ textDecoration: 'underline' }}
                        >
                          info@dentalclinic.com
                        </ChakraText>
                      </VStack>
                    </HStack>
                  </VStack>
                </Box>

                {/* Operating Hours */}
                <Box 
                  p={6} 
                  bg="white" 
                  borderRadius="xl" 
                  border="2px solid" 
                  borderColor="professional.lightTeal"
                  boxShadow="lg"
                  _hover={{ boxShadow: 'xl', transform: 'translateY(-2px)' }}
                  transition="all 0.3s"
                >
                  <Heading as="h3" size="md" mb={4} color="professional.darkTeal" display="flex" alignItems="center" gap={2}>
                    <FaClock /> Operating Hours
                  </Heading>
                  <VStack align="stretch" spacing={3}>
                    <HStack justify="space-between" py={2} borderBottom="1px solid" borderColor="professional.lightTeal">
                      <ChakraText fontWeight="semibold" color="professional.darkTeal">Monday - Friday</ChakraText>
                      <ChakraText color="professional.gray">9:00 AM - 6:00 PM</ChakraText>
                    </HStack>
                    <HStack justify="space-between" py={2} borderBottom="1px solid" borderColor="professional.lightTeal">
                      <ChakraText fontWeight="semibold" color="professional.darkTeal">Saturday</ChakraText>
                      <ChakraText color="professional.gray">9:00 AM - 4:00 PM</ChakraText>
                    </HStack>
                    <HStack justify="space-between" py={2} borderBottom="1px solid" borderColor="professional.lightTeal">
                      <ChakraText fontWeight="semibold" color="professional.darkTeal">Sunday</ChakraText>
                      <ChakraText color="professional.gray">Closed</ChakraText>
                    </HStack>
                    <Box mt={2} p={3} bg="professional.lightTeal" borderRadius="md">
                      <ChakraText fontSize="sm" color="professional.darkTeal" fontWeight="medium">
                        💡 Emergency appointments available on request
                      </ChakraText>
                    </Box>
                  </VStack>
                </Box>
              </VStack>

              {/* Right Side - Location & Map */}
              <VStack spacing={6} align="stretch">
                {/* Address Card */}
                <Box 
                  p={6} 
                  bg="white" 
                  borderRadius="xl" 
                  border="2px solid" 
                  borderColor="professional.lightTeal"
                  boxShadow="lg"
                  _hover={{ boxShadow: 'xl', transform: 'translateY(-2px)' }}
                  transition="all 0.3s"
                >
                  <Heading as="h3" size="md" mb={4} color="professional.darkTeal" display="flex" alignItems="center" gap={2}>
                    <FaMapMarkerAlt /> Our Location
                  </Heading>
                  <VStack align="stretch" spacing={4}>
                    <ChakraText color="professional.gray" fontSize="md" lineHeight="tall">
                      123 Dental Street<br />
                      Health City, HC 12345<br />
                      United States
                    </ChakraText>
                    <Button
                      leftIcon={<FaDirections />}
                      colorScheme="teal"
                      variant="gradient"
                      size="md"
                      onClick={() => {
                        // Open Google Maps with directions
                        const address = encodeURIComponent('123 Dental Street, Health City, HC 12345')
                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${address}`, '_blank')
                      }}
                      _hover={{ transform: 'translateY(-2px)', boxShadow: 'xl' }}
                      transition="all 0.3s"
                    >
                      Get Directions
                    </Button>
                  </VStack>
                </Box>

                {/* Interactive Map */}
                <Box 
                  borderRadius="xl" 
                  overflow="hidden"
                  border="2px solid" 
                  borderColor="professional.lightTeal"
                  boxShadow="lg"
                  _hover={{ boxShadow: 'xl' }}
                  transition="all 0.3s"
                  cursor="pointer"
                  onClick={() => {
                    // Open Google Maps in new tab
                    const address = encodeURIComponent('123 Dental Street, Health City, HC 12345')
                    window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank')
                  }}
                  position="relative"
                >
                  {/* Map Placeholder with Clickable Overlay */}
                  <Box
                    bg="professional.lightTeal"
                    h="300px"
                    position="relative"
                    bgImage="url('https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+14b8a6(123,456)/123,456,14,0/600x300?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw')"
                    bgSize="cover"
                    bgPosition="center"
                  >
                    {/* Fallback if map doesn't load */}
                    <Box
                      position="absolute"
                      inset={0}
                      bg="linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      flexDirection="column"
                      gap={3}
                      opacity={0.95}
                    >
                      <FaMapMarkerAlt size={48} color="white" />
                      <VStack spacing={1}>
                        <ChakraText color="white" fontWeight="bold" fontSize="lg">
                          Click to View on Maps
                        </ChakraText>
                        <ChakraText color="white" fontSize="sm" opacity={0.9}>
                          123 Dental Street, Health City
                        </ChakraText>
                      </VStack>
                    </Box>
                    
                    {/* Click Overlay */}
                    <Box
                      position="absolute"
                      inset={0}
                      bg="transparent"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      _hover={{ bg: 'rgba(0,0,0,0.1)' }}
                      transition="all 0.3s"
                    >
                      <Box
                        bg="white"
                        px={6}
                        py={3}
                        borderRadius="full"
                        boxShadow="xl"
                        display="flex"
                        alignItems="center"
                        gap={2}
                        fontWeight="semibold"
                        color="professional.darkTeal"
                        _hover={{ transform: 'scale(1.05)' }}
                        transition="all 0.3s"
                      >
                        <FaDirections />
                        <ChakraText>Click to Open Maps</ChakraText>
                      </Box>
                    </Box>
                  </Box>
                </Box>

                {/* Quick Actions */}
                <SimpleGrid columns={2} spacing={4}>
                  <Button
                    leftIcon={<FaPhone />}
                    colorScheme="teal"
                    variant="outline"
                    size="md"
                    onClick={() => window.open('tel:+15551234567', '_self')}
                    _hover={{ bg: 'professional.lightTeal', transform: 'translateY(-2px)' }}
                    transition="all 0.3s"
                  >
                    Call Us
                  </Button>
                  <Button
                    leftIcon={<FaEnvelope />}
                    colorScheme="teal"
                    variant="outline"
                    size="md"
                    onClick={() => window.open('mailto:info@dentalclinic.com', '_self')}
                    _hover={{ bg: 'professional.lightTeal', transform: 'translateY(-2px)' }}
                    transition="all 0.3s"
                  >
                    Email Us
                  </Button>
                </SimpleGrid>
              </VStack>
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* CTA Section - Professional */}
      <Box 
        bgGradient="linear(135deg, professional.teal 0%, professional.darkTeal 100%)" 
        color="white" 
        py={20}
        position="relative"
        overflow="hidden"
      >
        <Container maxW="container.xl" textAlign="center" position="relative" zIndex={1}>
          <VStack spacing={8}>
            <Heading 
              as="h2" 
              size={{ base: "xl", md: "2xl", lg: "3xl" }} 
              fontWeight="bold"
              color="white"
              textShadow="0 2px 8px rgba(0,0,0,0.3)"
              letterSpacing="0.5px"
            >
              Ready to Take Care of Your Smile?
            </Heading>
            <ChakraText 
              fontSize={{ base: "lg", md: "xl", lg: "2xl" }} 
              maxW="3xl" 
              color="white"
              fontWeight="medium"
              textShadow="0 2px 6px rgba(0,0,0,0.2)"
              lineHeight="tall"
            >
              Book your appointment today and experience professional dental care. 
              We'll send you convenient SMS reminders so you never miss your visit.
            </ChakraText>
            <HStack spacing={4} flexWrap="wrap" justify="center">
              <Button 
                onClick={() => document.getElementById('book-appointment')?.scrollIntoView({ behavior: 'smooth' })}
                size="lg"
                bg="white"
                color="professional.darkTeal"
                _hover={{ bg: "professional.lightTeal", transform: "translateY(-2px)", boxShadow: "2xl" }}
                px={10}
                py={7}
                fontSize="xl"
                fontWeight="bold"
                borderRadius="full"
                boxShadow="2xl"
                letterSpacing="0.5px"
              >
                📅 Book Appointment Now
              </Button>
              {!isAuthenticated && (
                <>
                  <Button 
                    as={Link} 
                    to="/login?role=patient" 
                    size="lg"
                    bg="white"
                    color="professional.darkTeal"
                    borderWidth="2px"
                    borderColor="white"
                    fontWeight="bold"
                    _hover={{ bg: "professional.lightTeal", color: "white", transform: "translateY(-2px)", boxShadow: "xl" }}
                    px={10}
                    py={7}
                    fontSize="lg"
                    borderRadius="full"
                    boxShadow="lg"
                  >
                    Patient Login
                  </Button>
                  <Menu>
                    <MenuButton
                      as={Button}
                      size="lg"
                      bg="white"
                      color="professional.darkTeal"
                      borderWidth="2px"
                      borderColor="white"
                      fontWeight="bold"
                      _hover={{ bg: "professional.lightTeal", color: "white", transform: "translateY(-2px)", boxShadow: "xl" }}
                      px={10}
                      py={7}
                      fontSize="lg"
                      borderRadius="full"
                      rightIcon={<FaChevronDown />}
                      boxShadow="lg"
                    >
                      Staff/Admin
                    </MenuButton>
                    <MenuList bg="white" borderColor="professional.lightTeal" borderWidth="2px" boxShadow="xl">
                      <MenuItem 
                        as={Link} 
                        to="/login?role=staff" 
                        icon={<FaUserMd />}
                        bg="white"
                        color="professional.darkTeal"
                        fontWeight="medium"
                        _hover={{ bg: "professional.lightTeal", color: "professional.darkTeal" }}
                        py={3}
                      >
                        Staff Login
                      </MenuItem>
                      <MenuItem 
                        as={Link} 
                        to="/login?role=admin" 
                        icon={<FaUserShield />}
                        bg="white"
                        color="professional.darkTeal"
                        fontWeight="medium"
                        _hover={{ bg: "professional.lightTeal", color: "professional.darkTeal" }}
                        py={3}
                      >
                        Admin Login
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </>
              )}
            </HStack>
            <HStack spacing={8} mt={8} flexWrap="wrap" justify="center" fontSize="md" fontWeight="semibold">
              <ChakraText color="white" textShadow="0 2px 4px rgba(0,0,0,0.2)">✓ Secure & Compliant</ChakraText>
              <ChakraText color="white" textShadow="0 2px 4px rgba(0,0,0,0.2)">✓ Easy to Use</ChakraText>
              <ChakraText color="white" textShadow="0 2px 4px rgba(0,0,0,0.2)">✓ 24/7 Support</ChakraText>
            </HStack>
          </VStack>
        </Container>
      </Box>
    </Box>
  )
}

function FeatureCard({ 
  icon, 
  title, 
  description, 
  color = "professional.teal" 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  color?: string;
}) {
  return (
    <Box
      p={8}
      borderRadius="2xl"
      bg="white"
      boxShadow="lg"
      textAlign="center"
      border="2px solid"
      borderColor="professional.lightTeal"
      _hover={{ 
        boxShadow: '2xl', 
        transform: 'translateY(-8px)', 
        transition: 'all 0.3s',
        borderColor: color,
      }}
      h="100%"
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
    >
      <Box color={color} mb={6} display="flex" justifyContent="center">
        {icon}
      </Box>
      <Heading as="h3" size="md" mb={3} color="professional.darkTeal" fontWeight="bold">
        {title}
      </Heading>
      <ChakraText color="professional.gray" lineHeight="tall">{description}</ChakraText>
    </Box>
  )
}

function BenefitCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <Box
      p={8}
      borderRadius="xl"
      bg="white"
      boxShadow="md"
      textAlign="center"
      _hover={{ 
        boxShadow: 'xl', 
        transform: 'translateY(-5px)', 
        transition: 'all 0.3s',
      }}
      borderTop="4px solid"
      borderColor="professional.teal"
    >
      <Box color="professional.teal" mb={4} display="flex" justifyContent="center">
        {icon}
      </Box>
      <Heading as="h3" size="md" mb={3} color="professional.darkTeal" fontWeight="bold">
        {title}
      </Heading>
      <ChakraText color="professional.gray" lineHeight="tall">{description}</ChakraText>
    </Box>
  )
}

