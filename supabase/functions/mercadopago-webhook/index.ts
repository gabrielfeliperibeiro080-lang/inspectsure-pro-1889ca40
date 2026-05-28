import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || url.searchParams.get("topic");
    const id = url.searchParams.get("data.id") || url.searchParams.get("id");

    console.log(`Recebido webhook do Mercado Pago. Ação: ${action}, ID: ${id}`);

    // Só processamos eventos de pagamento ou preapproval
    if ((action === "payment" || action === "preapproval") && id) {
      const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
      
      // Busca detalhes do pagamento/assinatura
      const endpoint = action === "payment" 
        ? `https://api.mercadopago.com/v1/payments/${id}`
        : `https://api.mercadopago.com/preapproval/${id}`;
        
      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}` }
      });
      
      const data = await response.json();
      console.log("Detalhes da transação:", data);

      if (data.status === "approved" || data.status === "authorized") {
        const userId = data.external_reference; // O ID do usuário que passamos na criação
        
        if (userId) {
          // Conecta no banco de dados usando Service Role Key (para ignorar RLS)
          const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
          );

          // Atualiza a tabela profiles com o status ativo e o ID da assinatura
          const { error } = await supabaseAdmin
            .from("profiles")
            .update({
              subscription_status: "active",
              subscription_id: action === "preapproval" ? id : data.order?.id,
            })
            .eq("id", userId);

          if (error) {
            console.error("Erro ao atualizar o Supabase:", error);
          } else {
            console.log(`Assinatura do usuário ${userId} ativada com sucesso.`);
          }
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    console.error("Erro no Webhook:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
});
