var Color = function(r,g,b) {
    if(typeof r === 'number' && g === undefined && b === undefined) {
        this.r = (r & 0xff0000) >> 16;
        this.g = (r & 0x00ff00) >> 8;
        this.b = (r & 0x0000ff) >> 0;
    } else {
        this.r = r || 0;
        this.g = g || 0;
        this.b = b || 0;
    }
}
var dp = Color.prototype;

dp.copy = function() {
    return new Color(this.r, this.g, this.b);
}

dp.set = function(r,g,b) {
    if(r instanceof Color) {
        var src = r;
        this.r = src.r;
        this.g = src.g;
        this.b = src.b;
    } else {
        this.r = (r & 0xff0000) >> 16;
        this.g = (r & 0x00ff00) >> 8;
        this.b = (r & 0x0000ff) >> 0;        
    }
}

dp.add = function(rhs) {
    this.r += rhs.r;
    this.g += rhs.g;
    this.b += rhs.b;
}

dp.sub = function(rhs) {
    this.r -= rhs.r;
    this.g -= rhs.g;
    this.b -= rhs.b;
}

dp.mul = function(value) {
    this.r *= value;
    this.g *= value;
    this.b *= value;
}

dp.div = function(value) {
    this.r /= value;
    this.g /= value;
    this.b /= value;
}