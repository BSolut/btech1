Math.interpolate = function(value, vMin, vMax, retMin, retMax) {
    return retMin + (value - vMin) * (retMax - retMin) / (vMax - vMin);
}

const
    CullMode = {
        None: 0,
        Back: 1,
        Front: 2
    }

/*

const float DegToRad = float(M_PI / 180);
const int32 FixedDepthExponent = 16, FixedDepth1 = 1 << FixedDepthExponent;
const int32 SubdivExponent = 4, Subdiv1 = 1 << SubdivExponent, SubdivModulo = Subdiv1 - 1;
const float InvertedSubdiv1 = 1.f / Subdiv1;
const int32 TextureTransparencyKey = 0xff00ff;
*/
const
    SubdivExponent = 4,
    Subdiv1 = 1 << SubdivExponent,
    SubdivModulo= Subdiv1 - 1,
    InvertedSubdiv1 = 1 / Subdiv1;

var Canvas = SR.Canvas = function(dom) {
    this.camera = new Matrix();
    this.width = 800;
    this.height = 600;

    //RenderState
    this.cullMode = CullMode.Back;
    this.clipNear = 3;
    this.zoom = 1.5;
    this.currentTexture = {
        width: 0,
        height: 0
    }

    this.depthBuffer = new Array(this.width*this.height);
    this.depthBuffer.fill(0);


    this.dom = dom;
    this.ctx = dom.getContext('2d');
    dom.width = this.width;
    dom.height = this.height;
    this.imgData = this.ctx.createImageData(this.width, this.height);

    this.rasterizer = new TriangleRasterizer(this);
}
var dp = Canvas.prototype;


var _tmpCanvas = document.createElement('canvas'),
    _tmpCtx = _tmpCanvas.getContext('2d');


dp.getExponent = function(number) {
    for (var i = 31; i >= 0; i--) {
        if (1 << i == number) return i;
    }
    return 0;
}


dp.setCurrentTexture = function(text) {
    if(!text.rawData) {
        _tmpCanvas.width = text.width;
        _tmpCanvas.height = text.height;
        _tmpCtx.drawImage(text, 0, 0);

        text.rawData = _tmpCtx.getImageData(0,0,text.width,text.height).data;
    }

    this.currentTexture.width = text.width;
    this.currentTexture.height = text.height;
    this.currentTexture.widthExponent = this.getExponent(text.width);
    this.currentTexture.data = text.rawData;
}

dp.drawMesh = function(mesh, modelSpace) {
    var subset, subsetIdx = 0;
    while(subset = mesh.subsets[subsetIdx++]) {
        //RenderStates::CurrentTexture = subset->AppliedTexture; TODO
        this.setCurrentTexture(subset.texture);
        var tri, triIdx = 0;
        while(tri = subset.triangles[triIdx++])
            this.drawTriangle(modelSpace, tri);

    }
}

var _worldSpace = new Matrix(),
    v1 = new ProcessedVertex(),
    v2 = new ProcessedVertex(),
    v3 = new ProcessedVertex(),
    _tmp1 = new Point(),
    _tmp2 = new Point();

