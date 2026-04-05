import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = import.meta.env.VITE_GEMINI_API_KEY

const getAI = () => {
  if (!apiKey) {
    console.warn('⚠️ Gemini API key missing. AI features will not work.')
    return null
  }
  return new GoogleGenerativeAI(apiKey)
}

// ─── Preference Summary Card ───────────────────────────────────────────────
export async function generatePreferenceSummary(preferences) {
  const ai = getAI()
  if (!ai) return getMockSummary(preferences)

  const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const prompt = `You are an AI assistant for a group travel planning app in India.
  
Here are the travel preferences submitted by ${preferences.length} group members (budget info is aggregated, not individual):

${preferences.map((p, i) => `Member ${i + 1}:
- Vibe: ${p.vibe}
- Budget range (per person/day): ₹${p.budget_min || '?'} – ₹${p.budget_max || '?'}
- Dietary: ${p.dietary}
- Must have: ${p.must_have || 'none'}
- Dealbreaker: ${p.dealbreaker || 'none'}`).join('\n\n')}

Return a JSON object (no markdown) with this structure:
{
  "vibe_consensus": "dominant vibe label",
  "vibe_note": "short note like '3 of 5 want adventure, 2 prefer chill'",
  "budget_band_min": number,
  "budget_band_max": number,
  "budget_note": "e.g. '4 of 5 members comfortable with this range'",
  "dietary_summary": "e.g. 'Mix of veg and non-veg. 2 vegetarians in the group.'",
  "must_haves": ["top 3 aggregated must-haves"],
  "dealbreakers": ["top 2 common dealbreakers"],
  "alignment_score": number between 1-10,
  "alignment_note": "brief note on how aligned the group is"
}`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const cleaned = text.replace(/```json|```/g, '').trim()
    return JSON.parse(cleaned)
  } catch (e) {
    console.error('AI summary error:', e)
    return getMockSummary(preferences)
  }
}

function getMockSummary(preferences) {
  const vibes = preferences.map(p => p.vibe).filter(Boolean)
  const dominant = vibes.sort((a, b) =>
    vibes.filter(v => v === a).length - vibes.filter(v => v === b).length
  ).pop() || 'mix'
  const budgets = preferences.filter(p => p.budget_min && p.budget_max)
  const minAvg = budgets.length ? Math.round(budgets.reduce((s, p) => s + p.budget_min, 0) / budgets.length / 500) * 500 : 5000
  const maxAvg = budgets.length ? Math.round(budgets.reduce((s, p) => s + p.budget_max, 0) / budgets.length / 500) * 500 : 12000

  return {
    vibe_consensus: dominant,
    vibe_note: `${vibes.filter(v => v === dominant).length} of ${vibes.length} members prefer ${dominant}`,
    budget_band_min: minAvg,
    budget_band_max: maxAvg,
    budget_note: `${budgets.length} of ${preferences.length} members submitted budget preferences`,
    dietary_summary: 'Mix of dietary preferences in the group.',
    must_haves: preferences.flatMap(p => p.must_have ? [p.must_have] : []).slice(0, 3),
    dealbreakers: preferences.flatMap(p => p.dealbreaker ? [p.dealbreaker] : []).slice(0, 2),
    alignment_score: 7,
    alignment_note: 'Group has moderate alignment on key preferences.'
  }
}

