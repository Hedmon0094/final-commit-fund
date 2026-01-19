import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface STKPushRequest {
  amount: number;
  phone_number: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const INTASEND_API_KEY = Deno.env.get('INTASEND_API_KEY');
    if (!INTASEND_API_KEY) {
      console.error('INTASEND_API_KEY not configured');
      throw new Error('Payment service not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { amount, phone_number, user_id, first_name, last_name, email }: STKPushRequest = await req.json();

    console.log(`Initiating STK Push: amount=${amount}, phone=${phone_number}, user=${user_id}`);

    // Validate inputs
    if (!amount || amount <= 0) {
      throw new Error('Invalid amount');
    }
    if (!phone_number) {
      throw new Error('Phone number is required');
    }
    if (!user_id) {
      throw new Error('User ID is required');
    }

    // Format phone number (ensure 254 format)
    let formattedPhone = phone_number.replace(/\s+/g, '').replace(/^0/, '254').replace(/^\+/, '');
    if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone;
    }

    console.log(`Formatted phone: ${formattedPhone}`);

    // Generate unique reference
    const apiRef = `contrib_${user_id.slice(0, 8)}_${Date.now()}`;

    // Create a pending contribution record with api_ref for webhook matching
    const { data: contribution, error: insertError } = await supabase
      .from('contributions')
      .insert({
        user_id,
        amount,
        status: 'pending',
        api_ref: apiRef,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create contribution record:', insertError);
      throw new Error('Failed to initiate payment');
    }

    console.log(`Created pending contribution: ${contribution.id} with api_ref: ${apiRef}`);

    // Call IntaSend STK Push API
    const response = await fetch('https://payment.intasend.com/api/v1/payment/mpesa-stk-push/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${INTASEND_API_KEY}`,
      },
      body: JSON.stringify({
        amount,
        phone_number: formattedPhone,
        api_ref: apiRef,
        first_name: first_name || 'Member',
        last_name: last_name || '',
        email: email || 'member@finalcommit.fund',
        narrative: 'FinalCommit Fund Contribution',
      }),
    });

    const result = await response.json();
    console.log('IntaSend response:', JSON.stringify(result));

    if (!response.ok) {
      // Update contribution to failed
      await supabase
        .from('contributions')
        .update({ status: 'failed' })
        .eq('id', contribution.id);
      
      throw new Error(result.message || result.error || 'Payment initiation failed');
    }

    // Update contribution with IntaSend reference
    await supabase
      .from('contributions')
      .update({ 
        status: 'processing',
      })
      .eq('id', contribution.id);

    return new Response(JSON.stringify({
      success: true,
      message: 'STK Push sent. Check your phone to complete payment.',
      contribution_id: contribution.id,
      invoice_id: result.invoice?.invoice_id || result.id,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('STK Push error:', error);
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
