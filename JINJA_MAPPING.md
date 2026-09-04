# Guía de Arquitectura UI y Mapeo Flask + Jinja (EMILA)

Esta guía documenta la base de componentes y tokens de diseño implementada en EMILA para permitir su traslado directo y desacoplado a **Flask + Jinja2**.

---

## 1. Tokens Globales (`tokens.css` / `:root`)

Todos los componentes utilizan variables CSS estándar definidas en `index.css` (o un `theme.css` global en Flask):

```css
:root {
  /* Paleta EMILA */
  --bg-main: #FBECEF;
  --surface: #FFFFFF;
  --primary: #681B2B;
  --primary-hover: #541421;
  --text-main: #2C1E23;
  --text-muted: #7D6871;
  --border-soft: #F2D6DE;
  --border-medium: #E8C4CE;

  /* Estados semánticos */
  --color-success: #059669;
  --color-warning: #D97706;
  --color-danger: #DC2626;
  --color-info: #2563EB;

  /* Alturas de Inputs */
  --input-height-sm: 34px;
  --input-height-md: 42px;
  --input-height-lg: 48px;

  /* Ancho Máximo de Formularios */
  --form-max-sm: 24rem;  /* 384px */
  --form-max-md: 28rem;  /* 448px */
  --form-max-lg: 42rem;  /* 672px */
  --form-max-xl: 56rem;  /* 896px */
  --form-max-full: 64rem;/* 1024px */
}
```

---

## 2. Equivalencias de Componentes a Macros de Jinja2

### 2.1 `FormField` -> `{% macro form_field(...) %}`
```jinja
{% macro form_field(id, label, error=none, required=false, helper=none, max_w='full') %}
<div class="space-y-1.5 {{ 'max-w-md' if max_w == 'md' else 'w-full' }}">
  {% if label %}
    <label for="{{ id }}" class="emila-label">
      {{ label }}
      {% if required %}<span class="emila-label-required">*</span>{% endif %}
    </label>
  {% endif %}

  {{ caller() }}

  {% if error %}
    <p id="error-{{ id }}" class="text-xs font-semibold text-rose-600 mt-1 flex items-center gap-1">
      <span>{{ error }}</span>
    </p>
  {% elif helper %}
    <p class="text-[11px] text-[#7D6871] mt-1">{{ helper }}</p>
  {% endif %}
</div>
{% endmacro %}
```

---

### 2.2 `AutocompleteSelect` -> `{% macro autocomplete_select(...) %}`
*Regla Global: Cualquier dropdown de negocio utiliza búsqueda.*

```jinja
{% macro autocomplete_select(id, name, options, value="", placeholder="Seleccionar una opción...", searchable=true) %}
<div class="relative w-full" data-emila-select id="{{ id }}-wrapper">
  <input type="hidden" id="{{ id }}" name="{{ name }}" value="{{ value }}">
  
  <div class="emila-input emila-input-md cursor-pointer justify-between" tabindex="0" role="combobox">
    <span class="truncate selected-text text-[#2C1E23]">{{ placeholder }}</span>
    <svg class="w-4 h-4 text-[#7D6871]" ...></svg>
  </div>

  <div class="dropdown-list hidden absolute z-50 left-0 right-0 mt-1 bg-white rounded-xl border border-[#F2D6DE] shadow-xl">
    {% if searchable %}
      <div class="p-2 border-b border-[#F2D6DE]">
        <input type="text" class="w-full text-xs p-1 outline-none" placeholder="Buscar...">
      </div>
    {% endif %}
    <ul class="max-h-56 overflow-y-auto divide-y divide-gray-50">
      {% for opt in options %}
        <li class="px-3.5 py-2 text-xs hover:bg-[#FBECEF] cursor-pointer" data-val="{{ opt.value }}">
          {{ opt.label }}
        </li>
      {% endfor %}
    </ul>
  </div>
</div>
{% endmacro %}
```

---

