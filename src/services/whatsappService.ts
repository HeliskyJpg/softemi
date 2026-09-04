import { Order } from '../types';

/**
 * Normaliza y formatea números de teléfono de Guatemala para enlaces de WhatsApp.
 * Si tiene 8 dígitos (ej. 55551234), le añade el código de país '502'.
 */
export function cleanGuatemalaPhoneNumber(phone?: string | null): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 8) {
    return `502${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('502')) {
    return digits;
  }
  // Retorna los dígitos limpios si ya tiene formato internacional
  return digits;
}

/**
 * Genera el texto resumido oficial del pedido para compartir por WhatsApp
 * según las especificaciones de EMILA Floristería.
 *
 * Formato requerido:
 * EMILA
 * Pedido PED-XXXX
 * Cliente: ...
 * Total: Q...
 * Pagado: Q...
 * Saldo: Q...
 */
export function generateOrderWhatsAppSummary(
  order: Order,
  options: { includeDetails?: boolean } = {}
): string {
  const lines: string[] = [
    'EMILA',
    `Pedido ${order.code}`,
    `Cliente: ${order.clientName}`,
    `Total: Q ${order.total.toFixed(2)}`,
    `Pagado: Q ${order.advancePayment.toFixed(2)}`,
    `Saldo: Q ${order.balance.toFixed(2)}`,
  ];

  // Datos complementarios de entrega y estado
  if (order.status) {
    lines.push(`Estado: ${order.status}`);
  }
  if (order.deliveryDate) {
    const timeInfo = order.deliveryTime ? ` (${order.deliveryTime})` : '';
    lines.push(`Entrega: ${order.deliveryDate}${timeInfo}`);
  }

  // Si se solicitan detalles de componentes/dedicatoria
  if (options.includeDetails) {
    if (order.description) {
      lines.push(`Arreglo: ${order.description}`);
    }
    if (order.observations) {
      lines.push(`Dedicatoria: "${order.observations}"`);
    }
  }

  return lines.join('\n');
}

/**
 * Construye la URL de WhatsApp para compartir el mensaje precargado.
 * Si el cliente tiene un número telefónico válido registrado, se asocia directamente a su chat.
 * Si no tiene teléfono, genera el enlace universal de compartir para que el usuario seleccione el contacto.
 */
export function buildWhatsAppShareUrl(
  order: Order,
  targetPhone?: string,
  options?: { includeDetails?: boolean }
): { url: string; message: string; sanitizedPhone: string } {
  const message = generateOrderWhatsAppSummary(order, options);
  const rawPhone = targetPhone !== undefined ? targetPhone : order.clientPhone;
  const sanitizedPhone = cleanGuatemalaPhoneNumber(rawPhone);

  const encodedText = encodeURIComponent(message);

  let url: string;
  if (sanitizedPhone) {
    url = `https://api.whatsapp.com/send?phone=${sanitizedPhone}&text=${encodedText}`;
  } else {
    url = `https://api.whatsapp.com/send?text=${encodedText}`;
  }

  return {
    url,
    message,
    sanitizedPhone,
  };
}
