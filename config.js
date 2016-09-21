CONFIG = {
	targetFunc: function (x) {
		return (
			Math.cos(x) + Math.sin(3*x)
			// Math.sin(x*2) + Math.cos(x) + 1
			// x
			// Math.pow(x/2, 2) - 3
		);
	},
	
	numHiddenNeurons: 24,
	hiddenLayerTransferFunction: Math.sin,
	outputLayerTransferFunction: BRAIN.transferFunctions.identity,
	initialBiasRange: 1,
	// 0...1; per gene
	mutationRate: 0.005,
	mutationRange: 1,
	
	sampleRange: 6,
	sampleResolution: 1/10,
	
	initialZoom: 70
};