dp.drawTriangle = function(modelSpace, triangle) {
    _worldSpace.set(modelSpace).multiply( this.camera )

    v1.set(triangle.vertexa);
    v2.set(triangle.vertexb);
    v3.set(triangle.vertexc);

    Point.transform( v1.position, triangle.vertexa.position, _worldSpace );
    Point.transform( v2.position, triangle.vertexb.position, _worldSpace );
    Point.transform( v3.position, triangle.vertexc.position, _worldSpace );


    //TODO its looks broken
    /*_tmp1.set(v3.position).sub(v2.position);
    _tmp2.set(v2.position).sub(v1.position);
    var normal = Point.TMP.set(v1.position).mul(_tmp1).cross(_tmp2);
    var isLastTriangleCulled = normal.x + normal.y + normal.z < 0;
    if(this.cullMode == CullMode.Back && isLastTriangleCulled || this.cullMode === CullMode.Front && !isLastTriangleCulled)
        return console.log('Culled');*/


    //todo  if (!IsStencilTriangle) apply lights
    if(this.isStencilTriangle) {
        v1.R = v1.G = v1.B = 0x80;
        v2.R = v2.G = v2.B = 0x80;
        v3.R = v3.G = v3.B = 0x80;

        /*v1.R *= r1 > 256 ? 1 : r1 / 256;
        v1.G *= g1 > 256 ? 1 : g1 / 256;
        v1.B *= b1 > 256 ? 1 : b1 / 256;
        v2.R *= r2 > 256 ? 1 : r2 / 256;
        v2.G *= g2 > 256 ? 1 : g2 / 256;
        v2.B *= b2 > 256 ? 1 : b2 / 256;
        v3.R *= r3 > 256 ? 1 : r3 / 256;
        v3.G *= g3 > 256 ? 1 : g3 / 256;
        v3.B *= b3 > 256 ? 1 : b3 / 256;*/
    }


    var d = 1 / this.clipNear;
    v1.position.mul(d);
    v2.position.mul(d);
    v3.position.mul(d);
    var v1Visible = v1.position.z > 1,
        v2Visible = v2.position.z > 1,
        v3Visible = v3.position.z > 1;


    if(v1Visible && v2Visible && v3Visible) {
        this.drawClippedTriangle(v1, v2, v3);
    } else if(v1Visible || v2Visible || v2Visible) {
        var v12 = new ProcessedVertex(),
            v23 = new ProcessedVertex(),
            v31 = new ProcessedVertex();

        v12.position.x = Math.interpolate(1, v1.position.z, v2.position.z, v1.position.x, v2.position.x);
        v12.position.y = Math.interpolate(1, v1.position.z, v2.position.z, v1.position.y, v2.position.y);
        v12.position.z = 1;
        v23.position.x = Math.interpolate(1, v2.position.z, v3.position.z, v2.position.x, v3.position.x);
        v23.position.y = Math.interpolate(1, v2.position.z, v3.position.z, v2.position.y, v3.position.y);
        v23.position.z = 1;
        v31.position.x = Math.interpolate(1, v3.position.z, v1.position.z, v3.position.x, v1.position.x);
        v31.position.y = Math.interpolate(1, v3.position.z, v1.position.z, v3.position.y, v1.position.y);
        v31.position.z = 1;

        //todo interpolate textcorads and color

        if (v1Visible && v2Visible)
        {
            this.drawClippedTriangle(v31, v1, v23);
            this.drawClippedTriangle(v1, v2, v23);
        }
        else if (v2Visible && v3Visible)
        {
            this.drawClippedTriangle(v3, v31, v2);
            this.drawClippedTriangle(v12, v2, v31);
        }
        else if (v1Visible && v3Visible)
        {
            this.drawClippedTriangle(v1, v12, v23);
            this.drawClippedTriangle(v3, v1, v23);
        }
        else if (v1Visible)
        {
            this.drawClippedTriangle(v1, v12, v31);
        }
        else if (v2Visible)
        {
            this.drawClippedTriangle(v2, v23, v12);
        }
        else if (v3Visible)
        {
            this.drawClippedTriangle(v3, v31, v23);
        }
    }


}

