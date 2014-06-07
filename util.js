(function () {
	'use strict';
	
	// clear a possibly transformed canvas
	// http://stackoverflow.com/a/9722502/40356
	CanvasRenderingContext2D.prototype.clear = function () {
		this.save();
		this.setTransform(1, 0, 0, 1, 0, 0);
		this.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.restore();
	};
	
	Array.prototype.clone = function () {
		return this.slice(0);
	};
	
	Array.prototype.sum = function () {
		var sum = 0;
		for (var i = 0, n = this.length; i < n; n++) sum += this[i];
		return sum;
	};
	
	Array.prototype.sortNumeric = (function () {
		function compareNumbers(a, b) {
			return a - b;
		}
		
		return function () {
			this.sort(compareNumbers);
			return this;
		};
	}());
	
	Math.randRange = function (min, max) {
		return min + (Math.random() * (max - min));
	};
	
	Math.mean = function (/* n1, n2, n3 ... */) {
		if (arguments.length === 0) return 0;
		
		var sum = 0;
		for (var i = 0, n = arguments.length; i < n; i++) sum += arguments[i];
		
		return sum/arguments.length;
	};
	
	Math.median = function (/* n1, n2, n3 ... */) {
		if      (arguments.length === 0) return 0;
		else if (arguments.length === 1) return arguments[0];
		else if (arguments.length === 2) return (arguments[0] + arguments[1])/2;
		
		var args = Array.prototype.slice.call(arguments);
		args.sortNumeric();
		
		var middleIndex = (args.length - 1)/2;
		
		// if the number of values is odd, middle index will be a whole number and we're done
		if (middleIndex%1 === 0) return args[middleIndex];
		// if the number of values is even, take the average of the two middle values
		else return (args[Math.floor(middleIndex)] + args[Math.ceil(middleIndex)])/2;
	};
}());
