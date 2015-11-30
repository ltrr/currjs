var svg = d3.select("#curriculum");
var circles = svg.select("#curr-nodes").selectAll("circle"); 
var lines = svg.select("#curr-edges").selectAll("line");

// Dimensions of the svg area
var svg_dim = svg.node().getBoundingClientRect();
var width = svg_dim.width;
var height = svg_dim.height;

var run = true;

/*var center = svg.append("circle")
	.attr("cx", width/2)
	.attr("cy", height/2)
	.attr("r", 1)
	.style("fill", '#FF00FF');*/

var data, // Raw data from json file
	index, // Index for code -> node object conversion
	nodes, // List of node objects
	edges; // List of edge objects

var tooltip = d3.select("body").append("div")   
    .attr("class", "tooltip")               
    .style("opacity", 0);

d3.json("data.json", function(error, json) {
	if (error) return console.warn(error);
	data = json;
	nodes = data["components"];

	// Creates nodes and index them.
	index = new Object();
	for (var i = 0; i < nodes.length; ++i) {
		var node = nodes[i];
		node["edges_in"] = [];
		node["edges_out"] = [];
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
		edges[k+i] = { u: index[edge[0]], v: index[edge[1]], type: "C", mode: 0 };
	}

	var m = edges.length;
	for (var i = 0; i < m; ++i) {
		var edge = edges[i];
		var u = edge.u;
		u.edges_out[u.edges_out.length] = edge;
		var v = edge.v;
		v.edges_in[v.edges_in.length] = edge;
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

	}

	circles.data(nodes)
		.enter().append("circle")
			.attr("cx", function (d) { return d.x; })
			.attr("cy", function (d) { return d.y; })
			.attr("r", function (d) { return d.ch/15 + 1; })
			.style("fill", function (d) {
				var ch = d.ch;
				if (ch <= 30) {
					return "#fc0309";
				} else if (ch <= 45) {
					return "#ff8a2c";
				} else if (ch <= 60) {
					return "#f5f300";
				} else if (ch <= 90) {
					return "#e8fbff";
				} else {
					return "#1e7eef";
				}
			})
			.on("click", function (d) { console.log(d.code) })
			.on("mouseover", function (d) {
				tooltip.style("opacity", .9)     
            		.html("<acronym>" + d.code + "</acronym><br />" + d.name)
            		.style("left", (d3.event.pageX + 28) + "px")     
                	.style("top", (d3.event.pageY - 28) + "px");

                for (var i = 0; i < d.edges_in.length; i++) {
                	d.edges_in[i].mode = 1;
                };
                for (var i = 0; i < d.edges_out.length; i++) {
                	d.edges_out[i].mode = 2;
                };

                run = false;
			})
			.on("mouseout", function (d) {
				tooltip.style("opacity", 0);

				for (var i = 0; i < d.edges_in.length; i++) {
                	d.edges_in[i].mode = 0;
                };
                for (var i = 0; i < d.edges_out.length; i++) {
                	d.edges_out[i].mode = 0;
                };

                run = true;
			})

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

	if (run) {
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
			.attr("y2", function (d) { return d.v.y; })
	}
	
	lines.classed("in", function (d) { return d.mode == 1; })
		 .classed("out", function (d) { return d.mode == 2; });
}


function updateVelocity() {

	if (!run) return;

	var m = edges.length;
	var n = nodes.length;
	

	var alpha = 5000; // repulsion constant
	var gamma = 20;
	var beta = 0.2; // buoyancy effect constant
	var k = 0.00008; // hooke's law constant
	var edge_len = 40; // ideal edge length

	for (var i = 0; i < n; ++i) {
		var u = nodes[i];

		if (u.sem) {

			var ref = 1.2*(u.sem) * edge_len;
			var dx = width/2 - u.x;
			var dy = height/2 - u.y;

			if (dx*dx + dy*dy > 0) {

				var dw = Math.sqrt(dx*dx + dy*dy);
				var dv = -beta*(ref-dw);

				u.x += dv * (dx/dw);
				u.y += dv * (dy/dw);
			}
		}

		// node-node repulsion
		for (var j = i+1; j < n; ++j) {
			var v = nodes[j];
			var dx = v.x - u.x;
			var dy = v.y - u.y;
			var dw = dx * dx + dy * dy;

			var f = alpha / (dw + gamma);

			u.vx -= f * (dx / dw);
			u.vy -= f * (dy / dw);
			v.vx += f * (dx / dw);
			v.vy += f * (dy / dw);
		}				
	}

	
	for (var i = 0; i < m; ++i) {
		var u = edges[i].u;
		var v = edges[i].v;

		// edge attraction
		var dx = v.x - u.x;
		var dy = v.y - u.y;
		var dw = Math.sqrt(dx * dx + dy * dy);

		var corr = 1;
		if (u.sem && v.sem) {
			corr = 1 + 0.1*(u.sem-1);
		}

		var p = 0.9;
		var f = k * (corr*edge_len - dw) * Math.abs(corr*edge_len - dw);

		u.vx -= p * f * (dx / dw);
		u.vy -= p * f * (dy / dw);
		v.vx += (1 - p) * f * (dx / dw);
		v.vy += (1 - p) * f * (dy / dw);

		var omega = 12000;
		// edge-edge repulsion
		for (var j = i+1; j < n; ++j) {
			var u2 = edges[j].u;
			var v2 = edges[j].v;

			var cx = (u.x + v.x)/2;
			var cy = (u.y + v.y)/2;
			var cx2 = (u2.x + v2.x)/2;
			var cy2 = (u2.y + v2.y)/2;

			var dx = cx2 - cx;
			var dy = cy2 - cy;
			var dw = dx * dx + dy * dy + 0.01;

			var f = omega / (dw + gamma);

			u.vx -= f * (dx / dw);
			u.vy -= f * (dy / dw);
			v.vx -= f * (dx / dw);
			v.vy -= f * (dy / dw);

			u2.vx += f * (dx / dw);
			u2.vy += f * (dy / dw);
			v2.vx += f * (dx / dw);
			v2.vy += f * (dy / dw);
		}
	}

	var maxv = 10;
	var damp = 0.70;
	for (var i = 0; i < n; ++i) {
		var u = nodes[i];
		u.vx *= damp;
		u.vy *= damp;
	}
}

