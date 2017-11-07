class Map {
    constructor({ container, zoom, center = { lat: 39.99, lng: 116.40 } }) {
        this.container = container instanceof HTMLElement ? container : document.querySelector(container);
        this.zoom = zoom;
        this.center = center;
        this.tileSize = 256;
        this.loadTiles();
    }
    xPos(lng) {
        return (lng + 180) / 360;
    }
    yPos(lat) {
        const latPI = lat * Math.PI / 180;
        // return Math.log((1 + Math.sin(latPI)) / (1 - Math.sin(latPI))) / 2;
        const yProj = Math.log(Math.tan(Math.PI / 4 + latPI / 2 ));
        return 0.5 - yProj / 2 / Math.PI;
    }
    rePosX(xPos) {
        return 360 * xPos - 180;
    }
    rePosY(yPos) {
        const yProj = ( 0.5 - yPos ) * 2 * Math.PI;
        return ( 2 * Math.atan(Math.exp(yProj)) - (Math.PI / 2) ) * 180 / Math.PI;
    }
    on(eventType, callback) {
        this.container.addEventListener(eventType, (e) => {
            const event = this.getDefaultEventData(e);
            callback(event);
        }, false);
    }
    getDefaultEventData(event) {
        const { clientX, clientY } = event;
        const { clientLeft, clientTop } = this.container;
        const deltX = clientX - clientLeft;
        const deltY = clientY - clientTop;
        const lng = this.rePosX(this.xPosMin + this.getProjDistance(deltX));
        const lat = this.rePosY(this.yPosMin + this.getProjDistance(deltY));
        return { lat, lng };
    }
    getTile({ xPos, yPos }, z) {
        const xTile = xPos * Math.pow(2, z);
        const xTileFloor = Math.floor(xTile);
        const x = xTile === xTileFloor ? Math.max(xTileFloor - 1, 0) : xTileFloor;

		const yTile = yPos * Math.pow(2, z);
		const yTileFloor = Math.floor(yTile);
		const y = yTile === yTileFloor ? Math.max(yTileFloor - 1, 0) : yTileFloor;
        return { x, y, left: xTile - xTileFloor, top: yTile - yTileFloor };
    }
    getProjDistance(pxWidth) {
        return pxWidth / ( Math.pow(2, this.zoom) * this.tileSize);
    }
    getCoords() {
        const { center, zoom } = this;
        const width = this.container.offsetWidth;
        const height = this.container.offsetHeight;
        center.xPos = this.xPos(center.lng);
        center.yPos = this.yPos(center.lat);
		const xPosMin = center.xPos - this.getProjDistance(width / 2);
		const xPosMax = center.xPos + this.getProjDistance(width / 2);
		const yPosMin = center.yPos - this.getProjDistance(height / 2);
		const yPosMax = center.yPos + this.getProjDistance(height / 2);
        this.xPosMin = xPosMin;
        this.yPosMin = yPosMin;
        return {
            nw: this.getTile({ xPos: xPosMin, yPos: yPosMin }, zoom),
            se: this.getTile({ xPos: xPosMax, yPos: yPosMax }, zoom)
        }
    }
    getUrl(x, y, z) {
        return `http://tile.osm.org/${z}/${x}/${y}.png`;
    }
    createImg(x, y, z) {
        const image = document.createElement('img');
        image.src = this.getUrl(x, y, z);
        return image;
    }
    loadTiles() {
        const coords = this.getCoords();
        const fragment = document.createDocumentFragment()
        for (var j = coords.nw.y; j <= coords.se.y; j++) {
            for (var i = coords.nw.x; i <= coords.se.x; i++) {
                const img = this.createImg(i, j, this.zoom);
                const left = (-coords.nw.left + (i - coords.nw.x)) * 256;
                const top = (-coords.nw.top + (j - coords.nw.y)) * 256;
                img.style.transform = `translate(${left}px, ${top}px)`;
                fragment.append(img);
            }
        }
        this.container.appendChild(fragment);
    }
};
