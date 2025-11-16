import { extendTheme, type ThemeConfig } from '@chakra-ui/react'

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
}

const theme = extendTheme({
  config,
  colors: {
    dental: {
      50: '#f0fdfa',
      100: '#ccfbf1',
      200: '#99f6e4',
      300: '#5eead4',
      400: '#2dd4bf',
      500: '#14b8a6', // Primary teal - professional dental color
      600: '#0d9488',
      700: '#0f766e',
      800: '#115e59',
      900: '#134e4a',
    },
    accent: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
    professional: {
      white: '#ffffff',
      lightGray: '#f8f9fa',
      gray: '#6c757d',
      darkGray: '#343a40',
      teal: '#14b8a6',
      darkTeal: '#0d9488',
      lightTeal: '#ccfbf1',
    },
    gradient: {
      primary: 'linear(135deg, #14b8a6 0%, #0d9488 50%, #0f766e 100%)',
      secondary: 'linear(135deg, #2dd4bf 0%, #14b8a6 100%)',
      accent: 'linear(135deg, #5eead4 0%, #2dd4bf 100%)',
      dark: 'linear(135deg, #0f766e 0%, #115e59 100%)',
    },
  },
  fonts: {
    heading: `'Poppins', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif`,
    body: `'Inter', 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif`,
  },
  styles: {
    global: (props: any) => ({
      body: {
        bg: props.colorMode === 'dark' ? '#1a202c' : '#ffffff',
        color: props.colorMode === 'dark' ? '#f7fafc' : '#1a202c',
        transition: 'background-color 0.3s, color 0.3s',
      },
    }),
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'teal',
      },
      variants: {
        gradient: {
          bgGradient: 'linear(135deg, #14b8a6 0%, #0d9488 100%)',
          color: 'white',
          _hover: {
            bgGradient: 'linear(135deg, #0d9488 0%, #0f766e 100%)',
            transform: 'translateY(-2px)',
            boxShadow: 'xl',
          },
          transition: 'all 0.3s',
        },
        glass: {
          bg: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: 'white',
          _hover: {
            bg: 'rgba(255, 255, 255, 0.2)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    Card: {
      baseStyle: {
        container: {
          transition: 'all 0.3s ease',
        },
      },
      variants: {
        glass: {
          container: {
            bg: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
          },
        },
        gradient: {
          container: {
            bgGradient: 'linear(135deg, #14b8a6 0%, #0d9488 100%)',
            color: 'white',
          },
        },
      },
    },
  },
  shadows: {
    'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    'glow': '0 0 20px rgba(20, 184, 166, 0.3)',
  },
})

export default theme

