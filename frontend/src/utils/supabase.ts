import { createClient } from '@supabase/supabase-js'

// 임시로 하드코딩된 값 사용 (테스트용)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://prqnogpoggsuasljldjd.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBycW5vZ3BvZ2dzdWFzbGpsZGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0ODg5MjMsImV4cCI6MjA2NjA2NDkyM30.hTQs_fEXgNWBuHAIuSLT9MRfonontq5TFFNNKUJfhrg'

console.log('Supabase 설정 확인:')
console.log('- URL:', supabaseUrl)
console.log('- Anon Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 50)}...` : '❌ 없음')

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// 서버사이드에서 사용할 Service Role 클라이언트 (API Routes용)
export const createServiceClient = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBycW5vZ3BvZ2dzdWFzbGpsZGpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQ4ODkyMywiZXhwIjoyMDY2MDY0OTIzfQ.qeblQvlp6X04W8SXkjLO35qt8mGammeVQzUpLXcYX-M'
  
  console.log('Service Client 설정:')
  console.log('- Service Key:', serviceKey ? `${serviceKey.substring(0, 50)}...` : '❌ 없음')
  
  if (!serviceKey) {
    throw new Error('Missing Supabase service key')
  }
  
  return createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
} 