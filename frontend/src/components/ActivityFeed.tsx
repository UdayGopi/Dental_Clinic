import { VStack, Box, Text, HStack, Avatar, Badge, Divider } from '@chakra-ui/react'
import { FaUser, FaCalendar, FaEnvelope, FaCheckCircle, FaClock } from 'react-icons/fa'

interface Activity {
  id: string
  type: 'appointment' | 'message' | 'patient' | 'system'
  action: string
  user: string
  time: string
  status?: 'success' | 'pending' | 'failed'
}

interface ActivityFeedProps {
  activities?: Activity[]
}

const defaultActivities: Activity[] = [
  {
    id: '1',
    type: 'appointment',
    action: 'New appointment scheduled',
    user: 'Dr. Smith',
    time: '5 minutes ago',
    status: 'success',
  },
  {
    id: '2',
    type: 'message',
    action: 'SMS sent to 5 patients',
    user: 'System',
    time: '1 hour ago',
    status: 'success',
  },
  {
    id: '3',
    type: 'patient',
    action: 'New patient registered',
    user: 'John Doe',
    time: '2 hours ago',
    status: 'success',
  },
  {
    id: '4',
    type: 'message',
    action: 'Reminder scheduled',
    user: 'System',
    time: '3 hours ago',
    status: 'pending',
  },
]

const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'appointment':
      return <FaCalendar />
    case 'message':
      return <FaEnvelope />
    case 'patient':
      return <FaUser />
    default:
      return <FaCheckCircle />
  }
}

const getActivityColor = (type: Activity['type']) => {
  switch (type) {
    case 'appointment':
      return 'blue.500'
    case 'message':
      return 'teal.500'
    case 'patient':
      return 'green.500'
    default:
      return 'gray.500'
  }
}

const getStatusBadge = (status?: Activity['status']) => {
  if (!status) return null
  
  switch (status) {
    case 'success':
      return <Badge colorScheme="green" size="sm">Success</Badge>
    case 'pending':
      return <Badge colorScheme="yellow" size="sm">Pending</Badge>
    case 'failed':
      return <Badge colorScheme="red" size="sm">Failed</Badge>
  }
}

export default function ActivityFeed({ activities = defaultActivities }: ActivityFeedProps) {
  return (
    <VStack align="stretch" spacing={0}>
      {activities.map((activity, index) => (
        <Box key={activity.id}>
          <HStack spacing={4} py={3} align="start">
            <Avatar
              size="sm"
              bg={getActivityColor(activity.type)}
              icon={getActivityIcon(activity.type)}
            />
            <VStack align="start" spacing={1} flex={1}>
              <HStack spacing={2}>
                <Text fontSize="sm" fontWeight="medium">
                  {activity.action}
                </Text>
                {getStatusBadge(activity.status)}
              </HStack>
              <HStack spacing={2} fontSize="xs" color="gray.500">
                <Text>{activity.user}</Text>
                <Text>•</Text>
                <Text>{activity.time}</Text>
              </HStack>
            </VStack>
          </HStack>
          {index < activities.length - 1 && <Divider />}
        </Box>
      ))}
    </VStack>
  )
}

