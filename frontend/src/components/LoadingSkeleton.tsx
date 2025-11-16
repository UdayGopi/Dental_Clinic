import { Box, Skeleton, SkeletonCircle, SkeletonText, VStack, HStack } from '@chakra-ui/react'

interface LoadingSkeletonProps {
  type?: 'card' | 'table' | 'list' | 'stat'
  count?: number
}

export function CardSkeleton() {
  return (
    <Box p={6} bg="white" borderRadius="xl" boxShadow="md">
      <Skeleton height="20px" mb={4} />
      <SkeletonText mt="4" noOfLines={3} spacing="4" />
    </Box>
  )
}

export function TableSkeleton() {
  return (
    <Box>
      <Skeleton height="40px" mb={2} />
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} height="50px" mb={2} />
      ))}
    </Box>
  )
}

export function ListSkeleton() {
  return (
    <VStack spacing={4} align="stretch">
      {[1, 2, 3, 4].map((i) => (
        <HStack key={i} spacing={4}>
          <SkeletonCircle size="12" />
          <VStack align="start" spacing={2} flex={1}>
            <Skeleton height="16px" width="60%" />
            <Skeleton height="12px" width="40%" />
          </VStack>
        </HStack>
      ))}
    </VStack>
  )
}

export function StatSkeleton() {
  return (
    <Box p={6} bg="white" borderRadius="xl" boxShadow="md">
      <SkeletonCircle size="10" mb={4} />
      <Skeleton height="16px" width="60%" mb={2} />
      <Skeleton height="32px" width="40%" />
    </Box>
  )
}

export default function LoadingSkeleton({ type = 'card', count = 1 }: LoadingSkeletonProps) {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return <CardSkeleton />
      case 'table':
        return <TableSkeleton />
      case 'list':
        return <ListSkeleton />
      case 'stat':
        return <StatSkeleton />
      default:
        return <CardSkeleton />
    }
  }

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Box key={i}>{renderSkeleton()}</Box>
      ))}
    </>
  )
}

