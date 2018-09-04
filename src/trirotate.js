var TriangleRotate = function() {
    this.alist = [];
    this.blist = [];

    for(var i=0;i<50;i++) {
        this.alist.push( new Triangle() );
        this.blist.push( new Triangle() );
    }
}
var dp = TriangleRotate.prototype;

dp.start = function(p1,p2,p3) {
    var tri = this.blist[0];
    tri.p1 = p1;
    tri.p2 = p2;
    tri.p3 = p3;
    this.alength = 0;
    this.blength = 1;
}

dp.reset = function() {
    var tmp = this.alist;
    this.alist = this.blist;
    this.blist = tmp;
    tmp = this.alength;
    this.alength = this.blength;
    this.blength = 0;
}

dp.get = function(idx) {
    return this.alist[idx];
}

dp.push = function(tri) {
    this.pushPoint(tri.p1,tri.p2,tri.p3);
}

dp.pushPoint = function(p1,p2,p3) {
    var dest = this.blist[this.blength++];
    dest.p1 = p1;
    dest.p2 = p2;
    dest.p3 = p3;
}