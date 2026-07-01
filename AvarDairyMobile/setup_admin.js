const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zqnhkjzgbsgprnkskhzv.supabase.co';
const supabaseAnonKey = 'sb_publishable_Tk_PzmpYpUCnyUjfQpmZ3Q_PW9W45ox';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupAdmin() {
  const email = 'admin@avardairy.com';
  const password = 'AvarAdmin@2026';
  
  // 1. Try to sign up
  let { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error && error.message.includes('User already registered')) {
    // 2. Try to log in if already registered
    console.log('User already registered, logging in to get ID...');
    const result = await supabase.auth.signInWithPassword({ email, password });
    data = result.data;
    error = result.error;
    
    if (error && error.message.includes('Email not confirmed')) {
       console.log('User registered but email not confirmed! Trying to find user in profiles...');
       // Cannot login without confirmation, but wait, maybe we can just query by email?
       // supabase.from('profiles').select().eq('email', email) might not work due to RLS!
    }
  }

  if (error) {
    console.error('Auth Error:', error.message);
  }

  if (data && data.user) {
    console.log('Target User ID:', data.user.id);
    
    // 3. Update the profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: 'admin', is_approved: true })
      .eq('id', data.user.id);

    if (profileError) {
      console.error('Profile Update Error:', profileError.message);
      
      // If update fails (maybe due to RLS), try insert
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
           id: data.user.id,
           email: email,
           name: 'Avar Admin',
           role: 'admin',
           is_approved: true,
           is_available: true
        });
      if (insertError) {
         console.error('Profile Insert Error:', insertError.message);
      } else {
         console.log('Successfully inserted Admin profile!');
      }
    } else {
      console.log('Successfully updated Admin profile!');
    }
  }
}

setupAdmin();
