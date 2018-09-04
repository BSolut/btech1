
var ShadowTriangle = function(p1, p2, p3) {
	this.p1 = p1;
	this.p2 = p2;
	this.p3 = p3;
	this.p1Transformed = new Point();
	this.p2Transformed = new Point();
	this.p3Transformed = new Point();
	this.edge1 = this.edge2 = this.edge3 = null;
	this.isCulled = true;
}


var ShadowVolumen = function() {
	this.shadowTriangles = [];
}
var dp = ShadowVolumen.prototype;

dp.addTriangles = function(trinagles) {
	let tri, triIdx = 0,
		sTris = this.shadowTriangles;
	while(tri = trinagles[triIdx++])
		sTris.push( new ShadowTriangle(tri.p1.point, tri.p2.point, tri.p3.point) );
		//sTris.push( new ShadowTriangle(tri[0].point, tri[1].point, tri[2].point) );
}

dp.build = function() {
	let sTris = this.shadowTriangles,
		sTriCount = sTris.length,
		triangle1, triangle2;

	for(var a = 0; a < sTriCount; a++) {
		triangle1 = sTris[a];
		for(var b = 0; b < sTriCount; b++) {
			triangle2 = sTris[b];

			var t1a_t2a = triangle1.p1 === triangle2.p1,
				t1a_t2b = triangle1.p1 === triangle2.p2,
				t1a_t2c = triangle1.p1 === triangle2.p3,
				t1b_t2a = triangle1.p2 === triangle2.p1,
				t1b_t2b = triangle1.p2 === triangle2.p2,
				t1b_t2c = triangle1.p2 === triangle2.p3,
				t1c_t2a = triangle1.p3 === triangle2.p1,
				t1c_t2b = triangle1.p3 === triangle2.p2,
				t1c_t2c = triangle1.p3 === triangle2.p3;

			if (t1a_t2b && t1b_t2a) {
				triangle1.edge1 = triangle2;
				triangle2.edge1 = triangle1;
			} else
			if (t1b_t2b && t1c_t2a) {
				triangle1.edge2 = triangle2;
				triangle2.edge1 = triangle1;
			} else
			if (t1c_t2b && t1a_t2a) {
				triangle1.edge3 = triangle2;
				triangle2.edge1 = triangle1;
			} else
			if (t1a_t2c && t1b_t2b) {
				triangle1.edge1 = triangle2;
				triangle2.edge2 = triangle1;
			} else
			if (t1b_t2c && t1c_t2b) {
				triangle1.edge2 = triangle2;
				triangle2.edge2 = triangle1;
			} else
			if (t1c_t2c && t1a_t2b) {
				triangle1.edge3 = triangle2;
				triangle2.edge2 = triangle1;
			} else
			if (t1a_t2a && t1b_t2c) {
				triangle1.edge1 = triangle2;
				triangle2.edge3 = triangle1;
			} else
			if (t1b_t2a && t1c_t2c) {
				triangle1.edge2 = triangle2;
				triangle2.edge3 = triangle1;
			} else
			if (t1c_t2a && t1a_t2c) {
				triangle1.edge3 = triangle2;
				triangle2.edge3 = triangle1;
			}
		}
	}
}



var _ray1 = new Point(),
	_ray2 = new Point(),
	_ray3 = new Point();

dp.render = function(renderer, light) {
	light = renderer.scene.lights[0];
	let length = light.length,
		modelMatrix = renderer.modelTransform;


	var tri, triIdx = 0;
	while(tri = this.shadowTriangles[triIdx++]) {
		Point.transform( tri.p1Transformed, tri.p1, modelMatrix );
		Point.transform( tri.p2Transformed, tri.p2, modelMatrix );
		Point.transform( tri.p3Transformed, tri.p3, modelMatrix );

		// normal = ( Vertex1Transformed - light.position ) * (Vertex3Transformed - Vertex2Transformed).CrossProduct(  Vertex2Transformed - Vertex1Transformed)
		// Calculat the normal for culling check
		var p2Subp1 = Point.TMP2.set(tri.p2Transformed).sub(tri.p1Transformed),
			p3Subp2 = Point.TMP3.set(tri.p3Transformed).sub(tri.p2Transformed),
			crossValue = p3Subp2.cross(p2Subp1);

		var t1 = Point.TMP.set( tri.p1Transformed ).sub( light.point);
		var normal = t1.mulVector(crossValue);
		tri.isCulled = normal.x + normal.y + normal.z > 0;
	}


	triIdx = 0;
	while(tri = this.shadowTriangles[triIdx++]) {
		if(tri.isCulled)
			continue;

		//rayX = VertexXTransformed + ( VertexXTransformed - light.point ).normalize() * length
		//Build ray's
		_ray1.set(tri.p1Transformed).sub(light.point).normalize().mul( length ).add( tri.p1Transformed );
		_ray2.set(tri.p2Transformed).sub(light.point).normalize().mul( length ).add( tri.p2Transformed );
		_ray3.set(tri.p3Transformed).sub(light.point).normalize().mul( length ).add( tri.p3Transformed );

		if(tri.edge1 == null || tri.edge1.isCulled) {
			this.drawStencilTriangle(renderer, tri.p1Transformed, _ray2, _ray1 );
			this.drawStencilTriangle(renderer, tri.p1Transformed, tri.p2Transformed, _ray2 );
		}
		if(tri.edge2 == null || tri.edge2.isCulled) {
			this.drawStencilTriangle(renderer, tri.p2Transformed, _ray3, _ray2 );
			this.drawStencilTriangle(renderer, tri.p2Transformed, tri.p3Transformed, _ray3 );
		}
		if(tri.edge3 == null || tri.edge3.isCulled) {
			this.drawStencilTriangle(renderer, tri.p1Transformed, _ray1, _ray3 );
			this.drawStencilTriangle(renderer, tri.p1Transformed, _ray3, tri.p3Transformed);
		}

		this.drawStencilTriangle(renderer,_ray1, _ray2, _ray3);
		this.drawStencilTriangle(renderer,tri.p2Transformed, tri.p1Transformed, tri.p3Transformed);
	}
}

var _v1 = new Vertex(),
	_v2 = new Vertex(),
	_v3 = new Vertex();

dp.drawStencilTriangle = function(renderer,p1,p2,p3) {
	_v1.point.set(p1);
	_v2.point.set(p2);
	_v3.point.set(p3);

	renderer.drawTriangle(_v1, _v2, _v3);
}