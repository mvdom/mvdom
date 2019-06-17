import { splitAndTrim, ensureArray } from './utils';

interface NsObject {
	ns: string
};

interface HubOptions {
	ns?: string;
	ctx?: any;
}

interface HubRef {
	topic: string,
	fun: Function,
	ns?: string,
	ctx?: any,
	label?: string
}

export type HubSubHandler = (data: any, info: any) => void;

export interface HubEventInfo {
	topic: string;
	label: string;
}

// User Hub object exposing the public API
const hubDic = new Map<string, HubImpl>();

// Data for each hub (by name)
const hubDataDic = new Map<string, HubData>();

// get or create a new hub;
export function hub(name: string): Hub {
	if (name == null) {
		throw "MVDOM INVALID API CALLS: for now, d.hub(name) require a name (no name was given).";
	}
	let hub = hubDic.get(name);
	// if it does not exist, we create and set it. 
	if (hub === undefined) {
		hub = new HubImpl(name);
		hubDic.set(name, hub);
		// create the hubData
		hubDataDic.set(name, new HubData(name));
	}
	return hub;
}

// function hubDelete(name: string) {
// 	hubDic.delete(name);
// 	hubDataDic.delete(name);
// };

// --------- Hub --------- //
export interface Hub {
	sub(topics: string, handler: HubSubHandler, opts?: HubOptions): void;
	sub(topics: string, labels: string | undefined | null, handler: HubSubHandler, opts?: HubOptions): void;

	/** Publish a message to a hub for a given topic  */
	pub(topic: string, message: any): void;
	/** Publish a message to a hub for a given topic and label  */
	pub(topic: string, label: string, message: any): void;

	unsub(ns: NsObject): void;
}

class HubImpl implements Hub {
	name: string;
	constructor(name: string) {
		this.name = name;
	}


	sub(topics: string, handler: HubSubHandler, opts?: HubOptions): void;
	sub(topics: string, labels: string, handler: HubSubHandler, opts?: HubOptions): void;
	sub(topics: string, labels_or_handler: string | HubSubHandler, handler_or_opts?: HubSubHandler | HubOptions, opts?: HubOptions) {

		//// Build the arguments
		let labels: string | null;
		let handler: HubSubHandler;
		// if the first arg is function, then, no labels
		if (labels_or_handler instanceof Function) {
			labels = null;
			handler = labels_or_handler;
			opts = handler_or_opts as HubOptions | undefined;
		} else {
			labels = labels_or_handler;
			handler = handler_or_opts as HubSubHandler;
			// opts = opts;
		}

		//// Normalize topic and label to arrays
		const topicArray = splitAndTrim(topics, ",");
		const labelArray = (labels != null) ? splitAndTrim(labels, ",") : null;

		//// make opts (always defined at least an emtpy object)
		opts = makeOpts(opts);

		//// add the event to the hubData
		const hubData = hubDataDic.get(this.name)!; // by hub(...) factory function, this is garanteed
		hubData.addEvent(topicArray, labelArray, handler, opts);
	}

	unsub(ns: NsObject) {
		const hubData = hubDataDic.get(this.name)!; // by factory contract, this always exist.
		hubData.removeRefsForNs(ns.ns);
	}

	/** Publish a message to a hub for a given topic  */
	pub(topic: string, message: any): void;
	/** Publish a message to a hub for a given topic and label  */
	pub(topic: string, label: string, message: any): void;
	pub(topics: string, labels?: string | null, data?: any) {
		// ARG SHIFTING: if data is undefined, we shift args to the RIGHT
		if (typeof data === "undefined") {
			data = labels;
			labels = null;
		}

		//// Normalize topic and label to arrays
		const topicArray = splitAndTrim(topics, ",");
		const labelArray = (labels != null) ? splitAndTrim(labels, ",") : null;

		const hubData = hubDataDic.get(this.name)!;

		const hasLabels = (labels != null && labels.length > 0);

		// if we have labels, then, we send the labels bound events first
		if (hasLabels) {
			hubData.getRefs(topicArray, labelArray).forEach(function (ref) {
				invokeRef(ref, data);
			});
		}

		// then, we send the topic only bound
		hubData.getRefs(topicArray, null).forEach(function (ref) {
			// if this send, has label, then, we make sure we invoke for each of this label
			if (hasLabels) {
				labelArray!.forEach(function (label) {
					invokeRef(ref, data, label);
				});
			}
			// if we do not have labels, then, just call it.
			else {
				invokeRef(ref, data);
			}
		});

	}

