import type { TrackingStatus } from './useHandTracking';

/** What to tell people about the camera, for each state. */
export const STATUS_TEXT: Record<TrackingStatus, { title: string; detail: string }> = {
  idle: { title: 'Camera off', detail: 'Start the camera to steer the particles with your hands.' },
  loading: { title: 'Starting…', detail: 'Loading hand tracking and asking for the camera.' },
  running: { title: 'Tracking', detail: 'Hold your hands up, well lit, about an arm’s length away.' },
  denied: {
    title: 'Camera blocked',
    detail: 'The browser was not allowed to use the camera. Allow it in the address bar or site settings, then try again.',
  },
  'no-camera': { title: 'No camera found', detail: 'Connect a webcam and try again, or explore with the mouse and keyboard.' },
  busy: { title: 'Camera in use', detail: 'Another app or tab is using the camera. Close it and try again.' },
  error: {
    title: 'Hand tracking could not start',
    detail: 'The hand-tracking files did not load. Check your connection and try again.',
  },
};

export const isProblem = (s: TrackingStatus) => s === 'denied' || s === 'no-camera' || s === 'busy' || s === 'error';
