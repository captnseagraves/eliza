import { useQuery } from "@tanstack/react-query"

interface Agent {
  id: string
  name: string
}

interface AgentsResponse {
  agents: Agent[]
}

export function useFirstAgent() {
  const { data: agentId, isLoading, error } = useQuery({
    queryKey: ["firstAgent"],
    queryFn: async () => {
      const res = await fetch("/api/agents")
      if (!res.ok) {
        throw new Error("Failed to fetch agents")
      }
      const data = await res.json() as AgentsResponse
      if (!data.agents?.length) {
        throw new Error("No agents available")
      }
      return data.agents[0].id
    },
  })

  return { agentId, isLoading, error }
}
