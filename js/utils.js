// js/utils.js — Utility functions
export function formatDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatShortDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function parseDate(dateString) {
  if (!dateString) return new Date().toISOString().split('T')[0];
  return new Date(dateString).toISOString().split('T')[0];
}

export function getCigarDisplayName(cigar) {
  if (!cigar) return '';
  const brand = cigar.brand || '?';
  const name = cigar.name || '?';
  const vitola = cigar.vitola ? ` (${cigar.vitola})` : '';
  return `${brand} ${name}${vitola}`;
}

export function getRatingColor(rating) {
  if (!rating) return 'gray';
  if (rating >= 9) return 'gold';
  if (rating >= 8) return 'silver';
  if (rating >= 7) return 'bronze';
  return 'default';
}

export function formatCurrency(amount, currency = 'EUR') {
  if (amount === null || amount === undefined) return '—';
  const formatter = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
  });
  return formatter.format(amount);
}

export function downloadJSON(data, filename = 'export.json') {
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function createButton(label, options = {}) {
  const button = document.createElement('button');
  button.textContent = label;
  button.className = options.className || 'btn';
  if (options.action) button.dataset.action = options.action;
  if (options.screen) button.dataset.screen = options.screen;
  if (options.cigarId) button.dataset.cigarId = options.cigarId;
  if (options.onclick) button.onclick = options.onclick;
  return button;
}

export function createInput(type = 'text', options = {}) {
  const input = document.createElement('input');
  input.type = type;
  input.placeholder = options.placeholder || '';
  input.value = options.value || '';
  input.name = options.name || '';
  input.className = options.className || 'input';
  if (options.required) input.required = true;
  if (options.min) input.min = options.min;
  if (options.max) input.max = options.max;
  if (options.step) input.step = options.step;
  return input;
}

export function createSelect(options, defaultValue = '') {
  const select = document.createElement('select');
  select.className = 'input';
  
  const emptyOption = document.createElement('option');
  emptyOption.value = '';
  emptyOption.textContent = '— Sélectionner —';
  select.appendChild(emptyOption);

  options.forEach((opt) => {
    const option = document.createElement('option');
    option.value = opt.value;
    option.textContent = opt.label;
    if (opt.value === defaultValue) option.selected = true;
    select.appendChild(option);
  });

  return select;
}

export function createForm(fields) {
  const form = document.createElement('form');
  form.className = 'form';

  fields.forEach((field) => {
    const group = document.createElement('div');
    group.className = 'form-group';

    const label = document.createElement('label');
    label.textContent = field.label;
    group.appendChild(label);

    let input;
    if (field.type === 'select') {
      input = createSelect(field.options, field.value);
    } else if (field.type === 'textarea') {
      input = document.createElement('textarea');
      input.placeholder = field.placeholder || '';
      input.value = field.value || '';
      input.name = field.name || '';
      input.className = 'input textarea';
    } else {
      input = createInput(field.type, {
        placeholder: field.placeholder,
        value: field.value,
        name: field.name,
        required: field.required,
        min: field.min,
        max: field.max,
        step: field.step,
      });
    }

    input.name = field.name;
    group.appendChild(input);
    form.appendChild(group);
  });

  return form;
}

export function getFormData(form) {
  const formData = new FormData(form);
  const data = {};
  formData.forEach((value, key) => {
    data[key] = value;
  });
  return data;
}