### 2.3 `TextArea` con Contador -> `{% macro textarea_with_counter(...) %}`
```jinja
{% macro textarea_with_counter(id, name, value="", max_length=200, rows=3, placeholder="") %}
<div class="space-y-1.5 w-full">
  <textarea id="{{ id }}" name="{{ name }}" rows="{{ rows }}" maxlength="{{ max_length }}"
            placeholder="{{ placeholder }}"
            class="emila-input rounded-xl px-3.5 py-2.5 text-sm resize-none"
            oninput="document.getElementById('{{ id }}-counter').textContent = this.value.length + ' / {{ max_length }}'">{{ value }}</textarea>
  <div class="flex justify-end">
    <span id="{{ id }}-counter" class="text-[11px] text-[#7D6871] font-medium">
      {{ value|length }} / {{ max_length }}
    </span>
  </div>
</div>
{% endmacro %}
```

---

### 2.4 `Modal` Responsive -> `{% macro modal(...) %}`
```jinja
{% macro modal(id, title, size='md') %}
<div id="{{ id }}" class="hidden fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs">
  <div class="bg-white rounded-2xl w-full {{ 'max-w-md' if size == 'md' else 'max-w-2xl' }} shadow-2xl border border-[#F2D6DE] max-h-[90dvh] flex flex-col overflow-hidden">
    <div class="flex items-center justify-between p-4 sm:p-6 border-b border-[#F2D6DE]/60">
      <h3 class="text-base sm:text-lg font-bold text-[#2C1E23]">{{ title }}</h3>
      <button type="button" onclick="closeModal('{{ id }}')" class="p-1 rounded-lg text-[#7D6871] hover:bg-gray-100">✕</button>
    </div>
    <div class="flex-1 overflow-y-auto p-4 sm:p-6">
      {{ caller() }}
    </div>
  </div>
</div>
{% endmacro %}
```

---

### 2.5 `QuantityInput` -> `{% macro quantity_input(...) %}`
```jinja
{% macro quantity_input(id, name, value=1, min=1, max=none) %}
<div class="inline-flex items-center rounded-xl border border-[#F2D6DE] bg-white h-[42px] px-2">
  <input type="text" id="{{ id }}" name="{{ name }}" value="{{ value }}" inputmode="numeric"
         class="w-16 text-center font-bold text-sm outline-none"
         oninput="this.value = this.value.replace(/[^0-9]/g, '')">
</div>
{% endmacro %}
```

---

### 2.6 `EmptyState` -> `{% macro empty_state(...) %}`
```jinja
{% macro empty_state(title, description="", action_label=none, action_url="#") %}
<div class="flex flex-col items-center justify-center text-center py-12 px-4">
  <div class="w-12 h-12 rounded-2xl bg-[#FBECEF] border border-[#F2D6DE] flex items-center justify-center text-[#681B2B] mb-3">
    📦
  </div>
  <h3 class="text-base font-bold text-[#2C1E23]">{{ title }}</h3>
  {% if description %}<p class="text-xs text-[#7D6871] max-w-sm mt-1">{{ description }}</p>{% endif %}
  {% if action_label %}
    <a href="{{ action_url }}" class="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-[#681B2B] text-white">
      {{ action_label }}
    </a>
  {% endif %}
</div>
{% endmacro %}
```

---

### 2.7 `MoneyFormatter` & `DateFormatter` (Filtros de Jinja)
En Flask, se registran como filtros en `app.py`:

```python
@app.template_filter('format_money')
def format_money(amount, currency='Q'):
    if amount is None:
        return f"{currency} 0.00"
    return f"{currency} {amount:,.2f}"

@app.template_filter('format_date')
def format_date(value, fmt='medium'):
    # Lógica de fecha en español
    ...
```

Uso en plantillas Jinja:
```jinja
<span>{{ order.total | format_money }}</span>
<span>{{ order.delivery_date | format_date }}</span>
```

---

