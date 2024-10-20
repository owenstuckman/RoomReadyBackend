import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database
const supabase = createClient('https://tsewlrukrykkycootlsb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzZXdscnVrcnlra3ljb290bHNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkzNjcwNTUsImV4cCI6MjA0NDk0MzA1NX0.DNwdRirUSViojOqOOLHaJ_lW9u2jd1siOxqdmQWz6PU')


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