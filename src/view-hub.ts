import { View, hook } from './view';
import { HubListener, Hub, hub as _hub, HubListenerByFullSelector, HubListenerByHubNameBySelector, bindHubEvents, unbindHubEvents } from './hub';
import { splitAndTrim } from './utils';

// Note: We bound events after the init (see #34)
hook("didInit", function (view: View) {
	const opts = { ns: "view_" + view.id, ctx: view };

	if (view.hubEvents) {
		bindHubEvents(view.hubEvents, opts);
	}
});

hook("willRemove", function (view: View) {
	const ns = "view_" + view.id;
	if (view.hubEvents) {
		unbindHubEvents(view.hubEvents, { ns });
	}
});




