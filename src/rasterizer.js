var TriangleRasterizer = SR.TriangleRasterizer = function() {
    this.needClipping = true;
}
var dp = TriangleRasterizer.prototype;

var _vec1 = new Point(),
    _vec2 = new Point();
dp.draw = function(renderer, v1,v2,v3) {
    var shader = renderer.shader;
    if(!shader.calculateVaryingSlope(renderer, v1,v2,v3))
        return;

    var yScanStart = Math.ceil(v1.point.y),
        yScanEnd = Math.ceil(Math.min(v2.point.y, v3.point.y));

    //scan top half
    if(yScanStart !== yScanEnd) {
        _vec1.set(v2.point).sub(v1.point);
        _vec2.set(v3.point).sub(v1.point);
        this.drawHalfTriangle(renderer, yScanStart, yScanEnd,
             v1.point, _vec1.x/_vec1.y,
             v1.point, _vec2.x/_vec2.y,
             v1);
    }

    //scan bottom half
    yScanStart = yScanEnd;
    var start1, start2;
    if(v2.point.y > v3.point.y) {
        yScanEnd = Math.ceil(v2.point.y);
        _vec1.set(v2.point).sub(v1.point);
        _vec2.set(v2.point).sub(v3.point);
        start1 = v1.point;
        start2 = v3.point;
    } else {
        yScanEnd = Math.ceil(v3.point.y);
        _vec1.set(v3.point).sub(v2.point);
        _vec2.set(v3.point).sub(v1.point);
        start1 = v2.point;
        start2 = v1.point;
    }

    if(yScanStart !== yScanEnd) {
        this.drawHalfTriangle(renderer, yScanStart, yScanEnd,
            start1, _vec1.x / _vec1.y,
            start2, _vec2.x / _vec2.y,
            v1);
    }
}

dp.drawHalfTriangle = function(renderer, scanStart, scanEnd, p1, slope1, p2, slope2, baseVertex) {
    if(scanStart < 0)
        scanStart = 0;
    if(scanStart > scanEnd)
        return;

    var sx1 = p1.x + (scanStart - p1.y) * slope1,
        sx2 = p2.x + (scanStart - p2.y) * slope2;

    if(scanEnd > renderer.height)
        scanEnd = renderer.height;

    let shader = renderer.shader,
        shaderSlope = shader.varyingSlope,
        varying = shader.varying;

    //draw scan lines
    for(var i=scanStart; i<scanEnd; i++) {
        
        let low = Math.ceil(sx2),
            high = Math.ceil(sx1);
        if(low >= renderer.width || high <0 || low>high) {
            sx1 += slope1;
            sx2 += slope2;
            continue;
        }

        if(low < 0)
            low = 0;
        if(high >= renderer.width)
            high = renderer.width -1;

        shader.calculateVaryingBase(baseVertex, low, i);

        for(let j=low;j<high;j++) {
            //if(j>=0 && i>=0 && j< renderer.width && i < renderer.height)
            renderer.shader.processPixel(renderer, varying, j, i) 
            
            //We are ~10% faster if we do the incrementVaryingX here
            //renderer.shader.incrementVaryingX();            
            for(var vi=0,vil=shader.varSize;vi<vil;vi++) //renderer.shader.incrementVaryingX();            
                varying[vi] += shaderSlope[vi<<1];
        }
        sx1 += slope1;
        sx2 += slope2;
    }
}
