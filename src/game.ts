import { Application, Sprite, Text, Graphics } from 'pixi.js';
import {interpret, AstNode} from "./lang";
import { Button, ScrollBox } from '@pixi/ui';
const TextInput = require('pixi-text-input')

/*

The function (runLambda) is run every time the green button is pressed.
It should take the function defined in the text box, run it with
level specific variables an input, and the return value should decide a game action.

For example:

[EnemyIsOverhead] --> [User Defined Function] --> [Return Boolean] --> [Shoot/Not Shoot]

*/

// Lambda Vars
const ident: AstNode = (x: AstNode) => x;
const True = interpret("(\\x.\\y.x)");

let lastOutput;
let currentInput: AstNode = (x: AstNode) => x;
let stringCurrentInput = "enemyIsAbove";
let levels = [
    {title : "Level 1", description: "Example", lambdaInput: "x"},
    {title : "Level 2", description: "Example", lambdaInput: 'test'}
];

let levelId = 0;

const app = new Application({backgroundColor: 0x222222});

//@ts-ignore
document.body.appendChild(app.view);

document.getElementById("levelName").innerText = levels[levelId].title;

let mary = Sprite.from('assets/lambda.png');
let enemy = Sprite.from('assets/enemy.png');

let input = new TextInput({
    input: {
        fontFamily: 'monospace',
        fontSize: '20px',
        padding: '10px',
        width: '300px',
        height: '20px',
        color: 'white'
    },
    box: {
        default:  {fill: 0x222222, rounded: 0, stroke: {color: 0xffffff, width: 1}}
    }
})

const inputLabel = new Text(('(' + stringCurrentInput + '): Shoot/Don\'t Shoot'), {
    fontFamily: 'monospace',
    fontSize: 20,
    fill: 0xffffff,
});

inputLabel.x = 350;
inputLabel.y = 30;

input.placeholder = 'Enter code';
input.x = 20;
input.y = 20;

function runLambda() {
    currentInput = enemyIsAbove() ? interpret("(\\x.\\y.x)") : interpret("(\\x.\\y.y)");
    lastOutput = interpretLambda(input.text, currentInput)
    console.log(lastOutput(interpret("(\\x.\\y.x)(\\x.\\y.y)")))
    setTimeout(() => runLambda(), 200)
}

const button = new Button(
    new Graphics()
        .beginFill(0x00CC00)
        .drawRoundedRect(20, 65, 80, 30, 5)
);

button.onPress.connect(runLambda);

const label = new Text('Run', {
            fontFamily: 'monospace',
            fontSize: 20,
            fill: 0x000000,
});

label.x = 30;
label.y = 70;

app.stage.addChild(button.view);
app.stage.addChild(label);
app.stage.addChild(input);
app.stage.addChild(inputLabel);
app.stage.addChild(mary);

function interpretLambda(lambdaSource, levelInput) {
    let source = lambdaSource;
    let out = interpret(source);

    //@ts-ignore
    return out(levelInput);
}

mary.x = 40;
mary.y = 500;

let lives = {
    one : Sprite.from("/assets/heart.png"),
    two : Sprite.from("/assets/heart.png"),
    three : Sprite.from("/assets/heart.png")
}

let life = 3;

    app.stage.addChild(lives.one)
    app.stage.addChild(lives.two)
    app.stage.addChild(lives.three)

    lives.one.x = 650
    lives.two.x = 680
    lives.three.x = 710

    lives.one.y = 550
    lives.two.y = 550
    lives.three.y = 550


export function moveBy(val) {
    mary.x = Math.min(Math.max(mary.x + val, 0), 760)
}

function boxesIntersect(a, b)
{
    let ab = a.getBounds();
    let bb = b.getBounds();
    return ab.x + ab.width > bb.x &&
        ab.x < bb.x + bb.width &&
        ab.y + ab.height > bb.y &&
        ab.y < bb.y + bb.height;
}

