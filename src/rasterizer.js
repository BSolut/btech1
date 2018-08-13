
var Edge = SR.Edge = function() {}
var dp = Edge.prototype;

dp.set = function(a,b,vars,dVars) {
    this.dVars = dVars;
    this.vars = vars;
    this.a = a;
    this.b = b;
    this.x = a.pPosition.x;

    var len = (b.pPosition.y - a.pPosition.y)|0,
        dyInv = (len === 0) ? 0 : (1 / len),
        dx = this.dx = (b.pPosition.x - a.pPosition.x) * dyInv;

    for(var i=0,l=a.vars.length;i<l;i++) {
        vars[i] = a.vars[i];
        dVars[i] = dyInv * (b.vars[i] - a.vars[i]);
    }
}

dp.nextYTop = function() {
    this.x += this.dx;
    for(var i=0,l=this.vars.length;i<l;i++)
        this.vars[i] += this.dVars[i];
}

dp.nextYBottom = function() {
    this.x -= this.dx;
    for(var i=0,l=this.vars.length;i<l;i++)
        this.vars[i] -= this.dVars[i];
}


//=======================
var Scan = SR.Scan = function() {
    
}
var dp = Scan.prototype;

dp.setVars = function(vars, dVars) {
    this.vars = vars;
    this.dVars = dVars;
}

dp.swapE1E2 = function() {
    var t = this.e1;
    this.e1 = this.e2;
    this.e2 = t;
}

dp.setTop = function(e1,e2) {
    this.e1 = e1;
    this.e2 = e2;
    if (e1.dx > e2.dx) {
        this.swapE1E2();
    }
    this.y1 = e1.a.pPosition.y | 0;
    this.y2 = e1.b.pPosition.y | 0;
}

dp.setBottom = function(e1,e2) {
    this.e1 = e1;
    this.e2 = e2;
    if (e1.dx < e2.dx) {
        this.swapE1E2();
    }
    this.y1 = e1.a.pPosition.y | 0;
    this.y2 = e1.b.pPosition.y | 0;
}

dp.initX = function() {
    this.x1 = this.e1.x | 0;
    this.x2 = this.e2.x | 0;
    this.dx = this.x2 - this.x1;
    if(this.dx === 0)
        this.dx = 1;

    for(var i=0,l=this.e1.vars.length;i<l;i++)
        this.vars[i] = this.e1.vars[i];

    var dxInv = 1 / this.dx;
    for(var k=0,l=this.vars.length;k<l;k++)
        this.dVars[k] = (this.e2.vars[k] - this.e1.vars[k]) * dxInv;
}

dp.nextX = function() {
    for(var i=0,l=this.vars.length;i<l;i++)
        this.vars[i] += this.dVars[i];
}

dp.drawTop = function(renderer) {
    var shader = renderer.shader;
    for(var y = this.y1; y <= this.y2; y++) {
        this.initX();
        for(var x = this.x1; x <= this.x2; x++) {
            shader.processPixel(renderer, this.x1, this.x2, x,y, this.vars);
            this.nextX();
        }
        this.e1.nextYTop();
        this.e2.nextYTop();
    }
}

dp.drawBottom = function(renderer) {
    var shader = renderer.shader;
    for(var y = this.y1; y > this.y2; y--) {
        this.initX();
        for(var x = this.x1; x <= this.x2; x++) {
            shader.processPixel(renderer, this.x1, this.x2, x,y, this.vars);
            this.nextX();
        }
        this.e1.nextYBottom();
        this.e2.nextYBottom();
    }
}


//==============================

var TriangleRasterizer = SR.TriangleRasterizer = function() {
    this.vertices = [];
    this.e1 = new Edge();
    this.e2 = new Edge();
    this.scan = new Scan();
}
var dp = TriangleRasterizer.prototype;


dp.draw = function(renderer, v1, v2, v3) {
    //TODO !!
    var shader = renderer.shader;

    this.scan.setVars(shader.varsScan, shader.dVarsScan);

    //TODO top or bottom can be handled with an if ?

    //Draw top
    this.e1.set(v1, v2, shader.varsE1, shader.dVarsE1);
    this.e2.set(v1, v3, shader.varsE2, shader.dVarsE2);

    this.scan.setTop(this.e1, this.e2);
    this.scan.drawTop(renderer);


    //DrawBottom
    this.e1.set(v3, v2, shader.varsE1, shader.dVarsE1);
    this.e2.set(v3, v1, shader.varsE2, shader.dVarsE2);

    this.scan.setBottom(this.e1, this.e2);
    this.scan.drawBottom(renderer);

}