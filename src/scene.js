
var Scene = SR.Scene = function() {
	this.camera = new Matrix4();
	this.world = new SR.Renderable();
    this.lights = [];
}
var dp = Scene.prototype;

dp.add = function(itm) {
    this.world.add(itm);
    return itm;
}

dp.addLight = function(l) {
    this.lights.push(l)
}