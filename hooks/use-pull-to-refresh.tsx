import { useState, useCallback } from 'react'
import { RefreshControl } from 'react-native'

/**
 * usePullToRefresh
 * 
 * Usage:
 *   const { refreshing, refreshControl } = usePullToRefresh(loadData)
 *   <ScrollView refreshControl={refreshControl}>...</ScrollView>
 */
export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setRefreshing(false)
    }
  }, [onRefresh])

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={handleRefresh}
      tintColor="#4f46e5"
      colors={['#4f46e5']}
    />
  )

  return { refreshing, refreshControl }
}
