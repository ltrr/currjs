var svg = d3.select("#curriculum");
var circles = svg.select("#curr-nodes").selectAll("circle"); 
var lines = svg.select("#curr-edges").selectAll("line");

// Dimensions of the svg area
var svg_dim = svg.node().getBoundingClientRect();
var width = svg_dim.width;
var height = svg_dim.height;

var data, // Raw data from json file
	index, // Index for code -> node object conversion
	nodes, // List of node objects
	edges; // List of edge objects

d3.json("data.json", function(error, json) {
	if (error) return console.warn(error);
	data = json;
	nodes = data["components"];

	// Creates nodes and index them.
	index = new Object();
	for (var i = 0; i < nodes.length; ++i) {
		var node = nodes[i];
		index[node.code] = node;
	}

	edges = new Array();

	// Adds dependecies to edges
	var edges_dep = data["edges_dep"];
	for (var i = 0; i < edges_dep.length; ++i) {
		var edge = edges_dep[i];
		edges[i] = { u: index[edge[0]], v: index[edge[1]], type: "D" };
	}

	// Adds codependecies to edges
	var k = edges.length;
	var edges_codep = data["edges_codep"];
	for (var i = 0; i < edges_codep.length; ++i) {
		var edge = edges_codep[i];
		edges[k+i] = { u: index[edge[0]], v: index[edge[1]], type: "C" };
	}

	startGraph();
});


/* Initializes the graph and starts the simulation */
function startGraph() {

	// Defines margins
	var xbase = 0.1 * width;
	var xrange = 0.8 * width;
	var ybase = 0.1 * height;
	var yrange = 0.8 * height;

	for (var i = 0; i < nodes.length; ++i) {
		var node = nodes[i];
		node.x = xbase + Math.random() * xrange;
		node.y = ybase + Math.random() * yrange;
		node.vx = 0;
		node.vy = 0;

		// Uncomment lines below to add random intial velocity
		// node.vx = Math.random() * 3 - 1.5;
		// node.vy = Math.random() * 3 - 1.5;
	}

	circles.data(nodes)
		.enter().append("circle")
			.attr("cx", function (d) { return d.x; })
			.attr("cy", function (d) { return d.y; })
			.attr("r", 5)
			.on("click", function (d) { console.log(d.code) });

	lines.data(edges)
		.enter().append("line")
			.attr("x1", function (d) { return d.u.x; })
			.attr("y1", function (d) { return d.u.y; })
			.attr("x2", function (d) { return d.v.x; })
			.attr("y2", function (d) { return d.v.y; })
			.classed("dashed", function (d) { return d.type == "C"; });

	// Update loop
	setInterval(function () {
		updatePosition();
		updateVelocity();
	}, 50);

	// Updates the variables to the newly created objects
	circles = svg.select("#curr-nodes").selectAll("circle");
	lines = svg.select("#curr-edges").selectAll("line");
}


/* Updates the position of each node in the graph
 based on its velocity */
function updatePosition() {

	for (var i = 0; i < nodes.length; ++i) {
		var node = nodes[i];
		node.x += node.vx;
		node.y += node.vy;
	}

	circles.data(nodes)
		.attr("cx", function (d) { return d.x; })
		.attr("cy", function (d) { return d.y; });

	lines.data(edges)
		.attr("x1", function (d) { return d.u.x; })
		.attr("y1", function (d) { return d.u.y; })
		.attr("x2", function (d) { return d.v.x; })
		.attr("y2", function (d) { return d.v.y; });
}


function updateVelocity() {

	/* Force calculation goes here.
	To apply a force to a node just
	discover the components (fx, fy)
	and do
		node.vx += fx;
		node.vy += fy;
	*/
}