import React from 'react'
import { Box, VStack, Text } from '@chakra-ui/react'
import { keyframes } from '@emotion/react'

const spin = keyframes`
  0% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.1); }
  100% { transform: rotate(360deg) scale(1); }
`

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
`

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`

const dentalEmojis = ['🦷', '😁', '✨', '💫', '🌟']

export default function LoadingScreen() {
  const [currentEmoji, setCurrentEmoji] = React.useState(0)

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentEmoji((prev) => (prev + 1) % dentalEmojis.length)
    }, 500)
    return () => clearInterval(interval)
  }, [])

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bgGradient="linear(135deg, #14b8a6 0%, #0d9488 50%, #0f766e 100%)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      zIndex={9999}
    >
      <VStack spacing={8} textAlign="center">
        {/* Animated Dental Emoji */}
        <Box
          fontSize="120px"
          animation={`${spin} 2s ease-in-out infinite, ${float} 3s ease-in-out infinite`}
          filter="drop-shadow(0 10px 20px rgba(0,0,0,0.3))"
        >
          {dentalEmojis[currentEmoji]}
        </Box>

        {/* Loading Text with Animation */}
        <VStack spacing={4}>
          <Text
            fontSize={{ base: '2xl', md: '3xl', lg: '4xl' }}
            fontWeight="bold"
            color="white"
            textShadow="2px 2px 4px rgba(0,0,0,0.3)"
            animation={`${pulse} 2s ease-in-out infinite`}
          >
            Dental Clinic System
          </Text>
          <Text
            fontSize={{ base: 'lg', md: 'xl' }}
            color="white"
            opacity={0.9}
            fontWeight="medium"
            animation={`${pulse} 2s ease-in-out infinite 0.5s`}
          >
            Loading your smile... ✨
          </Text>
        </VStack>

        {/* Animated Dots */}
        <Box display="flex" gap={2} alignItems="center">
          {[0, 1, 2].map((i) => (
            <Box
              key={i}
              w="12px"
              h="12px"
              borderRadius="full"
              bg="white"
              animation={`${pulse} 1.5s ease-in-out infinite`}
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </Box>

        {/* Decorative Elements */}
        <Box position="absolute" top="20%" left="10%" fontSize="40px" opacity={0.3} animation={`${float} 4s ease-in-out infinite`}>
          🦷
        </Box>
        <Box position="absolute" top="30%" right="15%" fontSize="50px" opacity={0.3} animation={`${float} 5s ease-in-out infinite 1s`}>
          😁
        </Box>
        <Box position="absolute" bottom="20%" left="15%" fontSize="45px" opacity={0.3} animation={`${float} 4.5s ease-in-out infinite 0.5s`}>
          ✨
        </Box>
        <Box position="absolute" bottom="25%" right="10%" fontSize="40px" opacity={0.3} animation={`${float} 5.5s ease-in-out infinite 1.5s`}>
          💫
        </Box>
      </VStack>
    </Box>
  )
}

