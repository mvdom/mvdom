import { View, hook } from './view';
import { HubSubHandler, Hub, hub as _hub } from './hub';
import { splitAndTrim } from './utils';

// Note: We bound events after the init (see #34)
hook("didInit", function (view: View) {
	const opts = { ns: "view_" + view.id, ctx: view };

	if (view.hubEvents) {
		// build the list of bindings
		const hubEventsList = (view.hubEvents instanceof Array) ? view.hubEvents : [view.hubEvents];

		for (const hubEvents of hubEventsList) {
			const infoList = listHubInfos(hubEvents);

			infoList.forEach(function (info) {
				info.hub.sub(info.topics, info.labels, info.fun, opts);
			});
		}
	}
});

hook("willRemove", function (view: View) {
	const ns = "view_" + view.id;
	if (view.hubEvents) {
		const hubEventsList = (view.hubEvents instanceof Array) ? view.hubEvents : [view.hubEvents];
		hubEventsList.forEach(function (hubEvents) {
			const infoList = listHubInfos(hubEvents);
			infoList.forEach(function (info) {
				info.hub.unsub({ ns });
			});
		});
	}
});

//#region    ---------- Private Helpers ---------- 
type FnBySelector = { [selector: string]: HubSubHandler };
type FnByTypeBySelector = { [closestSelector: string]: { [typeSelector: string]: HubSubHandler } };
type ListHubInfo = { hub: Hub, topics: string, labels?: string, fun: HubSubHandler };

/**
 * @param {*} hubEvents could be {"hubName; topics[; labels]": fn} 
 * 											or {hubName: {"topics[; labels]": fn}}
 * @returns {hub, topics, labels}[]
 */
function listHubInfos(hubEvents: FnBySelector | FnByTypeBySelector): ListHubInfo[] {
	const infoList: ListHubInfo[] = []

	for (const key in hubEvents) {
		const val = hubEvents[key];

		// If we have FnBySelector, then, hub name is in the selector, getHubInfo will extract it
		// "hubName; topics[; labels]": fn}
		if (val instanceof Function) {
			infoList.push(getHubInfo(key, null, val));
		}
		// otherwise, if val is an object, then, thee key is the name of the hub, so get/create it.
		// {hubName: {"topics[; labels]": fn}}
		else {
			const hub = _hub(key);
			for (const key2 in val) {
				infoList.push(getHubInfo(key2, hub, val[key2]));
			}
		}
	}
	return infoList;
}

// returns {hub, topics, labels}
// hub is optional, if not present, assume the name will be the first item will be in the str
function getHubInfo(str: string, hub: Hub | null, fun: HubSubHandler): ListHubInfo {
	const a = splitAndTrim(str, ";");
	// if no hub, then, assume it is in the str
	const topicIdx = (hub) ? 0 : 1;
	hub = (!hub) ? _hub(a[0]) : hub;

	const info: ListHubInfo = {
		topics: a[topicIdx],
		fun: fun,
		hub
	};
	if (a.length > topicIdx + 1) {
		info.labels = a[topicIdx + 1];
	}
	return info;
}

//#endregion ---------- /Private Helpers ---------- 
