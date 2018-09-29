// NOTE: This code is not meant to be ran at all (this is why there is no typscript compiler on this project)
//       but just here to manualy test the mvdom's typescript typing with VSCode. 
// import mvdom = require("../types/index"); // not to be used 
import * as mvdom from "../types/index";
import { View } from "../types/index";


// // ------ Section --------- //
class HelloView {

	create() {
		return `<div class="HelloView"></div>`;
	}
}

mvdom.display(new HelloView(), "body", { append: "first" }).then((v) => {
	v.id;
	v.name;
	v.create;
});

// with litteral
mvdom.display({
	some: 'data',
	create: function () { return `<div class="HelloView"> </div>` }
}, 'body');











