//----------------
const
    Plane = SR.Plane = {
        X: 1,
        Y: 2,
        Z: 3,
        W: 4
    }


//----------------

var ShaderVertex = function(varSize, constSize) {
	this.point = new Point();
	this.varSize = varSize;
    this.constSize = constSize;
	this.vars = (new Array(varSize)).fill(0);
    this.consts = (new Array(constSize)).fill(0);
}
var dp = ShaderVertex.prototype;

dp.getPlane = function(plane) {
    switch(plane) {
        case Plane.X:
            return this.point.x;
        case Plane.Y:
            return this.point.y;
        case Plane.Z:
            return this.point.z;
        case Plane.W:
            return this.point.w;
        default:
            return 0;
    }
}

dp.lerp = function(pa, pb, proc) {
    /*Point.TMP.set(pb.point).mul(1- proc);
    this.point.set(pa.point).mul(proc).add(Point.TMP);*/

    let proc1 = (1-proc);
    this.point.x = pa.point.x * proc + pb.point.x * proc1;
    this.point.y = pa.point.y * proc + pb.point.y * proc1;
    this.point.z = pa.point.z * proc + pb.point.z * proc1;
    this.point.w = pa.point.w * proc + pb.point.w * proc1;

    for(let i=0;i<this.varSize;i++)
        this.vars[i] = pa.vars[i] * proc + pb.vars[i] * proc1;
    //TODO const vars needs to align the same way
    for(let i=0;i<this.constSize;i++)
        this.consts[i] = pa.consts[i] * proc + pb.consts[i] * proc1;
}


//----------------

var AbstractShader = function(varSize, constSize) {
	this.varSize = varSize;
    this.constSize = constSize;

	this.varyingSlope = (new Array(this.varSize*2)).fill(0);
	this.varying = (new Array(this.varSize)).fill(0);

    this.vertexCacheIndex = 0;
    this.vertexCache = [];
}
var dp = AbstractShader.prototype;

dp.resetVertexCache = function() {
    this.vertexCacheIndex = 0;
}

dp.getVertexFromCache = function() {
    if(this.vertexCacheIndex > this.vertexCache.length - 1) {
        var vx = new ShaderVertex(this.varSize, this.constSize);
        this.vertexCache.push(vx);
        this.vertexCacheIndex++;
        return vx;
    } else
        return this.vertexCache[ this.vertexCacheIndex++ ];
}

dp.copyShaderVertex = function(src) {
    var dest = this.getVertexFromCache();
    dest.point.set( src.point );
    for(var i=0,l=this.varSize;i<l;i++)
        dest.vars[i] = src.vars[i];
    for(var i=0,l=this.constSize;i<l;i++)
        dest.consts[i] = src.consts[i];
    return dest;
}


dp.assignVertex = function(shaderVertex, srcVertex, srcTransform) {
	if(!srcVertex)
		return shaderVertex;
	if(srcTransform)
		Point.transform(shaderVertex.point, srcVertex.point, srcTransform);
	else
		shaderVertex.point.set(srcVertex.point);
	this.assignVertexVars(shaderVertex, srcVertex, srcTransform);
	return shaderVertex;
}
dp.assignVertexVars = function(shaderVertex, srcVertex, srcTransform) {}

dp.getVertex = function(srcVertex, srcTransform) {
	return this.assignVertex(this.getVertexFromCache(), srcVertex, srcTransform);
}



dp.preDraw = function(renderer, v1,v2,v3) {}

dp.calculateVaryingBase = function(base, x, y) {
    var xDiff = x - base.point.x,
        yDiff = y - base.point.y,
        slopes = this.varyingSlope;

    for(var i=0,l=base.vars.length; i<l;i++) {
        var slopeIdx = i * 2;
        this.varying[i] = base.vars[i] + ( slopes[slopeIdx+0] * xDiff + slopes[slopeIdx+1] * yDiff );
    }
}

dp.incrementVaryingX = function() {}

dp.processPixel = function(renderer, vars, x, y) {}

dp.postDraw = function(renderer, v1,v2,v3) {}


//----------------

var ShadowShader = function() {
    AbstractShader.call(this, 1);
}
var dp = ShadowShader.prototype;
dp.__proto__ = AbstractShader.prototype;

