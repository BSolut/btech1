

var DomSurface = SR.DomSurface = function(canvas) {
	this.canvas = canvas;
	this.ctx = canvas.getContext('2d');
}
var dp = DomSurface.prototype;

dp.clear = function() {
    //for(var i=0,l=this.depthBuffer.length;i<l;i++)
    //    this.depthBuffer[i] = 1;
    this.depthBuffer.fill(1);
    this.imgData.data.fill(0);
}

dp.setSize = function(width, height) {
	this.width = this.canvas.width = width;
	this.height = this.canvas.height = height;
	this.imgData = this.ctx.getImageData(0,0,width,height);
	this.depthBuffer = new Float32Array(width * height);
	this.clear();
}



dp.getIndex = function(x,y) {
    return x + y * this.width;
}

dp.checkDepth = function(x,y,z) {
    var idx = this.getIndex(x,y),
        curDepth = this.depthBuffer[ idx ];
    if(z <= curDepth) {
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

