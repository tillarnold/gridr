import Fixed2dArray from 'fixed-2d-array'


export default class DirtyGrid {
  constructor (w, h, d) {
    this._w = w
    this._h = h
    this._grid = new Fixed2dArray(w, h, d)
    this._dirtyCoordinates = []
  }

  get(x, y) {
    return this._grid.get(x, y)
  }

  set(x, y, v) {
    this._dirtyCoordinates.push({ x, y })

    return this._grid.set(x, y, v)
  }

  getDirtyCoordinates() {
    return this._dirtyCoordinates
  }

  cleanDirtyCoordinates() {
    this._dirtyCoordinates = []
  }

  getHeight() {
    return this._h
  }

  getWidth() {
    return this._w
  }
}
