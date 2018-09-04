//=====

var Transformable = SR.Transformable = function() {
    this.matrix = new Matrix4();
    this.matrixUpdate = false;
}
var dp = Transformable.prototype;

dp.scale = function(x,y,z) { this.matrixUpdate = true; return this.matrix.scale(x,y,z) }
dp.translate = function(x,y,z) { this.matrixUpdate = true; return this.matrix.translate(x,y,z) }
dp.rotx = function(theta) { this.matrixUpdate = true; return this.matrix.rotx(theta) }
dp.roty = function(theta) { this.matrixUpdate = true; return this.matrix.roty(theta) }
dp.rotz = function(theta) { this.matrixUpdate = true; return this.matrix.rotz(theta) }
dp.matrix = function(m) { this.matrixUpdate = true; return this.matrix.matrix(m) }
dp.setMatrix = function(m) { this.matrixUpdate = true; return this.matrix.set(m) }
dp.reset = function() { this.matrixUpdate = true; return this.matrix.reset() }

dp.transform = function(m) { return this.matrix.multiply(m) }


//=====

var Renderable = SR.Renderable = function(mesh) {
	Renderable.super_.call(this);
	this.matrixWorld = new Matrix4();
	this.children = [];
	this.material = null;
	this.shader = null;
	if(mesh)
		this.setMesh(mesh);
}
var dp = Object.inherits(Renderable, Transformable);

dp.add = function(child) {
    child.parent = this;
    this.children.push(child);
    return child;
}

dp.setMesh = function(mesh) {
	this.mesh = mesh;
}

dp.updateWorldMatrix = function() {
    this.matrixWorld.set(this.matrix);
    if(this.parent)
        this.matrixWorld.multiply( this.parent.matrixWorld );

    if(this.children.length === 0)
        return;
    var children = this.children,
        child, childIdx = 0;
    while(child = children[childIdx++])
        child.updateWorldMatrix();
}

dp.render = function(renderer) {
    if(this.matrixUpdate) {
        this.updateWorldMatrix();
        this.matrixUpdate = false;
    }

    renderer.modelTransform.set(this.matrixWorld);

	if(this.mesh)
		this.mesh.render(renderer);

    if(this.children.length === 0)
        return;
    var children = this.children,
        child, childIdx = 0;
    while(child = children[childIdx++])
        child.render(renderer);
}