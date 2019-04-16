'use strict';
let grid;
/******
    Sequencer grid
*******/
class Grid {
    constructor() {
        this.swatchesElem = {};
    }
    init() {
        this.refresh();
        seq.stats();
        this.events();
    }
    /**
     * Set a specific grid pad to the state stored in the sequence
     * array at that step
     *
     * @param {integer}  x 	Step in sequence
     **/
    state(x) {
        const elem = $(`input[x=${x}]`);
        const lightElem = $(`.L[x=${x}]`);
        const step = seq.grid[x];
        if (typeof step !== 'undefined') {
            elem.prop('checked', false);
            $(`.${step.cmd}[x=${x}]`).prop('checked', true);
            if (step.cmd === 'CF' || step.cmd === 'CB') {
                lightElem.css('background', `rgb(${step.light})`)
                    .addClass('a')
                    .prop('title', `rgb(${seq.light})`);
            }
            else {
                lightElem.css('background', 'transparent')
                    .removeClass('a')
                    .prop('title', '');
            }
        }
        else {
            lightElem.css('background', 'transparent')
                .removeClass('a')
                .prop('title', '');
        }
    }
    /**
     * Clears the UI of the grid and restores it to the
     * state of the sequence.
     *
     **/
    refresh() {
        const cmds = [
            'camera_forward',
            'camera_second_forward',
            'projector_forward',
            'projector_second_forward',
            'camera_backward',
            'camera_second_backward',
            'projector_backward',
            'projector_second_backward',
            'light_set',
            'numbers'
        ];
        const width = 970 - 34 + ((940 / 24) * Math.abs(24 - seq.size));
        let elem;
        let cmd;
        $('#sequence').width(`${width}px`);
        for (let i = 0; i < cmds.length; i++) {
            cmd = `#${cmds[i]}`;
            $(cmd).empty();
            for (let x = 0; x < seq.size; x++) {
                if (cmds[i] === 'numbers') {
                    elem = `<div x="${x}">${x}</div>`;
                    $(cmd).append($(elem));
                }
                else if (cmds[i] === 'light_set') {
                    elem = `<div x="${x}" class="L"></div>`;
                    $(cmd).append($(elem));
                }
                else {
                    elem = `<input type="checkbox" x="${x}" />`;
                    $(cmd).append($(elem).addClass(cfg.cmd[cmds[i]]));
                }
                this.state(x);
            }
        }
    }
    /**
     * Function bound to click on grid pad elements
     *
     * @param  {object} t This, passed from clicked element
     **/
    click(t) {
        const x = parseInt($(t).attr('x'));
        let c;
        if ($(t).prop('checked')) {
            c = $(t).attr('class').replace('.', '');
            seq.set(x, c);
        }
        else {
            seq.grid[x] = undefined;
            delete seq.grid[x];
            seq.unset(x);
        }
        this.state(x);
        seq.stats();
    }
    /**
     * Clears the state of the sequence and then refreshes
     * the grid and then recalculates the stats on the sequence
     **/
    clear() {
        const doit = confirm('Are you sure you want to clear this sequence?');
        if (doit) {
            seq.clear();
            this.refresh();
            seq.stats();
            log.info('Sequencer cleared');
        }
    }
    /**
     * Add 24 frames to the sequence in the GUI
     **/
    plus_24() {
        seq.size += 24;
        this.refresh();
        log.info(`Sequencer expanded to ${seq.size} steps`);
    }
    /**
     * Set light value to black (0,0,0) when double clicked
     *
     * @param {object} t This, passed from clicked element
     **/
    blackout(t) {
        const elem = $(t);
        const x = parseInt(elem.attr('x'));
        if (typeof seq.grid[x].light === 'undefined') {
            return false;
        }
        console.log(x);
        if (seq.grid[x].light === '0,0,0') {
            seq.setLight(x, light.color);
        }
        else {
            seq.setLight(x, [0, 0, 0]);
        }
    }
    /**
     * Change all lights at all camera commands to a specific
     * RGB value
     *
     * @param {array}  rgb  RGB value [255. 255, 255]
     */
    changeAll(rgb) {
        let c;
        for (let step of seq.grid) {
            c = step.cmd;
            if (c === 'CF' || c === 'CB') {
                seq.setLight(step.x, rgb);
            }
        }
    }
    /**
     * Display color swatch modal for selection of light
     * color value at specific step
     *
     * @param {integer} x   Position in sequence to change value
     **/
    swatches(x) {
        const current = seq.grid[x].light;
        this.swatchesElem = w2popup.open({
            title: 'Select Color',
            body: $('#light-swatches').html(),
            buttons: '<button id="sequencer-ok" class="btn btn-default">Ok</button> <button id="sequencer-changeall" class="btn btn-warning">Change All</button> <button id="sequencer-cancel" class="btn btn-default">Cancel</button>',
            onClose: () => { }
        });
        $('.w2ui-msg-body .swatch').removeClass('default set');
        $(`.w2ui-msg-body .swatch[color="${current}"`).eq(0).addClass('default set');
        $('#sequencer-cancel').on('click', this.swatchesElem.close);
        $('#sequencer-changeall').on('click', function () {
            const doit = confirm('You sure you want to change all light settings?');
            const elem = $('.w2ui-msg-body .default');
            let rgb;
            if (doit && elem.length > 0) {
                rgb = elem.attr('color').split(',');
                grid.changeAll(rgb);
                grid.swatchesElem.close();
            }
            else if (doit && elem.length === 0) {
                gui.warn('Select Color', 'Please select a color to proceed.');
            }
        });
        $('#sequencer-ok').on('click', function () {
            var elem = $('.w2ui-msg-body .default'), rgb;
            if (elem.length > 0) {
                rgb = elem.attr('color').split(',');
                seq.setLight(x, rgb);
                light.color = rgb;
                grid.swatchesElem.close();
            }
            else {
                gui.warn('Select Color', 'Please select a color to proceed.');
            }
        });
    }
    /**
     * Scroll the grid to a specific step
     *
     * @param {integer} x Step to scroll to
     **/
    scrollTo(x) {
        const w = 35 + 3; //width of pad + margin
        $('#seq_scroll').scrollLeft(x * w);
    }
    /**
     * Bind all events to sequence. Re-evaluate this in search
     * of memory leak issues with long sequences.
     **/
    events() {
        $(document.body).on('click', '#sequencer input[type=checkbox]', function () {
            grid.click(this);
        });
        //$(document.body).on('click', '.L', function () {
        //alert('click');
        //log.warn('please dont happen');
        //});
        $(document.body).on('dblclick', '.L', function () {
            grid.blackout(this);
        });
        $(document.body).on('contextmenu', '.L', function (e) {
            const x = e.target.attributes.x.value;
            setTimeout(function () {
                grid.swatches(x);
            }, 300);
            e.preventDefault();
            return false;
        });
        $('#seq_scroll').on('scroll', function () {
            let x = Math.ceil($('#seq_scroll').scrollLeft() / (35 + 3));
            $('#seq_scroll_state').val(gui.fmtZero(x, 6));
        });
        $('#seq_scroll_state').on('change', function () {
            let x = parseInt($(this).val() + '');
            $(this).val(gui.fmtZero(x, 6));
            grid.scrollTo(x);
        });
        $(document.body).on('click', '.w2ui-msg-body .swatch', function () {
            const colorStr = $(this).attr('color');
            const title = $(this).attr('title');
            let color;
            if (typeof color !== 'undefined') {
                color = colorStr.split(',');
                $('.w2ui-msg-body .swatch').removeClass('default set');
                $('#light-swatches .swatch').removeClass('default set');
                $(this).addClass('default set');
                $(`#light-swatches .swatch[title="${title}"]`).eq(0).addClass('default set');
                light.color = color;
            }
        });
    }
    ;
}
grid = new Grid();
module.exports = grid;
