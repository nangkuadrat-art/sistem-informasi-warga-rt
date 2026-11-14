import { formatRupiah } from '@/lib/utils/currency';

export function formatPhoneNumberWA(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (cleaned.startsWith('+62')) {
    cleaned = cleaned.slice(1);
  }
  return cleaned;
}

export async function sendWhatsappMessage(
  targetPhone: string,
  message: string
) {
  const token = process.env.FONNTE_TOKEN;
  if (!token) {
    return { status: false, message: 'Fonnte token tidak ditemukan' };
  }

  const formattedPhone = formatPhoneNumberWA(targetPhone);

  try {
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target: formattedPhone,
        message: message,
        countryCode: '62',
      }),
    });

    const result = await response.json();
    return result;
  } catch (err: any) {
    return { status: false, message: err.message };
  }
}
