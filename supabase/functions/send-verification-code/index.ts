import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, redirectUrl } = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    console.log("Generating verification token for:", email);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Generate secure token
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

    // Delete any existing codes for this email
    await supabase
      .from("verification_codes")
      .delete()
      .eq("email", email.toLowerCase());

    // Insert new token (using 'code' column for the token)
    const { error: insertError } = await supabase
      .from("verification_codes")
      .insert({
        email: email.toLowerCase(),
        code: token,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Failed to store token:", insertError);
      throw new Error("Failed to generate verification token");
    }

    // Build verification link
    const baseUrl = redirectUrl || "https://final-commit-fund.lovable.app";
    const verifyUrl = `${baseUrl}/verify?token=${token}&email=${encodeURIComponent(email)}`;

    // Send email via Resend
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 20px;">
        <div style="max-width: 420px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-block; background: #18181b; padding: 12px; border-radius: 12px; margin-bottom: 16px;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="4 17 10 11 4 5"></polyline>
                <line x1="12" y1="19" x2="20" y2="19"></line>
              </svg>
            </div>
            <h1 style="color: #18181b; font-size: 24px; font-weight: 700; margin: 0;">FinalCommit</h1>
          </div>
          
          <h2 style="color: #18181b; font-size: 20px; font-weight: 600; text-align: center; margin: 0 0 8px 0;">
            Verify your email
          </h2>
          <p style="color: #71717a; font-size: 15px; text-align: center; margin: 0 0 32px 0;">
            Click the button below to verify your email address and activate your account.
          </p>
          
          <div style="text-align: center; margin-bottom: 32px;">
            <a href="${verifyUrl}" style="display: inline-block; background: #18181b; color: white; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
              Verify Email Address
            </a>
          </div>
          
          <p style="color: #a1a1aa; font-size: 13px; text-align: center; margin: 0 0 16px 0;">
            Or copy and paste this link into your browser:
          </p>
          <p style="color: #3b82f6; font-size: 12px; text-align: center; word-break: break-all; margin: 0 0 24px 0;">
            ${verifyUrl}
          </p>
          
          <p style="color: #a1a1aa; font-size: 13px; text-align: center; margin: 0 0 8px 0;">
            This link expires in 1 hour
          </p>
          <p style="color: #a1a1aa; font-size: 13px; text-align: center; margin: 0;">
            If you didn't create an account, you can safely ignore this email.
          </p>
        </div>
        
        <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin-top: 24px;">
          © ${new Date().getFullYear()} FinalCommit. All rights reserved.
        </p>
      </body>
      </html>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "FinalCommit <onboarding@resend.dev>",
        to: [email],
        subject: "Verify your email - FinalCommit",
        html: htmlContent,
      }),
    });

    const emailData = await response.json();

    if (!response.ok) {
      console.error("Resend error:", emailData);
      throw new Error(emailData.message || "Failed to send email");
    }

    console.log("Verification email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ success: true, message: "Verification email sent" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Send verification error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send verification email" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
