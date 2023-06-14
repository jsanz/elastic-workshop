const { EleventyHtmlBasePlugin } = require("@11ty/eleventy");

require('dotenv').config();

env = Object.keys(process.env).
  filter((k) =>  k.startsWith('ELASTIC')).
  reduce((cur, key) => { return Object.assign(cur, { [key]: process.env[key] })}, {});

module.exports = function(eleventyConfig) {  
  eleventyConfig.addPlugin(EleventyHtmlBasePlugin);

  eleventyConfig.addGlobalData('env', env);

	eleventyConfig.addPassthroughCopy({
    "./node_modules/maplibre-gl/dist/maplibre-gl-dev.js": "assets/js/maplibre-gl-dev.js",
    "./node_modules/maplibre-gl/dist/maplibre-gl-dev.js.map": "assets/js/maplibre-gl-dev.js.map",
    "./node_modules/maplibre-gl/dist/maplibre-gl.css": "assets/css/maplibre-gl.css",
    "./node_modules/pmtiles/dist/index.js": "assets/js/pmtiles.js",
    "./node_modules/@picocss/pico/css/pico.css": "assets/css/pico.css",
    "static/js/highlight.min.js": "assets/js/highlight.min.js",
    "node_modules/highlight.js/styles/nord.css": "assets/css/nord.css",
    "static/*": "assets/",
    "static/css/*": "assets/css/"
  });

  // Sort with `Array.sort`
  eleventyConfig.addCollection("maps", function(collectionApi) {
    return collectionApi
      .getAll()
      .filter(function(item){
        return "ordering" in item.data;
      })
      .sort(function(a, b) {
        return a.data.ordering - b.data.ordering;
    });
  });
};
