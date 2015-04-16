let Fixed2dArray = require('fixed-2d-array')

let DirtyGrid = function(w, h, d) {
  this._w = w
  this._h = h
  this._grid = new Fixed2dArray(w, h, d)
  this._dirtyCoordinates = []
}

DirtyGrid.prototype.get = function(x, y) {
  return this._grid.get(x, y)
}

DirtyGrid.prototype.set = function(x, y, v) {
  this._dirtyCoordinates.push({ x: x
                              , y: y
                              })

  return this._grid.set(x, y, v)
}

DirtyGrid.prototype.getDirtyCoordinates = function() {
  return this._dirtyCoordinates
}

DirtyGrid.prototype.cleanDirtyCoordinates = function() {
  this._dirtyCoordinates = []
}

DirtyGrid.prototype.getHeight = function() {
  return this._h
}

DirtyGrid.prototype.getWidth = function() {
  return this._w
}


module.exports = DirtyGrid
