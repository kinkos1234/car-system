import { createClient } from '@supabase/supabase-js'

// 환경변수에서 Supabase 설정 가져오기
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

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
  const serviceKey = process.env.SUPABASE_SERVICE_KEY || ''
  
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