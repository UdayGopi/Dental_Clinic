import { useEffect, useState } from 'react'
import {
  Container,
  Heading,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Card,
  CardBody,
  VStack,
  Text as ChakraText,
  Box,
} from '@chakra-ui/react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import api from '../services/api'

export default function Analytics() {
  const [metrics, setMetrics] = useState({
    total: 5,
    sent: 2,
    delivered: 2,
    failed: 0,
    pending: 1,
    delivery_rate: 80,
    failure_rate: 0,
  })
  const [optOutRate, setOptOutRate] = useState(2.5)
  const [recallEffectiveness, setRecallEffectiveness] = useState({
    total_recalls: 45,
    appointments_booked: 12,
    effectiveness_rate: 26.7,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const [metricsRes, optOutRes, recallRes] = await Promise.all([
        api.get('/metrics/messages').catch(() => ({ data: null })),
        api.get('/metrics/opt-out-rate').catch(() => ({ data: null })),
        api.get('/metrics/recall-effectiveness').catch(() => ({ data: null })),
      ])
      
      // Use API data if available
      if (metricsRes.data && Object.keys(metricsRes.data).length > 0 && metricsRes.data.total > 0) {
        setMetrics(metricsRes.data)
      } else {
        setMetrics({
          total: 0,
          sent: 0,
          delivered: 0,
          failed: 0,
          pending: 0,
          delivery_rate: 0,
          failure_rate: 0,
        })
      }
      
      setOptOutRate(optOutRes.data?.opt_out_rate || 0)
      
      if (recallRes.data && Object.keys(recallRes.data).length > 0) {
        setRecallEffectiveness(recallRes.data)
      } else {
        setRecallEffectiveness({
          total_recalls: 0,
          appointments_booked: 0,
          effectiveness_rate: 0,
        })
      }
    } catch (error: any) {
      console.error('Error fetching analytics:', error)
      setMetrics({
        total: 0,
        sent: 0,
        delivered: 0,
        failed: 0,
        pending: 0,
        delivery_rate: 0,
        failure_rate: 0,
      })
      setOptOutRate(0)
      setRecallEffectiveness({
        total_recalls: 0,
        appointments_booked: 0,
        effectiveness_rate: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  // Ensure chart data always has values for visualization
  const chartData = [
    { name: 'Sent', value: Math.max(metrics.sent || 0, 0) },
    { name: 'Delivered', value: Math.max(metrics.delivered || 0, 0) },
    { name: 'Failed', value: Math.max(metrics.failed || 0, 0) },
    { name: 'Pending', value: Math.max(metrics.pending || 0, 0) },
  ]

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
            Analytics Dashboard
          </Heading>
          <ChakraText color="professional.gray" fontSize="lg">
            Track message performance, patient engagement, and campaign effectiveness
          </ChakraText>
        </Box>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <Card 
            bg="white" 
            boxShadow="lg" 
            borderRadius="xl"
            border="1px solid"
            borderColor="professional.lightTeal"
            _hover={{ boxShadow: 'xl', transform: 'translateY(-2px)' }}
            transition="all 0.3s"
          >
            <CardBody>
              <Stat>
                <StatLabel color="professional.gray" fontWeight="medium">Total Messages</StatLabel>
                <StatNumber color="professional.darkTeal" fontSize="3xl" fontWeight="bold">{metrics.total}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card 
            bg="white" 
            boxShadow="lg" 
            borderRadius="xl"
            border="1px solid"
            borderColor="professional.lightTeal"
            _hover={{ boxShadow: 'xl', transform: 'translateY(-2px)' }}
            transition="all 0.3s"
          >
            <CardBody>
              <Stat>
                <StatLabel color="professional.gray" fontWeight="medium">Delivery Rate</StatLabel>
                <StatNumber color="professional.darkTeal" fontSize="3xl" fontWeight="bold">{metrics.delivery_rate.toFixed(1)}%</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card 
            bg="white" 
            boxShadow="lg" 
            borderRadius="xl"
            border="1px solid"
            borderColor="professional.lightTeal"
            _hover={{ boxShadow: 'xl', transform: 'translateY(-2px)' }}
            transition="all 0.3s"
          >
            <CardBody>
              <Stat>
                <StatLabel color="professional.gray" fontWeight="medium">Opt-Out Rate</StatLabel>
                <StatNumber color="professional.darkTeal" fontSize="3xl" fontWeight="bold">{optOutRate.toFixed(1)}%</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card 
            bg="white" 
            boxShadow="lg" 
            borderRadius="xl"
            border="1px solid"
            borderColor="professional.lightTeal"
            _hover={{ boxShadow: 'xl', transform: 'translateY(-2px)' }}
            transition="all 0.3s"
          >
            <CardBody>
              <Stat>
                <StatLabel color="professional.gray" fontWeight="medium">Recall Effectiveness</StatLabel>
                <StatNumber color="professional.darkTeal" fontSize="3xl" fontWeight="bold">{recallEffectiveness.effectiveness_rate.toFixed(1)}%</StatNumber>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          <Card 
            bg="white" 
            boxShadow="lg" 
            borderRadius="xl"
            border="1px solid"
            borderColor="professional.lightTeal"
          >
            <CardBody>
              <Heading size="md" mb={4} color="professional.darkTeal">
                Message Status Distribution
              </Heading>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={chartData} 
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  barSize={60}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#4a5568"
                    tick={{ fill: '#4a5568', fontSize: 12, fontWeight: 'medium' }}
                    axisLine={{ stroke: '#4a5568' }}
                  />
                  <YAxis 
                    stroke="#4a5568"
                    tick={{ fill: '#4a5568', fontSize: 12 }}
                    axisLine={{ stroke: '#4a5568' }}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(20, 184, 166, 0.1)' }}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '10px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                    formatter={(value: any) => [value, 'Messages']}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="circle"
                  />
                  <Bar 
                    dataKey="value" 
                    name="Messages"
                    radius={[8, 8, 0, 0]}
                  >
                    {chartData.map((entry, index) => {
                      let color = '#14b8a6' // Sent - Teal
                      if (entry.name === 'Delivered') color = '#0d9488' // Dark Teal
                      if (entry.name === 'Failed') color = '#ef4444' // Red
                      if (entry.name === 'Pending') color = '#facc15' // Yellow
                      return <Cell key={`cell-${index}`} fill={color} />
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>

          <Card 
            bg="white" 
            boxShadow="lg" 
            borderRadius="xl"
            border="1px solid"
            borderColor="professional.lightTeal"
          >
            <CardBody>
              <Heading size="md" mb={4} color="professional.darkTeal">
                Recall Reminder Stats
              </Heading>
              <VStack align="stretch" spacing={4}>
                <Box>
                <ChakraText fontSize="sm" color="gray.600" mb={2}>
                  Total Recalls Sent
                </ChakraText>
                <ChakraText fontSize="2xl" fontWeight="bold" color="professional.darkTeal">
                  {recallEffectiveness.total_recalls}
                </ChakraText>
              </Box>
              <Box>
                <ChakraText fontSize="sm" color="gray.600" mb={2}>
                  Appointments Booked
                </ChakraText>
                <ChakraText fontSize="2xl" fontWeight="bold" color="professional.teal">
                  {recallEffectiveness.appointments_booked}
                </ChakraText>
              </Box>
              <Box>
                <ChakraText fontSize="sm" color="gray.600" mb={2}>
                  Effectiveness Rate
                </ChakraText>
                <ChakraText fontSize="2xl" fontWeight="bold" color="green.500">
                  {recallEffectiveness.effectiveness_rate.toFixed(1)}%
                </ChakraText>
                </Box>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>
      </VStack>
    </Container>
  )
}

