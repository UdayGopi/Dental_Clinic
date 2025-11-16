import { InputGroup, InputLeftElement, Input, Box } from '@chakra-ui/react'
import { FaSearch } from 'react-icons/fa'

interface SearchBarProps {
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  onSearch?: (value: string) => void
}

export default function SearchBar({ 
  placeholder = "Search...", 
  value = "",
  onChange,
  onSearch 
}: SearchBarProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange?.(newValue)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch?.(value)
    }
  }

  return (
    <Box w="100%" maxW="400px">
      <InputGroup>
        <InputLeftElement pointerEvents="none" color="gray.400">
          <FaSearch />
        </InputLeftElement>
        <Input
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          borderRadius="full"
          bg="white"
          border="2px solid"
          borderColor="gray.200"
          _hover={{
            borderColor: "teal.300",
          }}
          _focus={{
            borderColor: "teal.500",
            boxShadow: "0 0 0 1px teal.500",
          }}
          transition="all 0.2s"
        />
      </InputGroup>
    </Box>
  )
}

