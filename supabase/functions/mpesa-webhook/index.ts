import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IntaSendWebhookPayload {
  invoice_id: string;
  state: 'PENDING' | 'PROCESSING' | 'COMPLETE' | 'FAILED';
  provider: string;
  charges: string;
  net_amount: string;
  currency: string;
  value: string;
  account: string;
  api_ref: string;
  failed_reason?: string | null;
  failed_code?: string | null;
  created_at: string;
  updated_at: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Received webhook request');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload: IntaSendWebhookPayload = await req.json();
    
    console.log('Webhook payload:', JSON.stringify(payload));

    const { api_ref, state, invoice_id, failed_reason } = payload;

    if (!api_ref) {
      console.error('No api_ref in webhook payload');
      return new Response(JSON.stringify({ error: 'Missing api_ref' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Map IntaSend state to our status
    let newStatus: string;
    switch (state) {
      case 'COMPLETE':
        newStatus = 'completed';
        break;
      case 'FAILED':
        newStatus = 'failed';
        break;
      case 'PROCESSING':
        newStatus = 'processing';
        break;
      case 'PENDING':
      default:
        newStatus = 'pending';
        break;
    }

    console.log(`Updating contribution with api_ref=${api_ref} to status=${newStatus}`);

    // Find and update the contribution by api_ref
    const { data: contribution, error: findError } = await supabase
      .from('contributions')
      .select('id, status')
      .eq('api_ref', api_ref)
      .single();

    if (findError || !contribution) {
      console.error('Contribution not found for api_ref:', api_ref, findError);
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

    if (state === 'FAILED' && failed_reason) {
      console.log(`Payment failed reason: ${failed_reason}`);
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Contribution status updated to ${newStatus}`,
      contribution_id: contribution.id,
      invoice_id,
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
