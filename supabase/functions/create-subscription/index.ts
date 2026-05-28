import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Trata requisições OPTIONS (CORS)
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, userId } = await req.json();

    const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!MERCADOPAGO_ACCESS_TOKEN) {
      throw new Error("Mercado Pago token não configurado");
    }

    // Cria a assinatura usando a API de Preapproval do Mercado Pago
    // Nota: O Preapproval (Subscriptions) foca em cartão, mas aceita configurações da conta.
    const response = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reason: "Assinatura Mensal - InspectSure Pro",
        external_reference: userId,
        payer_email: email,
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: 49.90, // Valor de exemplo, ajuste conforme necessário
          currency_id: "BRL"
        },
        back_url: "https://inspectsure.com.br/app/configuracoes",
        status: "pending"
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Erro no Mercado Pago:", data);
      throw new Error("Falha ao criar link de assinatura no Mercado Pago");
    }

    // O init_point é a URL para redirecionar o usuário
    return new Response(JSON.stringify({ init_point: data.init_point }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
