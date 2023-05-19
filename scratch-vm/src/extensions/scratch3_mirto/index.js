/*
This is the Scratch 3 extension to remotely control a Mirto Robot

 Copyright (c) 2020 Michael Margolis
*/

const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const formatMessage = require('format-message');

//// require('sweetalert');

// flag indicating websocket message already been received
let alerted = false;

// outgoing websocket message buffer
let msg = null;

// flag indicating connection to ASIP bridge
let connected = false;
asip_server_addr = ""

// variables holding ASIP event values

let prev_pos_err = 0; // derived value from line_pos
    
var asip_event = {
    button :false,
    distance:0,
    ir_sensors: [0, 0, 0],
    line_pos: 0,
    left_bumper:false,
    right_bumper:false,
    edge_detected:false,
    pot:0
}

function  formAutoevents(svcId, dur) { 
    return `${svcId},A,${dur}\n`;
}


    // ASIP stuff 
function handleAsipEvent(data) {
    var values = data.slice(8,-2).split(',').map(Number);
    //var values = data.slice(8,-2).split(',');
    if(data[1] == 'B') { // bump msgs
       asip_event.left_bumper = values[0] == 0;  
       asip_event.right_bumper = values[1] == 0;     
    }
    else if(data[1] == 'R') { // ir msg    
        var avg = values[1]*1000 + values[2]*2000;
        var sum = values[0] + values[1] + values[2]
        asip_event.line_pos = Math.round(((avg / sum) - 1000)/50);
        // console.log(position);       
        var threshold = 250; //  fixme - allow this to be set using asip msg
        // returns true iff any sensor value above threshold
        for (var i = 0; i < values.length; i++) {
            if(values[i] > threshold) {                          
               asip_event.edge_detected = true;
               return;
            }
        }
        asip_event.edge_detected = false;       
    }
    else if(data[1] == 'D') { // distance msg
         asip_event.distance = values[0];
    }    
}
    
    
var pixel_colours = {
    red: [255, 0, 0],
    green: [0, 255, 0],
    blue: [0, 0, 255],
    cyan: [0, 255, 255],
    purple: [255, 0, 255],
    yellow: [255, 255, 0],
    white: [255, 255, 255],
    off: [0, 0, 0]
}
    
let mirto_icon = 'data:image/png;base64,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';

class Scratch3Mirto {
    constructor(runtime) {
        this.runtime = runtime;
        this.socket = null;
    }

    getInfo() {
        this.connect();

        return {
            id: 'mirto',
            color1: '#4B4A61',
            color2: '#34B0F7',
            name: 'Mirto robot',
            blockIconURI:  mirto_icon,
            
            blocks: [
                // command blocks
                {
                    opcode: 'set_motors',
                    blockType: BlockType.COMMAND,
                    text: 'motor power Left [LEFT_PERCENT]%  Right  [RIGHT_PERCENT]%',
                    arguments: {
                        LEFT_PERCENT: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '25',
                        },
                        RIGHT_PERCENT: {
                            type: ArgumentType.NUMBER, 
                            defaultValue: '25',
                        }
                    }
                },
                
                {
                    opcode: 'stop_motors',
                    blockType: BlockType.COMMAND,
                    text: 'Stop motors',
                },

                {
                    opcode: 'move_distance',
                    blockType: BlockType.COMMAND,
                    text: 'move robot [DISTANCE]cm  at [SPEED]cm/sec',
                    arguments: {
                        DISTANCE: {
                            type: ArgumentType.NUMBER, 
                            defaultValue: '20',
                        },
                        SPEED: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '10',
                        }
   
                    }
                },

               {
                    opcode: 'rotate',
                    blockType: BlockType.COMMAND,
                    text: 'rotate [ANGLE]degrees  for [DUR] sec',
                    arguments: {
                        ANGLE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '90',
                        },
                        DUR: {
                            type: ArgumentType.NUMBER, 
                            defaultValue: '2',
                        }
                    }
                },
                

