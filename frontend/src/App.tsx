import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AppLayout from '@/components/layout/AppLayout'
import Dashboard from '@/pages/Dashboard'
import NewExpense from '@/pages/NewExpense'
import History from '@/pages/History'
import Deposits from '@/pages/Deposits'
import MemberDetail from '@/pages/MemberDetail'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="expenses/new" element={<NewExpense />} />
            <Route path="history" element={<History />} />
            <Route path="deposits" element={<Deposits />} />
            <Route path="members/:id" element={<MemberDetail />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
