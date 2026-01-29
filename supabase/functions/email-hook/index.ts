import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailPayload {
  user: {
    email: string;
    user_metadata?: {
      name?: string;
    };
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
  };
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: EmailPayload = await req.json();
    
    console.log("Email hook received:", JSON.stringify({
      email: payload.user?.email,
      action_type: payload.email_data?.email_action_type,
      has_token: !!payload.email_data?.token_hash,
    }));

    const { user, email_data } = payload;
    const { token_hash, email_action_type, redirect_to, site_url } = email_data;
    const userEmail = user.email;
    const userName = user.user_metadata?.name || "there";

    // Build verification link using Supabase's auth endpoint
    const verifyType = email_action_type === "recovery" ? "recovery" : 
                       email_action_type === "signup" ? "signup" :
                       email_action_type === "email_change" ? "email_change" : "signup";
    
    const verificationLink = `${SUPABASE_URL}/auth/v1/verify?token=${token_hash}&type=${verifyType}&redirect_to=${encodeURIComponent(redirect_to)}`;

    let subject: string;
    let htmlContent: string;

    switch (email_action_type) {
      case "signup":
      case "email_change":
      case "confirmation":
        subject = "Verify your email - FinalCommit";
        htmlContent = `
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
                Hi ${userName}, click the button below to verify your email address and activate your account.
              </p>
              
              <div style="text-align: center; margin-bottom: 32px;">
                <a href="${verificationLink}" style="display: inline-block; background: #18181b; color: white; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                  Verify Email Address
                </a>
              </div>
              
              <p style="color: #a1a1aa; font-size: 13px; text-align: center; margin: 0 0 16px 0;">
                Or copy and paste this link into your browser:
              </p>
              <p style="color: #3b82f6; font-size: 12px; text-align: center; word-break: break-all; margin: 0 0 24px 0;">
                ${verificationLink}
              </p>
              
              <p style="color: #a1a1aa; font-size: 13px; text-align: center; margin: 0 0 8px 0;">
                This link expires in 1 hour
              </p>
              <p style="color: #a1a1aa; font-size: 13px; text-align: center; margin: 0;">
                If you didn't request this, you can safely ignore this email.
              </p>
            </div>
            
            <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin-top: 24px;">
              © ${new Date().getFullYear()} FinalCommit. All rights reserved.
            </p>
          </body>
          </html>
        `;
        break;

      case "recovery":
      case "reset_password":
        subject = "Reset your password - FinalCommit";
        htmlContent = `
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
                Reset your password
              </h2>
              <p style="color: #71717a; font-size: 15px; text-align: center; margin: 0 0 32px 0;">
                Hi ${userName}, click the button below to reset your password.
              </p>
              
              <div style="text-align: center; margin-bottom: 32px;">
                <a href="${verificationLink}" style="display: inline-block; background: #18181b; color: white; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                  Reset Password
                </a>
              </div>
              
              <p style="color: #a1a1aa; font-size: 13px; text-align: center; margin: 0 0 16px 0;">
                Or copy and paste this link into your browser:
              </p>
              <p style="color: #3b82f6; font-size: 12px; text-align: center; word-break: break-all; margin: 0 0 24px 0;">
                ${verificationLink}
              </p>
              
              <p style="color: #a1a1aa; font-size: 13px; text-align: center; margin: 0 0 8px 0;">
                This link expires in 1 hour
              </p>
              <p style="color: #a1a1aa; font-size: 13px; text-align: center; margin: 0;">
                If you didn't request this, you can safely ignore this email.
              </p>
            </div>
            
            <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin-top: 24px;">
              © ${new Date().getFullYear()} FinalCommit. All rights reserved.
            </p>
          </body>
          </html>
        `;
        break;

      case "magic_link":
        subject = "Your login link - FinalCommit";
        htmlContent = `
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
                Sign in to FinalCommit
              </h2>
              <p style="color: #71717a; font-size: 15px; text-align: center; margin: 0 0 32px 0;">
                Click the button below to sign in to your account.
              </p>
              
              <div style="text-align: center; margin-bottom: 32px;">
                <a href="${verificationLink}" style="display: inline-block; background: #18181b; color: white; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                  Sign In
                </a>
              </div>
              
              <p style="color: #a1a1aa; font-size: 13px; text-align: center; margin: 0 0 16px 0;">
                Or copy and paste this link into your browser:
              </p>
              <p style="color: #3b82f6; font-size: 12px; text-align: center; word-break: break-all; margin: 0 0 24px 0;">
                ${verificationLink}
              </p>
              
              <p style="color: #a1a1aa; font-size: 13px; text-align: center; margin: 0 0 8px 0;">
                This link expires in 1 hour
              </p>
              <p style="color: #a1a1aa; font-size: 13px; text-align: center; margin: 0;">
                If you didn't request this, you can safely ignore this email.
              </p>
            </div>
            
            <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin-top: 24px;">
              © ${new Date().getFullYear()} FinalCommit. All rights reserved.
            </p>
          </body>
          </html>
        `;
        break;

      default:
        console.log("Unknown email action type:", email_action_type);
        subject = "FinalCommit Notification";
        htmlContent = `
          <p>Click here to continue: <a href="${verificationLink}">${verificationLink}</a></p>
        `;
    }

    console.log("Sending email to:", userEmail, "with subject:", subject);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "FinalCommit <onboarding@resend.dev>",
        to: [userEmail],
        subject,
        html: htmlContent,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Resend error:", data);
      throw new Error(data.message || "Failed to send email");
    }

    console.log("Email sent successfully:", data);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Email hook error:", error);
    return new Response(
      JSON.stringify({ 
        error: { 
          http_code: 500, 
          message: error.message || "Failed to send email" 
        } 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
