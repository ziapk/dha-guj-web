import L from "leaflet";

type Corner = L.LatLngExpression;

export type RotatedOverlay = L.ImageOverlay & { setCorners(topLeft: Corner, topRight: Corner, bottomLeft: Corner): void };

/**
 * An image pinned to the map by its top-left, top-right and bottom-left corners, so a scanned society map can be
 * scaled, rotated and skewed onto the satellite view. Leaflet's own ImageOverlay only stretches to a north-up box.
 */
const RotatedImageOverlay = L.ImageOverlay.extend({
  initialize(this: L.ImageOverlay & Record<string, unknown>, url: string, topLeft: Corner, topRight: Corner, bottomLeft: Corner, options?: L.ImageOverlayOptions) {
    this._corners = [L.latLng(topLeft), L.latLng(topRight), L.latLng(bottomLeft)];
    (L.ImageOverlay.prototype as unknown as { initialize: (...args: unknown[]) => void }).initialize.call(this, url, L.latLngBounds(this._corners as L.LatLng[]), options);
  },

  onAdd(this: L.ImageOverlay & Record<string, unknown>, map: L.Map) {
    (L.ImageOverlay.prototype as unknown as { onAdd: (map: L.Map) => void }).onAdd.call(this, map);
    const image = this.getElement();

    if (image) {
      image.style.transformOrigin = "0 0";
      // The transform needs the image's real size, known only once it has loaded.
      image.addEventListener("load", () => (this as unknown as { _reset: () => void })._reset());
    }

    return this;
  },

  setCorners(this: L.ImageOverlay & Record<string, unknown>, topLeft: Corner, topRight: Corner, bottomLeft: Corner) {
    this._corners = [L.latLng(topLeft), L.latLng(topRight), L.latLng(bottomLeft)];
    this.setBounds(L.latLngBounds(this._corners as L.LatLng[]));
  },

  _reset(this: L.ImageOverlay & Record<string, unknown>) {
    const map = (this as unknown as { _map?: L.Map })._map;

    if (map) {
      const [topLeft, topRight, bottomLeft] = (this._corners as L.LatLng[]).map((corner) => map.latLngToLayerPoint(corner));
      (this as unknown as { _transform: (...points: L.Point[]) => void })._transform(topLeft, topRight, bottomLeft);
    }
  },

  _animateZoom(this: L.ImageOverlay & Record<string, unknown>, event: L.ZoomAnimEvent) {
    const map = (this as unknown as { _map: L.Map & { _latLngToNewLayerPoint: (latlng: L.LatLng, zoom: number, center: L.LatLng) => L.Point } })._map;
    const [topLeft, topRight, bottomLeft] = (this._corners as L.LatLng[]).map((corner) => map._latLngToNewLayerPoint(corner, event.zoom, event.center));
    (this as unknown as { _transform: (...points: L.Point[]) => void })._transform(topLeft, topRight, bottomLeft);
  },

  _transform(this: L.ImageOverlay, topLeft: L.Point, topRight: L.Point, bottomLeft: L.Point) {
    const image = this.getElement();

    if (!image || !image.naturalWidth) {
      return;
    }

    const width = image.naturalWidth;
    const height = image.naturalHeight;
    image.style.width = `${width}px`;
    image.style.height = `${height}px`;
    image.style.transform = `matrix(${(topRight.x - topLeft.x) / width}, ${(topRight.y - topLeft.y) / width}, ${(bottomLeft.x - topLeft.x) / height}, ${(bottomLeft.y - topLeft.y) / height}, ${topLeft.x}, ${topLeft.y})`;
  },
});

export function rotatedOverlay(url: string, topLeft: Corner, topRight: Corner, bottomLeft: Corner, options?: L.ImageOverlayOptions): RotatedOverlay {
  return new (RotatedImageOverlay as unknown as new (...args: unknown[]) => RotatedOverlay)(url, topLeft, topRight, bottomLeft, options);
}
