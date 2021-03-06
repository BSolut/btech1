//----------------------------

function Color(r,g,b,a) {
    if(typeof r === 'number' && g === undefined && b === undefined) {
        this.r = (r & 0xff0000) >> 16;
        this.g = (r & 0x00ff00) >> 8;
        this.b = (r & 0x0000ff) >> 0;
    } else {
        this.set(r,g,b,a);
    }
}
Color.hsl = function(h,s,l,a) {
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        var hue2rgb = function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return new Color(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), (a == null ? 1 : a) * 255 );
}
Color.asColor = function(value) {
    if(value instanceof Color)
        return value;
    return new Color(value);
}
var dp = Color.prototype;

dp.set = function(r,g,b,a) {
    this.r = r || 0;
    this.g = g || 0;
    this.b = b || 0;
    this.a = a || 0xff;
}

dp.copy = function() {
    return new Color(this.r,this.g,this.b,this.a);
}

dp.scale = function(n) {
    this.r *= n;
    this.g *= n;
    this.b *= n;
    return this;
}


//----------------------------

function Vertex(point, normal, color, texture){
    this.point = point || new Point();
    this.normal = normal || new Point();
    this.texture = texture;
    this.color = Color.asColor(color);
}

var Triangle = function(p1,p2,p3) {
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
}

//----------------------------

var _tmpCanvas = document.createElement('canvas'),
    _tmpCtx = _tmpCanvas.getContext('2d');

function Material(srcImage) {
    _tmpCanvas.width = this.width = srcImage.width;
    _tmpCanvas.height = this.height = srcImage.height;
    _tmpCtx.drawImage(srcImage, 0, 0);
    this.data = _tmpCtx.getImageData(0,0,this.width, this.height).data;
}

//----------------------------

function Shapes() {}

Shapes.makeCube = function(r, g, b) {
    let tris = [];
    tris.push(...Shapes.makeCubeFace(r, g, b, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1));
    tris.push(...Shapes.makeCubeFace(r, g, b, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, -1));

    tris.push(...Shapes.makeCubeFace(r, g, b, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, -1, 0));
    tris.push(...Shapes.makeCubeFace(r, g, b, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 1, 0));

    tris.push(...Shapes.makeCubeFace(r, g, b, 0, 1, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0));
    tris.push(...Shapes.makeCubeFace(r, g, b, 0, 0, 1, 0, 1, 0, 0, 0, 0, -1, 0, 0));

    return tris;
}

Shapes.makeCubeFace = function(r, g, b, xU, yU, zU, xV, yV, zV, xC, yC, zC, nx, ny, nz) {
    let uv = [[0, 0],[0, 1],[1, 1],[1, 0]];
    let vs = [];
    for (let i = 0; i < 4; i++) {
        let u = uv[i][0];
        let v = uv[i][1];
        let vert = new Vertex(new Point(
            xU * u * 2 + xV * v * 2 + xC * 2 - 1,
            yU * u * 2 + yV * v * 2 + yC * 2 - 1,
            zU * u * 2 + zV * v * 2 + zC * 2 - 1
        ), new Point(nx, ny, nz), new Color(r,g,b,255), [u,v]);
        vs.push(vert);
    }
    return [ new Triangle(vs[0], vs[2], vs[1]), new Triangle(vs[0], vs[3], vs[2]) ];
}


Shapes.makePlane = function(r, g, b, a) {
    let Point3 = Point;
    let tris = [];
    let v1 = new Vertex(new Point3(-1, 0, -1), new Point(0,-1,0), new Color(r,g,b,a), [0,0]);
    let v2 = new Vertex(new Point3(-1, 0, 1), new Point(0,-1,0), new Color(r,g,b,a), [0,1]);
    let v3 = new Vertex(new Point3(1, 0, 1), new Point(0,-1,0), new Color(r,g,b,a), [1,1]);
    let v4 = new Vertex(new Point3(1, 0, -1), new Point(0,-1,0), new Color(r,g,b,a), [1,0]);

    let v5 = new Vertex(new Point3(-1, 0, -1), new Point(0,1,0), new Color(r,g,b,a), [0,0]);
    let v6 = new Vertex(new Point3(-1, 0, 1), new Point(0,1,0), new Color(r,g,b,a), [0,1]);
    let v7 = new Vertex(new Point3(1, 0, 1), new Point(0,1,0), new Color(r,g,b,a), [1,1]);
    let v8 = new Vertex(new Point3(1, 0, -1), new Point(0,1,0), new Color(r,g,b,a), [1,0]);

    tris.push(new Triangle(v5, v6, v7));
    tris.push(new Triangle(v1, v3, v2));
    tris.push(new Triangle(v5, v7, v8));
    tris.push(new Triangle(v1, v4, v3));

    return tris;
}


//===================================

function doLoad(url, onLoad, onProgress, onError) {
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.addEventListener('load', function(ev){
        var res = ev.target.response;
        if(this.status===200 || this.status===0)
            onLoad(res);
    })
    if(onProgress)
        request.addEventListener('progress', onProgress, false);
    //todo error

    request.responseType = 'arraybuffer';
    request.send(null);
}

//===================================

