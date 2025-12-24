import { apiFetch } from "@/config/api";

/* =======================
   Types
   ======================= */
export interface ConsultationItemPayload {
  productId: string;
  qty: number;
}

export interface ConsultationResponse {
  whatsappMessage: string;
}

/* =======================
   Service
   ======================= */
export async function createConsultation(
  items: ConsultationItemPayload[]
): Promise<ConsultationResponse> {
  if (!items.length) {
    throw new Error("No hay productos para consultar");
  }

  return apiFetch<ConsultationResponse>("/api/v1/consultations", {
    method: "POST",
    body: JSON.stringify({ items }),
  });
}
