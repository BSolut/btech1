
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
var BinParser = function(rawData) {
    this.dview = new DataView(rawData);
    this.pos = 0;
    this.endian = true;
}
var dp = BinParser.prototype;

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


//===================================

var Vertex = SR.Vertex = function() {
    this.position = new Point();
    this.normal = new Point();
    this.textCoord = new Point();
    this.color = new Color();
}


var ProcessedVertex = SR.ProcessedVertex = function() {
    this.position = new Point();
    this.normal = new Point();
    this.textCoord = new Point();
    this.color = new Color();
    //
    this.pPosition = new Point();
    this.vars = [];
}
var dp = ProcessedVertex.prototype;

dp.set = function(src) {
    this.position.set(src.position);
    this.normal.set(src.normal);
    this.textCoord.set(src.textCoord);
    this.color.set(src.color);
}










var Triangle = SR.Triangle = function(a,b,c) {
    this.vertexa = a;
    this.vertexb = b;
    this.vertexc = c;
}

//===================================

var Subset = SR.Subset = function(vertices, triangles, texture) {
    this.vertices = vertices;
    this.triangles = triangles;
    this.texture = texture;
}


//===================================

var Mesh = SR.Mesh = function() {
}
var dp = Mesh.prototype;

dp.loadFastPix = function(rawData) {
    var parser = new BinParser(rawData);
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
            vex.position.set( parser.readFloat32(), parser.readFloat32(), parser.readFloat32() )
            vex.normal.set( parser.readFloat32(), parser.readFloat32(), parser.readFloat32() )
            vex.textCoord.set( parser.readFloat32(), parser.readFloat32() );
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

            var img = new Image();
            img.src = 'model/'+textName;
            img.onload = function(){
                that.subsets[idx-1].texture = img;
                nextText();
            }
        }
        nextText();



    })
}


