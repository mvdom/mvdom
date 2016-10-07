'use strict';

module.exports = {
	pull: pull, 
	push: push, 
	puller: puller, 
	pusher: pusher
};

var _pushers = [
	[":checkbox", function(value){
		var iptValue = this.attr("value");
		if (iptValue){
			if ($.isArray(value)){
				if ($.inArray(iptValue,value) > -1){
					this.prop("checked",true);
				}
			}else{
				if (iptValue == value){
					this.prop("checked",true);
				}					
			}
		}else{
			if (value){
				this.prop("checked",true);
			}
		}
	}],
	["input", function(value){
		this.val(value);
	}],
	["select", function(value){
		this.val(value);
	}],
	["textarea", function(value){
		this.val(value);
	}],
	["*", function(value){
		this.html(value);
	}]
];

var _pullers = [
	[":checkbox", function(existingValue){
		var iptValue = this.attr("value");
		var newValue;
		if (this.prop("checked")){
			newValue = (iptValue)?iptValue:true;
			if (typeof existingValue !== "undefined"){
				// if we have an existingValue for this property, we create an array
				var values = $.isArray(existingValue)?existingValue:[existingValue];
				values.push(newValue);
				newValue = values;
			}				
		}
		return newValue;
	}],
	["input, select", function(existingValue){
		return this.val();
	}],
	["textarea", function(existingValue){
		return this.val();
	}],
	["*", function(existingValue){
		return this.html();
	}]
];

function pusher(selector,func){
	_pushers.unshift([selector,func]);
}

function puller(selector,func){
	_pullers.unshift([selector,func]);
}

function push(el, data) {
	// iterate and process each matched element
	return this.each(function() {
		var $e = $(this);

		$e.find(".dx").each(function(){
			var $dx = $(this);
			var propPath = getPropPath($dx);
			var value = val(data,propPath);
			var i = 0, selector, fun, l = _pushers.length;
			for (; i<l ; i++){
				selector = _pushers[i][0];
				if ($dx.is(selector)){
					fun = _pushers[i][1];
					fun.call($dx,value);
					break;
				}
			}
		});
	});

}

function pull(el){
	var obj = {};
	// iterate and process each matched element
	this.each(function() {
		var $e = $(this);

		$e.find(".dx").each(function(){
			var $dx = $(this);
			var propPath = getPropPath($dx);
			var i = 0, selector, fun, l = _pullers.length;
			for (; i<l ; i++){
				selector = _pullers[i][0];
				if ($dx.is(selector)){
					fun = _pullers[i][1];
					var existingValue = val(obj,propPath);
					var value = fun.call($dx,existingValue);
					if (typeof value !== "undefined"){
						val(obj,propPath,value);	
					}
					break;
				}					
			}
		});
	});		
	
	return obj;
}

/** 
 * Return the variable path of the first dx-. "-" is changed to "."
 * 
 * @param classAttr: like "row dx dx-contact.name"
 * @returns: will return "contact.name"
 **/
function getPropPath($dx){
	var classAttr = $dx.attr("class");
	var path = null;
	var i =0, classes = classAttr.split(" "), l = classes.length, name;
	for (; i < l; i++){
		name = classes[i];
		if (name.indexOf("dx-") === 0){
			path = name.split("-").slice(1).join(".");
		}
	}
	// if we do not have a path in the css, try the data-dx attribute
	if (!path){
		path = $dx.attr("data-dx");
	}
	if (!path){
		path = $dx.attr("name"); // last fall back, assume input field
	}
	return path;
}