## 3. Mapeo del Comprobante de Pedido (Flask + Jinja2 + WeasyPrint)

La vista de **Comprobante de pedido** (`OrderReceiptDocument.tsx` / `OrderReceiptView.tsx`) fue diseñada desacoplada como un documento independiente para ser renderizada en el navegador y compilada a PDF mediante **WeasyPrint** en Python/Flask.

> **Regla de Negocio:** No se denomina "Factura", dado que no constituye documento contable fiscal. Todos los montos se expresan exclusivamente en Quetzales (Q).

### 3.1 Controlador en Flask (`orders.py`)

```python
from flask import Blueprint, render_template, make_response, abort
from weasyprint import HTML, CSS
from models import Order

orders_bp = Blueprint('orders', __name__)

@orders_bp.route('/pedidos/<int:order_id>/comprobante')
def ver_comprobante(order_id):
    """Renderiza el comprobante como vista web imprimible."""
    order = Order.query.get_or_404(order_id)
    return render_template('reports/order_receipt.html', order=order)

@orders_bp.route('/pedidos/<int:order_id>/comprobante.pdf')
def descargar_comprobante_pdf(order_id):
    """Compila y descarga el comprobante en formato PDF mediante WeasyPrint."""
    order = Order.query.get_or_404(order_id)
    rendered_html = render_template('reports/order_receipt.html', order=order, is_pdf=True)
    
    # Renderizar PDF con WeasyPrint
    pdf = HTML(string=rendered_html).write_pdf()
    
    response = make_response(pdf)
    response.headers['Content-Type'] = 'application/pdf'
    response.headers['Content-Disposition'] = f'inline; filename=Comprobante_{order.code}.pdf'
    return response
```

### 3.2 Plantilla Jinja2 (`templates/reports/order_receipt.html`)

