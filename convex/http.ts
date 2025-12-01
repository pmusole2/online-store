import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// Clerk webhook handler
http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const payload = await request.json();
    const eventType = payload.type;

    try {
      switch (eventType) {
        case "user.created": {
          const { id, email_addresses, first_name, last_name, image_url } = payload.data;
          const primaryEmail = email_addresses?.[0]?.email_address;

          if (primaryEmail) {
            await ctx.runMutation(api.users.upsertUser, {
              clerkId: id,
              email: primaryEmail,
              firstName: first_name || "",
              lastName: last_name || "",
              avatar: image_url,
            });
          }
          break;
        }

        case "user.updated": {
          const { id, email_addresses, first_name, last_name, image_url } = payload.data;
          const primaryEmail = email_addresses?.[0]?.email_address;

          if (primaryEmail) {
            await ctx.runMutation(api.users.upsertUser, {
              clerkId: id,
              email: primaryEmail,
              firstName: first_name || "",
              lastName: last_name || "",
              avatar: image_url,
            });
          }
          break;
        }

        case "user.deleted": {
          // Handle user deletion if needed
          // Note: You might want to soft-delete or anonymize instead
          console.log("User deleted:", payload.data.id);
          break;
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Webhook error:", error);
      return new Response(
        JSON.stringify({ error: "Webhook processing failed" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

// Health check endpoint
http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(
      JSON.stringify({
        status: "ok",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }),
});

export default http;