	deleteHub() {
		hubDic.delete(this.name);
		hubDataDic.delete(this.name);
	}
}
// --------- /Hub --------- //

// --------- HubData --------- //
// TODO: This was maded to have it private to the hub. Now that we are using trypescript, we might want to use private and store it in the Hub. 

class HubData {
	name: string;
	refsByNs = new Map<string, HubRef[]>();
	refsByTopic = new Map<string, HubRef[]>();
	refsByTopicLabel = new Map();

	constructor(name: string) {
		this.name = name;
	}

	addEvent(topics: string[], labels: string[] | null, fun: Function, opts: HubOptions) {
		const refs = buildRefs(topics, labels, fun, opts);
		const refsByNs = this.refsByNs;
		const refsByTopic = this.refsByTopic;
		const refsByTopicLabel = this.refsByTopicLabel;
		refs.forEach(function (ref) {
			// add this ref to the ns dictionary
			// TODO: probably need to add an custom "ns"
			if (ref.ns != null) {
				ensureArray(refsByNs, ref.ns).push(ref);
			}
			// if we have a label, add this ref to the topicLabel dictionary
			if (ref.label != null) {
				ensureArray(refsByTopicLabel, buildTopicLabelKey(ref.topic, ref.label)).push(ref);
			}
			// Otherwise, add it to this ref this topic
			else {

				ensureArray(refsByTopic, ref.topic).push(ref);
			}
		});
	};

	getRefs(topics: string[], labels: string[] | null) {
		const refs: HubRef[] = [];
		const refsByTopic = this.refsByTopic;
		const refsByTopicLabel = this.refsByTopicLabel;

		topics.forEach(function (topic) {
			// if we do not have labels, then, just look in the topic dic
			if (labels == null || labels.length === 0) {
				const topicRefs = refsByTopic.get(topic);
				if (topicRefs) {
					refs.push.apply(refs, topicRefs);
				}
			}
			// if we have some labels, then, take those in accounts
			else {
				labels.forEach(function (label) {
					const topicLabelRefs = refsByTopicLabel.get(buildTopicLabelKey(topic, label));
					if (topicLabelRefs) {
						refs.push.apply(refs, topicLabelRefs);
					}
				});
			}
		});
		return refs;
	};

	removeRefsForNs(ns: string) {
		const refsByTopic = this.refsByTopic;
		const refsByTopicLabel = this.refsByTopicLabel;
		const refsByNs = this.refsByNs;

		const refs = this.refsByNs.get(ns);
		if (refs != null) {

			// we remove each ref from the corresponding dic
			refs.forEach(function (ref) {

				// First, we get the refs from the topic or topiclabel
				let refList;
				if (ref.label != null) {
					const topicLabelKey = buildTopicLabelKey(ref.topic, ref.label);
					refList = refsByTopicLabel.get(topicLabelKey);
				} else {
					refList = refsByTopic.get(ref.topic);
				}

				// Then, for the refList array, we remove the ones that match this object
				let idx;
				while ((idx = refList.indexOf(ref)) !== -1) {
					refList.splice(idx, 1);
				}
			});

			// we remove them all form the refsByNs
			refsByNs.delete(ns);
		}


	};
}

// static/private
function buildRefs(topics: string[], labels: null | string[], fun: Function, opts: HubOptions) {
	let refs: HubRef[] = [];
	topics.forEach(function (topic) {
		// if we do not have any labels, then, just add this topic
		if (labels == null || labels.length === 0) {
			refs.push({
				topic: topic,
				fun: fun,
				ns: opts.ns,
				ctx: opts.ctx
			});
		}
		// if we have one or more labels, then, we add for those label
		else {
			labels.forEach(function (label) {
				refs.push({
					topic: topic,
					label: label,
					fun: fun,
					ns: opts.ns,
					ctx: opts.ctx
				});
			});
		}

	});

	return refs;
}


// static/private: return a safe opts. If opts is a string, then, assume is it the {ns}
const emptyOpts = {};
function makeOpts(opts?: HubOptions): HubOptions {
	if (opts == null) {
		opts = emptyOpts;
	} else {
		if (typeof opts === "string") {
			opts = { ns: opts };
		}
	}
	return opts;
}

// static/private
function buildTopicLabelKey(topic: string, label: string) {
	return topic + "-!-" + label;
}

// static/private: call ref method (with optional label override)
function invokeRef(ref: HubRef, data: any, label?: string) {
	const info = {
		topic: ref.topic,
		label: ref.label || label,
		ns: ref.ns
	};
	ref.fun.call(ref.ctx, data, info);
}
// --------- /HubData --------- //


