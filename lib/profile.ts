import { supabase } from '@/lib/supabase'
import { DEMO_PROFILE_ID } from '@/lib/constants'

export async function ensureDemoProfile(): Promise<void> {
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', DEMO_PROFILE_ID)
    .single()

  if (existingProfile) return

  const { error } = await supabase.from('profiles').insert([
    {
      id: DEMO_PROFILE_ID,
      email: 'casey@financialhub.local',
      full_name: 'Casey',
    },
  ])

  if (error) throw error
}
