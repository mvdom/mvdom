'use strict';

var _view = require("./view.js");
var _hub = require("./hub.js");
var utils = require("./utils.js");

// --------- Events Hook --------- //
_view.hook("willInit", function(view){
	var opts = {ns: "view_" + view.id, ctx: view};

	if (view.hubEvents){
		// build the list of bindings

		var infoList = listHubInfo(view.hubEvents);
		infoList.forEach(function(info){
			info.hub.sub(info.topics, info.labels, info.fun, opts);
		});
	}

	// TODO: need to allow closest binding.
});

_view.hook("willRemove", function(view){
	var ns = "view_" + view.id;
	var infoList = listHubInfo(view.hubEvents);
	infoList.forEach(function(info){
		info.hub.unsub(ns);
	});
});

function listHubInfo(hubEvents){
	var key, val, key2, hub, infoList = [];

	for (key in hubEvents){
		val = hubEvents[key];
		if (typeof val === "function"){
			infoList.push(getHubInfo(key, null, val));
		}else{
			key2;
			hub = _hub.hub(key);
			for (key2 in val){
				infoList.push(getHubInfo(key2, hub, val[key2]));
			}
		}			
	}
	return infoList;
}

// returns {hub, topics, labels}
// hub is optional, if not present, assume the name will be the first item will be in the str
function getHubInfo(str, hub, fun){
	var a = utils.splitAndTrim(str,";");
	// if no hub, then, assume it is in the str
	var topicIdx = (hub)?0:1;
	var info = {
		topics: a[topicIdx],
		fun: fun
	};
	if (a.length > topicIdx + 1){
		info.labels = a[topicIdx + 1];
	}
	info.hub = (!hub)?_hub.hub(a[0]):hub;
	return info;
}

// TODO: need to unbind on "willDestroy"

// --------- /Events Hook --------- //