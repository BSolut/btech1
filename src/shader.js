var AbstractShader = function() {

}
var dp = AbstractShader.prototype;





var MyShader = function() {
    AbstractShader.call(this);
    
	var vertexVarsSize = 6;
	
    this.dVarsE1 = new Array(vertexVarsSize).fill(0);
    this.varsE1 = new Array(vertexVarsSize).fill(0);
    this.dVarsE2 = new Array(vertexVarsSize).fill(0);
    this.varsE2 = new Array(vertexVarsSize).fill(0);
    this.dVarsScan = new Array(vertexVarsSize).fill(0);
    this.varsScan = new Array(vertexVarsSize).fill(0);	
}
var dp = MyShader.prototype;
dp.__proto__ = AbstractShader.prototype;


dp.processVertex = function(renderer, vertex) {
    vertex.vars[0] = 1 / vertex.pPosition.z;
    vertex.vars[1] = vertex.color.r;
    vertex.vars[2] = vertex.color.g;
    vertex.vars[3] = vertex.color.b;
}

dp.processTriangle = function(renderer, v1, v2, v3) {
    this.processVertex(renderer, v1);
    this.processVertex(renderer, v2);
    this.processVertex(renderer, v3);
}


dp.processPixel = function(renderer, xMin, xMax, x, y, vars) {
    
    /*
    var depth = vars[0],
        z = 1 / depth;

    var color = this.color;
    color.fill(0);
    color[0] = color[3] = 0xff;

    renderer.canvas.setPixel(x,y,depth, color);*/

    var color = [0x00,0x00,0x00,0xff];
    color[0] = vars[1];
    color[1] = vars[2];
    color[2] = vars[3];

    renderer.drawer.setPixel(x,y,-1, color);
}