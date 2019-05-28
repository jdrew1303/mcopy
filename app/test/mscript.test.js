'use strict';

const Mscript = require('../lib/mscript');
const mscript = new Mscript();

const assert = require('assert')

describe(`mscript module`, () => {
	const script1 = 'CF\nPF\nCB\nPB\nBF\nBB';
	const script2 = `CF 3\nPF 3`
	const script3 = `CF\nPF`

	it ('Should compile very short scripts as strings', () => {
		let obj = mscript.interpret(script1)
		assert.ok(obj.success, `Simple script1 compiles`);
		assert.equal(obj.cam, 0, 'Camera gets equaled out');
		assert.equal(obj.proj, 0, 'Projector gets cancelled out');
		assert.equal(obj.arr.length, 6, 'Generate sequence of 6 steps');
	});

	it ('Should compile script with count values after command', () => {
		let obj = mscript.interpret(script2)
		assert.ok(obj.success, `Simple script2 compiles`);
		assert.equal(obj.arr[0], 'CF', `First step is a camera_forward command`);
		assert.equal(obj.cam, 3, `Camera finished on frame 3`);
		assert.equal(obj.proj, 3, `Projector finished on frame 3`); 
		assert.equal(obj.arr.length,  6, `Generate sequence of 6 steps`);
	});


	it ('Should compile with implied counts of 1', () => {
		let obj = mscript.interpret(script3);
		assert.ok(obj.success, 'Simple script3 with implied counts compiles');
		//console.log(obj);
	});

});

describe(`mscript - Commands with integers`, () => {
	const script = `
CF 5
PF 5
CB 5
PB 5
BF 3
BB 3`;

	it ('Should compile script with integers as count values', () => {
		mscript.interpret(script, (obj) => {
			let pass = false;
			if (obj.success === true 
				&& obj.cam === 0
				&& obj.proj === 0 
				&& obj.arr.length === 26) {
				pass = true;
			}
			assert.ok(pass, `Script with integers cancels out count, but generates list of commands`)
		});
	});
});

describe(`mscript - Device commands with counts`, () => {
	const script = `
CAM 50
PROJ 50`;

	it ('Should compile script with device commands', () => {
		mscript.interpret(script, (obj) => {
			let pass = false;
			if (obj.success === true 
				&& obj.cam === 50
				&& obj.proj === 50 
				&& obj.arr.length === 100) {
				pass = true;
			}
			assert.ok(pass, `Script generates 100 step sequence with 50 steps on each device`)
		});
	});
});

describe('mscript - State', () => {
	const script = `
CF 1000
CB 1000
SET PROJ 200
PB 200`;

	it ('Should manage state using SET commands', () => {
		mscript.interpret(script, (obj) => {
			let pass = false;
			if (obj.success === true 
				&& obj.cam === 0
				&& obj.proj === 0) {
				pass = true;
			}
			assert.ok(pass, `Basic state test`);
		});
	});
});

describe('mscript - Loop', () => {
	const script1 = `
LOOP 10
	CF 3
	PF 1
END LOOP`;

	it ('Should generate a looped sequence between LOOP and END LOOP statements', () => {
		mscript.interpret(script1, (obj) => {
			let pass = false;
			if (obj.success === true 
				&& obj.cam === 30
				&& obj.proj === 10
				&& obj.arr.length === 40) {
				pass = true;
			}
			assert.ok(pass, 'Basic loop');
		});
	});

	const script2 = `
LOOP 4
	LOOP 4
		PF
		BF
	END LOOP
END LOOP`;

	it ('Should generate a sequence with nested loops', () => {
		mscript.interpret(script2, (obj) => {
			let pass = false;
			if (obj.success === true 
				&& obj.cam === 16
				&& obj.proj === 16
				&& obj.arr.length === 32) {
				pass = true;
			}
			assert.ok(pass, 'Nested loop works');
		});
	});

	//LOOP W/ CAM and PROJ
	const script3 = `
LOOP 2
	CAM 4
	PROJ 4
END`;

	it ('Should generate a sequence with CAM and PROJ statements', () => {
		mscript.interpret(script3, (obj) => {
			let pass = false;
			if (obj.success === true 
				&& obj.cam === 8
				&& obj.proj === 8
				&& obj.arr.length === 16
				&& obj.light.length === 16
				&& obj.light[0] === '0,0,0') {
				pass = true;
			}
			assert.ok(pass, 'Basic cam/proj loop');
		});
	});
});

describe('mscript - Light', () => {
	//Lighting tests
	const script1 = 'L 255,255,255\nCF\nPF';

	mscript.interpret(script1, (obj) => {
		let pass = false;
		if (obj.success === true 
			&& obj.cam === 1
			&& obj.proj === 1
			&& obj.arr.length === 2
			&& obj.light.length === 2
			&& obj.light[0] === '255,255,255'
			&& obj.light[1] === '') {
			pass = true;
		}
		assert.ok(pass, 'Basic light');
	});
	
	const script2 = 'L 255,255,255\nCF\nPF\nBF';
	mscript.interpret(script2, (obj) => {
		let pass = false;
		if (obj.success === true 
			&& obj.cam === 2
			&& obj.proj === 1
			&& obj.arr.length === 3
			&& obj.light.length === 3
			&& obj.light[0] === '255,255,255'
			&& obj.light[1] === ''
			&& obj.light[2] === '0,0,0') {
			pass = true;
		}
		assert.ok(pass, 'Basic black');
	});
	const script3 = 'LOOP 2\nL 1,1,1\nCF\nL 2,2,2\nCF\nEND';
	mscript.interpret(script3, (obj) => {
		let pass = false;
		if (obj.success === true 
			&& obj.cam === 4
			&& obj.proj === 0
			&& obj.arr.length === 4
			&& obj.light.length === 4
			&& obj.light[0] === '1,1,1'
			&& obj.light[3] === '2,2,2') {
			pass = true;
		}
		assert.ok(pass, 'Basic light');
	});
});

describe('mscript - Fade', () => {

	const script1 = 
`F 72 0,0,0 10,20,30
CF
END
PF 10`
	mscript.interpret(script1, (obj) => {
		//console.dir(obj)
		assert.ok(obj.success, 'Basic fade compiles');
		assert.equal(obj.cam, 72, `Camera moves forward 72 frames`);
		assert.equal(obj.proj, 10, 'Projector moves forward 10 frames');
		assert.equal(obj.arr.length, 82, 'Generates 82 steps');
		assert.equal(obj.light[0], '0,0,0', 'Fade starts with starting color');
		assert.equal(obj.light[71], '10,20,30', 'Fade ends with ending color');
		assert.equal(obj.light[72], '', 'Frame after fade is default color');
	});

	const script2 =
`
F 24 25,255,125 225,125,10
CF
END
L 225,125,10
CF 10`
	mscript.interpret(script2, (obj) => {
		//console.dir(obj)
		assert.ok(obj.success, 'Mscript labeled output success');
		assert.equal(obj.cam, 34, 'There are 34 camera frames');
		assert.equal(obj.arr.length, 34, 'There are 34 steps in the script');
		assert.equal(obj.light[0], '25,255,125', 'First frame is equal to start color');
		assert.equal(obj.light[23], '225,125,10', 'Last frame in fade is equal to end color');
		assert.equal(obj.light[24], '225,125,10', 'First frame after fade is set using Light command');
	});
})

/*describe('mscript - Variables', () => {
	const script1 = 
`@LIGHT=200,200,200
@COUNT=1
CF 20
PF
@COUNT++
`
	mscript.interpret(script1, obj => {
		//console.dir(obj)
		assert.ok(true)
	})
})*/