```jinja
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Comprobante de Pedido {{ order.code }} - EMILA Floristería</title>
  <style>
    @page {
      size: letter portrait;
      margin: 12mm 15mm;
      @bottom-center {
        content: "Documento de control interno no fiscal - EMILA Floristería";
        font-size: 8pt;
        color: #7D6871;
      }
    }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: #2C1E23;
      background: #FFFFFF;
      font-size: 11pt;
      margin: 0;
      padding: 0;
    }
    .header-table { width: 100%; border-bottom: 2px solid #681B2B; padding-bottom: 12px; }
    .emila-title { font-size: 20pt; font-weight: bold; color: #681B2B; margin: 0; }
    .badge-comprobante { background: #FBECEF; color: #681B2B; padding: 4px 8px; font-size: 9pt; font-weight: bold; border-radius: 4px; }
    .order-code { font-size: 18pt; font-weight: bold; color: #2C1E23; margin: 4px 0; }
    
    .info-grid { width: 100%; margin: 15px 0; border-collapse: separate; border-spacing: 10px; }
    .info-card { background: #FDF8F9; border: 1px solid #F2D6DE; border-radius: 8px; padding: 10px; vertical-align: top; width: 50%; font-size: 9pt; }
    .card-title { color: #681B2B; font-weight: bold; font-size: 9pt; border-bottom: 1px solid #F2D6DE; padding-bottom: 4px; margin-bottom: 6px; text-transform: uppercase; }
    
    .table-items { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 9pt; }
    .table-items th { background: #FBECEF; color: #681B2B; padding: 8px; text-align: left; font-weight: bold; border-bottom: 1px solid #E8C4CE; }
    .table-items td { padding: 8px; border-bottom: 1px solid #F2D6DE; }
    
    .financial-box { background: #FDF8F9; border: 1px solid #E8C4CE; border-radius: 8px; padding: 12px; font-size: 9pt; width: 280px; float: right; margin-bottom: 20px; }
    .sign-table { width: 100%; margin-top: 40px; clear: both; }
    .sign-line { border-bottom: 1px solid #999; height: 35px; width: 90%; }
  </style>
</head>
<body>
  <!-- Encabezado Institucional -->
  <table class="header-table">
    <tr>
      <td style="vertical-align: middle;">
        <h1 class="emila-title">EMILA Floristería</h1>
        <div style="font-size: 9pt; color: #7D6871;">Arreglos y Detalles Personalizados &bull; Guatemala</div>
      </td>
      <td style="text-align: right; vertical-align: middle;">
        <span class="badge-comprobante">COMPROBANTE DE PEDIDO</span>
        <div class="order-code">{{ order.code }}</div>
        <div style="font-size: 9pt; color: #7D6871;">Estado: <strong>{{ order.status }}</strong></div>
      </td>
    </tr>
  </table>

  <!-- Información de Cliente y Entrega -->
  <table class="info-grid">
    <tr>
      <td class="info-card">
        <div class="card-title">Datos del Cliente</div>
        <div><strong>Cliente:</strong> {{ order.client_name }}</div>
        <div><strong>Teléfono:</strong> {{ order.client_phone or 'No registrado' }}</div>
        <div><strong>Canal:</strong> {{ order.channel }}</div>
      </td>
      <td class="info-card">
        <div class="card-title">Programación de Entrega</div>
        <div><strong>Fecha Registro:</strong> {{ order.created_at }}</div>
        <div><strong>Fecha Entrega:</strong> {{ order.delivery_date }}</div>
        <div><strong>Hora Programada:</strong> {{ order.delivery_time or 'Por coordinar' }}</div>
      </td>
    </tr>
  </table>

  <!-- Descripción del Arreglo -->
  <div style="margin: 10px 0; font-size: 9.5pt;">
    <strong>Descripción del Arreglo:</strong> {{ order.description }}
    {% if order.observations %}
    <div style="margin-top: 6px; padding: 8px; background: #FBECEF; border: 1px solid #F2D6DE; border-radius: 6px; font-style: italic;">
      <strong>Dedicatoria / Observaciones:</strong> "{{ order.observations }}"
    </div>
    {% endif %}
  </div>

  <!-- Tabla de Componentes -->
  <table class="table-items">
    <thead>
      <tr>
        <th style="width: 50px; text-align: center;">Cant.</th>
        <th>Componente / Insumo</th>
        <th>Categoría</th>
        <th style="text-align: right; width: 90px;">Precio Unit.</th>
        <th style="text-align: right; width: 90px;">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      {% for item in order.items %}
      <tr>
        <td style="text-align: center; font-weight: bold;">{{ item.quantity }}</td>
        <td>{{ item.component_name }}</td>
        <td>{{ item.category }}</td>
        <td style="text-align: right;">Q {{ "%.2f"|format(item.unit_price) }}</td>
        <td style="text-align: right; font-weight: bold; color: #681B2B;">Q {{ "%.2f"|format(item.subtotal) }}</td>
      </tr>
      {% endfor %}
    </tbody>
  </table>

  <!-- Resumen Financiero -->
  <div class="financial-box">
    <table style="width: 100%;">
      <tr>
        <td>Subtotal:</td>
        <td style="text-align: right;">Q {{ "%.2f"|format(order.subtotal) }}</td>
      </tr>
      <tr style="font-weight: bold; color: #681B2B; font-size: 11pt; border-top: 1px solid #E8C4CE;">
        <td style="padding-top: 6px;">TOTAL:</td>
        <td style="text-align: right; padding-top: 6px;">Q {{ "%.2f"|format(order.total) }}</td>
      </tr>
      <tr style="color: #059669; font-weight: bold;">
        <td>Total Pagado:</td>
        <td style="text-align: right;">Q {{ "%.2f"|format(order.advance_payment) }}</td>
      </tr>
      <tr style="font-weight: bold; border-top: 1px solid #E8C4CE;">
        <td style="padding-top: 6px;">SALDO PENDIENTE:</td>
        <td style="text-align: right; padding-top: 6px; color: {{ '#059669' if order.balance <= 0 else '#DC2626' }};">
          Q {{ "%.2f"|format(order.balance) }}
        </td>
      </tr>
    </table>
  </div>

  <!-- Firmas -->
  <table class="sign-table">
    <tr>
      <td style="width: 50%; text-align: center; font-size: 8pt; color: #7D6871;">
        <div class="sign-line" style="margin: 0 auto 5px auto;"></div>
        Recibí Conforme (Firma y DPI del Cliente)
      </td>
      <td style="width: 50%; text-align: center; font-size: 8pt; color: #7D6871;">
        <div class="sign-line" style="margin: 0 auto 5px auto;"></div>
        Taller EMILA Floristería
      </td>
    </tr>
  </table>

  <!-- Leyenda No Fiscal -->
  <div style="margin-top: 30px; text-align: center; font-size: 7.5pt; color: #7D6871; border-top: 1px solid #F2D6DE; padding-top: 8px;">
    <strong>DOCUMENTO INTERNO NO FISCAL.</strong> Constancia de pedido y control de anticipos y saldos en Quetzales (Q).
  </div>
</body>
</html>
```

