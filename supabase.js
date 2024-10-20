import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database
const supabase = createClient('https://xyzcompany.supabase.co', 'public-anon-key')


/*
Fetch:

const { data, error } = await supabase
  .from('Users')
  .select()


Insert:

const { error } = await supabase
  .from('Users')
  .insert({ userid: 1, firstName: '',lastName })

Update:

const { error } = await supabase
  .from('Users')
  .update({ firstName: 'Raman' })
  .eq('id', 1)


*/