export const version = '0.8.6';

export { on, off, trigger, ExtendedDOMEventListener, ExtendedEvent, EventInfo, bindDOMEvents, DOMListenerBySelector, SelectTarget } from './event';

export { push, pull, pusher, puller } from './dx';

export { first, all, closest, next, prev, append, frag } from './dom';

export { hook, display, remove, empty, View, ViewController } from './view';

export { hub, bindHubEvents, unbindHubEvents, HubBindings } from './hub';

export { val } from './utils';


// force import those modules to have them excecute their hooks
import './view-event.js';
import './view-hub.js';


