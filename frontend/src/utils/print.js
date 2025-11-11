export function printReceipt(sale, opts = {}) {
  const {
    width = "58mm",               // "58mm" o "80mm"
    title = "Ticket",
    store = "Kiosco PV-0001",
    address = "",
    footer = "¡Gracias por su compra!",
  } = opts;

  const w = window.open("", "TICKET", "width=320,height=600");
  const css = `
    <style>
      @page { size: ${width} auto; margin: 0; }
      @media print { 
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
      body { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; margin:0; padding: 8px; }
      .c { text-align:center }
      .r { text-align:right }
      hr { border: 0; border-top: 1px dashed #333; margin: 6px 0 }
      table { width: 100%; border-collapse: collapse }
      td { padding: 2px 0; vertical-align: top }
      .tot { font-weight: bold; }
      small { color:#333 }
    </style>
  `;
  const items = (sale.items || []).map(i => {
    const name = (i.product_name || "").substring(0, 28);
    const line1 = `
      <tr>
        <td colspan="2">${name}</td>
      </tr>`;
    const line2 = `
      <tr>
        <td>x${i.qty} @ $${Number(i.price).toFixed(2)}</td>
        <td class="r">$${Number(i.total).toFixed(2)}</td>
      </tr>`;
    return line1 + line2;
  }).join("");

  const html = `
    <html>
      <head><meta charset="utf-8"><title>${title}</title>${css}</head>
      <body>
        <div class="c"><strong>${store}</strong><br/>${address ? `<small>${address}</small>` : ""}</div>
        <hr/>
        <div><small>${new Date(sale.datetime).toLocaleString('es-AR')}</small></div>
        <div><small>Venta #${sale.id || "-"}</small></div>
        <hr/>
        <table>${items}</table>
        <hr/>
        <table>
          <tr><td>Subtotal</td><td class="r">$${Number(sale.subtotal).toFixed(2)}</td></tr>
          <tr><td>IVA</td><td class="r">$${Number(sale.tax_total).toFixed(2)}</td></tr>
          ${Number(sale.discount||0) > 0 ? `<tr><td>Descuento</td><td class="r">-$${Number(sale.discount).toFixed(2)}</td></tr>` : ""}
          <tr class="tot"><td>Total</td><td class="r">$${Number(sale.total).toFixed(2)}</td></tr>
          <tr><td>Método</td><td class="r">${sale.payment_method}</td></tr>
        </table>
        <hr/>
        <div class="c"><small>${footer}</small></div>
        <script>
          window.onload = () => {
            window.print();
            setTimeout(()=>window.close(), 300);
          };
        </script>
      </body>
    </html>
  `;
  w.document.open();
  w.document.write(html);
  w.document.close();
}
