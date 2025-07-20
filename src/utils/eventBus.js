import mitt from 'mitt';

export const eventBus = mitt();

export const AUTH_EVENTS = {
  AUTH_ERROR: 'auth:error',
};