dp.calculateVaryingSlope = function(renderer, v1,v2,v3) {
    v1.vars[0] = v1.point.z;
    v2.vars[0] = v2.point.z;
    v3.vars[0] = v3.point.z;
    return true;
}

dp.processPixel = function(renderer, vars, x, y) { //254.7
    let myz = vars[0] + 0.001;
    renderer.surface.setShadowPixel(x,y,0);

    /*var idx = renderer.surface.getIndex(x,y);
    renderer.surface.setPixel(idx, 0,0,0,0xff);*/
}


//----------------

var MinimalShader = function() {
    AbstractShader.call(this, 2+4);
}
var dp = MinimalShader.prototype;
dp.__proto__ = AbstractShader.prototype;


dp.assignVertexVars = function(dest, src, srcTransform) {
    dest.vars[ 2 ] = src.color.r;
    dest.vars[ 3 ] = src.color.g;
    dest.vars[ 4 ] = src.color.b;
    dest.vars[ 5 ] = src.color.a;
}


dp.perspectiveCorrectTriangle = function(renderer, v1,v2,v3) {
    v1.vars[0] = v1.point.z;
    v2.vars[0] = v2.point.z;
    v3.vars[0] = v3.point.z;

    v1.vars[1] = 1 / v1.point.w;
    v2.vars[1] = 1 / v2.point.w;
    v3.vars[1] = 1 / v3.point.w;

    for(var i=2;i<this.varSize;i++) {
        v1.vars[i] /= v1.point.w;
        v2.vars[i] /= v2.point.w;
        v3.vars[i] /= v3.point.w;
    }
}

dp.calculateVaryingSlope = function(renderer,v1,v2,v3) {
    this.perspectiveCorrectTriangle(renderer, v1,v2,v3);

    var w12 = v2.point.x - v1.point.x,
        h12 = v2.point.y - v1.point.y,
        w13 = v3.point.x - v1.point.x,
        h13 = v3.point.y - v1.point.y,
        quot = w13*h12 - w12*h13;
    if(quot === 0)
        return false;

    var v1 = v1.vars,
        v2 = v2.vars,
        v3 = v3.vars;

    for(var i=0;i<this.varSize;i++) {
        var r1 = v1[i],
            r2 = v2[i],
            r3 = v3[i];

        var dx = (h12 * (r3 - r1) + h13 * (r1 - r2)) / quot,
            dy = (w12 * (r3 - r1) + w13 * (r1 - r2)) / -quot;

        this.varyingSlope[ (i*2) + 0 ] = dx;
        this.varyingSlope[ (i*2) + 1 ] = dy;
    }

    return true;
}

dp.incrementVaryingX = function() {
    var slopes = this.varyingSlope;
    for(var i=0,l=this.varSize;i<l;i++) {
        this.varying[i] += slopes[i<<1]; //slopes[i*2+0];
    }
}

dp.processPixel = function(renderer, vars, x, y) { //254.7
    var vars = this.varying;
    var pixIdx = renderer.surface.checkDepth(x,y, vars[0]);
    if(pixIdx === -1)
        return;
    var invW = vars[1],
        r = vars[2] / invW,
        g = vars[3] / invW,
        b = vars[4] / invW,
        a = vars[5] / invW;

    renderer.surface.setPixelAlphaBlend(pixIdx, r,g,b,a);
}



//----------------

var GouraudShader = function() {
    AbstractShader.call(this, 2+4+3+2, 3+3);
}
var dp = GouraudShader.prototype;
dp.__proto__ = MinimalShader.prototype;


dp.assignVertexVars = function(dest, src) {
    dest.vars[ 2 ] = src.color.r;
    dest.vars[ 3 ] = src.color.g;
    dest.vars[ 4 ] = src.color.b;
    dest.vars[ 5 ] = src.color.a;
    if(src.texture) {
        dest.vars[ 6 ] = src.texture[0];
        dest.vars[ 7 ] = src.texture[1];
    }

    //Point in WorldSpace
    Point.transform(Point.TMP, src.point, this.renderer.modelTransform);
    dest.consts[ 0 ] = Point.TMP.x;
    dest.consts[ 1 ] = Point.TMP.y;
    dest.consts[ 2 ] = Point.TMP.z;

    //Normal in WorldSpace
    Point.transform(Point.TMP, src.normal, this.renderer.modelTransform);
    dest.consts[ 3 ] = Point.TMP.x;
    dest.consts[ 4 ] = Point.TMP.y;
    dest.consts[ 5 ] = Point.TMP.z;
}

