import { IconButton, useColorMode, Tooltip } from '@chakra-ui/react'
import { FaMoon, FaSun } from 'react-icons/fa'

export default function ThemeToggle() {
  const { colorMode, toggleColorMode } = useColorMode()

  return (
    <Tooltip label={colorMode === 'light' ? 'Dark Mode' : 'Light Mode'} placement="bottom">
      <IconButton
        aria-label="Toggle theme"
        icon={colorMode === 'light' ? <FaMoon /> : <FaSun />}
        onClick={toggleColorMode}
        variant="ghost"
        colorScheme="teal"
        size="md"
        borderRadius="full"
        _hover={{
          bg: colorMode === 'light' ? 'gray.100' : 'gray.700',
          transform: 'scale(1.1)',
        }}
        transition="all 0.2s"
      />
    </Tooltip>
  )
}

