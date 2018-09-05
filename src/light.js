function Light(type, options) {
    this.type = type;
    options = options || {};

    this.castShadow = options.castShadow != null ? options.castShadow : false,
    this.length = options.length != null ? options.length : false,
    this.point = options.point ? options.point : new Point();
    this.normal = options.normal ? options.normal : (new Point(1, -1, 1)).normalize();
    this.color = options.color ? options.color : new Color(0xff,0xff,0xff);
    this.intensity = options.intensity != null ? options.intensity : 0.01;
    this.enabled = options.enabled != null ? options.enabled : true;

    this.colorIntensity = this.color.copy().scale(this.intensity);
}
Light.Type = {
    Ambient: 1,
    Directional: 2,
    Point: 3
}
