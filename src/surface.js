

var DomSurface = SR.DomSurface = function(canvas) {
	this.canvas = canvas;
	this.ctx = canvas.getContext('2d');
}
var dp = DomSurface.prototype;

dp.clear = function() {
    this.depthBuffer.fill(1);
    this.shadowBuffer.fill(1);
    this.imgData.data.fill(0);
}

dp.setSize = function(width, height) {
	this.width = this.canvas.width = width;
	this.height = this.canvas.height = height;
	this.imgData = this.ctx.getImageData(0,0,width,height);
	this.depthBuffer = new Float64Array(width * height);
    this.shadowBuffer = new Float32Array(width * height);
	this.clear();
}



dp.getIndex = function(x,y) {
    return x + y * this.width;
}


dp.setShadowPixel = function(x,y,z) {
    var idx = this.getIndex(x,y);
    this.shadowBuffer[idx] = z;
    return;

    var idx = this.getIndex(x,y),
        curVal = this.shadowBuffer[ idx ];
    if(z <= curVal)
        this.shadowBuffer[ idx ] = z;
}
dp.getShadow = function(idx) {
    return this.shadowBuffer[ idx ];
}


dp.checkDepth = function(x,y,z) {
    var idx = this.getIndex(x,y),
        curDepth = this.depthBuffer[ idx ];
    if(z <= curDepth) {
    //if(Math.abs(z - curDepth) > 10e-6) {
        this.depthBuffer[idx] = z;
        return idx;
    }
    return -1;
}

dp.setPixel = function(idx, r,g,b,a) {
    idx <<= 2; //idx *= 4;
    var data = this.imgData.data;
    data[idx + 0] = r;
    data[idx + 1] = g;
    data[idx + 2] = b;
    data[idx + 3] = a;
}

dp.setPixelAlphaBlend = function(idx, r,g,b,a) {
    idx <<= 2; //idx *= 4;
    var data = this.imgData.data;
    if(a>=255) {
        data[idx + 0] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = a;
    } else {
        var af = a / 255,
            oma = 1 - af;

        data[idx + 0] = data[idx + 0] * oma + r * af;
        data[idx + 1] = data[idx + 1] * oma + g * af;
        data[idx + 2] = data[idx + 2] * oma + b * af;
        data[idx + 3] = data[idx + 3] + af * (255 - data[idx + 3]);
    }
}


dp.flush = function() {
    this.ctx.putImageData(this.imgData, 0, 0);
}

