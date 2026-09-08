import { supabase } from '../lib/supabase'

const DEVICE_KEY = 'wemoney-device-id'
const DEVICE_NAME_KEY = 'wemoney-device-name'

function makeDeviceId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function getDeviceId() {
  try {
    let id = window.localStorage.getItem(DEVICE_KEY)
    if (!id) {
      id = makeDeviceId()
      window.localStorage.setItem(DEVICE_KEY, id)
    }
    return id
  } catch {
    return makeDeviceId()
  }
}

export function getDeviceName() {
  try {
    const saved = window.localStorage.getItem(DEVICE_NAME_KEY)
    if (saved?.trim()) return saved.trim()
  } catch {}

  const ua = navigator.userAgent || ''
  if (/iPhone/i.test(ua)) return 'iPhone'
  if (/iPad/i.test(ua)) return 'iPad'
  if (/Android/i.test(ua)) return 'HP Android'
  if (/Windows/i.test(ua)) return 'PC Windows'
  if (/Macintosh|Mac OS/i.test(ua)) return 'Mac'
  return 'Perangkat'
}

export function setDeviceName(name) {
  const value = String(name || '').trim().slice(0, 80)
  if (!value) throw new Error('Nama perangkat tidak boleh kosong.')
  window.localStorage.setItem(DEVICE_NAME_KEY, value)
  return value
}

export async function registerCurrentDevice(userId) {
  if (!userId) return null
  const deviceId = getDeviceId()
  const deviceName = getDeviceName()
  const platform = /Android|iPhone|iPad/i.test(navigator.userAgent || '') ? 'mobile' : 'desktop'
  const { data, error } = await supabase.rpc('touch_user_device', {
    p_device_id: deviceId,
    p_device_name: deviceName,
    p_platform: platform,
    p_user_agent: navigator.userAgent?.slice(0, 500) || null,
  })
  if (error) throw error
  return Array.isArray(data) ? data[0] : data
}

export async function getMyDevices() {
  const { data, error } = await supabase.rpc('list_my_devices')
  if (error) throw error
  return data ?? []
}

export { DEVICE_KEY, DEVICE_NAME_KEY }
