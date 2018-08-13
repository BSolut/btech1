

var Matrix = SR.Matrix = function(m1) {
    this.m = m1 != null ? m1 : Matrix.IDENTITY.slice();
}
Matrix.IDENTITY = [1, 0, 0, 0,
                   0, 1, 0, 0,
                   0, 0, 1, 0,
                   0, 0, 0, 1];
Matrix.Identity = new Matrix();
Matrix.ARRAY_POOL = new Array(16);

var dp = Matrix.prototype;


dp.set = function(src) {
    if(src instanceof Matrix)
        src = src.m;

    if(!Array.isArray(src) || src.length !== this.m.length)
        throw new Error("Invalid matrix.set call");

    for(var i=0,l=this.m.length;i<l;i++)
        this.m[i] = src[i];
    return this;
}


dp.multiply = function(m) {
    if(m instanceof Matrix)
        m = m.m;

/*
    var c = Matrix.ARRAY_POOL,
        i, j, o, u;
    for (j = o = 0; o < 4; j = ++o) {
        for (i = u = 0; u < 16; i = u += 4) {
            c[i + j] = m[i] * this.m[j] + m[i + 1] * this.m[4 + j] + m[i + 2] * this.m[8 + j] + m[i + 3] * this.m[12 + j];
        }
    }
*/

    var o = this.m,
        c = Matrix.ARRAY_POOL;

    c[ 0] = o[ 0] * m[0] + o[ 1] * m[4] + o[2 ] * m[ 8] + o[ 3] * m[12];
    c[ 1] = o[ 0] * m[1] + o[ 1] * m[5] + o[ 2] * m[ 9] + o[ 3] * m[13];
    c[ 2] = o[ 0] * m[2] + o[ 1] * m[6] + o[ 2] * m[10] + o[ 3] * m[14];
    c[ 3] = o[ 0] * m[3] + o[ 1] * m[7] + o[ 2] * m[11] + o[ 3] * m[15];
    c[ 4] = o[ 4] * m[0] + o[ 5] * m[4] + o[ 6] * m[ 8] + o[ 7] * m[12];
    c[ 5] = o[ 4] * m[1] + o[ 5] * m[5] + o[ 6] * m[ 9] + o[ 7] * m[13];
    c[ 6] = o[ 4] * m[2] + o[ 5] * m[6] + o[ 6] * m[10] + o[ 7] * m[14];
    c[ 7] = o[ 4] * m[3] + o[ 5] * m[7] + o[ 6] * m[11] + o[ 7] * m[15];
    c[ 8] = o[ 8] * m[0] + o[ 9] * m[4] + o[10] * m[ 8] + o[11] * m[12];
    c[ 9] = o[ 8] * m[1] + o[ 9] * m[5] + o[10] * m[ 9] + o[11] * m[13];
    c[10] = o[ 8] * m[2] + o[ 9] * m[6] + o[10] * m[10] + o[11] * m[14];
    c[11] = o[ 8] * m[3] + o[ 9] * m[7] + o[10] * m[11] + o[11] * m[15];
    c[12] = o[12] * m[0] + o[13] * m[4] + o[14] * m[ 8] + o[15] * m[12];
    c[13] = o[12] * m[1] + o[13] * m[5] + o[14] * m[ 9] + o[15] * m[13];
    c[14] = o[12] * m[2] + o[13] * m[6] + o[14] * m[10] + o[15] * m[14];
    c[15] = o[12] * m[3] + o[13] * m[7] + o[14] * m[11] + o[15] * m[15];

    Matrix.ARRAY_POOL = this.m;
    this.m = c;
    return this;
}


dp.translate = function(x,y,z) {
    if(x instanceof Point) {
        z = x.z;
        y = x.y;
        x = x.x;
    }

    return this.multiply([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        x, y, z, 1
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



/*
var Matrix = function(m1) {
    this.m = m1 != null ? m1 : null;
    if(this.m === null)
        this.m = Matrix.IDENTITY.slice()
    this.baked = Matrix.IDENTITY;
}
Matrix.IDENTITY = [1, 0, 0, 0,
                   0, 1, 0, 0,
                   0, 0, 1, 0,
                   0, 0, 0, 1];


var dp = Matrix.prototype;

dp.set = function(src) {
    if(src instanceof Matrix)
        src = src.m;

    if(!Array.isArray(src) || src.length !== this.m.length)
        throw new Error("Invalid matrix.set call");

    for(var i=0,l=this.m.length;i<l;i++)
        this.m[i] = src[i];
    return this;
}

dp.copy = function() {
    return new Matrix( this.m.slice() );
}

dp.reset = function() {
    this.m = this.baked.slice();
    return this;
}

dp.bake = function(m) {
    this.baked = (m != null ? m : this.m).slice();
    return this;
}



dp.rotx = function(theta) {
    var ct = Math.cos(theta),
        st = Math.sin(theta);

    return this.matrix([
        1,  0,   0, 0,
        0, ct, -st, 0,
        0, st,  ct, 0,
        0,  0,   0, 1 ]);
}


dp.rotz = function(theta) {
    var ct = Math.cos(theta),
        st = Math.sin(theta);

    return this.matrix([
        ct, -st, 0, 0,
        st,  ct, 0, 0,
         0,   0, 1, 0,
         0,   0, 0, 1 ]);
}

dp.translate = function(x,y,z) {
    if(x instanceof Point) {
        z = x.z;
        y = x.y;
        x = x.x;
    }

    return this.matrix([
        1, 0, 0, x || 0,
        0, 1, 0, y || 0,
        0, 0, 1, z || 0,
        0, 0, 0, 1
    ])
}

dp.scale = function(x,y,z) {
    x = x == null ? 1 : x;
    y = y == null ? x : y;
    z = z == null ? y : z;

    return this.matrix([
        x, 0, 0, 0,
        0, y, 0, 0,
        0, 0, z, 0,
        0, 0, 0, 1
    ])
}

dp.multiply = function(b) {
    return this.matrix(b.m);
}

dp.transform = function(b) {
    return this.multiply(b);
}


/*

;

  Matrix.prototype.transpose = function() {
    var c, i, len1, o, ti;
    c = ARRAY_POOL;
    for (i = o = 0, len1 = TRANSPOSE_INDICES.length; o < len1; i = ++o) {
      ti = TRANSPOSE_INDICES[i];
      c[i] = this.m[ti];
    }
    ARRAY_POOL = this.m;
    this.m = c;
    return this;
  };

  return Matrix;

})();
*/