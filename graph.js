var GRAPH = (function () {
	'use strict';
	var exports = {};
	
	exports.Graph = function (config) {
		var self = this;
		
		self.view = {
			zoom: 60,
			offsetX: 0,
			offsetY: 0,
			
			minX: 0,
			maxX: 0,
			minY: 0,
			maxY: 0
		};
		
		self.funcs = [];
		self.funcColors = [];
		self.samples = [];
		
		function transformCanvas() {
			ctx.translate(self.canvas.width/2 + self.view.offsetX*self.view.zoom, -(self.view.offsetY*self.view.zoom - self.canvas.height/2));
			ctx.scale(self.view.zoom, self.view.zoom * -1 /* invert y-axis */);
		}
		
		function updateExtents() {
			self.view.minX = -self.canvas.width /2/self.view.zoom - self.view.offsetX;
			self.view.maxX =  self.canvas.width /2/self.view.zoom - self.view.offsetX;
			self.view.minY = -self.canvas.height/2/self.view.zoom - self.view.offsetY;
			self.view.maxY =  self.canvas.height/2/self.view.zoom - self.view.offsetY;
		}
		
		function drawAxes() {
			ctx.beginPath();
			
			// x-axis
			ctx.moveTo(self.view.minX, 0);
			ctx.lineTo(self.view.maxX, 0);
			
			// y-axis
			ctx.moveTo(0, self.view.minY);
			ctx.lineTo(0, self.view.maxY);
			
			ctx.strokeStyle = '#222222';
			ctx.stroke();
		}
		
		function drawGrid() {
			ctx.beginPath();
			
			var spacing = 1;
			
			for (var x = self.view.minX - self.view.minX%spacing; x < self.view.maxX; x += spacing) {
				ctx.moveTo(x, self.view.minY);
				ctx.lineTo(x, self.view.maxY);
			}
			
			for (var y = self.view.minY - self.view.minY%spacing; y < self.view.maxY; y += spacing) {
				ctx.moveTo(self.view.minX, y);
				ctx.lineTo(self.view.maxX, y);
			}
			
			ctx.strokeStyle = 'rgba(0, 0, 0, 0.13)';
			ctx.stroke();
		}
		
		function graphFuncs() {
			for (var i = 0, n = self.funcs.length; i < n; i++) {
				ctx.beginPath();
				
				ctx.moveTo(self.view.minX, self.funcs[i](self.view.minX));
				for (var x = self.view.minX; x < self.view.maxX; x += 1/self.view.zoom) {
					ctx.lineTo(x, self.funcs[i](x));
				}
				
				ctx.strokeStyle = self.funcColors[i] || 'black';
				ctx.stroke();
			}
		}
		
		function drawSamples() {
			var endRadius = 1/self.view.zoom;
			ctx.beginPath();
			
			for (var i = 0, n = self.samples.length; i < n; i++) {
				var sample = self.samples[i];
				
				ctx.moveTo(sample.x, sample.y1 + endRadius);
				ctx.arc(sample.x, sample.y1, endRadius, (1/2)*Math.PI, (5/2)*Math.PI);
				
				ctx.lineTo(sample.x, sample.y2 - endRadius);
				ctx.arc(sample.x, sample.y2, endRadius, (3/2)*Math.PI, (7/2)*Math.PI);
			}
			
			ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
			ctx.stroke();
		}
		
		self.refresh = function () {
			ctx.save();
			ctx.clear();
			
			transformCanvas();
			updateExtents();
			
			ctx.lineWidth = 2/3/self.view.zoom;
			drawGrid();
			drawAxes();
			graphFuncs();
			drawSamples();
			
			ctx.restore();
		};
		
		var scrollListeners = [];
		self.onScroll = function (listener) {
			scrollListeners.push(listener);
		};
		
		var zoomListeners = [];
		self.onZoom = function (listener) {
			zoomListeners.push(listener);
		};
		
		var clickListeners = [];
		self.onClick = function (listener) {
			clickListeners.push(listener);
		};
		
		self.canvas = document.createElement('canvas');
		self.canvas.width     = config.width  || 640;
		self.canvas.height    = config.height || 480;
		self.canvas.className = config.className;
		$(config.container).first().append(self.canvas);
		
		var ctx = self.canvas.getContext('2d');
		
		self.sampleResolution = 1/10;
		self.sampleWindow = {
			minX: -self.canvas.width /2/self.view.zoom - self.view.offsetX,
			maxX:  self.canvas.width /2/self.view.zoom - self.view.offsetX,
			minY: -self.canvas.height/2/self.view.zoom - self.view.offsetY,
			maxY:  self.canvas.height/2/self.view.zoom - self.view.offsetY
		};
		
		var isDragging = false;
		$(self.canvas).on('mousedown',   function () { isDragging = true; });
		$(document).on('mouseup',   function () { isDragging = false; });
		$(document).on('mousemove', function (event) {
			if (!isDragging) return;
			event.preventDefault();
			
			// on drag start, cancel click event
			isClicking = false;
			
			var o = event.originalEvent;
			var oldOffsetX = self.view.offsetX;
			self.view.offsetX += (o.movementX || o.webkitMovementX || o.mozMovementX || 0)/self.view.zoom;
			var oldOffsetY = self.view.offsetY;
			self.view.offsetY -= (o.movementY || o.webkitMovementY || o.mozMovementY || 0)/self.view.zoom;
			
			scrollListeners.forEach(function (listener) {
				listener(self.view.offsetX - oldOffsetX, self.view.offsetY - oldOffsetY);
			});
			
			self.refresh();
		});
		
		$(self.canvas).on('mousewheel DOMMouseScroll', function (event) {
			event.preventDefault();
			var scrollAmount = -event.originalEvent.detail || event.originalEvent.wheelDelta/120;
			
			var zoomDelta = 0.05;
			var oldZoom = self.view.zoom;
			if (scrollAmount > 0) {
				// self.view.offsetX = ...
				self.view.zoom *= 1 + zoomDelta;
			} else {
				// self.view.offsetX = ...
				self.view.zoom *= 1 - zoomDelta;
			}
			
			zoomListeners.forEach(function (listener) {
				listener(self.view.zoom/oldZoom);
			});
			
			self.refresh();
		});
		
		var isClicking = false;
		$(self.canvas).on('mousedown', function () {
			isClicking = true;
		});
		$(self.canvas).on('mouseup', function () {
			if (isClicking) {
				clickListeners.forEach(function (listener) {
					listener(self);
				});
			}
		});
		
		// self.refresh();
	};
	
	return exports;
}());