// ─── AI Itinerary Builder ──────────────────────────────────────────────────
export async function generateItinerary({ destination, dateStart, dateEnd, budgetMin, budgetMax, groupSize, vibe, dietary, mustHaves, dealbreakers }) {
  const ai = getAI()

  const days = Math.max(1, Math.round((new Date(dateEnd) - new Date(dateStart)) / (1000 * 60 * 60 * 24)) + 1)

  if (!ai) return getMockItinerary(destination, days, dateStart)

  const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const isVegGroup = dietary && dietary.includes('veg')

  const prompt = `You are an expert Indian travel planner. Create a detailed day-by-day group trip itinerary.

Trip details:
- Destination: ${destination}
- Duration: ${days} days (${dateStart} to ${dateEnd})
- Group size: ${groupSize} people
- Budget: ₹${budgetMin}–₹${budgetMax} per person per day
- Vibe: ${vibe}
- Dietary: ${dietary || 'mixed'} ${isVegGroup ? '(IMPORTANT: recommend vegetarian/veg-friendly options ONLY)' : ''}
- Must haves: ${mustHaves || 'none'}
- Dealbreakers: ${dealbreakers || 'none'}

Return a JSON array (no markdown) with ${days} day objects:
[
  {
    "day_number": 1,
    "date": "${dateStart}",
    "title": "Arrival & first impressions",
    "items": [
      {
        "time": "10:00 AM",
        "type": "travel",
        "activity": "Activity name",
        "location": "Location name",
        "description": "1-2 sentence description with local tips",
        "estimated_cost": 500,
        "tags": ["veg-friendly", "group-activity"]
      }
    ]
  }
]

Include 4-6 items per day covering morning, afternoon, evening. Add meal suggestions. Include a crowd-tip or travel-tip for at least 2 items per day. Keep costs realistic for Indian group travel.`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const cleaned = text.replace(/```json|```/g, '').trim()
    return JSON.parse(cleaned)
  } catch (e) {
    console.error('AI itinerary error:', e)
    return getMockItinerary(destination, days, dateStart)
  }
}

function getMockItinerary(destination, days, dateStart) {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(dateStart)
    date.setDate(date.getDate() + i)
    return {
      day_number: i + 1,
      date: date.toISOString().split('T')[0],
      title: i === 0 ? 'Arrival & Settle In' : i === days - 1 ? 'Last Day & Departure' : `Day ${i + 1} in ${destination}`,
      items: [
        { time: '09:00 AM', type: 'activity', activity: 'Morning exploration', location: `${destination} Old Town`, description: 'Start your day with a walk through the local market area.', estimated_cost: 200, tags: ['morning'] },
        { time: '12:30 PM', type: 'food', activity: 'Lunch at local restaurant', location: 'Local dhabha / restaurant', description: 'Try the local specialty. Highly recommended by the community.', estimated_cost: 300, tags: ['vegetarian-options'] },
        { time: '03:00 PM', type: 'activity', activity: 'Group activity', location: destination, description: 'Perfect group activity for the afternoon.', estimated_cost: 500, tags: ['group', 'adventure'] },
        { time: '07:30 PM', type: 'food', activity: 'Dinner', location: 'Popular local spot', description: 'End the day with a great meal and good vibes.', estimated_cost: 400, tags: ['evening'] }
      ]
    }
  })
}

// ─── Expense Parser (Hinglish NLP) ────────────────────────────────────────
export async function parseExpense(input, memberNames) {
  const ai = getAI()
  if (!ai) return parseExpenseFallback(input, memberNames)

  const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const prompt = `You are an expense parser for an Indian group travel app. Parse this expense input (can be in English, Hindi, or Hinglish):

Input: "${input}"
Group members: ${memberNames.join(', ')}

Return JSON only (no markdown):
{
  "amount": number,
  "description": "short description in English",
  "paid_by_name": "name of person who paid (or null if unclear)",
  "split_type": "all" | "some" | "custom",
  "split_names": ["name1", "name2"] or null if all,
  "confidence": "high" | "medium" | "low",
  "clarification_needed": null or "question to ask user if confidence is low"
}

Examples:
- "paid 2400 for dinner for all 6" → amount: 2400, description: "Dinner", split_type: "all"
- "Maine 1200 diye breakfast ke liye, hum 4 the" → amount: 1200, description: "Breakfast", split_type: "some"
- "Rohit paid 500 for tickets for him and Priya" → amount: 500, paid_by_name: "Rohit", split_names: ["Rohit", "Priya"]`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const cleaned = text.replace(/```json|```/g, '').trim()
    return JSON.parse(cleaned)
  } catch (e) {
    console.error('Expense parse error:', e)
    return parseExpenseFallback(input, memberNames)
  }
}

function parseExpenseFallback(input, memberNames) {
  const amountMatch = input.match(/\d+/)
  const amount = amountMatch ? parseInt(amountMatch[0]) : null
  return {
    amount,
    description: input.trim(),
    paid_by_name: null,
    split_type: 'all',
    split_names: null,
    confidence: 'low',
    clarification_needed: 'Could you confirm — who paid and should this be split among everyone?'
  }
}
