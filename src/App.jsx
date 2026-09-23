import { useState } from 'react'
import { StoreProvider, useStore } from './lib/store'
import { Sidebar, TopBar } from './components/Shell'
import AgentHome from './pages/AgentHome'
import CoachHome from './pages/CoachHome'

function Layout() {
  const { state } = useStore()
  const [openAgent, setOpenAgent] = useState(null)
  return (
    <div className="h-full flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          {state.persona === 'agent' ? <AgentHome key={state.agentId} /> : <CoachHome openAgent={openAgent} setOpenAgent={setOpenAgent} />}
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Layout />
    </StoreProvider>
  )
}
