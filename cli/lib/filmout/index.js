'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const animated_gif_detector_1 = __importDefault(require("animated-gif-detector"));
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
const delay_1 = require("delay");
const crypto_1 = require("crypto");
const frame_1 = __importDefault(require("frame"));
/**
 * @module FilmOut
 **/
class FilmOut {
    /**
     * @constructor
     * Builds FilmOut class with display, ffmpeg, ffprobe, ui and light as internal properties.
     *
     * @param {object} display Display object for showing frames
     * @param {object} ffmpeg  FFMPEG wrapper
     * @param {object} ffprobe FFPROBE wrapper for file info
     * @param {object} ui      Electron ui object
     * @param {object} light   Light device object
     **/
    constructor(display, ffmpeg, ffprobe, ui, light) {
        this.id = 'filmout';
        this.videoExtensions = ['.mpg', '.mpeg', '.mov', '.mkv', '.avi', '.mp4'];
        this.stillExtensions = ['.tif', '.tiff', '.png', '.jpg', '.jpeg', '.bmp'];
        this.gifExtension = '.gif';
        this.state = {
            frame: 0,
            frames: 0,
            still: false,
            path: null,
            fileName: null,
            info: {},
            dir: true,
            enabled: false
        };
        this.display = display;
        this.ffmpeg = ffmpeg;
        this.ffprobe = ffprobe;
        this.ui = ui;
        this.light = light;
        this.init();
    }
    /**
     * Async function for requiring log, ipcMain and bind events.
     **/
    async init() {
        const Log = require('log');
        this.log = await Log({ label: this.id });
        this.ipc = require('electron').ipcMain;
        this.listen();
    }
    /**
     *
     **/
    listen() {
        this.ipc.on(this.id, this.onConnect.bind(this));
        this.ipc.on('focus', this.focus.bind(this));
        this.ipc.on('field', this.field.bind(this));
        this.ipc.on('meter', this.meter.bind(this));
        this.ipc.on('filmout_close', this.close.bind(this));
        this.ipc.on('preview', this.preview.bind(this));
        this.ipc.on('preview_frame', this.previewFrame.bind(this));
        this.ipc.on('display', this.onDisplay.bind(this));
        this.ipc.on('pre_export', this.onPreExport.bind(this));
        this.ffmpeg.onProgress = (obj) => {
            this.ui.send('pre_export_progress', { progress: obj });
        };
    }
    /**
     * Create a hash of a string.
     *
     * @param {string} data Data to produce hash of
     */
    hash(data) {
        return crypto_1.createHash('sha1').update(data).digest('hex');
    }
    /**
     * Sets filmout direction.
     *
     * @param {boolean} dir  Direction of filmout
     **/
    set(dir) {
        this.state.dir = dir;
    }
    /**
     * Moves filmout a frame at a time.
     **/
    async move() {
        let start = +new Date();
        if (this.state.still) {
            return false;
        }
        if (this.state.dir) {
            this.state.frame++;
        }
        else {
            this.state.frame--;
        }
        if (this.state.frame < 1) {
            this.state.frame = 1;
        }
        return (+new Date()) - start;
    }
    /**
    * Begin the process of exporting single frames from the video for display.
    **/
    async start() {
        let path;
        try {
            path = await this.ffmpeg.frame(this.state, this.light.state);
        }
        catch (err) {
            this.log.error(err, 'FILMOUT', true, true);
            throw err;
        }
        await this.display.show(path);
        await delay_1.delay(20);
    }
    /**
     * Ends the filmout process and closes the display.
     **/
    async end() {
        await delay_1.delay(20);
        this.display.hide();
    }
    /**
     * Use a video file as a film out source on "projector"
     *
     * @param {object} evt Original connect event
     * @param {object} arg Arguments from ipc message
     **/
    async onConnect(evt, arg) {
        let frames = 0;
        let isAnimated = false;
        let info;
        let ext;
        ext = path_1.extname(arg.fileName.toLowerCase());
        if (ext === this.gifExtension) {
            try {
                isAnimated = await this.isGifAnimated(arg.path);
            }
            catch (err) {
                this.log.error(err, 'FILMOUT', true, true);
                await this.ui.send(this.id, { valid: false });
                return false;
            }
            this.state.still = !isAnimated;
        }
        else if (this.stillExtensions.indexOf(ext) !== -1) {
            this.state.still = true;
        }
        else if (this.videoExtensions.indexOf(ext) !== -1) {
            this.state.still = false;
        }
        else {
            this.log.error(`File is not of a valid file type`, 'FILMOUT', true, true);
            return false;
        }
        try {
            await this.ffmpeg.clearAll();
        }
        catch (err) {
            this.log.error(err, 'FILMOUT', true, true);
            throw err;
        }
        if (this.state.still) {
            try {
                info = await this.stillInfo(arg.path);
            }
            catch (err) {
                this.log.error(err, 'FILMOUT', true, true);
                this.state.enabled = false;
                await this.ui.send(this.id, { valid: false });
                return false;
            }
            frames = 1;
        }
        else {
            try {
                info = await this.ffprobe.info(arg.path);
            }
            catch (err) {
                this.log.error(err, 'FILMOUT', true, true);
                this.state.enabled = false;
                await this.ui.send(this.id, { valid: false });
                return false;
            }
            try {
                frames = await this.ffprobe.frames(arg.path);
            }
            catch (err) {
                this.log.error(err, 'FILMOUT', true, true);
                this.state.enabled = false;
                await this.ui.send(this.id, { valid: false });
                return false;
            }
        }
        this.state.frame = 0;
        this.state.path = arg.path;
        this.state.fileName = arg.fileName;
        this.state.frames = frames;
        this.state.info = info;
        this.state.hash = this.hash(arg.path);
        if (info.seconds) {
            this.state.seconds = info.seconds;
        }
        else if (info.fps && frames) {
            this.state.seconds = frames / info.fps;
        }
        this.log.info(`Opened ${this.state.fileName}`, 'FILMOUT', true, true);
        this.log.info(`Frames : ${frames}`, 'FILMOUT', true, true);
        this.state.enabled = true;
        return await this.ui.send(this.id, { valid: true, state: JSON.stringify(this.state) });
    }
    /**
     * Pre-export all frames from video for display.
     *
     * @param {object} evt IPC event
     * @param {object} arg IPC args
     */
    async onPreExport(evt, arg) {
        if (!this.state.path) {
            return await this.ui.send('pre_export', { complete: false, err: 'No file to pre export.' });
        }
        try {
            await this.ffmpeg.frames(this.state);
        }
        catch (err) {
            return await this.ui.send('pre_export', { complete: false, err });
        }
        return await this.ui.send('pre_export', { complete: true });
    }
    /**
     * Return true if gif is animated, false if it is a still
     *
     * @param {string} pathStr Path to gif to check
     *
     * @returns {boolean} Whether or not gif is animated
     **/
    async isGifAnimated(pathStr) {
        let gifBuffer;
        try {
            gifBuffer = await fs_extra_1.readFile(pathStr);
        }
        catch (err) {
            this.log.error(err, 'FILMOUT', true, true);
            return false;
        }
        return animated_gif_detector_1.default(gifBuffer);
    }
    /**
     * Return information on a still image using the sharp module
     *
     * @param {string} pathStr Path to gif to check
     *
     * @returns {object} Info about still from sharp
     **/
    async stillInfo(pathStr) {
        let info;
        try {
            info = await frame_1.default.info(pathStr);
        }
        catch (err) {
            this.log.error(err, 'FILMOUT', true, true);
        }
        return info;
    }
    /**
     * Preview a frame from the selected video.
     *
     * @param {object} evt Original event
     * @param {object} arg Arguments from message
     **/
    async previewFrame(evt, arg) {
        const state = JSON.parse(JSON.stringify(this.state));
        let path;
        state.frame = arg.frame;
        try {
            path = await this.ffmpeg.frame(state, { color: [255, 255, 255] });
        }
        catch (err) {
            this.log.error(err, 'FILMOUT', true, true);
            ;
            throw err;
        }
        this.ui.send('preview_frame', { path, frame: arg.frame });
    }
    /**
     * Open a single frame in a display window to preview filmout.
     *
     * @param {object} evt Original event
     * @param {object} arg Arguments from message
     **/
    async preview(evt, arg) {
        const state = JSON.parse(JSON.stringify(this.state));
        let path;
        state.frame = arg.frame;
        this.log.info(`Previewing frame ${state.frame} of ${state.fileName}`);
        try {
            path = await this.ffmpeg.frame(state, { color: [255, 255, 255] });
        }
        catch (err) {
            this.log.error(err, 'FILMOUT', true, true);
            throw err;
        }
        try {
            await this.display.open();
            await this.display.show(path);
        }
        catch (err) {
            this.log.error(err, 'FILMOUT', true, true);
        }
    }
    /**
     *
     **/
    async focus(evt, arg) {
        this.log.info(`Showing focus screen`);
        try {
            await this.display.open();
            await this.display.focus();
        }
        catch (err) {
            this.log.error(err, 'FILMOUT', true, true);
        }
    }
    /**
     *
     **/
    async field(evt, arg) {
        const ratio = arg.ratio;
        this.log.info(`Showing field guide screen`);
        try {
            await this.display.open();
            await this.display.field(ratio);
        }
        catch (err) {
            this.log.error(err, 'FILMOUT', true, true);
        }
    }
    /**
     *
     **/
    async meter(evt, arg) {
        this.log.info(`Showing meter screen`);
        try {
            await this.display.open();
            await this.display.meter();
        }
        catch (err) {
            this.log.error(err, 'FILMOUT', true, true);
        }
    }
    /**
     *
     **/
    async close(evt, arg) {
        try {
            await this.display.hide();
            await this.display.close();
        }
        catch (err) {
            this.log.error(err, 'FILMOUT', true, true);
        }
    }
    /**
     *
     **/
    onDisplay(evt, arg) {
        this.display.change(arg.display);
        this.log.info(`Changing the display to ${arg.display}`);
    }
}
module.exports = (display, ffmpeg, ffprobe, ui, light) => {
    return new FilmOut(display, ffmpeg, ffprobe, ui, light);
};
//# sourceMappingURL=index.js.map