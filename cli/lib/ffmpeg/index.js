'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
const exec_1 = require("exec");
/** @class FFMPEG **/
class FFMPEG {
    /**
     * @constructor
     * Creates an ffmpeg class
     *
     * @param {object} sys System object to be used to get temp directory
     **/
    constructor(sys) {
        this.id = 'ffmpeg';
        this.bin = sys.deps.ffmpeg;
        this.convert = sys.deps.convert;
        this.TMPDIR = path_1.join(sys.tmp, 'mcopy_digital');
        this.init();
    }
    /**
     * Async method to call async functions from constructor
     **/
    async init() {
        const Log = require('log');
        this.log = await Log({ label: this.id });
        await this.checkDir();
    }
    /**
     * Add padding to a number to 5 places. Return a string.
     *
     * @param {integer} i Integer to pad
     *
     * @returns {string} Padded string
     **/
    padded_frame(i) {
        let len = (i + '').length;
        let str = i + '';
        for (let x = 0; x < 5 - len; x++) {
            str = '0' + str;
        }
        return str;
    }
    /**
     * Render a single frame from a video or image to a png.
     *
     * @param {object} state State object containing file data
     * @param {object} light Object containing color information for frame
     *
     * @returns {string} Path of frame
     **/
    async frame(state, light) {
        const frameNum = state.frame;
        const video = state.path;
        const w = state.info.width;
        const h = state.info.height;
        const padded = this.padded_frame(frameNum);
        let ext = 'tif';
        let rgb = light.color;
        let tmpoutput;
        let cmd;
        let output;
        let cmd2;
        let output2;
        let scale = '';
        if (w && h) {
            scale = `,scale=${w}:${h}`;
        }
        //console.dir(state)
        //if (system.platform !== 'nix') {
        ext = 'png';
        //}
        tmpoutput = path_1.join(this.TMPDIR, `export-${padded}.${ext}`);
        rgb = rgb.map((e) => {
            return parseInt(e);
        });
        //
        cmd = `${this.bin} -y -i "${video}" -vf "select='gte(n\\,${frameNum})'${scale}" -vframes 1 -compression_algo raw -pix_fmt rgb24 "${tmpoutput}"`;
        cmd2 = `${this.convert} "${tmpoutput}" -resize ${w}x${h} -size ${w}x${h} xc:"rgb(${rgb[0]},${rgb[1]},${rgb[2]})" +swap -compose Darken -composite "${tmpoutput}"`;
        //ffmpeg -i "${video}" -ss 00:00:07.000 -vframes 1 "export-${time}.jpg"
        //ffmpeg -i "${video}" -compression_algo raw -pix_fmt rgb24 "export-%05d.tiff"
        //-vf "select=gte(n\,${frame})" -compression_algo raw -pix_fmt rgb24 "export-${padded}.png"
        try {
            this.log.info(cmd);
            output = await exec_1.exec(cmd);
        }
        catch (err) {
            this.log.error(err);
        }
        if (output && output.stdout)
            this.log.info(`"${output.stdout}"`);
        if (this.convert && (rgb[0] !== 255 || rgb[1] !== 255 || rgb[2] !== 255)) {
            try {
                this.log.info(cmd2);
                output2 = await exec_1.exec(cmd2);
            }
            catch (err) {
                this.log.error(err);
            }
        }
        if (output2 && output2.stdout)
            this.log.info(`"${output2.stdout}"`);
        return tmpoutput;
    }
    /**
     * Render all frames in a video to the temp directory.
     * Not in use.
     *
     * @param {string} video Path to video
     * @param {object} obj Not sure
     *
     * @returns {?}
     **/
    async frames(video, obj) {
        const tmppath = this.TMPDIR;
        let ext = 'tif';
        let tmpoutput;
        //if (system.platform !== 'nix') {
        ext = 'png';
        //}
        tmpoutput = path_1.join(tmppath, `export-%05d.${ext}`);
        try {
            await fs_extra_1.mkdir(tmppath);
        }
        catch (err) {
            this.log.error(err);
        }
        //ffmpeg -i "${video}" -compression_algo raw -pix_fmt rgb24 "${tmpoutput}"
    }
    /**
     * Clears a specific frame from the tmp directory
     *
     * @param {integer} frame Integer of frame to clear
     *
     * @returns {boolean} True if successful, false if not
     **/
    async clear(frame) {
        const padded = this.padded_frame(frame);
        let ext = 'tif';
        let tmppath;
        let tmpoutput;
        let cmd;
        let fileExists;
        //if (system.platform !== 'nix') {
        ext = 'png';
        //}
        tmppath = path_1.join(this.TMPDIR, `export-${padded}.${ext}`);
        try {
            fileExists = await fs_extra_1.exists(tmppath);
        }
        catch (err) {
            this.log.error(err);
        }
        if (!fs_extra_1.exists)
            return false;
        try {
            await fs_extra_1.unlink(tmppath);
            this.log.info(`Cleared frame ${tmppath}`);
        }
        catch (err) {
            this.log.error(err);
        }
        return true;
    }
    /**
     * Delete all frames in temp directory.
     *
     **/
    async clearAll() {
        const tmppath = this.TMPDIR;
        let files;
        try {
            files = await fs_extra_1.readdir(tmppath);
        }
        catch (err) {
            this.log.error(err);
        }
        if (files) {
            files.forEach(async (file, index) => {
                try {
                    await fs_extra_1.unlink(path_1.join(tmppath, file));
                }
                catch (err) {
                    this.log.error(err);
                }
            });
        }
    }
    /**
     * Checks if mcopy temp directory exists. If it doesn't,
     * create it.
     **/
    async checkDir() {
        let fileExists;
        try {
            fileExists = await fs_extra_1.exists(this.TMPDIR);
        }
        catch (err) {
            this.log.error('Error checking for tmp dir', err);
        }
        if (!fileExists) {
            try {
                await fs_extra_1.mkdir(this.TMPDIR);
                this.log.info(`Created tmpdir ${this.TMPDIR}`);
            }
            catch (err) {
                this.log.error('Error creating tmp dir', err);
            }
        }
        try {
            await this.clearAll();
        }
        catch (err) {
            this.log.error(err);
        }
    }
}
module.exports = (sys) => {
    return new FFMPEG(sys);
};
//# sourceMappingURL=index.js.map