---

## 4. Mapeo de Compartir por WhatsApp y Auditoría (Flask + Python)

La funcionalidad de **Compartir por WhatsApp** genera un enlace `https://api.whatsapp.com/send` con el texto resumido precargado y registra el evento en la tabla de auditoría (`audit_logs`).

### 4.1 Generador de Texto en Python (`services/whatsapp.py`)

```python
import urllib.parse
import re

def clean_guatemala_phone(phone: str | None) -> str:
    if not phone:
        return ""
    digits = re.sub(r'\D', '', phone)
    if len(digits) == 8:
        return f"502{digits}"
    return digits

def generate_order_whatsapp_summary(order) -> str:
    lines = [
        "EMILA",
        f"Pedido {order.code}",
        f"Cliente: {order.client_name}",
        f"Total: Q {order.total:.2f}",
        f"Pagado: Q {order.advance_payment:.2f}",
        f"Saldo: Q {order.balance:.2f}",
        f"Estado: {order.status}",
    ]
    if order.delivery_date:
        time_info = f" ({order.delivery_time})" if order.delivery_time else ""
        lines.append(f"Entrega: {order.delivery_date}{time_info}")
    return "\n".join(lines)

def build_whatsapp_share_url(order, target_phone: str | None = None) -> str:
    phone = clean_guatemala_phone(target_phone or order.client_phone)
    text = generate_order_whatsapp_summary(order)
    encoded = urllib.parse.quote(text)
    if phone:
        return f"https://api.whatsapp.com/send?phone={phone}&text={encoded}"
    return f"https://api.whatsapp.com/send?text={encoded}"
```

### 4.2 Registro en Auditoría y Ruta Flask

```python
from flask import redirect, request, jsonify
from models import Order, AuditLog, db
from services.whatsapp import build_whatsapp_share_url

@orders_bp.route('/pedidos/<int:order_id>/compartir-whatsapp')
def compartir_whatsapp(order_id):
    order = Order.query.get_or_404(order_id)
    url = build_whatsapp_share_url(order)

    # Registrar evento en auditoría
    audit = AuditLog(
        user_id=current_user.id,
        user_name=current_user.name,
        action="compartir por whatsapp",
        module="Pedidos",
        entity_type="Order",
        record_id=order.code,
        description=f"Comprobante de pedido {order.code} compartido por WhatsApp para {order.client_name}.",
        operation_type="Reportes y Exportaciones"
    )
    db.session.add(audit)
    db.session.commit()

    return redirect(url)
```

> **Separación de "Enviar PDF":** La acción de adjuntar y enviar archivos PDF por WhatsApp requiere una integración posterior con la API oficial de WhatsApp Business (Meta Graph API / Twilio Cloud) y una plantilla aprobada. No se simula el envío binario en esta etapa.


