// ─── Demo Data Seeder ─────────────────────────────────────────────────────
// Seeds a fully realistic Goa trip demo into localStorage.
// The current user is set as Rahul (organizer) by default.
// All 13 MVP features are represented in the demo data.

import { saveTable, saveStore, getStore, genId } from './supabase.js'

export const DEMO_TRIP_ID = 'demo-trip-001'
export const DEMO_USER_ID = 'demo-user-rahul'

export const DEMO_MEMBERS = {
  rahul:  { id: 'dm-rahul',  name: 'Rahul',  role: 'organizer', user_id: DEMO_USER_ID },
  priya:  { id: 'dm-priya',  name: 'Priya',  role: 'member',    user_id: 'demo-user-priya'  },
  arjun:  { id: 'dm-arjun',  name: 'Arjun',  role: 'member',    user_id: 'demo-user-arjun'  },
  sneha:  { id: 'dm-sneha',  name: 'Sneha',  role: 'member',    user_id: 'demo-user-sneha'  },
  mohit:  { id: 'dm-mohit',  name: 'Mohit',  role: 'member',    user_id: 'demo-user-mohit'  },
}

export function seedDemoData() {
  const store = getStore()

  // ── Trip ──────────────────────────────────────────────────────────────────
  store.trips = [{
    id: DEMO_TRIP_ID,
    name: 'Goa Squad 2026 🌊',
    approximate_month: 'May 2026',
    note: 'Finally happening! Planning for long weekend, aiming for ₹8-12k/person',
    organizer_id: DEMO_USER_ID,
    invite_code: 'demo1234',
    phase: 'itinerary',           // Show maximum features
    destination: 'Goa',
    date_start: '2026-05-22',
    date_end: '2026-05-25',
    budget_min: 8000,
    budget_max: 12000,
    vote_deadline: null,
    created_at: new Date().toISOString(),
  }]

  // ── Members ───────────────────────────────────────────────────────────────
  store.trip_members = Object.values(DEMO_MEMBERS).map(m => ({
    ...m,
    trip_id: DEMO_TRIP_ID,
    email: null,
    session_token: genId(),
    joined_at: new Date().toISOString(),
  }))

  // ── Preferences ───────────────────────────────────────────────────────────
  store.preferences = [
    { id: genId(), trip_id: DEMO_TRIP_ID, member_id: 'dm-rahul',  vibe: 'chill',     budget_min: 8000,  budget_max: 12000, dietary: 'non-veg',       must_have: 'Beach access',      dealbreaker: 'No budget hotels', created_at: new Date().toISOString() },
    { id: genId(), trip_id: DEMO_TRIP_ID, member_id: 'dm-priya',  vibe: 'chill',     budget_min: 8000,  budget_max: 10000, dietary: 'veg',            must_have: 'Good vegetarian food', dealbreaker: 'Overnight buses',  created_at: new Date().toISOString() },
    { id: genId(), trip_id: DEMO_TRIP_ID, member_id: 'dm-arjun',  vibe: 'adventure', budget_min: 10000, budget_max: 15000, dietary: 'non-veg',       must_have: 'Watersports',       dealbreaker: 'No parties',       created_at: new Date().toISOString() },
    { id: genId(), trip_id: DEMO_TRIP_ID, member_id: 'dm-sneha',  vibe: 'chill',     budget_min: 7000,  budget_max: 10000, dietary: 'veg',            must_have: 'Pool at resort',    dealbreaker: 'Shared dorms',     created_at: new Date().toISOString() },
    { id: genId(), trip_id: DEMO_TRIP_ID, member_id: 'dm-mohit',  vibe: 'mix',       budget_min: 9000,  budget_max: 12000, dietary: 'no-preference', must_have: 'Good wifi',         dealbreaker: 'None really',      created_at: new Date().toISOString() },
  ]

  // ── Destination options + votes ───────────────────────────────────────────
  const goaId = genId(), coorgId = genId(), pondiId = genId()
  store.destination_options = [
    { id: goaId,   trip_id: DEMO_TRIP_ID, name: 'Goa',           note: 'Classic! Flights 90 mins, within budget, beach + nightlife', vote_count: 3, added_by: 'dm-rahul', created_at: new Date().toISOString() },
    { id: coorgId, trip_id: DEMO_TRIP_ID, name: 'Coorg',         note: 'Peaceful, coffee estates, 6hr drive from Bangalore', vote_count: 1, added_by: 'dm-rahul', created_at: new Date().toISOString() },
    { id: pondiId, trip_id: DEMO_TRIP_ID, name: 'Pondicherry',   note: 'Unique vibe, French quarter, beach, great food', vote_count: 1, added_by: 'dm-priya', created_at: new Date().toISOString() },
  ]

  store.votes = [
    { id: genId(), trip_id: DEMO_TRIP_ID, destination_id: goaId,   member_id: 'dm-rahul', created_at: new Date().toISOString() },
    { id: genId(), trip_id: DEMO_TRIP_ID, destination_id: goaId,   member_id: 'dm-arjun', created_at: new Date().toISOString() },
    { id: genId(), trip_id: DEMO_TRIP_ID, destination_id: goaId,   member_id: 'dm-mohit', created_at: new Date().toISOString() },
    { id: genId(), trip_id: DEMO_TRIP_ID, destination_id: coorgId, member_id: 'dm-priya', created_at: new Date().toISOString() },
    { id: genId(), trip_id: DEMO_TRIP_ID, destination_id: pondiId, member_id: 'dm-sneha', created_at: new Date().toISOString() },
  ]

  // ── Date availability ─────────────────────────────────────────────────────
  store.date_availability = [
    { id: genId(), trip_id: DEMO_TRIP_ID, member_id: 'dm-rahul', available_dates: ['2026-05-22','2026-05-23','2026-05-24','2026-05-25'], created_at: new Date().toISOString() },
    { id: genId(), trip_id: DEMO_TRIP_ID, member_id: 'dm-priya', available_dates: ['2026-05-22','2026-05-23','2026-05-24','2026-05-25'], created_at: new Date().toISOString() },
    { id: genId(), trip_id: DEMO_TRIP_ID, member_id: 'dm-arjun', available_dates: ['2026-05-22','2026-05-23','2026-05-24'], created_at: new Date().toISOString() },
    { id: genId(), trip_id: DEMO_TRIP_ID, member_id: 'dm-sneha', available_dates: ['2026-05-23','2026-05-24','2026-05-25'], created_at: new Date().toISOString() },
  ]

  // ── Itinerary ─────────────────────────────────────────────────────────────
  store.itinerary = [
    {
      id: genId(), trip_id: DEMO_TRIP_ID, day_number: 1, date: '2026-05-22', title: 'Arrival & North Goa Vibes',
      items: [
        { time: '10:00 AM', type: 'travel', activity: 'Fly into Dabolim Airport', location: 'Goa Airport', description: 'All 5 meeting at airport. Pre-book Gozo cab together (~₹1,200 for 5).', estimated_cost: 240, tags: ['travel', 'group'], done: true },
        { time: '12:30 PM', type: 'food', activity: 'Lunch at Fisherman\'s Wharf', location: 'Cavelossim, South Goa', description: 'Legendary riverside spot. Veg thali available. Seafood platter recommended 🦐', estimated_cost: 600, tags: ['veg-options', 'popular'], done: false },
        { time: '02:30 PM', type: 'activity', activity: 'Check-in at resort & pool time', location: 'Baga, North Goa', description: 'Book 2 rooms at Goa Marriott or Lemon Tree (~₹5,500/room/night). Pool + settle in.', estimated_cost: 2200, tags: ['stay', 'pool'], done: false },
        { time: '05:00 PM', type: 'activity', activity: 'Sunset walk at Baga Beach', location: 'Baga Beach', description: 'Classic. Get here before 5:30pm for best sunset. Tinto bar nearby for drinks.', estimated_cost: 200, tags: ['beach', 'sunset'], done: false },
        { time: '08:00 PM', type: 'food', activity: 'Dinner at Brittos', location: 'Calangute', description: 'Institution. Veg & non-veg, great cocktails, live music on weekends. Book ahead!', estimated_cost: 900, tags: ['veg-options', 'nightlife', 'group-favorite'], done: false },
      ],
      created_at: new Date().toISOString()
    },
    {
      id: genId(), trip_id: DEMO_TRIP_ID, day_number: 2, date: '2026-05-23', title: 'Watersports & South Goa',
      items: [
        { time: '08:30 AM', type: 'food', activity: 'Breakfast at the hotel', location: 'Hotel', description: 'Use hotel breakfast if included. Otherwise: Infantaria bakery (Baga) — best croissants in Goa!', estimated_cost: 300, tags: ['morning', 'veg-options'], done: false },
        { time: '10:00 AM', type: 'activity', activity: 'Watersports session at Calangute', location: 'Calangute Beach', description: 'Banana boat, parasailing, jet ski. Package deals ~₹1,800/person. Arjun\'s must-have! Book them as a group for discounts.', estimated_cost: 1800, tags: ['adventure', 'watersports', 'arjun-pick'], done: false },
        { time: '01:30 PM', type: 'food', activity: 'Lunch at Souza Lobo', location: 'Calangute', description: 'Beachside, veg & non-veg. Known for their mushroom xacuti (veg-friendly Goan curry).', estimated_cost: 550, tags: ['veg-options', 'beachside'], done: false },
        { time: '03:30 PM', type: 'activity', activity: 'Drive to Dudhsagar Falls viewpoint', location: 'Mollem, South Goa', description: '⚠️ Skip the actual trekking — crowded in May. The viewpoint is spectacular enough. Rent a Xylo (~₹2,000 for the group).', estimated_cost: 400, tags: ['scenic', 'group-activity', 'crowd-tip'], done: false },
        { time: '07:30 PM', type: 'activity', activity: 'Flea market + dinner at Thalassa', location: 'Anjuna/Vagator', description: 'Anjuna flea market until 7pm, then Thalassa Greek restaurant — Goa\'s most Instagrammed dinner spot. Call ahead for terrace seats.', estimated_cost: 1100, tags: ['shopping', 'sunset', 'popular'], done: false },
      ],
      created_at: new Date().toISOString()
    },
    {
      id: genId(), trip_id: DEMO_TRIP_ID, day_number: 3, date: '2026-05-24', title: 'Lazy Beach Day & Farewell Vibes',
      items: [
        { time: '09:00 AM', type: 'food', activity: 'Breakfast at Café Bodega', location: 'Fontainhas, Panjim', description: 'Old Goa heritage café, great for the gram. Filter coffee + eggs. Priya\'s pick.', estimated_cost: 350, tags: ['morning', 'veg-options', 'heritage'], done: false },
        { time: '11:00 AM', type: 'activity', activity: 'Free beach time at Palolem', location: 'Palolem Beach, South Goa', description: 'Quieter than North Goa. Crystal water. Sneha\'s favourite. Rent a sunbed (~₹200/person).', estimated_cost: 400, tags: ['beach', 'chill', 'sneha-pick'], done: false },
        { time: '01:30 PM', type: 'food', activity: 'Lunch at Dropadi Restaurant', location: 'Palolem', description: 'Pure veg, great thali, super affordable (~₹250/person). Perfect for Priya & Sneha!', estimated_cost: 250, tags: ['pure-veg', 'affordable'], done: false },
        { time: '04:00 PM', type: 'activity', activity: 'Head back to hotel, pack & settle', location: 'Hotel', description: 'Check-out deadline is usually 11am — negotiate a late checkout (4pm) for ~₹1,000 extra for the group.', estimated_cost: 200, tags: ['checkout'], done: false },
        { time: '06:30 PM', type: 'travel', activity: 'Transfer to Airport', location: 'Dabolim Airport', description: 'Book the same Gozo cab for return. Keep cab number saved from Day 1!', estimated_cost: 240, tags: ['travel', 'departure'], done: false },
      ],
      created_at: new Date().toISOString()
    },
  ]

  // ── Tasks ──────────────────────────────────────────────────────────────────
  store.tasks = [
    { id: genId(), trip_id: DEMO_TRIP_ID, title: 'Book return flights BLR ↔ GOI', assigned_to: 'dm-rahul',  deadline: '2026-04-15', notes: 'IndiGo usually cheapest. Add 15kg baggage each.', status: 'done',        created_at: new Date().toISOString() },
    { id: genId(), trip_id: DEMO_TRIP_ID, title: 'Book hotel rooms at Lemon Tree Baga',  assigned_to: 'dm-priya',  deadline: '2026-04-20', notes: '2 rooms, 3 nights. Ask for pool-facing rooms!', status: 'in_progress', created_at: new Date().toISOString() },
    { id: genId(), trip_id: DEMO_TRIP_ID, title: 'Book Thalassa table for Day 2 dinner', assigned_to: 'dm-arjun',  deadline: '2026-04-30', notes: 'Call +91-832-xxx. Terrace seats for 5. 7:30pm slot.', status: 'todo',        created_at: new Date().toISOString() },
    { id: genId(), trip_id: DEMO_TRIP_ID, title: 'Research watersports package deals', assigned_to: 'dm-arjun',  deadline: '2026-05-10', notes: 'Compare Calangute Beach Sports vs. Bob\'s Watersports', status: 'todo',        created_at: new Date().toISOString() },
    { id: genId(), trip_id: DEMO_TRIP_ID, title: 'Create WhatsApp packing checklist',    assigned_to: 'dm-sneha',  deadline: '2026-05-15', notes: 'Sunscreen SPF 50+, waterproof bag, reef-safe sunscreen', status: 'todo',        created_at: new Date().toISOString() },
  ]

  // ── Expenses ───────────────────────────────────────────────────────────────
  const ALL_IDS = Object.values(DEMO_MEMBERS).map(m => m.id)
  store.expenses = [
    { id: genId(), trip_id: DEMO_TRIP_ID, paid_by: 'dm-rahul', description: 'Cab from airport (Gozo)', amount: 1200, split_among: ALL_IDS, raw_input: 'paid 1200 for cab for all 5', created_at: new Date().toISOString() },
    { id: genId(), trip_id: DEMO_TRIP_ID, paid_by: 'dm-priya', description: 'Lunch at Fisherman\'s Wharf', amount: 3100, split_among: ALL_IDS, raw_input: 'Maine 3100 bhari lunch ke liye hum sab ke liye', created_at: new Date().toISOString() },
    { id: genId(), trip_id: DEMO_TRIP_ID, paid_by: 'dm-arjun', description: 'Watersports session', amount: 9000, split_among: ['dm-rahul','dm-arjun','dm-mohit'], raw_input: 'Arjun paid 9000 for watersports for Rahul Arjun Mohit', created_at: new Date().toISOString() },
    { id: genId(), trip_id: DEMO_TRIP_ID, paid_by: 'dm-sneha', description: 'Dinner at Brittos', amount: 4800, split_among: ALL_IDS, raw_input: 'paid 4800 for dinner for everyone', created_at: new Date().toISOString() },
  ]

  saveStore(store)

  // Set current user as Rahul
  localStorage.setItem('tripsync_user_id', DEMO_USER_ID)
  localStorage.setItem(`trip_${DEMO_TRIP_ID}_user_id`, DEMO_USER_ID)
  localStorage.setItem(`trip_${DEMO_TRIP_ID}_member_name`, 'Rahul')

  console.log('✅ Demo data seeded successfully!')
  return DEMO_TRIP_ID
}

export function clearDemoData() {
  localStorage.removeItem('tripsync_db')
  localStorage.removeItem('tripsync_user_id')
  console.log('🗑️ Demo data cleared')
}
