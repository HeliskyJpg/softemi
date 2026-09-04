import React, { useState } from 'react';
import {
  MessageCircle,
  Copy,
  Check,
  ExternalLink,
  FileText,
  AlertCircle,
  Phone,
  Info,
  Clock,
  Send,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Order } from '../../types';
import {
  buildWhatsAppShareUrl,
  generateOrderWhatsAppSummary,
  cleanGuatemalaPhoneNumber,
} from '../../services/whatsappService';
import { useApp } from '../../context/AppContext';

interface WhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onSuccess?: () => void;
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  isOpen,
  onClose,
  order,
  onSuccess,
}) => {
  const { logAction, addToast } = useApp();
  const [phoneNumber, setPhoneNumber] = useState(order.clientPhone || '');
  const [includeDetails, setIncludeDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generar mensaje y URL
  const { url, message, sanitizedPhone } = buildWhatsAppShareUrl(order, phoneNumber, {
    includeDetails,
  });

  // Manejar apertura de WhatsApp
  const handleOpenWhatsApp = () => {
    // Registrar en auditoría
    logAction({
      action: 'compartir por whatsapp',
      module: 'Pedidos',
      entityType: 'Order',
      recordId: order.code,
      description: `Comprobante de pedido ${order.code} compartido por WhatsApp para ${order.clientName} (${sanitizedPhone || 'sin número directo'}). Total: Q ${order.total.toFixed(2)}, Saldo: Q ${order.balance.toFixed(2)}.`,
      metadata: {
        orderId: order.id,
        orderCode: order.code,
        clientName: order.clientName,
        phoneUsed: sanitizedPhone || phoneNumber,
        total: order.total,
        balance: order.balance,
        status: order.status,
      },
    });

    // Abrir enlace en nueva pestaña
    window.open(url, '_blank', 'noopener,noreferrer');

    addToast(
      `Abriendo WhatsApp con el comprobante de ${order.code}. Acción registrada en auditoría.`,
      'success',
      'Compartir por WhatsApp'
    );

    if (onSuccess) onSuccess();
    onClose();
  };

  // Copiar texto al portapapeles
  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    addToast('Texto del comprobante copiado al portapapeles.', 'success');
    setTimeout(() => setCopied(false), 2500);

    // También auditar la copia de texto para mensajería
    logAction({
      action: 'copiar comprobante para whatsapp',
      module: 'Pedidos',
      entityType: 'Order',
      recordId: order.code,
      description: `Texto resumido del pedido ${order.code} copiado al portapapeles para mensajería.`,
      metadata: {
        orderCode: order.code,
        clientName: order.clientName,
      },
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Compartir Comprobante por WhatsApp"
      maxWidth="md"
    >
      <div className="space-y-4 text-xs">
        {/* Banner informativo de transparencia */}
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex items-start gap-2.5">
          <MessageCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="font-bold text-xs text-emerald-950">
              Enlace directo con mensaje precargado
            </h4>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Se generará el enlace oficial para abrir WhatsApp Web o la aplicación con el resumen del comprobante listo para enviar al cliente en Quetzales (Q).
            </p>
          </div>
        </div>

        {/* Campo de Teléfono Destinatario */}
        <div className="space-y-1.5">
          <label htmlFor="input-whatsapp-phone" className="block font-bold text-[#2C1E23]">
            Número de Teléfono (Cliente):
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7D6871] font-semibold">
              🇬🇹 +502
            </span>
            <input
              id="input-whatsapp-phone"
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Ej. 55551234"
              className="w-full pl-20 pr-3 py-2 bg-white border border-[#F2D6DE] rounded-xl text-xs text-[#2C1E23] focus:outline-none focus:border-[#681B2B] focus:ring-1 focus:ring-[#681B2B]"
            />
          </div>
          <p className="text-[10px] text-[#7D6871]">
            {sanitizedPhone ? (
              <span>Número formateado para WhatsApp: <strong>+{sanitizedPhone}</strong></span>
            ) : (
              <span>Si deja el número vacío, WhatsApp le permitirá elegir el contacto de su lista.</span>
            )}
          </p>
        </div>

        {/* Opciones de mensaje */}
        <div className="flex items-center gap-2">
          <input
            id="checkbox-include-details"
            type="checkbox"
            checked={includeDetails}
            onChange={(e) => setIncludeDetails(e.target.checked)}
            className="rounded border-[#F2D6DE] text-[#681B2B] focus:ring-[#681B2B]"
          />
          <label htmlFor="checkbox-include-details" className="text-xs text-[#2C1E23] cursor-pointer">
            Incluir descripción del arreglo y dedicatoria
          </label>
        </div>

        {/* Vista previa del mensaje precargado */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#2C1E23]">Mensaje sugerido a enviar:</span>
            <button
              type="button"
              onClick={handleCopyMessage}
              className="text-[#681B2B] hover:text-[#541421] font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar texto</span>
                </>
              )}
            </button>
          </div>

          <pre
            id="preview-whatsapp-message"
            className="p-3 bg-[#FDF8F9] border border-[#F2D6DE] rounded-xl font-mono text-[11px] text-[#2C1E23] whitespace-pre-wrap leading-relaxed select-all"
          >
            {message}
          </pre>
        </div>

        {/* ============================================================ */}
        {/* SECCIÓN SEPARADA: FUTURA ACCIÓN "ENVIAR PDF"                 */}
        {/* ============================================================ */}
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-700 font-bold">
              <FileText className="w-4 h-4 text-gray-500" />
              <span>Enviar PDF adjunto</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-bold">
              Próxima integración
            </span>
          </div>
          <p className="text-[11px] text-gray-600 leading-relaxed">
            La acción de <em>«Enviar PDF»</em> se mantendrá separada para cuando se configure la API oficial de WhatsApp Business (Meta Graph API / Twilio) o un microservicio de correo/mensajería que permita adjuntar el archivo binario generado por WeasyPrint.
          </p>
          <button
            type="button"
            disabled
            className="w-full py-1.5 px-3 rounded-lg bg-gray-200 text-gray-400 font-semibold text-[11px] cursor-not-allowed flex items-center justify-center gap-1.5"
            title="Requiere integración oficial de WhatsApp Business API"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Enviar PDF (Requiere WhatsApp Business API)</span>
          </button>
        </div>

        {/* Acciones principales */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F2D6DE]/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#F2D6DE] text-[#7D6871] hover:bg-gray-100 font-semibold text-xs transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            id="btn-confirm-open-whatsapp"
            type="button"
            onClick={handleOpenWhatsApp}
            className="px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>Abrir en WhatsApp</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </button>
        </div>
      </div>
    </Modal>
  );
};
