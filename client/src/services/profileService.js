import { supabase } from '../supabaseClient';

// ইউজার আইডি দিয়ে ডাটা আনা
export const fetchProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (error) throw error;
  return data;
};

// প্রোফাইল আপডেট করা
export const updateProfile = async (userId, updateData) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', userId);
    
  if (error) throw error;
  return data;
};