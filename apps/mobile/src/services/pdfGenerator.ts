import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { BudgetItem } from "../types";
import { formatPixKey, getPixType } from "../utils/formatters";

interface PDFProps {
  clientName: string;
  items: BudgetItem[];
  total: number;
  businessName?: string;
  pixKey?: string;
}

export async function generateAndSharePDF({
  clientName,
  items,
  total,
  businessName,
  pixKey,
}: PDFProps) {
  try {
    const companyTitle = businessName || "Cotador+";

    let pixBlock = "";
    if (pixKey && pixKey.length > 3) {
      const formattedKey = formatPixKey(pixKey);

      const typeLabel = getPixType(pixKey).toUpperCase();

      pixBlock = `
        <div style="background-color: #f0fdf4; padding: 15px; border: 1px solid #bbf7d0; border-radius: 8px; margin-top: 20px; text-align: center;">
            <div style="color: #166534; font-size: 12px; font-weight: bold; text-transform: uppercase; margin-bottom: 5px;">
                PAGAMENTO VIA PIX (${typeLabel})
            </div>
            <div style="font-size: 18px; font-weight: bold; color: #15803d; letter-spacing: 1px;">
                ${formattedKey}
            </div>
        </div>
      `;
    }

    const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { font-family: 'Helvetica', sans-serif; color: #333; padding: 30px; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; }
            .logo { font-size: 26px; font-weight: 900; color: #2563eb; text-transform: uppercase; letter-spacing: -1px; }
            .sub-title { font-size: 14px; color: #64748b; margin-top: 5px; }
            
            .info-grid { display: flex; justify-content: space-between; margin-bottom: 30px; background: #f8fafc; padding: 20px; border-radius: 12px; }
            .info-item { display: flex; flex-direction: column; }
            .label { font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: bold; margin-bottom: 4px; }
            .value { font-size: 16px; font-weight: bold; color: #334155; }
            
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { text-align: left; padding: 15px; background-color: #f1f5f9; color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: bold; }
            td { padding: 15px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #334155; }
            tr:last-child td { border-bottom: none; }
            
            .total-box { margin-top: 30px; text-align: right; padding-top: 20px; border-top: 2px solid #f1f5f9; }
            .total-label { font-size: 14px; color: #64748b; margin-bottom: 5px; }
            .total-value { font-size: 32px; font-weight: 900; color: #2563eb; }
            
            .footer { margin-top: 60px; text-align: center; font-size: 11px; color: #cbd5e1; }
        </style>
    </head>
    <body>

        <div class="header">
            <div class="logo">${companyTitle}</div>
            <div class="sub-title">Orçamento de Serviços</div>
        </div>

        <div class="info-grid">
            <div class="info-item">
                <span class="label">Cliente</span>
                <span class="value">${clientName || "Não informado"}</span>
            </div>
            <div class="info-item" style="text-align: right;">
                <span class="label">Data de Emissão</span>
                <span class="value">${new Date().toLocaleDateString("pt-BR")}</span>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th style="width: 60%">Descrição</th>
                    <th style="width: 15%; text-align: center">Qtd</th>
                    <th style="width: 25%; text-align: right">Preço</th>
                </tr>
            </thead>
            <tbody>
                ${items
                  .map(
                    (item) => `
                    <tr>
                        <td>${item.description}</td>
                        <td style="text-align: center; color: #64748b;">${item.quantity}</td>
                        <td style="text-align: right; font-weight: bold;">R$ ${(item.unit_price * item.quantity).toFixed(2).replace(".", ",")}</td>
                    </tr>
                `,
                  )
                  .join("")}
            </tbody>
        </table>

        <div class="total-box">
            <div class="total-label">VALOR TOTAL</div>
            <div class="total-value">R$ ${total.toFixed(2).replace(".", ",")}</div>
        </div>

        ${pixBlock}

        <div class="footer">
            Gerado via aplicativo <b>Cotador+</b>
        </div>

    </body>
    </html>
    `;

    const { uri } = await Print.printToFileAsync({ html: html, base64: false });
    await Sharing.shareAsync(uri);
  } catch (error) {
    console.error("Erro PDF:", error);
    throw error;
  }
}
