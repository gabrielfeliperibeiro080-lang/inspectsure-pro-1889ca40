import jsPDF from "jspdf";
import type { Inspection, Property } from "./types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_LABEL: Record<string, string> = {
  ok: "OK",
  danificado: "Danificado",
  observacao: "Observação",
};

export async function generateInspectionPdf(
  inspection: Inspection,
  property: Property,
): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 40;
  let y = M;

  const ensure = (need: number) => {
    if (y + need > H - M) {
      addFooter();
      doc.addPage();
      y = M;
    }
  };

  const addFooter = () => {
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(
      `Córtex Vistoria Pro · Documento com validade jurídica · Hash: ${inspection.hash?.slice(0, 32) ?? "—"}`,
      M,
      H - 20,
    );
  };

  // Header
  doc.setFillColor(34, 47, 90);
  doc.rect(0, 0, W, 70, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Córtex Vistoria Pro", M, 32);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    `Relatório de Vistoria de ${inspection.type === "entrada" ? "Entrada" : "Saída"}`,
    M,
    50,
  );
  doc.setFontSize(9);
  doc.text(
    format(new Date(inspection.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }),
    W - M,
    50,
    { align: "right" },
  );
  y = 90;
  doc.setTextColor(0);

  // Property
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Dados do imóvel", M, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const addr = `${property.street}, ${property.number}${property.complement ? " " + property.complement : ""} — ${property.neighborhood}, ${property.city}/${property.state} · CEP ${property.zip}`;
  const lines = doc.splitTextToSize(
    `Código: ${property.code}\nTipo: ${property.type}\nEndereço: ${addr}\nProprietário: ${property.ownerName}`,
    W - 2 * M,
  );
  doc.text(lines, M, y);
  y += lines.length * 12 + 8;

  // Inspection info
  doc.setFont("helvetica", "bold");
  doc.text("Vistoria", M, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  const info = `Responsável: ${inspection.inspectorName}${inspection.tenantName ? "\nInquilino: " + inspection.tenantName : ""}\nIP: ${inspection.ip ?? "—"}    Geo: ${inspection.geo ? inspection.geo.lat.toFixed(5) + ", " + inspection.geo.lng.toFixed(5) : "—"}`;
  const infoLines = doc.splitTextToSize(info, W - 2 * M);
  doc.text(infoLines, M, y);
  y += infoLines.length * 12 + 10;

  // Rooms
  for (const room of inspection.rooms) {
    ensure(40);
    doc.setFillColor(240, 243, 250);
    doc.rect(M, y - 12, W - 2 * M, 22, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(room.name, M + 8, y + 3);
    y += 22;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    for (const item of room.items) {
      ensure(20);
      const status = item.status ? STATUS_LABEL[item.status] : "—";
      doc.setTextColor(60);
      doc.text(`• ${item.name}`, M + 12, y);
      const color =
        item.status === "ok"
          ? [16, 122, 80]
          : item.status === "danificado"
            ? [200, 40, 40]
            : item.status === "observacao"
              ? [180, 130, 20]
              : [120, 120, 120];
      doc.setTextColor(color[0], color[1], color[2]);
      doc.text(status, W - M - 12, y, { align: "right" });
      doc.setTextColor(60);
      y += 14;
      if (item.note) {
        const note = doc.splitTextToSize(`   Obs: ${item.note}`, W - 2 * M - 24);
        ensure(note.length * 12);
        doc.setTextColor(110);
        doc.text(note, M + 12, y);
        y += note.length * 12;
        doc.setTextColor(60);
      }
      // photos: render up to 3 thumbnails per row
      if (item.photos.length) {
        ensure(90);
        let x = M + 12;
        const size = 90;
        for (const p of item.photos.slice(0, 6)) {
          try {
            doc.addImage(p, "WEBP", x, y, size, size, undefined, "FAST");
          } catch {
            try {
              doc.addImage(p, "JPEG", x, y, size, size, undefined, "FAST");
            } catch {
              /* ignore */
            }
          }
          x += size + 6;
          if (x + size > W - M) {
            x = M + 12;
            y += size + 6;
            ensure(90);
          }
        }
        y += size + 10;
      }
    }
    y += 6;
  }

  // Notes
  if (inspection.generalNotes) {
    ensure(60);
    doc.setFont("helvetica", "bold");
    doc.text("Observações gerais", M, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(inspection.generalNotes, W - 2 * M);
    doc.text(lines, M, y);
    y += lines.length * 12 + 10;
  }

  // Signatures
  if (inspection.signatures.length) {
    ensure(160);
    doc.setFont("helvetica", "bold");
    doc.text("Assinaturas", M, y);
    y += 14;
    for (const s of inspection.signatures) {
      ensure(110);
      try {
        doc.addImage(s.dataUrl, "PNG", M, y, 180, 70);
      } catch {
        /* ignore */
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`${s.name} (${s.role === "vistoriador" ? "Vistoriador" : "Cliente"})`, M + 200, y + 20);
      doc.setFontSize(9);
      doc.setTextColor(110);
      doc.text(
        `Assinado em ${format(new Date(s.signedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}\nIP: ${s.ip ?? "—"}  ·  Geo: ${s.geo ? s.geo.lat.toFixed(5) + ", " + s.geo.lng.toFixed(5) : "—"}`,
        M + 200,
        y + 36,
      );
      doc.setTextColor(0);
      y += 90;
    }
  }

  // Legal block
  ensure(80);
  doc.setDrawColor(200);
  doc.line(M, y, W - M, y);
  y += 14;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Validade jurídica", M, y);
  y += 12;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80);
  const legal = doc.splitTextToSize(
    `Este documento foi gerado eletronicamente pelo Córtex Vistoria Pro com registro de IP, geolocalização e carimbo de tempo. Sua integridade pode ser verificada pelo hash SHA-256 abaixo.\n\nHash: ${inspection.hash ?? "—"}`,
    W - 2 * M,
  );
  doc.text(legal, M, y);
  y += legal.length * 11;

  addFooter();
  return doc;
}
