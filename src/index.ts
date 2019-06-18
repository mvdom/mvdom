export const version = '0.8.2';

export { on, off, trigger, ExtendedDOMEventListener, ExtendedEvent, EventInfo, bindDOMEvent, bindDOMEvents, DOMListenerBySelector } from './event';

export { push, pull, pusher, puller } from './dx';

export { first, all, closest, next, prev, append, frag } from './dom';

export { hook, display, remove, empty, View, ViewController } from './view';

export { hub } from './hub';

export { val } from './utils';


// force import those modules to have them excecute their hooks
import './view-event.js';
import './view-hub.js';


