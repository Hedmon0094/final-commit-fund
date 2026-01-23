import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Constants for validation
const MIN_AMOUNT = 1;  // KES
const MAX_AMOUNT = 50000;  // KES
const TARGET_AMOUNT = 1400;  // Per-user target
const MAX_RECENT_ATTEMPTS = 3;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

interface PaymentRequest {
  amount: number;
  phone_number: string;
  email?: string;
}

// Helper functions for log sanitization
function maskPhone(phone: string): string {
  if (!phone || phone.length < 4) return '***';
  return `${phone.slice(0, 3)}***${phone.slice(-2)}`;
}

function maskUserId(userId: string): string {
  return `${userId.slice(0, 8)}...`;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('Missing or invalid Authorization header');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Unauthorized' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create client with user's auth context to validate JWT
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Validate the JWT and get user claims
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      console.error('JWT validation failed');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Unauthorized' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user ID from validated JWT claims
    const user_id = claimsData.claims.sub;
    const userEmail = claimsData.claims.email;
    
    if (!user_id) {
      console.error('No user ID in JWT claims');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Unauthorized' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Authenticated user: ${maskUserId(user_id)}`);

    const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!PAYSTACK_SECRET_KEY) {
      console.error('PAYSTACK_SECRET_KEY not configured');
      throw new Error('Payment service not configured');
    }

    // Create service role client for database operations
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { amount, phone_number, email }: PaymentRequest = await req.json();

    // ===== COMPREHENSIVE INPUT VALIDATION =====
    
    // Validate amount type and format
    if (amount === undefined || amount === null) {
      throw new Error('Amount is required');
    }
    
    if (typeof amount !== 'number' || isNaN(amount)) {
      throw new Error('Amount must be a valid number');
    }
    
    // Ensure amount is a positive integer
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new Error('Amount must be a positive integer');
    }
    
    // Validate amount bounds
    if (amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
      throw new Error(`Amount must be between ${MIN_AMOUNT} and ${MAX_AMOUNT} KES`);
    }

    // Validate phone number type
    if (!phone_number || typeof phone_number !== 'string') {
      throw new Error('Phone number is required');
    }

    // Validate phone number format server-side (Kenyan numbers: Safaricom/Airtel)
    const cleanPhone = phone_number.replace(/\s+/g, '');
    if (!/^(\+254|254|0)?[17]\d{8}$/.test(cleanPhone)) {
      throw new Error('Invalid phone number format. Use Kenyan format (e.g., 0712345678 or +254712345678)');
    }

    console.log(`Processing payment: amount=${amount}, phone=${maskPhone(phone_number)}`);

    // ===== SERVER-SIDE BALANCE VALIDATION =====
    
    // Check user's completed contributions to validate against remaining balance
    const { data: userContribs, error: contribError } = await supabase
      .from('contributions')
      .select('amount')
      .eq('user_id', user_id)
      .eq('status', 'completed');

    if (contribError) {
      console.error('Failed to fetch user contributions');
      throw new Error('Failed to validate contribution status');
    }

    const totalPaid = userContribs?.reduce((sum, c) => sum + c.amount, 0) || 0;
    const remaining = TARGET_AMOUNT - totalPaid;

    if (remaining <= 0) {
      throw new Error('You have already completed your contribution target');
    }

    if (amount > remaining) {
      throw new Error(`Amount exceeds remaining balance of ${remaining} KES`);
    }

    // ===== RATE LIMITING =====
    
    const rateWindowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    const { data: recentAttempts, error: rateError } = await supabase
      .from('contributions')
      .select('id')
      .eq('user_id', user_id)
      .gte('created_at', rateWindowStart);

    if (!rateError && recentAttempts && recentAttempts.length >= MAX_RECENT_ATTEMPTS) {
      throw new Error('Too many payment attempts. Please wait a few minutes before trying again.');
    }

    // Format phone number (ensure +254 format for Kenya)
    let formattedPhone = phone_number.replace(/\s+/g, '').replace(/^0/, '+254').replace(/^254/, '+254');
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }

    // Generate unique reference
    const reference = `fcf_${user_id.slice(0, 8)}_${Date.now()}`;

    // Create a pending contribution record with api_ref for webhook matching
    const { data: contribution, error: insertError } = await supabase
      .from('contributions')
      .insert({
        user_id,
        amount,
        status: 'pending',
        api_ref: reference,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create contribution record');
      throw new Error('Failed to initiate payment');
    }

    console.log(`Created pending contribution with reference: ${reference.slice(0, 12)}...`);

    // Paystack uses amount in kobo (smallest currency unit), for KES it's cents
    const amountInCents = amount * 100;

    // Call Paystack Charge API for mobile money
    const response = await fetch('https://api.paystack.co/charge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
      body: JSON.stringify({
        amount: amountInCents,
        email: email || userEmail || `${user_id.slice(0, 8)}@finalcommit.fund`,
        currency: 'KES',
        mobile_money: {
          phone: formattedPhone,
          provider: 'mpesa',
        },
        reference,
        metadata: {
          user_id,
          contribution_id: contribution.id,
        },
      }),
    });

    const result = await response.json();
    
    // Log only essential non-sensitive info
    console.log('Payment API response:', { success: result.status, hasData: !!result.data });

    if (!result.status) {
      // Update contribution to failed
      await supabase
        .from('contributions')
        .update({ status: 'failed' })
        .eq('id', contribution.id);
      
      throw new Error(result.message || 'Payment initiation failed');
    }

    // Update contribution status to processing
    await supabase
      .from('contributions')
      .update({ status: 'processing' })
      .eq('id', contribution.id);

    return new Response(JSON.stringify({
      success: true,
      message: result.data?.display_text || 'Payment prompt sent. Check your phone to complete payment.',
      contribution_id: contribution.id,
      reference: result.data?.reference,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Payment processing error');
    const errorMessage = error instanceof Error ? error.message : 'Failed to initiate payment';
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
