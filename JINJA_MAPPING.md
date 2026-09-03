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
