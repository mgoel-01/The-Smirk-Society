import "server-only";
import QRCode from "qrcode";

/** QR as a PNG buffer — used as an email attachment. */
export async function qrPngBuffer(text: string): Promise<Buffer> {
  return QRCode.toBuffer(text, {
    type: "png",
    errorCorrectionLevel: "M",
    margin: 2,
    width: 640,
    color: { dark: "#2A0A14", light: "#FFFFFF" },
  });
}

/** QR as a data URL — used to render the ticket in the browser. */
export async function qrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 520,
    color: { dark: "#2A0A14", light: "#FFFFFF" },
  });
}