               {
                    opcode: 'set_servo',
                    blockType: BlockType.COMMAND,
                    text: 'servo angle [ANGLE]',
                    arguments: {
                        ANGLE: {
                            type: ArgumentType.ANGLE,
                            defaultValue: '0',
                        }    
                    }
                },
                {
                    opcode: 'play_note',
                    blockType: BlockType.COMMAND,
                    text: 'play note freq [FREQ]Hz  dur [DUR] ms',
                    arguments: {
                        FREQ: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '440',
                        },
                        DUR: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 500,
                        },

                    }
                },

                {
                    opcode: 'write_lcd_line',
                    blockType: BlockType.COMMAND,
                    text: 'write LCD line[LINE] Text[TEXT]',
                    arguments: {
                        LINE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '0',
                            menu: 'lcd_lines'
                        },
                        TEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Hello!',
                        },
                    }
                },

                {
                    opcode: 'clear_lcd',
                    blockType: BlockType.COMMAND,
                    text: 'clear LCD screen',
                },                
                                
                {                    
                    opcode: 'set_colour',
                    blockType: BlockType.COMMAND,
                    text: 'set colour [COLOUR]',
                    arguments: {
                        COLOUR: {
                            type: ArgumentType.STRING,
                            defaultValue: 'off',
                            menu: 'colour_menu'
                        },
                    }
                },
                
                         
                // reporter blocks
                '---',
                {
                    opcode: 'read_left_bumper',
                    blockType: BlockType.BOOLEAN,
                    text: 'bumped Left',
                },

                {
                    opcode: 'read_right_bumper',
                    blockType: BlockType.BOOLEAN,
                    text: 'bumped Right',
                },
                
                {
                    opcode: 'ir_edge_detect',
                    blockType: BlockType.BOOLEAN,
                    text: 'line detected',
          
                },
                
                {
                    opcode: 'ir_line_pos',
                    blockType: BlockType.REPORTER,
                    text: 'line follow error',
          
                },
                
                {
                    opcode: 'line_follow_PD',
                    blockType: BlockType.REPORTER,
                    text: 'line error correction quickness[PERCENT]%',
                    arguments: {
                            PERCENT: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '50',
                        },
                    }
                },
                /*
                unneeded blocks removed
                {
                    opcode: 'read_ir_sensor',
                    blockType: BlockType.REPORTER,
                    text: 'infra-red sensor [SENSOR]',
                    arguments: {
                        SENSOR: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '0',
                            menu: 'ir_sensors'
                        },
                    }
                },
                */
                /*
                {
                    opcode: 'read_potentiometer',
                    blockType: BlockType.REPORTER,
                    text: 'Read Potentiometer',
                },
                */   
                {
                    opcode: 'read_distance',
                    blockType: BlockType.REPORTER,
                    text: 'distance cm',
                    arguments: {
                        VALUE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '0',
                        },
                    }
                },
            ],
            menus: {
                lcd_lines: {
                    acceptReporters: true,
                    items: ['0', '1', '2', '3',]
                },
                ir_sensors: {
                    acceptReporters: true,
                    items: ['0', '1', '2',]
                },
                colour_menu: {
                    acceptReporters: true,
                    items: ['red','green','blue','cyan','purple','yellow','white','off',]
                    
                }
            }
        };
    }

    // Mirto block handlers

    //  command blocks

    set_motors(args) {
        let left_percent = args['LEFT_PERCENT'];
        left_percent = parseInt(left_percent, 10);
        let right_percent = args['RIGHT_PERCENT'];
        right_percent = parseInt(right_percent, 10);
        // fixme - validate range
        //msg = `M,c,0,0\n`; // stop motors if running (fixme, move this to arduino code) 
        //this.send(msg);
        msg = `M,M,${left_percent},${right_percent}\n`; 
        this.send(msg);

    }

    stop_motors(args) {
        msg =  'M,S\n'; 
        this.send(msg);          
    }

    move_distance(args) {
        let distance = parseInt(args['DISTANCE']); //cm
        let speed = parseInt(args['SPEED']);  // cm/sec
        let dur = Math.abs(Math.round((1000*distance) / speed));  // dur is in milliseconds
        if( distance <0)
            speed = -speed;
        // fixme - validate range
        msg = `M,c,${speed},${dur}\n`; 
        this.send(msg);
    }    
    
    rotate(args) {
        let angle = args['ANGLE'];
        angle = parseInt(angle, 10);
        let dur = args['DUR'];
        dur = parseInt(dur, 10);
        var degreees_per_sec = Math.abs(angle/dur);
        // fixme - validate range
        msg = `M,a,${degreees_per_sec},${angle}\n`; 
        this.send(msg);
    }   
    
    set_servo(args) {
        let angle = args['ANGLE'];
        angle = -parseInt(angle, 10)+90;
        if(angle < 0)
           angle=0;
        if(angle > 180)
           angle=180
        msg = `S,W,0,${angle}\n`; 
        this.send(msg);
    }
    
    play_note(args){
        let f = args['FREQ'];   
        let dur = args['DUR'];
        msg = `T,P,${f},${dur}\n` 
        this.send(msg); 
    }

    write_lcd_line(args) {
        let line = args['LINE'];   
        let text = args['TEXT'];
        msg = `L,W,${line},${text}\n`
        this.send(msg);  
    }

    clear_lcd(args) {
        msg = "L,C\n" 
        this.send(msg);   
    }
    
    set_colour(args) {
       let colour = pixel_colours[args['COLOUR']];
       let colour32 = (colour[0] <<16) + (colour[1] <<8) + colour[2];
       console.log(colour32)
       msg = `P,P,0,1,{0:${colour32}}\n`
       console.log(msg)
       this.send(msg); 
    }


    // reporter blocks
    read_left_bumper(args) {
        return asip_event.left_bumper;
    }

    read_right_bumper(args) {
        return asip_event.right_bumper;
    }

    read_button(args) {
        return asip_event.button;
    }
    
    ir_edge_detect(args) {
        return asip_event.edge_detected;
    }

    ir_line_pos(args) {
       return asip_event.line_pos; 
    }
    
    line_follow_PD(args) {
        let D_percent = args['PERCENT'];
        D_percent = parseInt(D_percent, 10);
        let d = asip_event.line_pos - prev_pos_err;   
        prev_pos_err  = asip_event.line_pos ;        
        // console.log(prev_pos_err)
        if(D_percent == 0)
            return 0
        
        return (d * 100)/ D_percent;
    }
    /* 
    read_ir_sensor(args) {
        let sensor = args['SENSOR'];
        sensor = parseInt(sensor, 10);
        //console.log(asip_event.ir_sensors)
        //console.log(`senser ${sensor}, val=${asip_event.ir_sensors[sensor]}`)
        return asip_event.ir_sensors[sensor];
    }
    */
    
    read_potentiometer(args) {
        return asip_event.pot;
    }

    read_distance(args) {
        return asip_event.distance;
    }


    // Websocket stuff
    
    connect() {
        if ( connected) {
            // ignore additional connection attempts
            return;  
        } else {
            if(asip_server_addr.length < 6) {
                var ip = window.prompt("Enter Mirto IP address", "192.168.1.102");
                asip_server_addr = `ws://${ip}:9006`              
            }
            window.socket = new WebSocket(asip_server_addr);
            this.socket = window.socket;
            console.log("connecting:" + window.socket.toString());
        } 

        // websocket event handlers
        window.socket.onopen = function () {

               // connection complete
            connected = true;
            //connecting = false;
            console.log(`connected:${connected}`);
            // the message is built above
            try {
                //this.send("!Hello mirto gateway\n");
                this.send(formAutoevents('M',0));   // turn off encoder events
                this.send(formAutoevents('D',100)); // turn on distance events
                this.send(formAutoevents('B',100)); // turn on bump
                this.send(formAutoevents('R',100)); // turn on ir
            } catch (err) {
                 console.log(err)
            }
        };

        window.socket.onclose = function () {
            if (alerted === false) {
                alerted = true;
                alert("WebSocket Connection Is Closed.");
            }
            connected = false;
        };

        // reporter messages from the board
        window.socket.onmessage = function (msg) { 
            if(msg.data[0] == '@') {
               handleAsipEvent(msg.data);
            }
            else{
                console.log(msg.data);
            }                
        };
    }

    send(msg){
        // console.log(`in send connected:${connected}`);
        if (connected && this.socket != null) {
            this.socket.send(msg);
            console.log(msg);
        }else {
            if(!connected){
               alert("not connected to Mirto robot");
            }
            else {
               alert("asip websocket is null");
            }
        }
    }

}

module.exports = Scratch3Mirto;

/*
    ["w", "set motors speed left: %n right: %n", "setMotors", 0, 0],
    ["w", "stop motors", "stopMotors"],
    ["w", "play note freq. (Hz) %n time (ms) %n", "playNote", 440, 500],
    ["w", "clear LCD screen", "clearLCD"],	
    ["w", "write LCD line %n text %s", "writeLCDLine", 0, "Hello!"],
    ["b", "read left bumper", "readLeftBumper"],
    ["b", "read right bumper", "readRightBumper"],	
    ["r", "read infra-red sensor %m.ir", "readIR", 0],
    ["r", "read potentiometer", "readPotentiometer"],
    ["r", "read distance", "readDistance"],
    ["b", "read button", "readButton"],

	"menus": {"ir": [0,1,2],},

*/