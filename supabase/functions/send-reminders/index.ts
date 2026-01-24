import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MemberReminder {
  name: string;
  phone: string | null;
  email: string;
  totalPaid: number;
  remaining: number;
}

const TARGET_AMOUNT = 700;
const TOTAL_TARGET = 7000;
const DEADLINE = new Date('2026-05-01');

// Format phone for WhatsApp (Kenyan format)
function formatPhoneForWhatsApp(phone: string): string {
  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, '');
  
  // Handle Kenyan formats
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.slice(1);
  } else if (!cleaned.startsWith('254')) {
    cleaned = '254' + cleaned;
  }
  
  return cleaned;
}

// Generate WhatsApp click-to-chat URL
function generateWhatsAppLink(phone: string, message: string): string {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
}

// Generate reminder message
function generateReminderMessage(member: MemberReminder, daysLeft: number): string {
  if (member.totalPaid === 0) {
    return `Hi ${member.name}! 👋

This is a friendly reminder about the FinalCommit Fund contribution.

📊 Your Status: Not started yet
💰 Target: KES ${TARGET_AMOUNT}
📅 Days Left: ${daysLeft}
🎯 Deadline: May 1st, 2026

Please contribute when you can. Every contribution counts! 🙏

Contribute here: ${Deno.env.get('APP_URL') || 'https://final-commit-fund.lovable.app'}/contribute`;
  }
  
  if (member.remaining > 0) {
    const progressPercent = Math.round((member.totalPaid / TARGET_AMOUNT) * 100);
    return `Hi ${member.name}! 👋

Great progress on your FinalCommit Fund contribution! 🎉

📊 Your Progress: ${progressPercent}%
💰 Paid: KES ${member.totalPaid.toLocaleString()}
💳 Remaining: KES ${member.remaining.toLocaleString()}
📅 Days Left: ${daysLeft}

You're almost there! Complete your contribution before the deadline. 💪

Contribute here: ${Deno.env.get('APP_URL') || 'https://final-commit-fund.lovable.app'}/contribute`;
  }
  
  return `Hi ${member.name}! 🎉

Thank you for completing your FinalCommit Fund contribution! ✅

📊 Status: COMPLETED
💰 Total Paid: KES ${member.totalPaid.toLocaleString()}

You're all set for the celebration! 🎊`;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Starting reminder generation...');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Validate JWT from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error('JWT validation failed:', claimsError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const userId = claimsData.claims.sub;
    console.log('Authenticated user:', userId);

    // Use service role for data access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for options
    let options = { sendType: 'preview', targetGroup: 'all' };
    try {
      if (req.body) {
        const body = await req.json();
        options = { ...options, ...body };
      }
    } catch {
      // Use defaults if no body
    }

    const { sendType, targetGroup } = options;
    console.log(`Reminder options: sendType=${sendType}, targetGroup=${targetGroup}`);

    // Calculate days until deadline
    const now = new Date();
    const daysLeft = Math.max(0, Math.ceil((DEADLINE.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    // Fetch all members with their profiles and contributions
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, name, phone, email');

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      throw new Error('Failed to fetch member profiles');
    }

    // Fetch all completed contributions
    const { data: contributions, error: contribError } = await supabase
      .from('contributions')
      .select('user_id, amount')
      .eq('status', 'completed');

    if (contribError) {
      console.error('Error fetching contributions:', contribError);
      throw new Error('Failed to fetch contributions');
    }

    // Calculate totals per member
    const memberTotals = new Map<string, number>();
    contributions?.forEach(c => {
      const current = memberTotals.get(c.user_id) || 0;
      memberTotals.set(c.user_id, current + c.amount);
    });

    // Build member reminder list
    const members: MemberReminder[] = (profiles || []).map(p => {
      const totalPaid = memberTotals.get(p.user_id) || 0;
      return {
        name: p.name,
        phone: p.phone,
        email: p.email,
        totalPaid,
        remaining: Math.max(0, TARGET_AMOUNT - totalPaid),
      };
    });

    // Filter based on target group
    let filteredMembers = members;
    switch (targetGroup) {
      case 'not_started':
        filteredMembers = members.filter(m => m.totalPaid === 0);
        break;
      case 'in_progress':
        filteredMembers = members.filter(m => m.totalPaid > 0 && m.totalPaid < TARGET_AMOUNT);
        break;
      case 'incomplete':
        filteredMembers = members.filter(m => m.totalPaid < TARGET_AMOUNT);
        break;
      case 'completed':
        filteredMembers = members.filter(m => m.totalPaid >= TARGET_AMOUNT);
        break;
      default:
        // 'all' - no filter
        break;
    }

    console.log(`Found ${filteredMembers.length} members matching criteria`);

    // Generate reminder data
    const reminders = filteredMembers.map(member => {
      const message = generateReminderMessage(member, daysLeft);
      const whatsappLink = member.phone ? generateWhatsAppLink(member.phone, message) : null;
      
      return {
        name: member.name,
        phone: member.phone,
        email: member.email,
        totalPaid: member.totalPaid,
        remaining: member.remaining,
        status: member.totalPaid >= TARGET_AMOUNT ? 'completed' : member.totalPaid > 0 ? 'in_progress' : 'not_started',
        message,
        whatsappLink,
        hasPhone: !!member.phone,
      };
    });

    // Summary stats
    const summary = {
      totalMembers: members.length,
      targetedMembers: filteredMembers.length,
      withPhone: filteredMembers.filter(m => m.phone).length,
      withoutPhone: filteredMembers.filter(m => !m.phone).length,
      daysLeft,
      totalCollected: members.reduce((sum, m) => sum + m.totalPaid, 0),
      totalRemaining: TOTAL_TARGET - members.reduce((sum, m) => sum + m.totalPaid, 0),
    };

    console.log('Reminder summary:', summary);

    return new Response(JSON.stringify({
      success: true,
      sendType,
      targetGroup,
      summary,
      reminders,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Reminder generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate reminders';
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});