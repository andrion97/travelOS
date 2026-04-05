import { create } from 'zustand'

export const useTripStore = create((set, get) => ({
  // Current trip
  trip: null,
  member: null,         // current user's trip_member record
  allMembers: [],
  preferences: [],
  destinations: [],
  votes: [],
  itinerary: [],
  tasks: [],
  expenses: [],

  setTrip: (trip) => set({ trip }),
  setMember: (member) => set({ member }),
  setAllMembers: (members) => set({ allMembers: members }),
  setPreferences: (preferences) => set({ preferences }),
  setDestinations: (destinations) => set({ destinations }),
  setVotes: (votes) => set({ votes }),
  setItinerary: (itinerary) => set({ itinerary }),
  setTasks: (tasks) => set({ tasks }),
  setExpenses: (expenses) => set({ expenses }),

  // Derived helpers
  myPreferences: () => {
    const { preferences, member } = get()
    return preferences.find(p => p.member_id === member?.id)
  },
  myVote: () => {
    const { votes, member } = get()
    return votes.find(v => v.member_id === member?.id)
  },
  hasVoted: () => !!get().myVote(),
  hasSubmittedPreferences: () => !!get().myPreferences(),

  // Phase helpers
  phaseIndex: () => {
    const phases = ['onboarding', 'destination', 'dates_budget', 'itinerary', 'on_trip', 'completed']
    return phases.indexOf(get().trip?.phase || 'onboarding')
  },

  reset: () => set({
    trip: null, member: null, allMembers: [],
    preferences: [], destinations: [], votes: [],
    itinerary: [], tasks: [], expenses: []
  })
}))
