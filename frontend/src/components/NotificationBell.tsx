import { IconButton, Badge, Menu, MenuButton, MenuList, MenuItem, VStack, Text, Box, HStack, Avatar } from '@chakra-ui/react'
import { FaBell } from 'react-icons/fa'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface Notification {
  id: string
  message: string
  time: string
  type: 'success' | 'info' | 'warning' | 'error'
  read: boolean
  role?: 'patient' | 'staff' | 'admin' | 'all' // Role filter for notifications
}

export default function NotificationBell() {
  const { user } = useAuth()
  const userRole = user?.role || 'patient'

  // All notifications (separated by role)
  const allNotifications: Notification[] = [
    // Patient notifications
    {
      id: 'p1',
      message: 'Your appointment reminder: Visit scheduled for tomorrow at 10:00 AM',
      time: '5 min ago',
      type: 'info',
      read: false,
      role: 'patient',
    },
    {
      id: 'p2',
      message: 'Thank you for your visit! We hope to see you again soon.',
      time: '2 hours ago',
      type: 'success',
      read: false,
      role: 'patient',
    },
    {
      id: 'p3',
      message: 'Your follow-up appointment is due in 3 days',
      time: '1 day ago',
      type: 'info',
      read: true,
      role: 'patient',
    },
    // Staff/Admin notifications
    {
      id: 's1',
      message: 'New appointment scheduled for tomorrow',
      time: '5 min ago',
      type: 'info',
      read: false,
      role: 'staff',
    },
    {
      id: 's2',
      message: 'Message sent successfully to 5 patients',
      time: '1 hour ago',
      type: 'success',
      read: false,
      role: 'staff',
    },
    {
      id: 's3',
      message: 'Reminder sent to John Doe',
      time: '2 hours ago',
      type: 'info',
      read: true,
      role: 'staff',
    },
    {
      id: 'a1',
      message: 'System backup completed successfully',
      time: '3 hours ago',
      type: 'success',
      read: false,
      role: 'admin',
    },
    {
      id: 'a2',
      message: 'New admin account created',
      time: '5 hours ago',
      type: 'info',
      read: false,
      role: 'admin',
    },
    // All role notifications
    {
      id: 'all1',
      message: 'System maintenance scheduled for tonight',
      time: '1 day ago',
      type: 'warning',
      read: true,
      role: 'all',
    },
  ]

  // Filter notifications based on user role
  const getFilteredNotifications = (): Notification[] => {
    if (userRole === 'patient') {
      return allNotifications.filter(n => n.role === 'patient' || n.role === 'all')
    } else if (userRole === 'staff') {
      return allNotifications.filter(n => n.role === 'staff' || n.role === 'all')
    } else if (userRole === 'admin') {
      return allNotifications.filter(n => n.role === 'admin' || n.role === 'staff' || n.role === 'all')
    }
    return []
  }

  const [notifications] = useState<Notification[]>(getFilteredNotifications())
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <Menu>
      <MenuButton
        as={IconButton}
        aria-label="Notifications"
        icon={
          <Box position="relative">
            <FaBell />
            {unreadCount > 0 && (
              <Badge
                position="absolute"
                top="-2"
                right="-2"
                bg="red.500"
                color="white"
                borderRadius="full"
                fontSize="xs"
                minW="20px"
                h="20px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                animation="pulse 2s infinite"
              >
                {unreadCount}
              </Badge>
            )}
          </Box>
        }
        variant="ghost"
        colorScheme="teal"
        size="md"
        _hover={{
          bg: 'gray.100',
          transform: 'scale(1.1)',
        }}
        transition="all 0.2s"
      />
      <MenuList maxW="400px" p={0}>
        <Box p={3} borderBottom="1px solid" borderColor="gray.200">
          <Text fontWeight="bold" fontSize="lg">
            Notifications
          </Text>
        </Box>
        <VStack spacing={0} align="stretch" maxH="400px" overflowY="auto">
          {notifications.length === 0 ? (
            <Box p={4} textAlign="center">
              <Text color="gray.500">No notifications</Text>
            </Box>
          ) : (
            notifications.map((notification) => (
              <MenuItem
                key={notification.id}
                p={3}
                _hover={{ bg: 'gray.50' }}
                borderBottom="1px solid"
                borderColor="gray.100"
              >
                <HStack spacing={3} w="100%">
                  <Avatar
                    size="sm"
                    bg={
                      notification.type === 'success'
                        ? 'green.500'
                        : notification.type === 'error'
                        ? 'red.500'
                        : notification.type === 'warning'
                        ? 'yellow.500'
                        : 'blue.500'
                    }
                    icon={<FaBell />}
                  />
                  <VStack align="start" spacing={0} flex={1}>
                    <Text fontSize="sm" fontWeight={notification.read ? 'normal' : 'semibold'}>
                      {notification.message}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {notification.time}
                    </Text>
                  </VStack>
                  {!notification.read && (
                    <Box w="8px" h="8px" bg="blue.500" borderRadius="full" />
                  )}
                </HStack>
              </MenuItem>
            ))
          )}
        </VStack>
        {notifications.length > 0 && (
          <Box p={3} borderTop="1px solid" borderColor="gray.200">
            <Text fontSize="sm" color="teal.500" textAlign="center" cursor="pointer" _hover={{ textDecoration: 'underline' }}>
              Mark all as read
            </Text>
          </Box>
        )}
      </MenuList>
    </Menu>
  )
}

