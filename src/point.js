var Point = function(x,y,z,r) {
    this.set(x, y, z, r)
}
dp = Point.prototype;

Point.fromVector = function(p1, p2, result) {
    result = result ? result : new Point()
    return result.set(p2).sub(p1);
}

//--- Static

//Modifier
Point.set = function(dest, x, y, z, r) {
    if(typeof x === 'object' && x.x != null && x.y !== null) {
        r = x.r;
        z = x.z;
        y = x.y;
        x = x.x;
    }
    dest.x = x == null ? 0 : x;
    dest.y = y == null ? 0 : y;
    dest.z = z == null ? 0 : z;
    dest.r = r == null ? 1 : r;
    return dest;
}

Point.add  = function(dest, a, b) {
    dest.x = a.x + b.x;
    dest.y = a.y + b.y;
    dest.z = a.z + b.z;
    return dest;
}

Point.sub  = function(dest, a, b) {
    dest.x = a.x - b.x;
    dest.y = a.y - b.y;
    dest.z = a.z - b.z;
    return dest;
}

Point.mul = function(dest, a, b) {
    dest.x = a.x * b;
    dest.y = a.y * b;
    dest.z = a.z * b;
    return dest;
}

Point.div = function(dest, a, b) {
    dest.x = a.x / b;
    dest.y = a.y / b;
    dest.z = a.z / b;
    return dest;
}

Point.rotate = function(dest,a,angle){
    if(angle !== 0){
        var c = Math.cos(angle),
            s = Math.sin(angle),
            x = a.x,
            y = a.y;
        dest.x = c*x -s*y;
        dest.y = s*x +c*y;
    } else {
        dest.x = a.x;
        dest.y = a.y;
    }
    return dest;
}

Point.rotateX = function(dest, a, angle) {
    var c = Math.cos(angle),
        s = Math.sin(angle),
        x = a.x,
        y = a.y,
        z = a.z;
    dest.y = y*c - z*s;
    dest.z = y*s + z*c;
    dest.x = x;

    return dest;
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

/*
Point.transform = function(dest, src, matrix) {
    //todo is
    var m = matrix.m,
        x = src.x,
        y = src.y,
        z = src.z,
        r = src.r;

    dest.x = x * m[0] + y * m[1] + z * m[2] + r * m[3];
    dest.y = x * m[4] + y * m[5] + z * m[6] + r * m[7];
    dest.z = x * m[8] + y * m[9] + z * m[10]+ r * m[11];
    dest.r = x * m[12]+ y * m[13]+ z * m[14]+ r * m[15];

    return dest;
}*/

Point.transform = function(dest, src, matrix) {
    //todo is
    var m = matrix.m,
        x = src.x,
        y = src.y,
        z = src.z;

    /*dest.x = x * m[0] + y * m[1] + z * m[2] + r * m[3];
    dest.y = x * m[4] + y * m[5] + z * m[6] + r * m[7];
    dest.z = x * m[8] + y * m[9] + z * m[10]+ r * m[11];
    dest.r = x * m[12]+ y * m[13]+ z * m[14]+ r * m[15];*/
    dest.x = m[0] * x + m[4] * y + m[8] * z + m[12];
    dest.y = m[1] * x + m[5] * y + m[9] * z + m[13];
    dest.z = m[2] * x + m[6] * y + m[10]* z + m[14];

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

//getter
Point.distance = function(a,b) {
    var x = a.x - b.x;
    var y = a.y - b.y;
    return Math.sqrt(x*x + y*y);
}

Point.distance3 = function(a,b) {
    var x = a.x - b.x;
    var y = a.y - b.y;
    var z = a.z - b.z;
    return Math.sqrt(x*x + y*y + z*z);
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


//-- Instance

dp.copy = function() {
    return new Point(this);
}

dp.set = function(x,y,z,r) {
    return Point.set(this, x, y, z, r);
}

dp.add = function(b) {
    return Point.add(this, this, b);
}

dp.sub = function(b) {
    return Point.sub(this, this, b);
}

dp.mul = function(b) {
    return Point.mul(this, this, b);
}

dp.div = function(b) {
    return Point.div(this, this, b);
}

dp.normalize = function() {
    var n = this.magnitude();
    if(n === 0)
        this.set(0,0,1);
    else
        this.div(n);
    return this;
}

dp.cross = function(b) {
    return Point.cross(this, this, b);
}


dp.transform = function(matrix) {
    return Point.transform(this, this, matrix);
}

dp.rotate = function(angle) {
    return Point.rotate(this, this, angle);
}

dp.rotateY = function(angle) {
    return Point.rotateY(this, this, angle);
}

dp.rotateX = function(angle) {
    return Point.rotateX(this, this, angle);
}

dp.scale = function(x,y,z) {
    x = x == null ? 1 : x;
    y = y == null ? x : y;
    z = z == null ? y : z;

    this.x *= x;
    this.y *= y;
    this.z *= z;
}


dp.distance = function(b) { return Point.distance(this, b); }
dp.distance3 = function(b) { return Point.distance3(this, b); }

dp.magnitude = function() {
    return Point.magnitude(this)
}

dp.dot = function(b) {
    return Point.dot(this, b);
}

dp.angle = function() {
    return Math.atan2(this.y, this.x);
}


//Statics
Point.TMP = new Point();
Point.TMP1 = new Point();
Point.TMP2 = new Point();
Point.TMP3 = new Point();
Point.TMP4 = new Point();
Point.Zero = Point.ZERO = new Point();
