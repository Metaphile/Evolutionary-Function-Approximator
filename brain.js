var BRAIN = (function () {
	'use strict';
	var exports = {};
	
	exports.transferFunctions = {
		logistic: function (x) {
			return 1 / (1 + Math.pow(Math.E, -x));
		},
		
		step: function (x) {
			return (x >= 0) ? 1 : 0;
		},
		
		// http://en.wikipedia.org/wiki/Gaussian_function
		gaussian: (function () {
			var WIDTH = 1;
			var HEIGHT = 1;
			var OFFSET_X = 0;
			
			return function (x) {
				var exponent = -(Math.pow(x - OFFSET_X, 2) / (2 * Math.pow(WIDTH, 2)));
				return HEIGHT * Math.pow(Math.E, exponent);
			};
		})(),
		
		hyperbolicTangent: function (x) {
			var y = Math.exp(2*x);
			return (y - 1)/(y + 1);
		},
		
		identity: function (x) {
			return x;
		}
	};
	
	function Neuron(transferFunction, weights, weightOffset) {
		this.think = function (inputs) {
			var weightedSum = 0;
			for (var i = 0, n = inputs.length; i < n; i++) {
				weightedSum += inputs[i] * weights[weightOffset + i];
			}
			
			var bias = weights[weightOffset + inputs.length];
			return transferFunction(weightedSum + bias);
		};
	}
	
	function Layer(neurons) {
		this.think = function (inputs) {
			var outputs = [];
			for (var i = 0, n = neurons.length; i < n; i++) {
				outputs.push(neurons[i].think(inputs));
			}
			
			return outputs;
		};
	}
	
	exports.Brain = function (numInputs, numHiddenNeurons, numOutputs) {
		var self = this;
		
		self.weights = [];
		var numBiases = numHiddenNeurons + numOutputs;
		for (var i = 0; i < numInputs*numHiddenNeurons + numHiddenNeurons*numOutputs + numBiases; i++) {
			self.weights.push(Math.randRange(-1, 1));
		}
		
		var weightOffset = 0;
		
		var neurons = [];
		for (var i = 0; i < numHiddenNeurons; i++) {
			neurons.push(new Neuron(CONFIG.hiddenLayerTransferFunction || exports.transferFunctions.gaussian, self.weights, weightOffset));
			weightOffset += numInputs + 1 /* bias */;
			
			if ('maxInitialBiasMagnitude' in CONFIG) {
				self.weights[weightOffset - 1] *= CONFIG.maxInitialBiasRange/2;
			}
		}
		var hiddenLayer = new Layer(neurons);
		
		var neurons = [];
		for (var i = 0; i < numOutputs; i++) {
			neurons.push(new Neuron(CONFIG.outputLayerTransferFunction || exports.transferFunctions.identity, self.weights, weightOffset));
			weightOffset += numHiddenNeurons + 1;
		}
		var outputLayer = new Layer(neurons);
		
		var layers = [hiddenLayer, outputLayer];
		
		self.think = function (inputs) {
			var outputs = inputs;
			
			for (var i = 0, n = layers.length; i < n; i++) {
				outputs = layers[i].think(outputs);
			}
			
			return outputs;
		};
	};
	
	return exports;
}());
