export const PHONE = '573203057571';
export const DEFAULT_MESSAGE = '¡Hola English Lab! 👋 Quiero información sobre sus programas de inglés.';

export function waLink(message = DEFAULT_MESSAGE) {
  return `https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`;
}

/** Todos los enlaces con [data-wa] abren WhatsApp con su mensaje (data-msg) o el general. */
export function wireWhatsApp() {
  document.querySelectorAll('[data-wa]').forEach((a) => {
    a.href = waLink(a.dataset.msg || DEFAULT_MESSAGE);
  });
}
