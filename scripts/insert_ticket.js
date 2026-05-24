/**
 * Insert a single ticket into the Supabase tasks board.
 *
 * Usage:
 *   node scripts/insert_ticket.js '<json>'
 *
 * JSON shape:
 *   { title, description, priority, epic, status, labels?, order? }
 *
 * Reads SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OWNER_EMAIL from .env.local
 * or from environment variables directly.
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// Load .env.local if not already in environment
function loadEnv() {
  try {
    const raw = readFileSync(resolve(ROOT, '.env.local'), 'utf8')
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      const val = trimmed.slice(eq + 1).trim()
      if (!process.env[key]) process.env[key] = val
    }
  } catch {
    // env vars must already be set
  }
}

loadEnv()

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const OWNER_EMAIL = process.env.OWNER_EMAIL ?? 'danielbrown13@gmail.com'

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const HEADERS = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
}

async function rest(method, path, body) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`
  const res = await fetch(url, { method, headers: HEADERS, body: body ? JSON.stringify(body) : undefined })
  const text = await res.text()
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${text}`)
  return text ? JSON.parse(text) : null
}

async function main() {
  const raw = process.argv[2]
  if (!raw) { console.error('Pass ticket JSON as first argument'); process.exit(1) }

  let ticket
  try { ticket = JSON.parse(raw) } catch { console.error('Invalid JSON:', raw); process.exit(1) }

  const { title, description, priority = 'medium', epic: epicName, status = 'tbd', labels = [] } = ticket

  if (!title) { console.error('title is required'); process.exit(1) }
  if (!epicName) { console.error('epic is required'); process.exit(1) }

  // Resolve owner user ID
  const profiles = await rest('GET', `profiles?email=eq.${encodeURIComponent(OWNER_EMAIL)}&select=id`)
  if (!profiles?.length) { console.error('Profile not found for', OWNER_EMAIL); process.exit(1) }
  const userId = profiles[0].id

  // Resolve or create epic
  const existing = await rest('GET', `epics?title=eq.${encodeURIComponent(epicName)}&select=id`)
  let epicId
  if (existing?.length) {
    epicId = existing[0].id
  } else {
    console.log(`Epic "${epicName}" not found — creating it...`)
    const [created] = await rest('POST', 'epics', { title: epicName, color: '#4263eb', created_by: userId })
    epicId = created.id
    console.log(`Created new epic: ${epicName} (${epicId})`)
  }

  // Get current max order so new ticket appears at the bottom
  const all = await rest('GET', 'tasks?select=order&order=order.desc&limit=1')
  const nextOrder = all?.length ? (all[0].order ?? 0) + 1 : 0

  // Insert task
  const [task] = await rest('POST', 'tasks', {
    title,
    description: description ?? '',
    status,
    priority,
    epic_id: epicId,
    assignee_id: null,
    labels,
    order: nextOrder,
    created_by: userId,
  })

  console.log(`\nTicket created successfully!`)
  console.log(`  ID:     ${task.id}`)
  console.log(`  Title:  ${task.title}`)
  console.log(`  Epic:   ${epicName}`)
  console.log(`  Status: ${task.status} | Priority: ${task.priority}`)
}

main().catch((err) => { console.error(err.message); process.exit(1) })
