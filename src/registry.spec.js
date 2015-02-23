var util = require('./util');
var assert = util.assert;

var Registry = require('./registry');
var EB = require('./event-bus');

var tutil = require('./test-util');
var dom   = tutil.dom;

var defaultBus = new EB();
var registry   = new Registry(defaultBus);

var positiveHandler = {
	onKey: function (e) {
		return true;
	}
};

var negativeHandler = {
	onKey: function (e) {
		return false;
	}
};

describe('Registry', function() {
	it('should give empty fleet for text node', tutil.promised(function() {
		return dom("<p>sup</p>", function(p) {
			var text = p.firstChild;

			expect(registry.busFleetFor(text).length).toBe(0);
		});
	}));

	it('should give empty fleet when no buses assigned to node', tutil.promised(function() {
		return dom("<p>sup</p>", function(p) {

			expect(registry.busFleetFor(p).length).toBe(0);
		});
	}));


	it('should return handlers assigned to a tag and node', tutil.promised(function () {
		return dom("<p>sup</p>", function(p) {

			registry.addTagHandler('P', positiveHandler);
			var fleet = registry.busFleetFor(p);

			expect(fleet.length).toBe(1);


			registry.addNodeHandler(p, negativeHandler);
			fleet = registry.busFleetFor(p);

			expect(fleet.length).toBe(2);

			expect(fleet[0].post('key')).toBe(false);

			expect(fleet[1].post('key')).toBe(true);
		});
	}));

	it('call order should continue until positive handler reached', tutil.promised(function () {
		return dom("<p>sup</p>", function(p) {
			var registry = new Registry(defaultBus);
			registry.addTagHandler('P', negativeHandler);
			registry.addTagHandler('P', negativeHandler);
			var fleet = registry.busFleetFor(p);

			expect(fleet.length).toBe(1);
			expect(fleet[0].post('key')).toBe(false);

			registry.addTagHandler('P', positiveHandler);
			fleet = registry.busFleetFor(p);
			expect(fleet[0].post('key')).toBe(true);
		});
	}));
});