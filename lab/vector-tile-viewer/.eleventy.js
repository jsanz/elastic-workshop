module.exports = function(eleventyConfig) {  
	eleventyConfig.addPassthroughCopy({
    "./node_modules/maplibre-gl/dist/maplibre-gl-dev.js": "assets/js/maplibre-gl-dev.js",
    "./node_modules/maplibre-gl/dist/maplibre-gl-dev.js.map": "assets/js/maplibre-gl-dev.js.map",
    "./node_modules/maplibre-gl/dist/maplibre-gl.css": "assets/css/maplibre-gl.css",
    "./node_modules/pmtiles/dist/index.js": "assets/js/pmtiles.js",
    "./node_modules/@picocss/pico/css/pico.css": "assets/css/pico.css",
    "static/*": "assets/",
    "static/css/*": "assets/css/"
  });
};