const EYE_NORMAL = new Point(0,0,1);


var _normalTmp = new Point();
dp.lightVertex = function(renderer, v) {
    var r = 0,
        g = 0,
        b = 0;

    var light, lightIdx = 0;
    while(light = renderer.scene.lights[lightIdx++]) {
        if(!light.enabled)
            continue;
        switch(light.type) {
            case Light.Type.Ambient:
                r += light.colorIntensity.r; //addChannels
                g += light.colorIntensity.g;
                b += light.colorIntensity.b;
                break;
            case Light.Type.Point:
            case Light.Type.Directional:

                var lightNormal;

                if(light.type === Light.Type.Point) {
                    var worldSpace = Point.TMP.set( v.consts[0], v.consts[1], v.consts[2] );
                    lightNormal = Point.TMP1.set( light.point ).sub( worldSpace ).normalize();
                } else
                    lightNormal = light.normal;

                var dot = Point.dot( lightNormal, Point.TMP.set(v.consts[3], v.consts[4], v.consts[5]));  //_normalTmp.set( v.point ).normalize() );
                if(dot > 0) {
                    r += light.colorIntensity.r * dot; //c.addChannels(light.colorIntensity.copy().scale(dot));
                    g += light.colorIntensity.g * dot;
                    b += light.colorIntensity.b * dot;

                    _normalTmp.set( v.normal ).mul( dot * 2).sub(lightNormal);
                    var specularIntensity = Math.pow(0.5 + Point.dot(_normalTmp, EYE_NORMAL), 15)//, material.specularExponent);
                    var sr = 255, //specularColor
                        sg = 255,
                        sb = 255;

                    var scale = specularIntensity * light.intensity / 255
                    r += sr * scale;
                    g += sg * scale;
                    b += sb * scale;
                }
                break;
            default:
                break;
        }
    }

    r *= v.vars[2]; //multiplyChannels
    g *= v.vars[3];
    b *= v.vars[4];

    //Clamp
    v.vars[2] = Math.min(0xff, Math.max(0, r));
    v.vars[3] = Math.min(0xff, Math.max(0, g));
    v.vars[4] = Math.min(0xff, Math.max(0, b));
}

dp.preDraw = function(renderer, v1, v2, v3) {
    this.lightVertex(renderer, v1);
    this.lightVertex(renderer, v2);
    this.lightVertex(renderer, v3);
}

dp.processPixel = function(renderer, vars, x, y) {
    var vars = this.varying;
    var pixIdx = renderer.surface.checkDepth(x,y, vars[0]);
    if(pixIdx === -1)
        return;
    var invW = vars[1],
        r = vars[2] / invW,
        g = vars[3] / invW,
        b = vars[4] / invW,
        a = vars[5] / invW;



    /*let mat = this.material;
    if(mat) {
        //11.4
        let u = vars[6] / invW,
            v = vars[7] / invW;

        u = u > 1 ? u - Math.floor(u) : u < 0 ? Math.floor(u - u) : u;
        v = v > 1 ? v - Math.floor(v) : v < 0 ? Math.floor(v - v) : v;

        var tx = Math.ceil(u * (mat.width-1)),
            ty = Math.ceil(v * (mat.height-1)),
            idx = (ty*mat.width +tx)<<2;

        r = (mat.data[idx+0] * (r/255));// | 0
        g = (mat.data[idx+1] * (g/255));// | 0
        b = (mat.data[idx+2] * (b/255));// | 0
        a = mat.data[idx+3]
    }
    */
    if(this.useStencil) { //Check shadow
        if(renderer.surface.getShadow(pixIdx) === 0 ) {
            return;
            r >>= 1;
            g >>= 1;
            b >>= 1;
        }
    }

    renderer.surface.setPixel(pixIdx, r,g,b,a);
}
