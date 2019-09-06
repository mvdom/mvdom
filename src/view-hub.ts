import { bindHubEvents, unbindHubEvents } from './hub';
import { hook, View } from './view';

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




