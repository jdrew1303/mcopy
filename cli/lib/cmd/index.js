'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const delay = require("delay");
class Commands {
    constructor(cfg, proj, cam, light, cam2 = null, proj2 = null) {
        this.cfg = cfg;
        this.proj = proj;
        this.cam = cam;
        this.light = light;
        if (cam2)
            this.cam2 = cam2;
        if (proj2)
            this.proj2 = proj2;
        this.ipc = require('electron').ipcMain;
    }
    /**
     * Move the projector one frame forward
     **/
    async projector_forward() {
        let ms;
        try {
            if (!this.proj.state.dir) {
                await delay(this.cfg.arduino.serialDelay);
                await this.proj.set(true);
            }
            await delay(this.cfg.arduino.serialDelay);
            ms = await this.proj.move();
        }
        catch (err) {
            throw err;
        }
        return ms;
    }
    /**
     * Move the projector one frame backward
     **/
    async projector_backward() {
        let ms;
        try {
            if (this.proj.state.dir) {
                await delay(this.cfg.arduino.serialDelay);
                await this.proj.set(false);
            }
            await delay(this.cfg.arduino.serialDelay);
            ms = await this.proj.move();
        }
        catch (err) {
            throw err;
        }
        return ms;
    }
    /**
     * Move the camera one frame forward
     *
     * @param {array} 	 rgb 	   Color to set light for frame
     **/
    async camera_forward(rgb = [255, 255, 255]) {
        const off = [0, 0, 0];
        let ms;
        try {
            if (!this.cam.state.dir) {
                await delay(this.cfg.arduino.serialDelay);
                await this.cam.set(true);
            }
            await delay(this.cfg.arduino.serialDelay);
            await this.light.set(rgb);
            await delay(this.cfg.arduino.serialDelay);
            ms = await this.cam.move();
            await delay(this.cfg.arduino.serialDelay);
            await this.light.set(off);
        }
        catch (err) {
            throw err;
        }
        return ms;
    }
    /**
     * Move the camera one frame forwardwith light off
     **/
    async black_forward() {
        const off = [0, 0, 0];
        let ms;
        try {
            if (!this.cam.state.dir) {
                await delay(this.cfg.arduino.serialDelay);
                await this.cam.set(true);
            }
            await delay(this.cfg.arduino.serialDelay);
            await this.light.set(off); //make sure set to off
            await delay(this.cfg.arduino.serialDelay);
            ms = await this.cam.move();
            await delay(this.cfg.arduino.serialDelay);
            await this.light.set(off);
        }
        catch (err) {
            throw err;
        }
        return ms;
    }
    /**
     * Move the camera one frame backward
     *
     * @param {array} 	 rgb 	   Color to set light for frame
     **/
    async camera_backward(rgb = [255, 255, 255]) {
        const off = [0, 0, 0];
        let ms;
        try {
            if (this.cam.state.dir) {
                await delay(this.cfg.arduino.serialDelay);
                await this.cam.set(false);
            }
            await delay(this.cfg.arduino.serialDelay);
            await this.light.set(rgb);
            await delay(this.cfg.arduino.serialDelay);
            ms = await this.cam.move();
            await delay(this.cfg.arduino.serialDelay);
            await this.light.set(off);
        }
        catch (err) {
            throw err;
        }
        return ms;
    }
    /**
     * Move the camera one frame forward, light set to black or off
     *
     **/
    async black_backward() {
        const off = [0, 0, 0];
        let ms;
        try {
            if (this.cam.state.dir) {
                await delay(this.cfg.arduino.serialDelay);
                await this.cam.set(false);
            }
            await delay(this.cfg.arduino.serialDelay);
            await this.light.set(off); //make sure set to off
            await delay(this.cfg.arduino.serialDelay);
            ms = await this.cam.move();
            await delay(this.cfg.arduino.serialDelay);
            await this.light.set(off);
        }
        catch (err) {
            throw err;
        }
        return ms;
    }
    /**
     * Move the second camera one frame forward
     *
     * @param {array} 	 rgb 	   Color to set light for frame
     **/
    async camera_second_forward(rgb = [255, 255, 255]) {
        const off = [0, 0, 0];
        let ms;
        try {
            if (!this.cam2.state.dir) {
                await delay(this.cfg.arduino.serialDelay);
                await this.cam2.set(true);
            }
            await delay(this.cfg.arduino.serialDelay);
            await this.light.set(rgb);
            await delay(this.cfg.arduino.serialDelay);
            ms = await this.cam2.move();
            await delay(this.cfg.arduino.serialDelay);
            await this.light.set(off);
        }
        catch (err) {
            throw err;
        }
        return ms;
    }
    /**
     * Move the second camera one frame backward
     *
     * @param {array} 	 rgb 	   Color to set light for frame
     **/
    async camera_second_backward(rgb = [255, 255, 255]) {
        const off = [0, 0, 0];
        let ms;
        try {
            if (this.cam2.state.dir) {
                await delay(this.cfg.arduino.serialDelay);
                await this.cam2.set(false);
            }
            await delay(this.cfg.arduino.serialDelay);
            await this.light.set(rgb);
            await delay(this.cfg.arduino.serialDelay);
            ms = await this.cam2.move();
            await delay(this.cfg.arduino.serialDelay);
            await this.light.set(off);
        }
        catch (err) {
            throw err;
        }
        return ms;
    }
    /**
     * Move the both cameras one frame forward
     *
     * @param {array} 	 rgb 	   Color to set light for frame
     **/
    async cameras_forward(rgb = [255, 255, 255]) {
        const off = [0, 0, 0];
        let both;
        let ms;
        try {
            if (!this.cam.state.dir) {
                await delay(this.cfg.arduino.serialDelay);
                await this.cam.set(true);
            }
            if (!this.cam2.state.dir) {
                await delay(this.cfg.arduino.serialDelay);
                await this.cam2.set(true);
            }
            await delay(this.cfg.arduino.serialDelay);
            await this.light.set(rgb);
            await delay(this.cfg.arduino.serialDelay);
            if (this.cam && this.cam2 && this.cam.arduino.alias.camera === this.cam.arduino.alias.camera_second) {
                ms = await this.cam.both();
            }
            else {
                this.cam.move();
                this.cam2.move();
                both = [await this.cam.move, await this.cam2.move];
                ms = Math.max(...both);
            }
            await delay(this.cfg.arduino.serialDelay);
            await this.light.set(off);
        }
        catch (err) {
            throw err;
        }
        return ms;
    }
    /**
     * Move the both cameras one frame backward
     *
     * @param {array} 	 rgb 	   Color to set light for frame
     **/
    async cameras_backward(rgb = [255, 255, 255]) {
        const off = [0, 0, 0];
        let both;
        let ms;
        try {
            if (this.cam.state.dir) {
                await delay(this.cfg.arduino.serialDelay);
                await this.cam.set(false);
            }
            if (this.cam2.state.dir) {
                await delay(this.cfg.arduino.serialDelay);
                await this.cam2.set(false);
            }
            await delay(this.cfg.arduino.serialDelay);
            await this.light.set(rgb);
            await delay(this.cfg.arduino.serialDelay);
            if (this.cam && this.cam2 && this.cam.arduino.alias.camera === this.cam.arduino.alias.camera_second) {
                ms = await this.cam.both();
            }
            else {
                this.cam.move();
                this.cam2.move();
                both = [await this.cam.move, await this.cam2.move];
                ms = Math.max(...both);
            }
            await delay(this.cfg.arduino.serialDelay);
            await this.light.set(off);
        }
        catch (err) {
            throw err;
        }
        return ms;
    }
    async camera_forward_camera_second_backward(rgb = [255, 255, 255]) {
        const off = [0, 0, 0];
        let both;
        let ms;
        try {
            if (!this.cam.state.dir) {
                await delay(this.cfg.arduino.serialDelay);
                await this.cam.set(true);
            }
            if (this.cam2.state.dir) {
                await delay(this.cfg.arduino.serialDelay);
                await this.cam2.set(false);
            }
            await delay(this.cfg.arduino.serialDelay);
            await this.light.set(rgb);
            await delay(this.cfg.arduino.serialDelay);
            if (this.cam && this.cam2 && this.cam.arduino.alias.camera === this.cam.arduino.alias.camera_second) {
                ms = await this.cam.both();
            }
            else {
                this.cam.move();
                this.cam2.move();
                both = [await this.cam.move, await this.cam2.move];
                ms = Math.max(...both);
            }
            await delay(this.cfg.arduino.serialDelay);
            await this.light.set(off);
        }
        catch (err) {
            throw err;
        }
        return ms;
    }
    async camera_backward_camera_second_forward(rgb = [255, 255, 255]) {
        const off = [0, 0, 0];
        let both;
        let ms;
        try {
            if (this.cam.state.dir) {
                await delay(this.cfg.arduino.serialDelay);
                await this.cam.set(false);
            }
            if (!this.cam2.state.dir) {
                await delay(this.cfg.arduino.serialDelay);
                await this.cam2.set(true);
            }
            await delay(this.cfg.arduino.serialDelay);
            await this.light.set(rgb);
            await delay(this.cfg.arduino.serialDelay);
            if (this.cam && this.cam2 && this.cam.arduino.alias.camera === this.cam.arduino.alias.camera_second) {
                ms = await this.cam.both();
            }
            else {
                this.cam.move();
                this.cam.move();
                both = [await this.cam.move, await this.proj2.move];
                ms = Math.max(...both);
            }
            await delay(this.cfg.arduino.serialDelay);
            await this.light.set(off);
        }
        catch (err) {
            throw err;
        }
        return ms;
    }
    /**
     * Move the secondary projector forward one frame
     *
     **/
    async projector_second_forward() {
        let ms;
        try {
            if (!this.proj2.state.dir) {
                await delay(this.cfg.arduino.serialDelay);
                await this.proj2.set(true);
            }
            await delay(this.cfg.arduino.serialDelay);
            ms = await this.proj2.move();
        }
        catch (err) {
            throw err;
        }
        return ms;
    }
    async projector_second_backward() {
        let ms;
        try {
            if (this.proj2.state.dir) {
                await delay(this.cfg.arduino.serialDelay);
                await this.proj2.set(false);
            }
            await delay(this.cfg.arduino.serialDelay);
            ms = await this.proj2.move();
        }
        catch (err) {
            throw err;
        }
        return ms;
    }
    async projectors_forward() {
        let both;
        let ms;
        try {
            if (!this.proj.state.dir) {
                await delay(this.cfg.arduino.serialDelay);
                await this.proj.set(true);
            }
            if (!this.proj2.state.dir) {
                await delay(this.cfg.arduino.serialDelay);
                await this.proj2.set(true);
            }
            await delay(this.cfg.arduino.serialDelay);
            if (this.proj && this.proj2 && this.proj.arduino.alias.projector === this.proj.arduino.alias.projector_second) {
                ms = await this.proj.both();
            }
            else {
                this.proj.move();
                this.proj2.move();
                both = [await this.proj.move, await this.proj2.move];
                ms = Math.max(...both);
            }
        }
        catch (err) {
            throw err;
        }
        return ms;
    }
    async projectors_backward() {
        let both;
        let ms;
        try {
            if (this.proj.state.dir) {
                await delay(this.cfg.arduino.serialDelay);
                await this.proj.set(false);
            }
            if (this.proj2.state.dir) {
                await delay(this.cfg.arduino.serialDelay);
                await this.proj2.set(false);
            }
            await delay(this.cfg.arduino.serialDelay);
            //run one projector without await?
            if (this.proj && this.proj2 && this.proj.arduino.alias.projector === this.proj.arduino.alias.projector_second) {
                ms = await this.proj.both();
            }
            else {
                this.proj.move();
                this.proj2.move();
                both = [await this.proj.move, await this.proj2.move];
                ms = Math.max(...both);
            }
        }
        catch (err) {
            throw err;
        }
        return ms;
    }
    async projector_forward_projector_second_backward() {
        let both;
        let ms;
        try {
            if (!this.proj.state.dir) {
                await delay(this.cfg.arduino.serialDelay);
                await this.proj.set(true);
            }
            if (this.proj2.state.dir) {
                await delay(this.cfg.arduino.serialDelay);
                await this.proj2.set(false);
            }
            await delay(this.cfg.arduino.serialDelay);
            //run one projector without await?
            if (this.proj && this.proj2 && this.proj.arduino.alias.projector === this.proj.arduino.alias.projector_second) {
                ms = await this.proj.both();
            }
            else {
                this.proj.move();
                this.proj2.move();
                both = [await this.proj.move, await this.proj2.move];
                ms = Math.max(...both);
            }
        }
        catch (err) {
            throw err;
        }
        return ms;
    }
    async projector_backward_projector_second_forward() {
        let both;
        let ms;
        try {
            if (this.proj.state.dir) {
                await delay(this.cfg.arduino.serialDelay);
                await this.proj.set(false);
            }
            if (!this.proj2.state.dir) {
                await delay(this.cfg.arduino.serialDelay);
                await this.proj2.set(true);
            }
            await delay(this.cfg.arduino.serialDelay);
            //run one projector without await?
            if (this.proj && this.proj2 && this.proj.arduino.alias.projector === this.proj.arduino.alias.projector_second) {
                ms = await this.proj.both();
            }
            else {
                this.proj.move();
                this.proj2.move();
                both = [await this.proj.move, await this.proj2.move];
                ms = Math.max(...both);
            }
        }
        catch (err) {
            throw err;
        }
        return ms;
    }
}
module.exports = function (cfg, proj, cam, light, cam2, proj2) {
    return new Commands(cfg, proj, cam, light, cam2, proj2);
};
//# sourceMappingURL=index.js.map