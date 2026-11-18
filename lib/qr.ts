// Server only (Server Components): keeps the qrcode library out of the browser bundle.
import QRCode from "qrcode";

/**
 * QR code as inline SVG markup that takes the color of its container
 * (`currentColor`) on a transparent background, so it follows the --rf-* palette.
 */
export async function qrSvg(url: string): Promise<string> {
  const svg = await QRCode.toString(url, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: "#000000", light: "#00000000" },
  });
  return svg.replaceAll('stroke="#000000"', 'stroke="currentColor"').replaceAll('fill="#000000"', 'fill="currentColor"');
}
