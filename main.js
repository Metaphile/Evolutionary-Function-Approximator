$(document).ready(function () {
	'use strict';
	
	var DEFAULT_TARGET_FUNC_BODY = '3 / (1 + Math.pow(Math.E, -x*2)) - 3/2';
	var DEFAULT_TARGET_FUNC = eval('(function (x) { return (' + DEFAULT_TARGET_FUNC_BODY + '); });');
	var DEFAULT_MUTATION_RATE = 0.005;
	
	var sampleFuncs = (function () {
		var sampleRange = CONFIG.sampleRange || 2*Math.PI;
		var minX = -sampleRange/2, maxX = sampleRange/2;
		// var minY = -1, maxY = 1;
		var resolution = CONFIG.sampleResolution || Math.PI/12;
		
		return function (func1, func2) {
			var samples = [];
			
			// snap samples to the y-axis
			// this method is more reliable than `minX - minX%resolution` cuz floating point errors
			// todo: use same method in Graph.js
			var x = Math.ceil(minX/resolution) * resolution;
			for (x; x <= maxX + 0.000001 /* don't exclude last sample */; x += resolution) {
				samples.push({
					x: x,
					y1: func1(x),
					y2: func2(x)
				});
			}
			
			return samples;
		};
	}());
	
	// graphs
	// graphs
	// graphs
	
	var MARGIN_WIDTH = 12;
	var BORDER_WIDTH = 1;
	var GRAPH_ASPECT_RATIO = 3/2;
	
	var containerWidth = $('main').width();
	var candidateGraphInnerWidth = containerWidth*(1/4) - BORDER_WIDTH*(GRAPH_ASPECT_RATIO + 1);
	var targetGraphInnerWidth = containerWidth*(3/4) - BORDER_WIDTH*(2 - (GRAPH_ASPECT_RATIO - 1));
	
	var targetGraph = new GRAPH.Graph({
		container: '#target-graph',
		width:     targetGraphInnerWidth,
		height:    targetGraphInnerWidth/GRAPH_ASPECT_RATIO,
		className: 'graph target'
	});
	CONFIG.targetFunc = eval('(function (x) { return (' + ($('#target-func-body').val() || DEFAULT_TARGET_FUNC_BODY) + '); });');
	targetGraph.funcs.push(function (x) { return CONFIG.targetFunc(x); });
	targetGraph.funcColors.push('blue');
	targetGraph.view.zoom = CONFIG.initialZoom || targetGraphInnerWidth/10;
	
	function Organism(brain, graph) {
		var self = this;
		
		self.brain = brain;
		self.brainFunc = function (x) { return brain.think([x])[0]; };
		self.graph = graph;
	}
	
	var organisms = [], i = 3;
	var candidateGraphs = [];
	while (i--) {
		var brain = new BRAIN.Brain(1, CONFIG.numHiddenNeurons || 3, 1);
		var graph = new GRAPH.Graph({
			container: '#candidate-graphs',
			width:     candidateGraphInnerWidth,
			height:    candidateGraphInnerWidth/GRAPH_ASPECT_RATIO,
			className: 'graph candidate'
		});
		candidateGraphs.push(graph);
		
		var organism = new Organism(brain, graph);
		
		graph.funcs.push(organism.brainFunc);
		graph.funcColors.push('green');
		graph.view.zoom = targetGraph.view.zoom * (candidateGraphInnerWidth/targetGraphInnerWidth);
		graph.refresh();
		
		organisms.push(organism);
	}
	
	for (var i = 0, n = organisms.length; i < n; i++) {
		targetGraph.funcs.push(organisms[i].brainFunc);
		targetGraph.funcColors.push('rgba(0, 128, 0, 0.2)');
	}
	
	
	// synchronized pan/zoom
	
	targetGraph.onScroll(function () {
		for (var i = 0, n = organisms.length; i < n; i++) {
			organisms[i].graph.view.offsetX = targetGraph.view.offsetX;
			organisms[i].graph.view.offsetY = targetGraph.view.offsetY;
			organisms[i].graph.refresh();
		}
	});
	
	targetGraph.onZoom(function () {
		for (var i = 0, n = organisms.length; i < n; i++) {
			organisms[i].graph.view.zoom = targetGraph.view.zoom * (candidateGraphInnerWidth/targetGraphInnerWidth);
			organisms[i].graph.refresh();
		}
	});
	
	function selectCandidateGraph(graph) {
		$('.graph.candidate').removeClass('selected');
		
		for (var i = 0, n = organisms.length; i < n; i++) {
			if (organisms[i].graph === graph) {
				$(organisms[i].graph.canvas).addClass('selected');
				organisms[i].graph.selected = true; // ugly!
			} else {
				organisms[i].graph.selected = false; // ugly!
			}
		}
		
		for (var i = 1, n = targetGraph.funcColors.length; i < n; i++) {
			targetGraph.funcColors[i] = 'rgba(0, 128, 0, 0.2)';
		}
		
		var i = targetGraph.funcs.indexOf(graph.funcs[0]);
		targetGraph.funcColors[i] = 'green';
		
		targetGraph.samples = sampleFuncs(CONFIG.targetFunc, graph.funcs[0]);
		
		targetGraph.refresh();
	}
	
	organisms.forEach(function (organism) {
		organism.graph.onScroll(function () {
			targetGraph.view.offsetX = organism.graph.view.offsetX;
			targetGraph.view.offsetY = organism.graph.view.offsetY;
			targetGraph.refresh();
			
			for (var i = 0, n = organisms.length; i < n; i++) {
				if (organisms[i] === organism) continue;
				
				organisms[i].graph.view.offsetX = organism.graph.view.offsetX;
				organisms[i].graph.view.offsetY = organism.graph.view.offsetY;
				organisms[i].graph.refresh();
			}
		});
		
		organism.graph.onZoom(function () {
			targetGraph.view.zoom = organism.graph.view.zoom / (candidateGraphInnerWidth/targetGraphInnerWidth);
			targetGraph.refresh();
			
			for (var i = 0, n = organisms.length; i < n; i++) {
				if (organisms[i] === organism) continue;
				
				organisms[i].graph.view.zoom = organism.graph.view.zoom;
				organisms[i].graph.refresh();
			}
		});
		
		organism.graph.onClick(selectCandidateGraph);
	});
	
	function fitness(func1, func2) {
		var samples = sampleFuncs(func1, func2);
		
		var sum = 0;
		for (var i = 0, n = samples.length; i < n; i++) {
			sum += Math.abs(samples[i].y2 - samples[i].y1);
		}
		
		return 1/(sum/samples.length);
	}
	
	function makeBabies(mother, father) {
		var mothersDNA = mother.brain.weights.clone();
		var fathersDNA = father.brain.weights.clone();
		
		// for efficiency, do not instantiate whole new organisms
		// just swap out the DNA (weights) of existing organisms
		for (var i = 0, n = organisms.length; i < n; i++) {
			for (var j = 0, m = organisms[i].brain.weights.length; j < m; j++) {
				// 50/50 mix of mother's, father's DNA
				organisms[i].brain.weights[j] = (Math.random() < 0.5 ? mothersDNA[j] : fathersDNA[j]);
				// mutate genes
				if ((CONFIG.mutationRate || DEFAULT_MUTATION_RATE) > Math.random()) organisms[i].brain.weights[j] += Math.randRange(-(CONFIG.mutationRange || 1)/2, (CONFIG.mutationRange || 1)/2);
			}
		}
	}
	
	function step() {
		// assume the organisms array has already been sorted by fitness
		
		makeBabies(organisms[0], organisms[1]);
		
		organisms.sort(function (a, b) {
			return fitness(b.brainFunc, CONFIG.targetFunc) - fitness(a.brainFunc, CONFIG.targetFunc);
		});
		
		for (var i = 0, n = organisms.length; i < n; i++) {
			// graph organisms in order of fitness
			candidateGraphs[i].funcs[0] = organisms[i].brainFunc;
			candidateGraphs[i].refresh();
			
			if (organisms[i].graph.selected) selectCandidateGraph(organisms[i].graph);
		}
	}
	
	(function () {
		var timerId;
		var state = 'init';
		var $doButton = $('#do-button');
		var $targetFuncBody = $('#target-func-body');
		
		$targetFuncBody.attr('placeholder', DEFAULT_TARGET_FUNC_BODY);
		
		$doButton.on('click', function () {
			if (state === 'init' || state === 'paused' || state === 'inconsistent') {
				var targetFuncBody = $targetFuncBody.val();
				var targetFunc;
				if (targetFuncBody) {
					try {
						targetFunc = eval('(function (x) { return (' + targetFuncBody + '); });');
						// the above eval will throw an exception if there's a syntax error, but not if there's an undefined reference, etc.
						// so try actually executing the function
						targetFunc(0);
						CONFIG.targetFunc = targetFunc;
					} catch (e) {
						$targetFuncBody.css('background-color', 'pink');
					}
				} else {
					CONFIG.targetFunc = DEFAULT_TARGET_FUNC;
				}
				
				clearInterval(timerId);
				timerId = setInterval(step, 1000/30);
				$doButton.val('Pause');
				state = 'running';
			} else if (state === 'running') {
				clearInterval(timerId);
				timerId = null;
				$doButton.val('Resume');
				state = 'paused';
			}
		});
		
		$('#step-button').on('click', function () {
			$doButton.click();
			clearInterval(timerId);
			$doButton.val('Resume');
			state = 'paused';
			step();
		});
		
		$targetFuncBody.on('input', function () {
			$doButton.val('Retarget');
			$targetFuncBody.css('background-color', 'initial');
			state = 'inconsistent';
		}).on('keypress', function (event) {
			if (event.which === 13 && (state === 'init' || state === 'paused' || state === 'inconsistent')) {
				$doButton.click();
				event.preventDefault();
			}
		}).on('focus', function () {
			// reliable select-on-focus is surprisingly difficult
			// http://stackoverflow.com/q/3380458/40356
			$(this).select().one('mouseup', function (e) { e.preventDefault(); });
		});
		
		$('#sample-funcs a').on('click', function (event) {
			$targetFuncBody.val($(this).text());
			state = 'inconsistent';
			$doButton.click();
			
			event.preventDefault();
		});
		
		$('#mutation-rate-range').on('input', function () {
			$('#mutation-rate-number').val($(this).val());
			CONFIG.mutationRate = $(this).val();
		});
		
		$('#mutation-rate-number').on('input', function () {
			$('#mutation-rate-range').val($(this).val());
			CONFIG.mutationRate = $(this).val();
		});
		
		$('#mutation-rate-range').val(CONFIG.mutationRate);
		$('#mutation-rate-number').val(CONFIG.mutationRate);
	}());
	
	selectCandidateGraph(organisms[0].graph);
});
