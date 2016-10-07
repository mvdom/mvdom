
(function(){

	document.addEventListener("DOMContentLoaded", function(event) {
		var d = mvdom;
		outputEl = d.first("#output");
		
		
		var beforeReturn = null;
		if (tests._before){
			beforeReturn = tests._before();
		}


		Promise.resolve(beforeReturn).then(function(){


			var result = Promise.resolve();			

			var name, names = [];
			for (name in tests){
				if (name.indexOf("_before") !== -1){
					continue;
				}
				names.push(name);
			}

			names.forEach(function(name){
				result = result.then(function(){
					// do the before each if defined
					if (tests._beforeEach){
						tests._beforeEach();
					}

					// create the html element for this test
					itemEl = document.createElement("li"); 		
					itemEl.innerHTML = label(name) + " running";
					outputEl.appendChild(itemEl);

					// run this test
					var p, fn = tests[name], failEx = null;	
					try {
						p = fn();
					} catch (ex){
						failEx = label(name) + " FAILED " + ex;
						itemEl.classList.add("fail");
					}

					// always resolve (to allow to continue to next test) and show appropriate message
					return Promise.resolve(p).then(function(){
						itemEl.innerHTML = (failEx)?failEx:(label(name) + " OK ");
					});
				});
			});

			return result;		
		});

	});

	function label(name){
		return "<strong>" + name + "</strong>";
	}	
})();

/*eslint-disable no-unused-vars*/
function assertEqual(expected, actual){
	try{

		// if an array, we compare each instance
		if (expected instanceof Array){
			if (!(actual instanceof Array)){
				throw "";
			}
			if (expected.length !== actual.length){
				throw "";
			}
			var i = 0;
			for (i ; i < expected.length; i++){
				if (expected[i] !== actual[i]){
					throw "";
				}
			}
			return;
		}

		// if it is not an array, then just compare
		if (expected !== actual){
			throw "";
		}

	}catch (e){
		throw "expected '" + expected + "' but got '" + actual + "'";
	}


}