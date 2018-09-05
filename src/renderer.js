//--------

function TriangleRotate() {
    this.alist = [];
    this.blist = [];

    for(var i=0;i<50;i++) {
        this.alist.push( new Triangle() );
        this.blist.push( new Triangle() );
    }
}
var dp = TriangleRotate.prototype;

dp.start = function(p1,p2,p3) {
    var tri = this.blist[0];
    tri.p1 = p1;
    tri.p2 = p2;
    tri.p3 = p3;
    this.alength = 0;
    this.blength = 1;
}

dp.reset = function() {
    var tmp = this.alist;
    this.alist = this.blist;
    this.blist = tmp;
    tmp = this.alength;
    this.alength = this.blength;
    this.blength = 0;
}

dp.get = function(idx) {
    return this.alist[idx];
}

dp.push = function(tri) {
    this.pushPoint(tri.p1,tri.p2,tri.p3);
}

dp.pushPoint = function(p1,p2,p3) {
    var dest = this.blist[this.blength++];
    dest.p1 = p1;
    dest.p2 = p2;
    dest.p3 = p3;
}

//--------

function Renderer(width,height,surface) {
	this.width = width;
	this.height = height;
	this.surface = surface;
	this.surface.setSize(width, height);
	this.mvp = new Matrix4();
	this.projectionTransform = new Matrix4();
    this.modelTransform = new Matrix4();
    this.drawTransform = new Matrix4();
	this.triangleRasterizer = new TriangleRasterizer();
}
var dp = Renderer.prototype;

dp.setPerspective = function(near, far, fov) {
	this.projectionTransform.perspective(this.width, this.height, near, far, fov);
}

dp.renderer = function(scene) {
    this.scene = scene;
	this.mvp.set(this.projectionTransform);
	this.mvp.multiply( scene.camera );

    this.modelTransform.set(Matrix4.Identity);

    scene.world.render(this, 1);
}

dp.beginDrawMesh = function() {
    this.drawTransform.set(this.mvp).multiply( this.modelTransform );
}

var _triRotate = new TriangleRotate();
dp.drawTriangle = function(v1,v2,v3, transform) {
    transform = transform || this.drawTransform;

	var shader = this.shader;
    shader.renderer = this;
	shader.resetVertexCache();

    _triRotate.start(shader.getVertex(v1, transform),shader.getVertex(v2, transform), shader.getVertex(v3, transform));


    this.clipTriangles(_triRotate, Plane.Z, true, true);
    this.clipTriangles(_triRotate, Plane.Z, false);

    this.clipTriangles(_triRotate, Plane.X, true);
    this.clipTriangles(_triRotate, Plane.X, false);

    this.clipTriangles(_triRotate, Plane.Y, false);
    this.clipTriangles(_triRotate, Plane.Y, true);

    _triRotate.reset();
    for (let j = 0; j < _triRotate.alength; j++) {
        tNext = _triRotate.get(j);
        tNext.p1.point.normalizeW();
        tNext.p2.point.normalizeW();
        tNext.p3.point.normalizeW();

        this.rasterizerTriangle(tNext.p1, tNext.p2, tNext.p3);
    }
}


dp.getClipT = function(pA, pB, plane, isLow) {
    var a = pA.getPlane(plane),
        b = pB.getPlane(plane);
    if(isLow) {
        return (b + pB.point.w) / (b - a + pB.point.w - pA.point.w)
    } else
        return (pB.point.w - b) / (-b +a + pB.point.w - pA.point.w);
}

dp.clipTriangles = function(triangles, plane, isLow, checkW) {
    triangles.reset();

    for(let i=0,l=triangles.alength;i<l;i++) {
        var tri = triangles.get(i),
            invert = isLow ? 1 : -1;

        var p1b = (tri.p1.getPlane(plane)*invert) / tri.p1.point.w <= -1,
            p2b = (tri.p2.getPlane(plane)*invert) / tri.p2.point.w <= -1,
            p3b = (tri.p3.getPlane(plane)*invert) / tri.p3.point.w <= -1;

        if(checkW) {
            p1b = p1b || tri.p1.point.w <= 0;
            p2b = p2b || tri.p2.point.w <= 0;
            p3b = p3b || tri.p3.point.w <= 0;
        }
        if(!p1b && !p2b && !p3b) {
            triangles.push(tri);
            continue;
        }
        if(p1b && p2b && p3b)
            continue;

        //if we got here, part of the triangle is on the wrong side of the line
        let twoBehind = false;
        if (p2b && !p1b) { //rotate left
            let tmp = tri.p1;
            tri.p1 = tri.p2;
            tri.p2 = tri.p3;
            tri.p3 = tmp;
            twoBehind = p3b;
        } else if (p3b && !p2b) {
            //rotate right
            let tmp = tri.p3;
            tri.p3 = tri.p2;
            tri.p2 = tri.p1;
            tri.p1 = tmp;
            twoBehind = p1b;
        } else {
            twoBehind = p2b;
        }


        if (twoBehind) {
            //first two verts are getting clipped results in one triangle
            var tA = this.getClipT( tri.p1, tri.p3, plane, isLow ),
                tB = this.getClipT( tri.p2, tri.p3, plane, isLow );

            tri.p1.lerp( tri.p1, tri.p3, tA);
            tri.p2.lerp( tri.p2, tri.p3, tB);

            triangles.push(tri);
        } else {
            //only the first vert is getting clipped. results in two trian2gles

            var shader = this.shader;

            let tA = this.getClipT(tri.p1, tri.p2, plane, isLow),
                tB = this.getClipT(tri.p1, tri.p3, plane, isLow);

            var v12 = shader.getVertexFromCache();
            v12.lerp( tri.p1, tri.p2, tA );

            var v12copy = shader.copyShaderVertex(v12);

            var v13 = shader.getVertexFromCache();
            v13.lerp( tri.p1, tri.p3, tB );

            var p3copy = shader.copyShaderVertex(tri.p3);

            triangles.pushPoint( v12copy, tri.p2, p3copy );
            triangles.pushPoint( v12, tri.p3, v13 );
        }
    }
}


dp.rasterizerTriangle = function(v1,v2,v3) {
    this.drawCounter++;
    //sort from top to bottom maintaining ccw or cw order
    if(v2.point.y < v1.point.y && v2.point.y <= v3.point.y) {
        var tmp = v1;
        v1 = v2;
        v2 = v3;
        v3 = tmp;
    }
    if(v3.point.y < v2.point.y && v3.point.y < v1.point.y) {
        var tmp = v1;
        v1 = v3;
        v3 = v2;
        v2 = tmp;
    }

    var p1 = v1.point,
        p2 = v2.point,
        p3 = v3.point;

    //lets rescale the -1 to 1 point x and y coordinates to be buffer coordinates 0 - width and 0 - height
    var xScale = this.width/2,
        yScale = this.height/2;

    p1.x = (p1.x + 1) * xScale;
    p1.y = (p1.y + 1) * yScale;

    p2.x = (p2.x + 1) * xScale;
    p2.y = (p2.y + 1) * yScale;

    p3.x = (p3.x + 1) * xScale;
    p3.y = (p3.y + 1) * yScale;

    let vL = Point.TMP.set(p2).sub(p1);
    let vR = Point.TMP1.set(p3).sub(p1);
    let cr = vL.cross2(vR);    
    if (cr < 0) //keep Clockwise Faces cull Counter Clockwise Faces
        return;

    this.shader.preDraw(this, v1, v2, v3);
    this.triangleRasterizer.draw(this, v1, v2, v3);
    this.shader.postDraw(this, v1, v2, v3);
}
