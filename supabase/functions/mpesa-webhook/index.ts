import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-paystack-signature',
};

interface PaystackWebhookPayload {
  event: string;
  data: {
    reference: string;
    status: 'success' | 'failed' | 'abandoned' | 'pending';
    amount: number;
    currency: string;
    channel: string;
    metadata?: {
      user_id?: string;
      contribution_id?: string;
    };
    gateway_response?: string;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Received Paystack webhook');

  try {
    const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!PAYSTACK_SECRET_KEY) {
      console.error('PAYSTACK_SECRET_KEY not configured');
      throw new Error('Webhook not configured');
    }

    // Get raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature');

    // Verify webhook signature
    if (signature) {
      const hash = createHmac('sha512', PAYSTACK_SECRET_KEY)
        .update(rawBody)
        .digest('hex');
      
      if (hash !== signature) {
        console.error('Invalid webhook signature');
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload: PaystackWebhookPayload = JSON.parse(rawBody);
    
    console.log('Webhook payload:', JSON.stringify(payload));

    const { event, data } = payload;
    const { reference, status, gateway_response } = data;

    // Only process charge events
    if (!event.startsWith('charge.')) {
      console.log(`Ignoring event: ${event}`);
      return new Response(JSON.stringify({ success: true, message: 'Event ignored' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!reference) {
      console.error('No reference in webhook payload');
      return new Response(JSON.stringify({ error: 'Missing reference' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Map Paystack status to our status
    let newStatus: string;
    switch (status) {
      case 'success':
        newStatus = 'completed';
        break;
      case 'failed':
      case 'abandoned':
        newStatus = 'failed';
        break;
      case 'pending':
      default:
        newStatus = 'processing';
        break;
    }

    console.log(`Updating contribution with reference=${reference} to status=${newStatus}`);

    // Find and update the contribution by api_ref (which stores our reference)
    const { data: contribution, error: findError } = await supabase
      .from('contributions')
      .select('id, status')
      .eq('api_ref', reference)
      .single();

    if (findError || !contribution) {
      console.error('Contribution not found for reference:', reference, findError);
      return new Response(JSON.stringify({ error: 'Contribution not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Only update if status is changing (avoid overwriting completed status)
    if (contribution.status === 'completed' && newStatus !== 'completed') {
      console.log('Contribution already completed, skipping update');
      return new Response(JSON.stringify({ success: true, message: 'Already completed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error: updateError } = await supabase
      .from('contributions')
      .update({ status: newStatus })
      .eq('id', contribution.id);

    if (updateError) {
      console.error('Failed to update contribution:', updateError);
      throw new Error('Failed to update contribution status');
    }

    console.log(`Successfully updated contribution ${contribution.id} to ${newStatus}`);

    if (status === 'failed' && gateway_response) {
      console.log(`Payment failed: ${gateway_response}`);
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Contribution status updated to ${newStatus}`,
      contribution_id: contribution.id,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Webhook processing failed';
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