dp.drawClippedTriangle = function(vertex1, vertex2, vertex3) {
    var width2 = this.width >> 1,
        height2 = this.height >> 1,
        d = width2 * this.zoom;

    var v1pp = vertex1.pPosition,
        v2pp = vertex2.pPosition,
        v3pp = vertex3.pPosition;

    v1pp.x = width2 + (vertex1.position.x * d / vertex1.position.z) | 0; //todo
    v1pp.y = height2 + (vertex1.position.y * d / vertex1.position.z) | 0;
    v2pp.x = width2 + (vertex2.position.x * d / vertex2.position.z) | 0;
    v2pp.y = height2 + (vertex2.position.y * d / vertex2.position.z) | 0;
    v3pp.x = width2 + (vertex3.position.x * d / vertex3.position.z) | 0;
    v3pp.y = height2 + (vertex3.position.y * d / vertex3.position.z) | 0;

    if(v1pp.x < 0 && v2pp.x < 0 && v3pp.x < 0 ||
       v1pp.y < 0 && v2pp.y < 0 && v3pp.y < 0 ||
       v1pp.x >= this.width && v2pp.x >= this.width && v3pp.x >= this.width ||
       v1pp.y >= this.height && v2pp.y >= this.height && v3pp.y >= this.height )
        return;

    //--After that point vXpp is dead

    if(vertex1.pPosition.y > vertex2.pPosition.y) {
        [vertex1,vertex2] = [vertex2,vertex1] //swap(vertex1, vertex2)
    }
    if(vertex2.pPosition.y > vertex3.pPosition.y) {
        [vertex2,vertex3] = [vertex3,vertex2] //swap(vertex2, vertex3);
        if(vertex1.pPosition.y > vertex2.pPosition.y)
            [vertex1,vertex2] = [vertex2,vertex1] //swap(vertex1, vertex2)
    }


    this.shader.processTriangle(this, vertex1,vertex2,vertex3);


    this.rasterizer.draw(this, vertex1, vertex2, vertex3);
    /*this.drawer.flush();


    this.ctx.moveTo(vertex1.pPosition.x, vertex1.pPosition.y)
    this.ctx.lineTo(vertex2.pPosition.x, vertex2.pPosition.y)
    this.ctx.lineTo(vertex3.pPosition.x, vertex3.pPosition.y)
    this.ctx.lineTo(vertex1.pPosition.x, vertex1.pPosition.y)
    this.ctx.stroke();
    */


    

    //this.ctx.putImageData(this.imgData, 0,0);

    return;

    vertex1.position.z = 1 / vertex1.position.z;
    vertex2.position.z = 1 / vertex2.position.z;
    vertex3.position.z = 1 / vertex3.position.z;

    if(!this.isStencilTriangle) {
        //Check texture coordinates
        //todo duplicate code here with x and y
        if(vertex1.textCoord.x < 0 || vertex2.textCoord.x < 0 || vertex3.textCoord.x < 0) {
            var diff = Math.floor(1 - Math.min(vertex1.textCoord.x, Math.min(vertex2.textCoord.x, vertex3.textCoord.x)));
            vertex1.textCoord.x += diff;
            vertex2.textCoord.x += diff;
            vertex3.textCoord.x += diff;
        }
        if(vertex1.textCoord.y < 0 || vertex2.textCoord.y < 0 || vertex3.textCoord.y < 0) {
            var diff = Math.floor(1 - Math.min(vertex1.textCoord.y, Math.min(vertex2.textCoord.y, vertex3.textCoord.y)));
            vertex1.textCoord.y += diff;
            vertex2.textCoord.y += diff;
            vertex3.textCoord.y += diff;
        }

        var curText = this.currentTexture;
        vertex1.textCoord.x *= curText.width * vertex1.position.z;
        vertex1.textCoord.y *= curText.height * vertex1.position.z;
        vertex1.R *= vertex1.position.Z;
        vertex1.G *= vertex1.position.Z;
        vertex1.B *= vertex1.position.Z;

        vertex2.textCoord.x *= curText.width * vertex2.position.z;
        vertex2.textCoord.y *= curText.height * vertex2.position.z;
        vertex2.R *= vertex2.position.Z;
        vertex2.G *= vertex2.position.Z;
        vertex2.B *= vertex2.position.Z;

        vertex3.textCoord.x *= curText.width * vertex3.position.z;
        vertex3.textCoord.y *= curText.height * vertex3.position.z;
        vertex3.R *= vertex3.position.Z;
        vertex3.G *= vertex3.position.Z;
        vertex3.B *= vertex3.position.Z;
    }


    var v1y = Math.min(Math.max(vertex1.pPosition.y, 0), this.height-1),
        v2y = Math.min(Math.max(vertex2.pPosition.y, 0), this.height-1),
        v3y = Math.min(Math.max(vertex3.pPosition.y, 0), this.height-1);

    if(!(vertex1.pPosition.y < this.height && vertex2.pPosition.y >= 0 || vertex2.pPosition.y < this.height && vertex3.pPosition.y >= 0))
        return;

    var v13u, v13v, v13r, v14g, v13b;
    var d = (vertex2.pPosition.y - vertex1.pPosition.y) * 1 / (vertex3.pPosition.y - vertex1.pPosition.y),
        v13x = vertex1.pPosition.x + (vertex3.pPosition.x - vertex1.pPosition.x) * d,
        v13z = vertex1.pPosition.z + (vertex3.pPosition.z - vertex1.pPosition.z) * d;

    if(!this.isStencilTriangle) {
        v13u = vertex1.textCoord.x + (vertex3.textCoord.x - vertex1.textCoord.x) * d;
        v13v = vertex1.textCoord.y + (vertex3.textCoord.y - vertex1.textCoord.y) * d;
        v13r = vertex1.R + (vertex3.R - vertex1.R) * d;
        v13g = vertex1.G + (vertex3.G - vertex1.G) * d;
        v13b = vertex1.B + (vertex3.B - vertex1.B) * d;
    }

    d = 1 / (v13x - vertex2.pPosition.x);
    Dz = (v13z - vertex2.pPosition.z) * d;
    this.Dz16 = Dz * Subdiv1;

    if(this.isStencilTriangle) {
        /*
            if (vertex1.ProjectedPosition.Y < Device::Height && vertex2.ProjectedPosition.Y >= 0)
            {
                for (int32 y = v1y; y < v2y; y++)
                {
                    DrawStencilScanline(
                        y,
                        vertex1.ProjectedPosition.X + (y - vertex1.ProjectedPosition.Y) * (vertex2.ProjectedPosition.X - vertex1.ProjectedPosition.X) / (vertex2.ProjectedPosition.Y - vertex1.ProjectedPosition.Y),
                        vertex1.Position.Z + (y - vertex1.ProjectedPosition.Y) * (vertex2.Position.Z - vertex1.Position.Z) / (vertex2.ProjectedPosition.Y - vertex1.ProjectedPosition.Y),
                        vertex1.ProjectedPosition.X + (y - vertex1.ProjectedPosition.Y) * (vertex3.ProjectedPosition.X - vertex1.ProjectedPosition.X) / (vertex3.ProjectedPosition.Y - vertex1.ProjectedPosition.Y),
                        vertex1.Position.Z + (y - vertex1.ProjectedPosition.Y) * (vertex3.Position.Z - vertex1.Position.Z) / (vertex3.ProjectedPosition.Y - vertex1.ProjectedPosition.Y)
                        );
                }
            }
            if (vertex2.ProjectedPosition.Y < Device::Height && vertex3.ProjectedPosition.Y >= 0)
            {
                for (int32 y = v2y; y < v3y; y++)
                {
                    DrawStencilScanline(
                        y,
                        vertex2.ProjectedPosition.X + (y - vertex2.ProjectedPosition.Y) * (vertex3.ProjectedPosition.X - vertex2.ProjectedPosition.X) / (vertex3.ProjectedPosition.Y - vertex2.ProjectedPosition.Y),
                        vertex2.Position.Z + (y - vertex2.ProjectedPosition.Y) * (vertex3.Position.Z - vertex2.Position.Z) / (vertex3.ProjectedPosition.Y - vertex2.ProjectedPosition.Y),
                        vertex1.ProjectedPosition.X + (y - vertex1.ProjectedPosition.Y) * (vertex3.ProjectedPosition.X - vertex1.ProjectedPosition.X) / (vertex3.ProjectedPosition.Y - vertex1.ProjectedPosition.Y),
                        vertex1.Position.Z + (y - vertex1.ProjectedPosition.Y) * (vertex3.Position.Z - vertex1.Position.Z) / (vertex3.ProjectedPosition.Y - vertex1.ProjectedPosition.Y)
                        );
                }
            }*/
    } else {
        this.Du = (v13u - vertex2.textCoord.x) * d;
        this.Dv = (v13v - vertex2.textCoord.y) * d;
        this.Dr = (v13r - vertex2.R) * d;
        this.Dg = (v13g - vertex2.G) * d;
        this.Db = (v13b - vertex2.B) * d;
        this.Du16 = this.Du * Subdiv1;
        this.Dv16 = this.Dv * Subdiv1;
        this.Dr16 = this.Dr * Subdiv1;
        this.Dg16 = this.Dg * Subdiv1;
        this.Db16 = this.Db * Subdiv1;

        if(vertex1.pPosition.y < this.height && vertex2.pPosition.y >= 0) {
            for(var y = v1y; y < v2y; y++) {
                this.drawScanline(
                    y,
                    vertex1.pPosition.x + ( y - vertex1.pPosition.y) * (vertex2.pPosition.x - vertex1.pPosition.x) /(vertex2.pPosition.y - vertex1.pPosition.y),
                    vertex1.position.z + ( y - vertex1.pPosition.y) * (vertex2.position.z - vertex3.position.z) / (vertex2.pPosition.y - vertex1.pPosition.y),
                    vertex1.textCoord.x + ( y - vertex1.pPosition.y) * (vertex2.textCoord.x - vertex1.textCoord.x) / (vertex2.pPosition.y - vertex1.pPosition.y),
                    vertex1.textCoord.y + ( y - vertex1.pPosition.y) * (vertex2.textCoord.y - vertex1.textCoord.x) / (vertex2.pPosition.y - vertex1.pPosition.y),
                    vertex1.R + (y - vertex1.pPosition.y) * (vertex2.R - vertex1.R) / (vertex2.pPosition.y - vertex1.pPosition.y),
                    vertex1.G + (y - vertex1.pPosition.y) * (vertex2.G - vertex1.G) / (vertex2.pPosition.y - vertex1.pPosition.y),
                    vertex1.B + (y - vertex1.pPosition.y) * (vertex2.B - vertex1.B) / (vertex2.pPosition.y - vertex1.pPosition.y),

                    vertex1.pPosition.x + (y - vertex1.pPosition.y) * (vertex3.pPosition.x - vertex1.pPosition.x) / (vertex3.pPosition.y - vertex1.pPosition.y),
                    vertex1.position.z + (y - vertex1.pPosition.y) * (vertex3.position.z - vertex1.position.z) / (vertex3.pPosition.y - vertex1.pPosition.y),
                    vertex1.textCoord.x + (y - vertex1.pPosition.y) * (vertex3.textCoord.x - vertex1.textCoord.x) / (vertex3.pPosition.y - vertex1.pPosition.y),
                    vertex1.textCoord.y + (y - vertex1.pPosition.y) * (vertex3.textCoord.y - vertex1.textCoord.y) / (vertex3.pPosition.y - vertex1.pPosition.y),
                    vertex1.R + (y - vertex1.pPosition.y) * (vertex3.R - vertex1.R) / (vertex3.pPosition.y - vertex1.pPosition.y),
                    vertex1.G + (y - vertex1.pPosition.y) * (vertex3.G - vertex1.G) / (vertex3.pPosition.y - vertex1.pPosition.y),
                    vertex1.B + (y - vertex1.pPosition.y) * (vertex3.B - vertex1.B) / (vertex3.pPosition.y - vertex1.pPosition.y)
                )
            }
        }


        this.ctx.putImageData(this.imgData, 0,0);//typeof x === 'undefined' ? 0 : x, typeof y === 'undefined' ? y : 0);

        if(vertex2.pPosition.y < this.height && vertex3.pPosition.y >= 0) {
            for(var y = v2y; y < v3y; y++) {
                this.drawScanline(
                    y,
                    vertex2.pPosition.x + (y - vertex2.pPosition.y) * (vertex3.pPosition.x - vertex2.pPosition.x) / (vertex3.pPosition.y - vertex2.pPosition.y),
                    vertex2.position.z + (y - vertex2.pPosition.y) * (vertex3.position.z - vertex2.position.z) / (vertex3.pPosition.y - vertex2.pPosition.y),
                    vertex2.textCoord.x + (y - vertex2.pPosition.y) * (vertex3.textCoord.x - vertex2.textCoord.x) / (vertex3.pPosition.y - vertex2.pPosition.y),
                    vertex2.textCoord.y + (y - vertex2.pPosition.y) * (vertex3.textCoord.y - vertex2.textCoord.y) / (vertex3.pPosition.y - vertex2.pPosition.y),
                    vertex2.R + (y - vertex2.pPosition.y) * (vertex3.R - vertex2.R) / (vertex3.pPosition.y - vertex2.pPosition.y),
                    vertex2.G + (y - vertex2.pPosition.y) * (vertex3.G - vertex2.G) / (vertex3.pPosition.y - vertex2.pPosition.y),
                    vertex2.B + (y - vertex2.pPosition.y) * (vertex3.B - vertex2.B) / (vertex3.pPosition.y - vertex2.pPosition.y),
                    vertex1.pPosition.x + (y - vertex1.pPosition.y) * (vertex3.pPosition.x - vertex1.pPosition.x) / (vertex3.pPosition.y - vertex1.pPosition.y),
                    vertex1.position.z + (y - vertex1.pPosition.y) * (vertex3.position.z - vertex1.position.z) / (vertex3.pPosition.y - vertex1.pPosition.y),
                    vertex1.textCoord.x + (y - vertex1.pPosition.y) * (vertex3.textCoord.x - vertex1.textCoord.x) / (vertex3.pPosition.y - vertex1.pPosition.y),
                    vertex1.textCoord.y + (y - vertex1.pPosition.y) * (vertex3.textCoord.y - vertex1.textCoord.y) / (vertex3.pPosition.y - vertex1.pPosition.y),
                    vertex1.R + (y - vertex1.pPosition.y) * (vertex3.R - vertex1.R) / (vertex3.pPosition.y - vertex1.pPosition.y),
                    vertex1.G + (y - vertex1.pPosition.y) * (vertex3.G - vertex1.G) / (vertex3.pPosition.y - vertex1.pPosition.y),
                    vertex1.B + (y - vertex1.pPosition.y) * (vertex3.B - vertex1.B) / (vertex3.pPosition.y - vertex1.pPosition.y)
                );
            }
        }

        this.ctx.putImageData(this.imgData, 0,0);//typeof x === 'undefined' ? 0 : x, typeof y === 'undefined' ? y : 0);

    }

/*
    if (vertex1.ProjectedPosition.Y < Device::Height && vertex2.ProjectedPosition.Y >= 0 || vertex2.ProjectedPosition.Y < Device::Height && vertex3.ProjectedPosition.Y >= 0)
    {


        d = 1.f / (v13x - vertex2.ProjectedPosition.X);
        Dz = (v13z - vertex2.Position.Z) * d;
        Dz16 = Dz * Subdiv1;

        if (IsStencilTriangle)
        {

        }
        else
        {
            Du = (v13u - vertex2.TextureCoordinates.X) * d;
            Dv = (v13v - vertex2.TextureCoordinates.Y) * d;
            Dr = (v13r - vertex2.R) * d;
            Dg = (v13g - vertex2.G) * d;
            Db = (v13b - vertex2.B) * d;
            Du16 = Du * Subdiv1;
            Dv16 = Dv * Subdiv1;
            Dr16 = Dr * Subdiv1;
            Dg16 = Dg * Subdiv1;
            Db16 = Db * Subdiv1;

            if (vertex1.ProjectedPosition.Y < Device::Height && vertex2.ProjectedPosition.Y >= 0)
            {
                for (int32 y = v1y; y < v2y; y++)
                {
                    DrawScanline(
                        y,
                        vertex1.ProjectedPosition.X + (y - vertex1.ProjectedPosition.Y) * (vertex2.ProjectedPosition.X - vertex1.ProjectedPosition.X) / (vertex2.ProjectedPosition.Y - vertex1.ProjectedPosition.Y),
                        vertex1.Position.Z + (y - vertex1.ProjectedPosition.Y) * (vertex2.Position.Z - vertex1.Position.Z) / (vertex2.ProjectedPosition.Y - vertex1.ProjectedPosition.Y),
                        vertex1.TextureCoordinates.X + (y - vertex1.ProjectedPosition.Y) * (vertex2.TextureCoordinates.X - vertex1.TextureCoordinates.X) / (vertex2.ProjectedPosition.Y - vertex1.ProjectedPosition.Y),
                        vertex1.TextureCoordinates.Y + (y - vertex1.ProjectedPosition.Y) * (vertex2.TextureCoordinates.Y - vertex1.TextureCoordinates.Y) / (vertex2.ProjectedPosition.Y - vertex1.ProjectedPosition.Y),
                        vertex1.R + (y - vertex1.ProjectedPosition.Y) * (vertex2.R - vertex1.R) / (vertex2.ProjectedPosition.Y - vertex1.ProjectedPosition.Y),
                        vertex1.G + (y - vertex1.ProjectedPosition.Y) * (vertex2.G - vertex1.G) / (vertex2.ProjectedPosition.Y - vertex1.ProjectedPosition.Y),
                        vertex1.B + (y - vertex1.ProjectedPosition.Y) * (vertex2.B - vertex1.B) / (vertex2.ProjectedPosition.Y - vertex1.ProjectedPosition.Y),
                        vertex1.ProjectedPosition.X + (y - vertex1.ProjectedPosition.Y) * (vertex3.ProjectedPosition.X - vertex1.ProjectedPosition.X) / (vertex3.ProjectedPosition.Y - vertex1.ProjectedPosition.Y),
                        vertex1.Position.Z + (y - vertex1.ProjectedPosition.Y) * (vertex3.Position.Z - vertex1.Position.Z) / (vertex3.ProjectedPosition.Y - vertex1.ProjectedPosition.Y),
                        vertex1.TextureCoordinates.X + (y - vertex1.ProjectedPosition.Y) * (vertex3.TextureCoordinates.X - vertex1.TextureCoordinates.X) / (vertex3.ProjectedPosition.Y - vertex1.ProjectedPosition.Y),
                        vertex1.TextureCoordinates.Y + (y - vertex1.ProjectedPosition.Y) * (vertex3.TextureCoordinates.Y - vertex1.TextureCoordinates.Y) / (vertex3.ProjectedPosition.Y - vertex1.ProjectedPosition.Y),
                        vertex1.R + (y - vertex1.ProjectedPosition.Y) * (vertex3.R - vertex1.R) / (vertex3.ProjectedPosition.Y - vertex1.ProjectedPosition.Y),
                        vertex1.G + (y - vertex1.ProjectedPosition.Y) * (vertex3.G - vertex1.G) / (vertex3.ProjectedPosition.Y - vertex1.ProjectedPosition.Y),
                        vertex1.B + (y - vertex1.ProjectedPosition.Y) * (vertex3.B - vertex1.B) / (vertex3.ProjectedPosition.Y - vertex1.ProjectedPosition.Y)
                        );
                }
            }
            if (vertex2.ProjectedPosition.Y < Device::Height && vertex3.ProjectedPosition.Y >= 0)
            {
                for (int32 y = v2y; y < v3y; y++)
                {
                    DrawScanline(
                        y,
                        vertex2.ProjectedPosition.X + (y - vertex2.ProjectedPosition.Y) * (vertex3.ProjectedPosition.X - vertex2.ProjectedPosition.X) / (vertex3.ProjectedPosition.Y - vertex2.ProjectedPosition.Y),
                        vertex2.Position.Z + (y - vertex2.ProjectedPosition.Y) * (vertex3.Position.Z - vertex2.Position.Z) / (vertex3.ProjectedPosition.Y - vertex2.ProjectedPosition.Y),
                        vertex2.TextureCoordinates.X + (y - vertex2.ProjectedPosition.Y) * (vertex3.TextureCoordinates.X - vertex2.TextureCoordinates.X) / (vertex3.ProjectedPosition.Y - vertex2.ProjectedPosition.Y),
                        vertex2.TextureCoordinates.Y + (y - vertex2.ProjectedPosition.Y) * (vertex3.TextureCoordinates.Y - vertex2.TextureCoordinates.Y) / (vertex3.ProjectedPosition.Y - vertex2.ProjectedPosition.Y),
                        vertex2.R + (y - vertex2.ProjectedPosition.Y) * (vertex3.R - vertex2.R) / (vertex3.ProjectedPosition.Y - vertex2.ProjectedPosition.Y),
                        vertex2.G + (y - vertex2.ProjectedPosition.Y) * (vertex3.G - vertex2.G) / (vertex3.ProjectedPosition.Y - vertex2.ProjectedPosition.Y),
                        vertex2.B + (y - vertex2.ProjectedPosition.Y) * (vertex3.B - vertex2.B) / (vertex3.ProjectedPosition.Y - vertex2.ProjectedPosition.Y),
                        vertex1.ProjectedPosition.X + (y - vertex1.ProjectedPosition.Y) * (vertex3.ProjectedPosition.X - vertex1.ProjectedPosition.X) / (vertex3.ProjectedPosition.Y - vertex1.ProjectedPosition.Y),
                        vertex1.Position.Z + (y - vertex1.ProjectedPosition.Y) * (vertex3.Position.Z - vertex1.Position.Z) / (vertex3.ProjectedPosition.Y - vertex1.ProjectedPosition.Y),
                        vertex1.TextureCoordinates.X + (y - vertex1.ProjectedPosition.Y) * (vertex3.TextureCoordinates.X - vertex1.TextureCoordinates.X) / (vertex3.ProjectedPosition.Y - vertex1.ProjectedPosition.Y),
                        vertex1.TextureCoordinates.Y + (y - vertex1.ProjectedPosition.Y) * (vertex3.TextureCoordinates.Y - vertex1.TextureCoordinates.Y) / (vertex3.ProjectedPosition.Y - vertex1.ProjectedPosition.Y),
                        vertex1.R + (y - vertex1.ProjectedPosition.Y) * (vertex3.R - vertex1.R) / (vertex3.ProjectedPosition.Y - vertex1.ProjectedPosition.Y),
                        vertex1.G + (y - vertex1.ProjectedPosition.Y) * (vertex3.G - vertex1.G) / (vertex3.ProjectedPosition.Y - vertex1.ProjectedPosition.Y),
                        vertex1.B + (y - vertex1.ProjectedPosition.Y) * (vertex3.B - vertex1.B) / (vertex3.ProjectedPosition.Y - vertex1.ProjectedPosition.Y)
                        );
                }
            }
        }
    }
*/
}