export function shoot() {
    let pew = Sprite.from("../assets/pewpew.png");
    pew.x = mary.x + mary.height / 2
    pew.y = mary.y //- mary.height

    app.stage.addChild(pew)

    let time = Date.now()
    const ticker = () => {
        pew.y -= 5
        if (pew.y < -pew.height) {
            app.ticker.remove(ticker)
            app.stage.removeChild(pew)
        } else {
            for (let enemy of enemySpriteGrid) {
                if (boxesIntersect(pew, enemy)) {
                    app.ticker.remove(ticker)
                    app.stage.removeChild(pew)
                    app.stage.removeChild(enemy)
                    enemySpriteGrid.splice(enemySpriteGrid.indexOf(enemy), 1)
                    if(enemySpriteGrid.length <= 0){
                        console.log("You Win")
                    }
                }
            }
        }
    }

    app.ticker.add(ticker)

}

export function enemyIsAbove() {
    for(let e of enemySpriteGrid) {
        if(Math.abs(e.x - mary.x) < mary.width){
            return true;
        }
    }
    return false
}

let enemySpriteGrid: Sprite[] = []

for(let x = 0; x < 15; x++) {
    for(let y = 0; y < 5; y++) {
        if((x + y) % 2 == 0) {
            let enemy = Sprite.from("../assets/enemy.png");
            enemy.x = 80 + x * 40
            enemy.y = 80 + y * 40
            app.stage.addChild(enemy)
            enemySpriteGrid.push(enemy)
        }
    }
}

let frameCounter = 0;
const enemyMovement = () => {
    if ((frameCounter++ % 80) == 0) {
        for (let e of enemySpriteGrid) {
            for (let i = 0; i < 5; i++) {
                e.x += 5
            }
            if(boxesIntersect(mary, e)){
                app.stage.removeChild(lives[life])
                if(life > 0) {
                    life--
                }
                app.stage.removeChild(e)
                enemySpriteGrid.splice(enemySpriteGrid.indexOf(e), 1)
            }
        }
    } else if (frameCounter % 80  == 20) {
        for (let e of enemySpriteGrid) {
            e.y += 5;
            if(boxesIntersect(mary, e)){
                app.stage.removeChild(lives[life])
                if(life > 0) {
                    life--
                }
                app.stage.removeChild(e)
                enemySpriteGrid.splice(enemySpriteGrid.indexOf(e), 1)
            }
        }
    } else if (frameCounter % 80  == 40) {
        for (let e of enemySpriteGrid) {
            for (let i = 0; i < 5; i++) {
                e.x -= 5
            }
            if(boxesIntersect(mary, e)){
                app.stage.removeChild(lives[life])
                if(life > 0) {
                    life--
                }
                app.stage.removeChild(e)
                enemySpriteGrid.splice(enemySpriteGrid.indexOf(e), 1)
            }
        }
    } else if(frameCounter % 80  == 60) {
        for (let e of enemySpriteGrid) {
            e.y += 5;
            if(e.y > app.view.height){
                app.stage.removeChild(e)
            }
            if(boxesIntersect(mary, e)){
                app.stage.removeChild(lives[life])
                if(life > 0) {
                    life--
                }
                app.stage.removeChild(e)
                enemySpriteGrid.splice(enemySpriteGrid.indexOf(e), 1)
            }
        }
    }
}

let keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false
}

window.onkeydown = (e) => {
    if (Object.keys(keys).includes(e.code)) {
        keys[e.code] = true
        e.preventDefault()
    }
}

window.onkeyup = (e) => {
    if (Object.keys(keys).includes(e.code)) {
        keys[e.code] = false
    }
}

let lastShootTime = Date.now()

const timePassed = (start, ms) => {
    return Date.now() - start > ms
}

const movementHandler = async () => {
    console.log(enemyIsAbove())
    if(keys.ArrowLeft){
        if (mary.x > 0)
        moveBy(-5)
    }
    if(keys.ArrowRight){
        if (mary.x < mary.parent.width)
        moveBy(5)
    }
    if ((lastOutput == true || keys.ArrowUp) && timePassed(lastShootTime, 400)) {
        shoot()
        lastShootTime = Date.now()
    }
}

app.ticker.add(movementHandler);
app.ticker.add(enemyMovement);

//((if (\c. enemyIsAbove c)) (\t. shoot t))) (\e. e (\x.x))
//
//