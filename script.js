let bfInterpreter;
let codeInput, resetButton, runButton, singleStepButton, label;
let intervalId;

const tapeLength = 50;
const numAvailableChar = 256;
let firstStep;

function setup() {
    createCanvas(1400, 500);
    textAlign(CENTER);

    bfInterpreter = new BrainfuckInterpreter();
    firstStep = true;

    label = createElement('label', 'Insert BFF code to execute:');
    label.position(10, 10);
    label.style('font-size', '24px');
    label.style('color', 'white');
    codeInput = createInput("[[{.>]-]    ]-]>.{[[");
    codeInput.position(300, 10);
    codeInput.size(380);
    codeInput.style('font-size', '24px');
    codeInput.style('padding', '10px');
    codeInput.style('color', 'white');
    codeInput.style('background-color', 'black');
    codeInput.style('border', 'none');

    let buttonsY = 80;

    resetButton = createButton('Reset');
    resetButton.position(10, 0 + buttonsY);
    resetButton.mousePressed(reset);

    runButton = createButton('Run steps');
    runButton.position(10, 30 + buttonsY);
    runButton.mousePressed(runCode);

    singleStepButton = createButton('Run one step');
    singleStepButton.position(10, 60 + buttonsY);
    singleStepButton.mousePressed(step);

    pauseButton = createButton('Pause');
    pauseButton.position(120, 30 + buttonsY);
    pauseButton.mousePressed(pause);

    const code = codeInput.value();
    bfInterpreter.setup(code);

    textSize(20);
    strokeWeight(1);

    noLoop();
}

function runCode() {
    intervalId = setInterval(loop, 100);
}

function reset() {
    bfInterpreter = new BrainfuckInterpreter();
    const code = codeInput.value();
    bfInterpreter.setup(code);
    firstStep = true;
    clearInterval(intervalId)
    loop();
}

function step() {
    loop();
}

function pause() {
    clearInterval(intervalId)
    noLoop();
}

function draw() {
    noLoop();

    background(0);
    strokeWeight(0);

    if (!firstStep) {
        bfInterpreter.step()
    }
    var tapeText = bfInterpreter.strTape
    let deltaX = width / tapeText.length
    var codePointerX = bfInterpreter.codePointer * deltaX
    var head0X = bfInterpreter.head0 * deltaX
    var head1X = bfInterpreter.head1 * deltaX
    let x = deltaX / 2;
    let y = height / 2;

    fill(255, 255, 255);

    //draw optional info
    let inputCode = "Input code";
    text(inputCode, textWidth(inputCode), y - 50);
    let outputCode = "Output code";
    text(outputCode, textWidth(outputCode) + width / 2, y - 50);

    //draw code
    for (let i = 0; i < tapeText.length; i++) {
        text(tapeText[i], x, y);
        x += deltaX;
    }

    //draw pointers
    fill(0, 255, 0);
    rect(codePointerX, y + 5, deltaX, 10)
    fill(255, 0, 0);
    rect(head0X, y + 15, deltaX, 10)
    fill(0, 0, 255);
    rect(head1X, y + 25, deltaX, 10)

    //draw middle line
    stroke(255, 255, 255);
    strokeWeight(5);
    line(width / 2, y - 80, width / 2, y + 80);

    firstStep = false;
}

class BrainfuckInterpreter {
    constructor() {
        this.tape = new Array(tapeLength).fill(0);
        this.strTape = new Array(tapeLength).fill('');

        this.head0 = 0;
        this.head1 = 0;
        this.codePointer = 0;
        this.bimap = new BiMap();

    }

    setup(code) {
        this.codePointer = 0;
        for (let i = 0; i < code.length; i++) {
            if (this.bimap.contains(code[i])) {
                this.write(i, this.bimap.getNumber(code[i]));
            } else {
                this.write(i, code[i]);
            }
        }
        this.head0 = 0;
        this.head1 = 0;

    }

    write(ind, value) {
        this.tape[ind] = value
        if (this.bimap.contains(value)) {
            this.strTape[ind] = this.bimap.getChar(value);
        } else {
            this.strTape[ind] = '';
        }
    }

    step() {

        switch (this.getCurrInstruction()) {
            case '<':
                this.head0 = (this.head0 - 1 + this.tape.length) % this.tape.length;
                break;
            case '>':
                this.head0 = (this.head0 + 1) % this.tape.length;
                break;
            case '{':
                this.head1 = (this.head1 - 1 + this.tape.length) % this.tape.length;
                break;
            case '}':
                this.head1 = (this.head1 + 1) % this.tape.length;
                break;
            case '-':
                this.write(this.head0, (this.tape[this.head0] - 1 + numAvailableChar) % numAvailableChar);
                break;
            case '+':
                this.write(this.head0, (this.tape[this.head0] + 1) % numAvailableChar);
                break;
            case '.':
                this.write(this.head1, this.tape[this.head0]);
                break;
            case ',':
                this.write(this.head0, this.tape[this.head1]);
                break;
            case '[':
                if (this.tape[this.head0] === 0) {
                    let openBrackets = 1;
                    while (openBrackets > 0) {
                        this.codePointer++;
                        if (this.getCurrInstruction() === '[') openBrackets++;
                        if (this.getCurrInstruction() === ']') openBrackets--;
                    }
                }
                break;
            case ']':
                if (this.tape[this.head0] !== 0) {
                    let closeBrackets = 1;
                    while (closeBrackets > 0) {
                        this.codePointer--;
                        if (this.getCurrInstruction() === ']') closeBrackets++;
                        if (this.getCurrInstruction() === '[') closeBrackets--;
                    }
                }
                break;
        }
        this.codePointer++;
    }

    getCurrInstruction() {
        return this.bimap.getChar(this.tape[this.codePointer]);
    }
}

class BiMap {
    constructor() {
        this.numToChar = {};
        this.charToNum = {};

        this.addPair(1, '<');
        this.addPair(2, '>');
        this.addPair(3, '{');
        this.addPair(4, '}');
        this.addPair(5, '-');
        this.addPair(6, '+');
        this.addPair(7, '.');
        this.addPair(8, ',');
        this.addPair(9, '[');
        this.addPair(10, ']');
    }

    addPair(number, char) {
        this.numToChar[number] = char;
        this.charToNum[char] = number;
    }

    getChar(number) {
        return this.numToChar[number];
    }

    getNumber(char) {
        return this.charToNum[char];
    }

    contains(key) {
        if (typeof key === 'number') {
            return key in this.numToChar;
        } else if (typeof key === 'string') {
            return key in this.charToNum;
        }
        return false;
    }
}
