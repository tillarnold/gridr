import { createCanvasEventEmitter } from 'canvas-utils'
import { EventEmitter } from 'events'
import DirtyGrid from './dirtyGrid'

export default class Gridr extends EventEmitter{
  constructor (canvas, grid, transformFunction, renderFunction, viewpoint = {}) {
    super()
    let cee = createCanvasEventEmitter(canvas)

    ; ['click', 'mousedown', 'mouseup', 'mousemove'].forEach(elem =>
      cee.on(elem, e => {
        let tile = this.getTileForCoords(e.x, e.y)
          , { target, event, button } = e

        if (tile !== null) {
          this.emit(elem, { x: tile.x
                          , y: tile.y
                          , xCoor: e.x
                          , yCoor: e.y
                          , type: elem
                          , target
                          , event
                          , button
                          , preventDefault: () => e.preventDefault()
                          })
        }
      })
    )

    this.needsFullRedraw = false
    this.preventAntialiasing = true

    this._canvas = canvas
    this._grid = grid
    this._transformer = transformFunction
    this._render = renderFunction

    this._viewpoint = { x: 0
                      , y: 0
                      , width: grid.getWidth ? grid.getWidth() : 10
                      , height: grid.getHeight ? grid.getHeight() : 10
                      }
    this._ctx = canvas.getContext('2d')

    this._lastCanvasWidth = canvas.width
    this._lastCanvasHeight = canvas.height

    this.setViewpoint(viewpoint)
  }


  /**
   * Returns true if the canvas size changed since the last time `fullRedraw()` was executed.
   * if `canvasSizeChanged()` is true when `draw()` is called a `fullRedraw()` is performed.
   */
  canvasSizeChanged() {
    return !(this._lastCanvasWidth === this._canvas.width && this._lastCanvasHeight === this._canvas.height)
  }

  /**
   * Sets the viewpoint for the grid.
   * You only need to pass in the properties you want to change.
   */
  setViewpoint({ x = this._viewpoint.x
               , y = this._viewpoint.y
               , width = this._viewpoint.width
               , height = this._viewpoint.height }) {
    this._viewpoint.x = x
    this._viewpoint.y = y
    this._viewpoint.width = width
    this._viewpoint.height = height

    this.needsFullRedraw = true
  }

  /**
   * returns true if the given cell lies within th viewpoint. else returns false
   */
  isInViewpoint(xn, yn) {
    let {x, y, width, height} = this._viewpoint

    if (xn > Math.floor(x + width) || yn > Math.floor(y + height)) {
      return false
    }

    if (xn < Math.floor(x) || yn < Math.floor(y)) {
      return false
    }

    return true

  }


  drawCell(x, y) {

    let { _grid: grid
        , _ctx: ctx
        , _viewpoint: viewpoint
        , _canvas: canvas
        } = this
      , { width: vWidth
        , height: vHeight
        , x: vx
        , y: vy
        } = viewpoint
      , tileInfo = Gridr.getTileSize(canvas, vWidth, vHeight)
      , item = this._transformer.call(null, grid.get(x, y))

    this._render.call(null, tileInfo, ctx, x - vx, y - vy, item)
  }

  /**
   * Clears the canvas. And then draws all cells that lie in the viewpoint.
   */
  fullRedraw() {

    let { _grid: grid
        , _ctx: ctx
        , _viewpoint: viewpoint
        , _canvas: canvas
        } = this
      , width = Math.floor(viewpoint.x + viewpoint.width)
      , height = Math.floor(viewpoint.y + viewpoint.height)

    this._lastCanvasWidth = canvas.width
    this._lastCanvasHeight = canvas.height


    ctx.clearRect(0, 0, canvas.width, canvas.height)


    if (grid.getWidth && grid.getHeight) {
      width = width >= grid.getWidth() ? grid.getWidth() - 1 : width
      height = height >= grid.getHeight() ? grid.getHeight() - 1 : height
    }

    for (let x = Math.floor(viewpoint.x); x <= width; x++) {
      for (let y = Math.floor(viewpoint.y); y <= height; y++) {
        this.drawCell(x, y)
      }
    }
  }

  /**
   * Draws all cells that are dirty and lie in th viewpoint.
   * If `needsFullRedraw` or `canvasSizeChanged()` are true a
   * `fullRedraw()` is triggered instead.
   */
  draw() {
    if (this.needsFullRedraw || this.canvasSizeChanged()) {
      this.fullRedraw()
      this.needsFullRedraw = false
      return
    }
    let grid = this._grid
      , dirty = grid.getDirtyCoordinates()

    dirty.forEach(({x, y})=>{
      if (this.isInViewpoint(x, y)) {
        this.drawCell(x, y)
      }
    })

    grid.cleanDirtyCoordinates()
  }

  /**
   * Returns the coordinates for a cell from coordinates on the canvas
   */
  getTileForCoords(x, y) {
    let { _viewpoint: viewpoint
        , _canvas: canvas
        } = this

      , tileInfo = Gridr.getTileSize(canvas, viewpoint.width, viewpoint.height)
      , tileSize = tileInfo.size
      , { left, top } = tileInfo

    if ((x < left) || (y < top) || (x > canvas.width - left) || (y > canvas.height - top)) {
      return null
    }

    return { x: Math.ceil((x - left) / tileSize - 1 + viewpoint.x)
           , y: Math.ceil((y - top) / tileSize - 1 + viewpoint.y)
           }
  }


  /**
   * calls the get method in the internal grid
   */
  get(x, y) {
    return this._grid.get(x, y)
  }

  /**
   * calls the set method in the internal grid
   */
  set(x, y, value) {
    this._grid.set(x, y, value)
  }

  /**
   * Calculates informations about the tiles used for a canvas.
   */
  static getTileSize(canvas, tilesX, tilesY, border = 0) {
    let w = canvas.width - border * 2
      , h = canvas.height - border * 2
      , maxTileHeight = h / tilesY
      , maxTileWidth = w / tilesX
      , tileSize = maxTileHeight < maxTileWidth ? maxTileHeight : maxTileWidth
      , offestLeft = (canvas.width - tilesX * tileSize) / 2
      , offestTop = (canvas.height - tilesY * tileSize) / 2

    if (this.preventAntialiasing) {
      let diff = tileSize % 1
      tileSize = Math.floor(tileSize)
      offestLeft += diff / 2
      offestTop += diff / 2
    }


    return { size: tileSize
           , left: offestLeft
           , top: offestTop
           }
  }



  /**
   * The render function used by `createDefaultConfig`
   * if the transformed items have a color property the cell will
   * be filled in that color. If the transformed item has a clear
   * property the cell will be cleared.
   *
   * TODO: Implement `img` property
   * TODO: Implement `text` property
   */
  static defaultRender(tileInfo, ctx, x, y, item) {
    let { size: tileSize, left, top } = tileInfo

    //console.log(arguments)
    if (item.color) {
      ctx.fillStyle = item.color
      ctx.beginPath()
      ctx.fillRect(x * tileSize + left, y * tileSize + top,
        tileSize, tileSize)
      ctx.closePath()
    }

    if (item.clear) {
      ctx.beginPath()
      ctx.clearRect(x * tileSize + left, y * tileSize + top,
        tileSize, tileSize)
      ctx.closePath()
    }
  }

  /**
   * Creates a Gridr instance with a sane defualt config.
   */
  static createDefaultConfig (canvas, w, h) {
    let grid = new DirtyGrid(w, h, { clear: true })

    return new Gridr(canvas, grid, e => e, Gridr.defaultRender)
  }
}