var BinaryReader = function(rawData) {
    this.dview = new DataView(rawData);
    this.pos = 0;
    this.endian = true;
}
var dp = BinaryReader.prototype;

dp.readUint8 = function() {
    return this.dview.getUint8(this.pos++);
}
dp.readUint16 = function() {
    var ret = this.dview.getUint16(this.pos, this.endian);
    this.pos+=2;
    return ret;
}
dp.readFloat32 = function() {
    var ret = this.dview.getFloat32(this.pos, this.endian);
    this.pos+=4;
    return ret;
}

dp.readString = function() {
    var ret = new Array(),
        ch;
    while((ch = this.readUint8()) !== 0x00)
        ret.push( String.fromCharCode(ch) );
    return ret.join('');
}

//---------------------

function Subset(vertices, triangles, texture) {
    this.vertices = vertices;
    this.triangles = triangles;
    this.texture = texture;
}

//---------------------

function Mesh(triangles) {
    this.subsets = [];
    if(triangles)
        this.subsets.push(new Subset(undefined, triangles, undefined));
}
var dp = Mesh.prototype;

dp.render = function(renderer) {
    renderer.beginDrawMesh();

    let oldMaterial = renderer.shader.material,
        subset, subsetIdx = 0;
    while(subset = this.subsets[subsetIdx++]) {
        renderer.shader.material = subset.material;
        var tri, triIdx = 0;
        while(tri = subset.triangles[triIdx++])
            renderer.drawTriangle(tri.p1, tri.p2, tri.p3);
    }
    renderer.shader.material = oldMaterial;
}

dp.loadFastPix = function(rawData) {
    var parser = new BinaryReader(rawData);
    if(parser.readString() != "FastPix3D_Mesh_1.0.2") //TODO
        return false;
    var subsetCount = parser.readUint16(),
        subsets = this.subsets = [];

    for(var subIdx=0;subIdx<subsetCount;subIdx++) {
        var textPath = parser.readString(),
            vertexCount = parser.readUint16(),
            triangleCount = parser.readUint16();

        var vertexList = new Array(vertexCount);
        for(var i=0;i<vertexCount;i++) {
            var vex = vertexList[i] = new Vertex();

            vex.point.set( parser.readFloat32(), parser.readFloat32(), parser.readFloat32() )
            vex.normal.set( parser.readFloat32(), parser.readFloat32(), parser.readFloat32() )
            vex.texture = [ parser.readFloat32(), parser.readFloat32() ];
            vex.color.r = parser.readUint8();
            vex.color.g = parser.readUint8();
            vex.color.b = parser.readUint8();
        }

        var triangles = new Array(triangleCount);
        for(var i=0;i<triangleCount;i++)
            triangles[i] = new Triangle( vertexList[ parser.readUint16() ], vertexList[ parser.readUint16() ], vertexList[ parser.readUint16() ]);

        var subSet = new Subset(vertexList, triangles, textPath);
        subsets.push(subSet);
    }
}

dp.load = function(url, callback) {
    var that = this;
    doLoad(url, function(response){
        that.loadFastPix(response);

        //Load textures
        var idx = 0;
        function nextText() {
            var textName = that.subsets[idx++];
            if(!textName)
                return callback && callback();
            textName = textName.texture;
            if(!textName)
                return nextText();

            var img = new Image();
            img.src = 'model/'+textName;
            img.onload = function(){
                that.subsets[idx-1].material = new Material(img);
                nextText();
            }
        }
        nextText();
    })
}



dp.decodeText = function(input) {
    if(typeof TextDecoder !== 'undefined')
        return new TextDecoder().decode(input);
    //String.fromCharCode.apply(null, array) may throws "maximum call stack size exceeded" error
    var s = [];
    for(var i=0,l=input.length;i<l;i++)
        s.push( String.fromCharCode(input[i]) );
    return decodeURIComponent( s.join('') );
}

dp.parsePoint = function(dest, src) {
    src = src.split(' ');
    dest.x = parseFloat(src[0]);
    dest.y = parseFloat(src[1]);
    dest.z = parseFloat(src[2]);
}

dp.parseStl = function(data) {
    let lines = data.split('\n'),
        tris = [];

    for(let i=0,l=lines.length;i<l;) {
        var normal = new Point(),
            v1 = new Vertex(),
            v2 = new Vertex(),
            v3 = new Vertex();

        this.parsePoint(normal, lines[i++] );
        this.parsePoint(v1.point, lines[i++] );
        this.parsePoint(v2.point, lines[i++] );
        this.parsePoint(v3.point, lines[i++] );
        v1.normal.set(normal);
        v2.normal.set(normal);
        v3.normal.set(normal);

        v1.color.r = v2.color.r = v3.color.r = 0x35;
        v1.color.g = v2.color.g = v3.color.g = 0xac;
        v1.color.b = v2.color.b = v3.color.b = 0x19;

        tris.push( new Triangle(v1,v2,v3) );
    }
    this.subsets = [ new Subset(undefined, tris, undefined) ]
}

dp.loadStl = function(url, callback) {
    var that = this;
    doLoad(url, function(response){
        that.parseStl(that.decodeText(response));
        callback && callback();
    })
}