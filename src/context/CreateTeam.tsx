import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type CreateTeamState = {
  eventId: number | null
  title: string
  promotionText: string
  recruitmentStartDate: string
  recruitmentEndDate: string
  role: string[] // roles -> role 로 변경
  capacity: number // headcount -> capacity 로 변경
  requiredSkills: string[]
  characteristic: string
}

type CreateTeamContextType = CreateTeamState & {
  setField: <K extends keyof CreateTeamState>(key: K, value: CreateTeamState[K]) => void
  setCapacity: (value: number) => void // setHeadcount -> setCapacity로 변경
  reset: () => void
}

const initialState: CreateTeamState = {
  eventId: null,
  title: '',
  promotionText: '',
  recruitmentStartDate: '',
  recruitmentEndDate: '',
  role: [],
  capacity: 1,
  requiredSkills: [],
  characteristic: '',
}

const STORAGE_KEY = 'create-team-storage'
const CreateTeamContext = createContext<CreateTeamContextType | null>(null)

export function CreateTeamProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CreateTeamState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? { ...initialState, ...JSON.parse(saved) } : initialState
    } catch {
      return initialState
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const setField: CreateTeamContextType['setField'] = (key, value) => {
    setState((prev) => ({ ...prev, [key]: value }))
  }

  const setCapacity = (value: number) => {
    setState((prev) => ({ ...prev, capacity: Math.max(1, value) }))
  }

  const reset = () => setState(initialState)

  return (
    <CreateTeamContext.Provider value={{ ...state, setField, setCapacity, reset }}>
      {children}
    </CreateTeamContext.Provider>
  )
}

export function useCreateTeamStore() {
  const ctx = useContext(CreateTeamContext)
  if (!ctx) throw new Error('Provider 밖에서 사용됨')
  return ctx
}