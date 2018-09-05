//=====================

function Matrix4(m1) {
    this.m = m1 != null ? m1 : Matrix4.IDENTITY.slice();
}
Matrix4.IDENTITY = [1, 0, 0, 0,
                   0, 1, 0, 0,
                   0, 0, 1, 0,
                   0, 0, 0, 1];
Matrix4.Identity = new Matrix4();
Matrix4.ARRAY_POOL = new Array(16);

var dp = Matrix4.prototype;

dp.set = function(src) {
    if(src instanceof Matrix4)
        src = src.m;

    if(!Array.isArray(src) || src.length !== this.m.length)
        throw new Error("Invalid matrix.set call");

    for(var i=0,l=this.m.length;i<l;i++)
        this.m[i] = src[i];
    return this;
}


dp.multiply = function(src) {
    if(src instanceof Matrix4)
        src = src.m;

    var me = this.m,
        dest = Matrix4.ARRAY_POOL;
    for(var i=0;i<16;i++) //Fill is slower here
        dest[i] = 0;

    for (var i = 0; i < 4; i++) {
        for (var j = 0; j < 4; j++) {
            var idx = i + j * 4;
            for (var k = 0; k < 4; k++) {
                dest[idx] += me[k + j * 4] * src[i + k * 4]; //dot product of the j'th row from m1 (this) and the i'th column from m2
            }
        }
    }

    Matrix4.ARRAY_POOL = this.m;
    this.m = dest;
    return this;
}

dp.translate = function(x,y,z) {
    if(x instanceof Point) {
        z = x.z;
        y = x.y;
        x = x.x;
    }

    return this.multiply([
        1, 0, 0, x || 0,
        0, 1, 0, y || 0,
        0, 0, 1, z || 0,
        0, 0, 0, 1
    ])
}

dp.rotx = function(theta) {
    var ct = Math.cos(theta),
        st = Math.sin(theta);

    return this.multiply([
        1,  0,   0, 0,
        0, ct,  st, 0,
        0,-st,  ct, 0,
        0,  0,   0, 1 ]);
}


dp.roty = function(theta) {
    var ct = Math.cos(theta),
        st = Math.sin(theta);

    return this.multiply([
        ct, 0, st, 0,
         0, 1,  0, 0,
       -st, 0, ct, 0,
         0, 0,  0, 1 ]);
}

dp.scale = function(x,y,z) {
    x = x == null ? 1 : x;
    y = y == null ? x : y;
    z = z == null ? y : z;

    return this.multiply([
        x, 0, 0, 0,
        0, y, 0, 0,
        0, 0, z, 0,
        0, 0, 0, 1
    ])
}


dp.perspective = function(w,h,near,far,fov) {
    let r = Math.tan(fov / 2) * near;
    let t = r * h / w;
    let v00 = near / r;
    let v11 = near / t;
    let v22 = (far + near) / (near - far);
    let v23 = 2 * far * near / (near - far);
    let v32 = -1;

    let m = this.m;
    m[0] = v00;
    m[5] = v11;
    m[10] = v22;
    m[11] = v23;
    m[14] = v32;
    m[15] = 0;
    return this;
}

dp.ortho = function(left, right, bottom, top, near, far) {
    left = left == null ? -1 : left;
    right = right == null ? 1 : right;
    bottom = bottom == null ? -1 : bottom;
    top = top == null ? 1 : top;
    near = near == null ? 1 : near;
    far = far == null ? 100 : far;

    var dx = right - left,
        dy = top - bottom,
        dz = far - near,
        m = this.m;

    m[0] = 2 / dx;
    m[1] = 0.0;
    m[2] = 0.0;
    m[3] = (right + left) / dx;
    m[4] = 0.0;
    m[5] = 2 / dy;
    m[6] = 0.0;
    m[7] = -(top + bottom) / dy;
    m[8] = 0.0;
    m[9] = 0.0;
    m[10] = -2 / dz;
    m[11] = -(far + near) / dz;
    m[12] = 0.0;
    m[13] = 0.0;
    m[14] = 0.0;
    m[15] = 1.0;

    return this;
}

//=====================

function Point(x,y,z,w) {
    this.set(x,y,z,w);
}
var dp = Point.prototype;

