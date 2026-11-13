import type { RentalReschedulingError } from '../../../application/rentals.store';
import type { RentalReschedulingDateIssue } from '../../../domain/policy/rental-request-rescheduling.policy';

export interface RentalRequestReschedulingCopy {
  edit: string;
  title: string;
  hint: string;
  start: string;
  end: string;
  save: string;
  cancel: string;
  saving: string;
  success: string;
  unchanged: string;
  dateIssues: Record<Exclude<RentalReschedulingDateIssue, null>, string>;
  errors: Record<RentalReschedulingError, string>;
}

const es: RentalRequestReschedulingCopy = {
  edit: 'Editar fechas',
  title: 'Modificar período de alquiler',
  hint: 'Puedes modificar una solicitud pendiente. Comprobaremos la disponibilidad antes de guardar.',
  start: 'Fecha de inicio',
  end: 'Fecha de fin',
  save: 'Guardar fechas',
  cancel: 'Cancelar',
  saving: 'Guardando...',
  success: 'Fechas actualizadas correctamente. La solicitud mantiene su mismo número.',
  unchanged: 'Elige un período diferente al registrado.',
  dateIssues: {
    INVALID: 'Selecciona fechas válidas.',
    REVERSED: 'La fecha final no puede ser anterior a la fecha inicial.',
    PAST: 'La fecha inicial no puede estar en el pasado (hora de Lima).',
  },
  errors: {
    CONFLICT: 'No se pudo actualizar la solicitud: puede haber un período ocupado, una solicitud duplicada o un cambio de estado. Revisa las fechas y vuelve a intentarlo.',
    FORBIDDEN: 'No tienes permiso para modificar esta solicitud.',
    NOT_FOUND: 'No se encontró la solicitud. Vuelve a Mis solicitudes.',
    INVALID: 'El servidor rechazó el período. Revisa las fechas seleccionadas.',
    NETWORK: 'No se pudo conectar al servidor. Comprueba que el backend esté iniciado.',
    UNKNOWN: 'No se pudieron actualizar las fechas. Inténtalo de nuevo.',
  },
};

const en: RentalRequestReschedulingCopy = {
  edit: 'Edit dates',
  title: 'Change rental dates',
  hint: 'You can change a pending request. Availability will be checked before saving.',
  start: 'Start date',
  end: 'End date',
  save: 'Save dates',
  cancel: 'Cancel',
  saving: 'Saving...',
  success: 'Dates updated successfully. Your request keeps the same ID.',
  unchanged: 'Choose dates different from the current period.',
  dateIssues: {
    INVALID: 'Choose valid dates.',
    REVERSED: 'The end date cannot precede the start date.',
    PAST: 'The start date cannot be in the past (Lima time).',
  },
  errors: {
    CONFLICT: 'Dates are unavailable, a conflicting request exists, or the request is no longer pending. Check the dates and try again.',
    FORBIDDEN: 'You are not authorized to edit this request.',
    NOT_FOUND: 'This request was not found. Return to My Requests.',
    INVALID: 'The server rejected the period. Check your chosen dates.',
    NETWORK: 'Cannot connect to the server. Check that the backend is running.',
    UNKNOWN: 'Dates could not be updated. Please try again.',
  },
};

/** Presentation-only fallback copy, independent from other bounded contexts. */
export function rentalRequestReschedulingCopy(language: string): RentalRequestReschedulingCopy {
  return language.toLowerCase().startsWith('en') ? en : es;
}
