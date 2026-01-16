import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface CreateUserRequest {
  email: string;
  password: string;
  full_name?: string;
  phone?: string;
  role: "admin" | "engineer" | "client";
  crm_type?: "generic" | "real_estate";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client for user management
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify the requesting user is an admin
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user using getClaims (works with signing-keys)
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    
    let requestingUserId: string;
    if (claimsError || !claimsData?.claims) {
      // Fallback to getUser for backward compatibility
      const { data: { user: requestingUser }, error: authError } = await supabaseClient.auth.getUser();
      if (authError || !requestingUser) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      requestingUserId = requestingUser.id;
    } else {
      requestingUserId = claimsData.claims.sub as string;
    }
    
    // Create user object for compatibility
    const requestingUser = { id: requestingUserId };

    // Check if requesting user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .single();

    if (roleError || roleData?.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Only admins can create users" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: CreateUserRequest = await req.json();
    const { email, password, full_name, phone, role, crm_type } = body;

    if (!email || !password || !role) {
      return new Response(
        JSON.stringify({ error: "Email, password, and role are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    let userId: string;
    let isExisting = false;

    if (existingUser) {
      // User already exists - check if they have the same role
      const { data: existingRole } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", existingUser.id)
        .maybeSingle();

      if (existingRole) {
        return new Response(
          JSON.stringify({ error: `User already exists with role: ${existingRole.role}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // User exists in auth but no role - assign the role
      userId = existingUser.id;
      isExisting = true;

      // Update password and metadata
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password,
        user_metadata: { full_name },
      });
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name },
      });

      if (createError) {
        return new Response(
          JSON.stringify({ error: createError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!newUser.user) {
        return new Response(
          JSON.stringify({ error: "Failed to create user" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      userId = newUser.user.id;
    }

    // Create or update profile with CRM type for clients
    if (!isExisting) {
      const profileData: Record<string, unknown> = {
        user_id: userId,
        email,
        full_name: full_name || null,
        phone: phone || null,
      };
      
      // Add CRM type for clients
      if (role === "client" && crm_type) {
        profileData.crm_type = crm_type;
      }

      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .insert(profileData);

      if (profileError) {
        console.error("Profile creation error:", profileError);
      }
    } else {
      // Update existing profile
      const updateData: Record<string, unknown> = {
        full_name: full_name || null,
        phone: phone || null,
      };
      
      if (role === "client" && crm_type) {
        updateData.crm_type = crm_type;
      }

      await supabaseAdmin
        .from("profiles")
        .update(updateData)
        .eq("user_id", userId);
    }

    // Assign role
    const { error: roleInsertError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: userId,
        role,
      });

    if (roleInsertError) {
      console.error("Role assignment error:", roleInsertError);
    }

    // If role is client, create initial credits record
    if (role === "client") {
      const { error: creditsError } = await supabaseAdmin
        .from("client_credits")
        .insert({
          client_id: userId,
          balance: 0,
        });

      if (creditsError) {
        console.error("Credits creation error:", creditsError);
      }
    }

    // If role is engineer, create initial points record
    if (role === "engineer") {
      const { error: pointsError } = await supabaseAdmin
        .from("engineer_points")
        .insert({
          engineer_id: userId,
          total_points: 0,
        });

      if (pointsError) {
        console.error("Points creation error:", pointsError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: userId,
          email,
          role,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
