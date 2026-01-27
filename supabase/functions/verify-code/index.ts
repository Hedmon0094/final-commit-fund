import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      throw new Error("Email and code are required");
    }

    console.log("Verifying code for:", email);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Look up the verification code
    const { data: verificationRecord, error: lookupError } = await supabase
      .from("verification_codes")
      .select("*")
      .eq("email", email.toLowerCase())
      .eq("code", code)
      .eq("verified", false)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (lookupError) {
      console.error("Lookup error:", lookupError);
      throw new Error("Failed to verify code");
    }

    if (!verificationRecord) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid or expired verification code" 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Mark code as verified
    await supabase
      .from("verification_codes")
      .update({ verified: true })
      .eq("id", verificationRecord.id);

    // Find the user by email and confirm them
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error("User lookup error:", userError);
      throw new Error("Failed to find user");
    }

    const user = userData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "User not found. Please sign up first." 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Update user to confirm email
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { email_confirm: true }
    );

    if (updateError) {
      console.error("Update user error:", updateError);
      throw new Error("Failed to confirm email");
    }

    // Clean up used verification code
    await supabase
      .from("verification_codes")
      .delete()
      .eq("email", email.toLowerCase());

    console.log("Email verified successfully for:", email);

    return new Response(
      JSON.stringify({ success: true, message: "Email verified successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Verify code error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to verify code" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
