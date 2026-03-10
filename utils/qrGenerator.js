import QRCode from "qrcode";

export const generateQRCode = async (data) => {
  const qrCode = await QRCode.toDataURL(data);
  return qrCode;
};