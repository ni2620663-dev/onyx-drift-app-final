import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dwboocndrvjcouvbnyly.supabase.co';
// এখানে sb_secret এর পরিবর্তে নতুন কপি করা Publishable key টি বসান
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3Ym9vY25kcnZqY291dmJueWx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzODgwODYsImV4cCI6MjA4ODk2NDA4Nn0.Sgw0ngqH1s1Kwg11WXjrq9-T4f-OkHiSC9K_WTrETcI'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey);