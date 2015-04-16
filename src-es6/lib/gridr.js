var canvasUtils = require('canvas-utils');
var EventEmitter = require('events').EventEmitter;
var inherits = require('inherits');
var DirtyGrid = require('./dirtyGrid.js');

var Gridr = function Gridr(canvas, grid, transformFunction, renderFunction, viewpoint) {

  var cee = canvasUtils.createCanvasEventEmitter(canvas);
  var that = this;

  ['click', 'mousedown', 'mouseup', 'mousemove'].forEach(function(elem) {
    cee.on(elem, function(e) {
      var tile = that.getTileForCoords(e.x, e.y);

      if (tile !== null) {
        that.emit(elem, {
          x: tile.x,
          y: tile.y,
          xCoor: e.x,
          yCoor: e.y,
          type: elem,
          target: e.target,
          event: e.event,
          button: e.button,
          preventDefault: function() {
            e.preventDefault();
          }
        });
      }
    });
  });

  this.needsFullRedraw = false;
  this.preventAntialiasing = true;

  this._canvas = canvas;
  this._grid = grid;
  this._transformer = transformFunction;
  this._render = renderFunction;

  this._viewpoint = {
    x: 0,
    y: 0,
    width: grid.getWidth ? grid.getWidth() : 10,
    height: grid.getHeight ? grid.getHeight() : 10
  };
  this._ctx = canvas.getContext('2d');

  this._lastCanvasWidth = canvas.width;
  this._lastCanvasHeight = canvas.height;

  this.setViewpoint(viewpoint || {});
};

inherits(Gridr, EventEmitter);

/**
 * Returns true if the canvas size changed since the last time `fullRedraw()` was executed.
 * if `canvasSizeChanged()` is true when `draw()` is called a `fullRedraw()` is performed.
 */
Gridr.prototype.canvasSizeChanged = function() {
  return !(this._lastCanvasWidth === this._canvas.width && this._lastCanvasHeight === this._canvas.height);
};

/**
 * Sets the viewpoint for the grid.
 * You only need to pass in th eproperties you want to change.
 */
Gridr.prototype.setViewpoint = function(v) {
  this._viewpoint.x = v.x || this._viewpoint.x;
  this._viewpoint.y = v.y || this._viewpoint.y;
  this._viewpoint.width = v.width || this._viewpoint.width;
  this._viewpoint.height = v.height || this._viewpoint.height;

  this.needsFullRedraw = true;
};

/**
 * returns true if the given cell lies within th viewpoint. else returns false;
 */
Gridr.prototype.isInViewpoint = function(x, y) {
  var viewpoint = this._viewpoint;

  if (x > Math.floor(viewpoint.x + viewpoint.width) || y > Math.floor(viewpoint.y + viewpoint.height)) {
    return false;
  }

  if (x < Math.floor(viewpoint.x) || y < Math.floor(viewpoint.y)) {
    return false;
  }

  return true;

};


Gridr.prototype.drawCell = function(x, y) {
  var grid = this._grid;
  var ctx = this._ctx;

  var viewpoint = this._viewpoint;
  var tileInfo = Gridr.getTileSize(this._canvas, viewpoint.width, viewpoint.height);
  var item = grid.get(x, y);
  item = this._transformer.call(null, item);
  this._render.call(null, tileInfo, ctx, x - viewpoint.x, y - viewpoint.y, item);
};

/**
 * Clears the canvas. And then draws all cells that lie in the viewpoint.
 */
Gridr.prototype.fullRedraw = function() {
  this._lastCanvasWidth = this._canvas.width;
  this._lastCanvasHeight = this._canvas.height;

  var viewpoint = this._viewpoint;
  var grid = this._grid;
  var ctx = this._ctx;
  var canvas = this._canvas;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  var width = Math.floor(viewpoint.x + viewpoint.width);
  var height = Math.floor(viewpoint.y + viewpoint.height);

  if (grid.getWidth && grid.getHeight) {
    width = width >= grid.getWidth() ? grid.getWidth() - 1 : width;
    height = height >= grid.getHeight() ? grid.getHeight() - 1 : height;
  }

  for (var x = Math.floor(viewpoint.x); x <= width; x++) {
    for (var y = Math.floor(viewpoint.y); y <= height; y++) {
      this.drawCell(x, y);
    }
  }
};

/**
 * Draws all cells that are dirty and lie in th viewpoint.
 * If `needsFullRedraw` or `canvasSizeChanged()` are true a
 * `fullRedraw()` is triggered instead.
 */
Gridr.prototype.draw = function() {
  if (this.needsFullRedraw || this.canvasSizeChanged()) {
    this.fullRedraw();
    this.needsFullRedraw = false;
    return;
  }
  var grid = this._grid;
  var dirty = grid.getDirtyCoordinates();

  for (var i = 0; i < dirty.length; i++) {
    var xCoor = dirty[i].x;
    var yCoor = dirty[i].y;


    if (this.isInViewpoint(xCoor, yCoor)) {
      this.drawCell(xCoor, yCoor);
    }
  }

  grid.cleanDirtyCoordinates();
};

/**
 * Returns the coordinates for a cell from coordinates on the canvas
 */
Gridr.prototype.getTileForCoords = function(x, y) {
  var canvas = this._canvas;
  var viewpoint = this._viewpoint;
  var tileInfo = Gridr.getTileSize(canvas, viewpoint.width, viewpoint.height);

  var tileSize = tileInfo.size;
  var left = tileInfo.left;
  var top = tileInfo.top; //Click outside of grid
  if ((x < left) || (y < top) || (x > canvas.width - left) || (y > canvas.height - top)) {
    return null;
  }
  var ret = {};

  ret.x = Math.ceil((x - left) / tileSize - 1 + viewpoint.x);
  ret.y = Math.ceil((y - top) / tileSize - 1 + viewpoint.y);
  return ret;
};


/**
 * calls the get method in the internal grid
 */
Gridr.prototype.get = function(x, y) {
  return this._grid.get(x, y);
};

/**
 * calls the set method in the internal grid
 */
Gridr.prototype.set = function(x, y, value) {
  this._grid.set(x, y, value);
};

/**
 * Calculates informations about the tiles used for a canvas.
 */
Gridr.getTileSize = function getTileSize(canvas, tilesX, tilesY, border) {
  border = border || 0;
  var w = canvas.width - border * 2;
  var h = canvas.height - border * 2;
  var maxTileHeight = h / tilesY;
  var maxTileWidth = w / tilesX;
  var tileSize = maxTileHeight < maxTileWidth ? maxTileHeight : maxTileWidth;
  var offestLeft = (canvas.width - tilesX * tileSize) / 2;
  var offestTop = (canvas.height - tilesY * tileSize) / 2;

  if (this.preventAntialiasing) {
    var diff = tileSize % 1;
    tileSize = Math.floor(tileSize);
    offestLeft += diff / 2;
    offestTop += diff / 2;
  }


  return {
    size: tileSize,
    left: offestLeft,
    top: offestTop
  };
};


/**
 * The render function used by `createDefaultConfig`
 * if the transformed items have a color property the cell will
 * be filled in that color. If the transformed item has a clear
 * property the cell will be cleared.
 *
 * TODO: Implement `img` property
 * TODO; Implement `text` property
 */
Gridr.defaultRender = function(tileInfo, ctx, x, y, item) {
  var tileSize = tileInfo.size;
  var left = tileInfo.left;
  var top = tileInfo.top;

  //console.log(arguments);
  if (item.color) {
    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.fillRect(x * tileSize + left, y * tileSize + top,
      tileSize, tileSize);
    ctx.closePath();
  }

  if (item.clear) {
    ctx.beginPath();
    ctx.clearRect(x * tileSize + left, y * tileSize + top,
      tileSize, tileSize);
    ctx.closePath();
  }
};

/**
 * Creates a Gridr instance with a sane defualt config.
 */
Gridr.createDefaultConfig = function(canvas, w, h) {
  return new Gridr(canvas, new DirtyGrid(w, h, {
    clear: true
  }), function(e) {
    return e;
  }, Gridr.defaultRender);
};

module.exports = Gridr;
