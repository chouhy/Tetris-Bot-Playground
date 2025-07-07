import { APPStacker} from './stacker.js';
import { View } from './view.js';

let stacker = new APPStacker;
// stacker.specificBoardState();
stacker.spawn();
stacker.setGarbageList([0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 2, 1, 0, 0, 0, 0, 0, 0, 4, 0, 0]);

let bot;

let hold = null;
let drawing = {
    container: document.body,
    matrix: document.getElementById('matrix'),
    garbage: document.getElementById('garbage'),
    hold: document.getElementById('hold'),
    previews: document.getElementById('previews'),
};

let gameMsg = {"type":"start","hold":null,"combo":0,"back_to_back":false,"board":getEmptyBoard()};
gameMsg["queue"] = (stacker.piece.type+stacker.queue).split("");

let view = new View(stacker, drawing);
view.resize();
view.draw();

let inputs = null;
function animate() {
    if (inputs === null) {
        return;
    }
    if (inputs.length === 0) {
        inputs = null;

        // normal update
        if (!stacker.garbageTick) {
            if (hold == '' && hold != stacker.hold) {
            //   console.log("add peice "+ stacker.queue.slice(-2) );
              bot.postMessage({"type":"new_piece", "piece":stacker.queue.slice(-2,-1)});
              // console.log(JSON.stringify({"type":"new_piece", "piece":stacker.queue.slice(-2,-1)}));
            }
            bot.postMessage({"type":"new_piece", "piece":stacker.queue.slice(-1)});
            // console.log(JSON.stringify({"type":"new_piece", "piece":stacker.queue.slice(-1)}));
            // console.log("add peice "+ stacker.queue.slice(-1));
        }
        // update the whole board
        else {
            // bot.postMessage({"type":"stop"});
            gameMsg["board"] = getEmptyBoard();
            let curBoard = stacker.convertBoard(gameMsg["board"]);
            // console.log("curBoard");
            gameMsg["back_to_back"] = stacker.b2b >= 0;
            gameMsg["queue"] = (stacker.piece.type+stacker.queue).split("");
            // no combo = 0, internal no combo = -1
            gameMsg["combo"] = stacker.combos +1 ;
            gameMsg["hold"] = stacker.hold == '' ? null : stacker.hold;
            // console.log("update board");
            // console.log(gameMsg);
            // console.log(gameMsg);
            // gameMsg["back_to_back_num"] = stacker.b2b;
            bot.postMessage(gameMsg);
            // console.log(JSON.stringify(gameMsg));
            // setTimeout(getSuggest, 200);
            return;
            // // bot.postMessage({"type":"stop"});
        }
        // send tbp request to bot
        // count++;
        // if (count < 6)
        // setTimeout(getSuggest, 200);
        return;
    }
    // inputs.shift();
    stacker.apply(inputs.shift());
    view.draw();
}
setInterval(animate, 70);

document.getElementById("next").addEventListener("click", function() {
    // console.log(this.id);
    getSuggest();
});

function getSuggest() {
    bot.postMessage({"type":"suggest"});
}

function getTestGameMsg() {
    return {"type":"start","hold":"T","combo":0,"back_to_back":false,"board":[["G","G","G","G","G","G","G","G","G",null],["G","G","G","G","G","G","G","G","G",null],["G","G","G","G","G","G","G","G","G",null],["G","G","G","G","G","G","G","G","G",null],["G","G","G","G","G","G","G","G","G",null],["G","G","G","G","G","G","G","G","G",null],["G","G","G","G","G","G","G","G","G",null],["G","G","G","G","G","G","G","G","G",null],["G","G","G",null,"G","G","G","G","G","G"],["O","O",null,null,null,"S","S","Z","L","I"],["O","O","J",null,null,null,"S","Z","Z","I"],["J","J","J",null,null,"S","S","L","Z","I"],[null,null,null,null,null,"S","L","L","L","L"],[null,null,null,null,null,null,"L","L","L",null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null]],"queue":["Z","S","T","I","O","J"]};
}

function getEmptyBoard() {
    return [[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null]];
}

export function start(botPath, atk) {

    stacker.setAtkCal(atk);
    
    

    //"queue":["I","T","I","L","O","Z"]
    // stacker.convertBoard(gameMsg["board"]);
    // console.log(JSON.stringify(gameMsg));
    
    
    bot = new Worker(botPath);
    
    bot.onmessage = (m) => {
        // console.log(m.data);
        switch (m.data.type) {
            case "info":
                bot.postMessage({"type":"rules"});
                break;
            case "ready":
                bot.postMessage(gameMsg);
                // bot.postMessage(getTestGameMsg());
                // setTimeout(getSuggest, 200);
                break;
            // do pathfinding and push to inputs then animate will process steps inside
            case "suggestion":
                let move = m.data.moves[0];
                // console.log(move.location.type + " " + move.spin);
                hold = stacker.hold;
                console.log(JSON.stringify({"type":"play", "move":m.data.moves[0]}));
                let steps = stacker.pathFinding(move.location, move.spin);
                console.log("steps:");
                console.log(steps);
                bot.postMessage({"type":"play", "move":m.data.moves[0]});
                steps.push("delay");
                inputs = steps;
                break;
            default:
                break;
        }
    }
}



