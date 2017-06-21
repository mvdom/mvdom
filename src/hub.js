var utils = require("./utils.js");

module.exports = {
	hub: hub
};

// User Hub object exposing the public API
var hubDic = new Map();

// Data for each hub (by name)
var hubDataDic = new Map(); 

// get or create a new hub;
function hub(name){
	if (name == null){
		throw "MVDOM INVALID API CALLS: for now, d.hub(name) require a name (no name was given).";
	}
	var h = hubDic.get(name); 
	// if it does not exist, we create and set it. 
	if (!h){
		// create the hub
		h = Object.create(HubProto, {
			name: { value: name } // read only
		});
		hubDic.set(name, h);

		// create the hubData
		hubDataDic.set(name, new HubDataProto(name));
	}
	return h;
}

hub.delete = function(name){
	hubDic.delete(name);
	hubDataDic.delete(name);
};

// --------- Hub --------- //
var HubProto = {
	sub: function(topics, labels, handler, opts){
		// ARG SHIFTING: if labels arg is a function, then, we swith the argument left
		if (typeof labels === "function"){
			opts = handler;
			handler = labels;			
			labels = null;
		}
		
		// make arrays
		topics = utils.splitAndTrim(topics, ",");
		if (labels != null){
			labels = utils.splitAndTrim(labels, ",");
		}

		// make opts (always defined at least an emtpy object)
		opts = makeOpts(opts);

		// add the event to the hubData
		var hubData = hubDataDic.get(this.name);
		hubData.addEvent(topics, labels, handler, opts);
	}, 

	unsub: function(ns){
		var hubData = hubDataDic.get(this.name);
		hubData.removeRefsForNs(ns);
	}, 

	pub: function(topics, labels, data){
		// ARG SHIFTING: if data is undefined, we shift args to the RIGHT
		if (typeof data === "undefined"){
			data = labels;
			labels = null;
		}

		topics = utils.splitAndTrim(topics, ",");


		if (labels != null){
			labels = utils.splitAndTrim(labels, ",");		
		}

		var hubData = hubDataDic.get(this.name);

		var hasLabels = (labels != null && labels.length > 0);

		// if we have labels, then, we send the labels bound events first
		if (hasLabels){
			hubData.getRefs(topics, labels).forEach(function(ref){
				invokeRef(ref, data);
			});
		}

		// then, we send the topic only bound
		hubData.getRefs(topics).forEach(function(ref){
			// if this send, has label, then, we make sure we invoke for each of this label
			if (hasLabels){
				labels.forEach(function(label){
					invokeRef(ref,data, label);
				});
			}
			// if we do not have labels, then, just call it.
			else{
				invokeRef(ref, data);
			}
		});

	}, 

	deleteHub: function(){
		hubDic.delete(this.name);
		hubDataDic.delete(this.name);
	}
};
// --------- /Hub --------- //

// --------- HubData --------- //
function HubDataProto(name){
	this.name = name;
	this.refsByNs = new Map();
	this.refsByTopic = new Map();
	this.refsByTopicLabel = new Map();
}

HubDataProto.prototype.addEvent = function(topics, labels, fun, opts){
	var refs = buildRefs(topics, labels, fun, opts);
	var refsByNs = this.refsByNs;
	var refsByTopic = this.refsByTopic;
	var refsByTopicLabel = this.refsByTopicLabel;
	refs.forEach(function(ref){
		// add this ref to the ns dictionary
		// TODO: probably need to add an custom "ns"
		if (ref.ns != null){
			utils.ensureArray(refsByNs, ref.ns).push(ref);
		}
		// if we have a label, add this ref to the topicLabel dictionary
		if (ref.label != null){
			utils.ensureArray(refsByTopicLabel, buildTopicLabelKey(ref.topic, ref.label)).push(ref);
		}
		// Otherwise, add it to this ref this topic
		else{
			
			utils.ensureArray(refsByTopic, ref.topic).push(ref);
		}
	});
};

HubDataProto.prototype.getRefs = function(topics, labels) {
	var refs = [];
	var refsByTopic = this.refsByTopic;
	var refsByTopicLabel = this.refsByTopicLabel;
	
	topics.forEach(function(topic){
		// if we do not have labels, then, just look in the topic dic
		if (labels == null || labels.length === 0){
			var topicRefs = refsByTopic.get(topic);
			if (topicRefs){
				refs.push.apply(refs, topicRefs);
			}
		}
		// if we have some labels, then, take those in accounts
		else{
			labels.forEach(function(label){
				var topicLabelRefs = refsByTopicLabel.get(buildTopicLabelKey(topic, label));
				if (topicLabelRefs){
					refs.push.apply(refs, topicLabelRefs);
				}
			});
		}
	});
	return refs;
};

HubDataProto.prototype.removeRefsForNs = function(ns){
	var refsByTopic = this.refsByTopic;
	var refsByTopicLabel = this.refsByTopicLabel;
	var refsByNs = this.refsByNs;

	var refs = this.refsByNs.get(ns);
	if (refs != null){

		// we remove each ref from the corresponding dic
		refs.forEach(function(ref){

			// First, we get the refs from the topic or topiclabel
			var refList;
			if (ref.label != null){
				var topicLabelKey = buildTopicLabelKey(ref.topic, ref.label);
				refList = refsByTopicLabel.get(topicLabelKey);
			}else{
				refList = refsByTopic.get(ref.topic);
			}

			// Then, for the refList array, we remove the ones that match this object
			var idx;
			while((idx = refList.indexOf(ref)) !== -1){
				refList.splice(idx, 1);
			}
		});

		// we remove them all form the refsByNs
		refsByNs.delete(ns);
	}


};

// static/private
function buildRefs(topics, labels, fun, opts){
	var refs = [];
	topics.forEach(function(topic){
		// if we do not have any labels, then, just add this topic
		if (labels == null || labels.length === 0){
			refs.push({
				topic: topic,
				fun: fun, 
				ns: opts.ns, 
				ctx: opts.ctx
			});
		}
		// if we have one or more labels, then, we add for those label
		else{
			labels.forEach(function(label){
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
var emptyOpts = {};
function makeOpts(opts){
	if (opts == null){
		opts = emptyOpts;
	}else{
		if (typeof opts === "string"){
			opts = {ns:opts};
		}
	}
	return opts;
}

// static/private
function buildTopicLabelKey(topic, label){
	return topic + "-!-" + label;
}

// static/private: call ref method (with optional label override)
function invokeRef(ref, data, label){
	var info = {
		topic: ref.topic,
		label: ref.label || label,
		ns: ref.ns
	};
	ref.fun.call(ref.ctx,data,info);
}
// --------- /HubData --------- //


