Object.mix = function(a, b) {
    Object.keys(b).forEach(function(name){
        a[name] = b[name]
    })
    return a;
}
Object.defaults = function(target, def, options) {
    options = options || {};
    Object.keys(options).forEach(function(name){
        if(def[name])
            def[name] = options[name]
    })
    return Object.mix(target, def);
}


var Light = function(type, options) {
    this.type = type;
    Object.defaults(this, {
        point: new Point(),
        color: new Color(0xff,0xff,0xff),
        intensity: 0.01,
        normal: (new Point(1, -1, 1)).normalize(),
        visible: true
    }, options || {})

    this.colorIntensity = this.color.copy().scale(this.intensity);
}
Light.Type = {
    Ambient: 1,
    Directional: 2,
    Point: 3
}