dp.drawScanline = function(y, v1x, v1z, v1u, v1v, v1r, v1g, v1b, v2x, v2z, v2u, v2v, v2r, v2g, v2b) {

    if(v1x > v2x) {
        [v1x, v2x] = [v2x, v1x];
        [v1z, v2z] = [v2z, v1z];
        [v1u, v2u] = [v2u, v1u];
        [v1v, v2v] = [v2v, v1v];
        [v1r, v2r] = [v2r, v1r];
        [v1g, v2g] = [v2g, v1g];
        [v1b, v2b] = [v2b, v1b];
    }
    if(v2x < 0 || v1x >= this.width)
        return;

    if(v1x < 0) {
        var d = v1x * 1 / (v2x - v1x);
        v1z -= (v2z - v1z) * d;
        v1u -= (v2u - v1u) * d;
        v1v -= (v2v - v1v) * d;
        v1r -= (v2r - v1r) * d;
        v1g -= (v2g - v1g) * d;
        v1b -= (v2b - v1b) * d;
        v1x = 0;
    }

    if(v2x >= this.width)
        v2x = this.width -1;

    var z = v1z, u = v1u, v = v1v, r = v1r, g = v1g, b = v1b,
        tw = this.currentTexture.width -1,
        th = this.currentTexture.height -1,
        twe = this.currentTexture.widthExponent;

    var depthPos = (v1x|0) + y * this.width;

    var subdivs = ((v2x -v1x) >> SubdivExponent) + 1;
    for(var i=0;i<subdivs;i++) {
        var pixels = i < subdivs -1 ? Subdiv1 : (v2x - v1x) & SubdivModulo;
        var z1 = 1 / z, z2 = 1 / (z + this.Dz16);
        var su = u * z1;
        var sv = v * z1;
        var sr = r * z1;
        var sg = g * z1;
        var sb = b * z1;
        var du = ((u + this.Du16) * z2 - su) * InvertedSubdiv1;
        var dv = ((v + this.Dv16) * z2 - sv) * InvertedSubdiv1;
        var dr = ((r + this.Dr16) * z2 - sr) * InvertedSubdiv1;
        var dg = ((g + this.Dg16) * z2 - sg) * InvertedSubdiv1;
        var db = ((b + this.Db16) * z2 - sb) * InvertedSubdiv1;

        for(var p=0;p<pixels;p++) {

            var depth = z;
            if(this.depthBuffer[depthPos] <= depth) { //&& (!RenderStates::EnableStencilMask || *stencilBuffer))
                //TODO
                var textPos = (su & tw) | (sv & th) << twe,
                    imgPos = (v1x|0) + y * this.width * 4 + (p*4);

                this.imgData.data[imgPos + 0] = this.currentTexture.data[ textPos + 0];
                this.imgData.data[imgPos + 1] = this.currentTexture.data[ textPos + 1];
                this.imgData.data[imgPos + 2] = this.currentTexture.data[ textPos + 2];
                this.imgData.data[imgPos + 3] = 255;
            }
            depthPos++;

            /*
            int16 depth = int16(z * 65536);
            if (*depthBuffer <= depth && (!RenderStates::EnableStencilMask || *stencilBuffer))
            {
                byte *color = (byte*)&textureBuffer[(int32(su) & tw) | ((int32(sv) & th) << twe)];
                if (*(int32*)color != TextureTransparencyKey)
                {
                    *backBuffer = ((color[0] * int32(sr)) >> 8) << 16 | ((color[1] * int32(sg)) >> 8) << 8 | (color[2] * int32(sb)) >> 8;
                    if (RenderStates::EnableZWrites) *depthBuffer = depth;
                }
            }
            backBuffer++;
            depthBuffer++;
            stencilBuffer++;
            */

            z += Dz;
            su += du;
            sv += dv;
            sr += dr;
            sg += dg;
            sb += db;
        }

        u += this.Du16;
        v += this.Dv16;
        r += this.Dr16;
        g += this.Dg16;
        b += this.Db16;
    }

    this.ctx.putImageData(this.imgData, 0,0);//typeof x === 'undefined' ? 0 : x, typeof y === 'undefined' ? y : 0);

/*

    int32 *backBuffer = &Device::BackBuffer[v1x + y * Device::Width];
    int16 *depthBuffer = &Device::DepthBuffer[v1x + y * Device::Width];
    sbyte *stencilBuffer = &Device::StencilBuffer[v1x + y * Device::Width];
    int32 *textureBuffer = RenderStates::CurrentTexture->Buffer;
    int32 textureWidthExponent = RenderStates::CurrentTexture->WidthExponent;

    float z = v1z, u = v1u, v = v1v, r = v1r, g = v1g, b = v1b;
    int32 tw = RenderStates::CurrentTexture->Width - 1;
    int32 th = RenderStates::CurrentTexture->Height - 1;
    int32 twe = RenderStates::CurrentTexture->WidthExponent;

    int32 subdivs = ((v2x - v1x) >> SubdivExponent) + 1;
    for (int32 i = 0; i < subdivs; i++)
    {
        int32 pixels = i < subdivs - 1 ? Subdiv1 : (v2x - v1x) & SubdivModulo;
        float z1 = 1 / z, z2 = 1 / (z + Dz16);
        float su = u * z1;
        float sv = v * z1;
        float sr = r * z1;
        float sg = g * z1;
        float sb = b * z1;
        float du = ((u + Du16) * z2 - su) * InvertedSubdiv1;
        float dv = ((v + Dv16) * z2 - sv) * InvertedSubdiv1;
        float dr = ((r + Dr16) * z2 - sr) * InvertedSubdiv1;
        float dg = ((g + Dg16) * z2 - sg) * InvertedSubdiv1;
        float db = ((b + Db16) * z2 - sb) * InvertedSubdiv1;
        for (int32 i = 0; i < pixels; i++)
        {
            int16 depth = int16(z * 65536);
            if (*depthBuffer <= depth && (!RenderStates::EnableStencilMask || *stencilBuffer))
            {
                byte *color = (byte*)&textureBuffer[(int32(su) & tw) | ((int32(sv) & th) << twe)];
                if (*(int32*)color != TextureTransparencyKey)
                {
                    *backBuffer = ((color[0] * int32(sr)) >> 8) << 16 | ((color[1] * int32(sg)) >> 8) << 8 | (color[2] * int32(sb)) >> 8;
                    if (RenderStates::EnableZWrites) *depthBuffer = depth;
                }
            }
            backBuffer++;
            depthBuffer++;
            stencilBuffer++;
            z += Dz;
            su += du;
            sv += dv;
            sr += dr;
            sg += dg;
            sb += db;
        }
        u += Du16;
        v += Dv16;
        r += Dr16;
        g += Dg16;
        b += Db16;
    }
*/
}