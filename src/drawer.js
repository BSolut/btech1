var Drawer = function(width, height, dom) {
    this.width = width;
    this.height = height;

    this.depthBuffer = new Array(width*height);
    this.depthBuffer.fill(0);


    //Color buffer
    this.dom = dom;
    this.ctx = dom.getContext('2d');
    dom.width = this.width;
    dom.height = this.height;
    this.imgData = this.ctx.createImageData(this.width, this.height);
}    
var dp = Drawer.prototype;

dp.getIndex = function(x,y) {
    return x + y * this.width;
}

dp._drawPixel = function(idx, color) {
    idx *= 4;
    var iData = this.imgData.data;
    iData[idx + 0] = color[0];
    iData[idx + 1] = color[1];
    iData[idx + 2] = color[2];
    iData[idx + 3] = color[3];
}

dp.setPixel = function(x,y,z,color) {    
    var idx = this.getIndex(x,y),
        curDepth = this.depthBuffer[ idx ];

    if(z < curDepth){
        this.depthBuffer[idx] = z;
        this._drawPixel(idx, color);
    }
}

dp.flush = function() {
    this.ctx.putImageData(this.imgData, 0, 0);
}
