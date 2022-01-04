import { errorStores, warningStores } from './stores';

function createId(length = 8) {
  let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let str = '';
  for (let i = 0; i < length; i++) {
    str += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return str;
}

export function svelteReporter(currentForm) {
  const config = currentForm.config;
  if (!config.__felteReporterSvelteId) {
    const id = createId(21);
    config.__felteReporterSvelteId = id;
    errorStores[id] = currentForm.errors;
    warningStores[id] = currentForm.warnings;
  }
  if (!currentForm.form) return;
  if (!currentForm.form.hasAttribute('data-felte-reporter-svelte-id')) {
    currentForm.form.dataset.felteReporterSvelteId =
      config.__felteReporterSvelteId;
  }
  return {
    onSubmitError() {
      const firstInvalidElement =
        currentForm &&
        currentForm.form.querySelector('[data-felte-validation-message]');
      firstInvalidElement && firstInvalidElement.focus();
    },
  };
}
