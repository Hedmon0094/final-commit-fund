import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  amount: number;
  phone_number: string;
  email?: string;
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
      console.error('JWT validation failed:', claimsError);
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

    console.log(`Authenticated user: ${user_id}`);

    const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!PAYSTACK_SECRET_KEY) {
      console.error('PAYSTACK_SECRET_KEY not configured');
      throw new Error('Payment service not configured');
    }

    // Create service role client for database operations
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { amount, phone_number, email }: PaymentRequest = await req.json();

    console.log(`Initiating Paystack charge: amount=${amount}, phone=${phone_number}, user=${user_id}`);

    // Validate inputs
    if (!amount || amount <= 0) {
      throw new Error('Invalid amount');
    }
    if (!phone_number) {
      throw new Error('Phone number is required');
    }

    // Format phone number (ensure +254 format for Kenya)
    let formattedPhone = phone_number.replace(/\s+/g, '').replace(/^0/, '+254').replace(/^254/, '+254');
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }

    console.log(`Formatted phone: ${formattedPhone}`);

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
      console.error('Failed to create contribution record:', insertError);
      throw new Error('Failed to initiate payment');
    }

    console.log(`Created pending contribution: ${contribution.id} with reference: ${reference}`);

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
    console.log('Paystack response:', JSON.stringify(result));

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
    console.error('Payment error:', error);
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