//--- Static
Point.set = function(dest, x, y, z, w) {
    if(typeof x === 'object' && x.x != null && x.y !== null) {
        w = x.w;
        z = x.z;
        y = x.y;
        x = x.x;
    }
    dest.x = x == null ? 0 : x;
    dest.y = y == null ? 0 : y;
    dest.z = z == null ? 0 : z;
    dest.w = w == null ? 1 : w;
    return dest;
}

Point.add  = function(dest, a, b) {
    dest.x = a.x + b.x;
    dest.y = a.y + b.y;
    dest.z = a.z + b.z;
    dest.w = a.w + b.w;
    return dest;
}

Point.sub  = function(dest, a, b) {
    dest.x = a.x - b.x;
    dest.y = a.y - b.y;
    dest.z = a.z - b.z;
    dest.w = a.w - b.w;
    return dest;
}

Point.mul = function(dest, a, b) {
    dest.x = a.x * b;
    dest.y = a.y * b;
    dest.z = a.z * b;
    dest.w = a.w * b;
    return dest;
}

Point.div = function(dest, a, b) {
    dest.x = a.x / b;
    dest.y = a.y / b;
    dest.z = a.z / b;
    dest.w = a.w / b;
    return dest;
}


Point.transform = function(dest, src, matrix) {
    var x = src.x,
        y = src.y,
        z = src.z,
        w = src.w,
        m = matrix.m;

    dest.x = x * m[0] + y * m[1] + z * m[2] + w * m[3];
    dest.y = x * m[4] + y * m[5] + z * m[6] + w * m[7];
    dest.z = x * m[8] + y * m[9] + z * m[10]+ w * m[11];
    dest.w = x * m[12]+ y * m[13]+ z * m[14]+ w * m[15];

    return dest;
}

Point.cross = function(dest, a, b) {
    var ax = a.x, bx = b.x,
        ay = a.y, by = b.y,
        az = a.z, bz = b.z;

    dest.x = ay * bz - az * by;
    dest.y = az * bx - ax * bz;
    dest.z = ax * by - ay * bx;
    return dest;
}

Point.dot = function(a, b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
}

Point.magnitudeSquared = function(a) {
    return Point.dot(a, a)
}

Point.magnitude = function(a) {
    return Math.sqrt( Point.magnitudeSquared(a) );
}

Point.rotateY = function(dest, a, angle) {
    var c = Math.cos(angle),
        s = Math.sin(angle),
        x = a.x,
        y = a.y,
        z = a.z;
    dest.z = z*c - x*s;
    dest.x = z*s + x*c;
    dest.y = y;

    return dest;
}

Point.setLerp = function(dest, a, b, p) {
    dest.x = a.x + p * (b.x - a.x);
    dest.y = a.y + p * (b.y - a.y);
    dest.z = a.z + p * (b.z - a.z);
    dest.w = a.w + p * (b.w - a.w);
    return dest;
}


//-- Instance
dp.set = function(x,y,z,w) {
    return Point.set(this, x, y, z, w);
}
dp.normalizeW = function() {
    this.x /= this.w;
    this.y /= this.w;
    this.z /= this.w;
}


dp.add = function(b) { return Point.add(this, this, b); }
dp.sub = function(b) { return Point.sub(this, this, b); }
dp.mul = function(b) { return Point.mul(this, this, b); }
dp.div = function(b) { return Point.div(this, this, b); }


dp.mulVector = function(b) {
    this.x *= b.x;
    this.y *= b.y;
    this.z *= b.z;
    this.w *= b.w;
    return this;
}

dp.setLerp = function(a, b, p) {
    return Point.setLerp(this, a, b, p);
}


dp.cross = function(b) {
    return Point.cross(this, this, b);
}

dp.cross2 = function(a) {
    return this.x * a.y - this.y * a.x;
}

dp.normalize = function() {
    var n = this.magnitude();
    if(n === 0)
        this.set(0,0,1);
    else
        this.div(n);
    return this;
}

dp.magnitude = function() {
    return Point.magnitude(this)
}

dp.rotateY = function(angle) {
    return Point.rotateY(this, this, angle);
}


//Statics
Point.TMP = new Point();
Point.TMP1 = new Point();
Point.TMP2 = new Point();
Point.TMP3 = new Point();
Point.TMP4 = new Point();
Point.Zero = Point.ZERO = new Point();
