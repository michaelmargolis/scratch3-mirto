npm run# scratch3-mirto
Files needed to add a mirto robot extension to the scratch 3 offline editor.

This version is a proof of concept and requires further development before being deployed.

### Installation ###
Set up the node.js environemnt as described in these links:
  https://github.com/scratchfoundation/scratch-vm/blob/develop/docs/extensions.md
  https://scratch.mit.edu/discuss/topic/289503/
  
Clone scratch-vm, scratch-gui and scratch-blocks from from https://github.com/scratchfoundation

The following Mirto specific files from this repo should be copied into the respctive folders
in the cloned repositories: 
  scratch-vm\src\extensions\scratch3_mirto\index.js   code for mirto specific blocks
  scratch-vm\src\extension-support\extension-manager.js  add line with link to above folder

  scratch-gui\src\lib\libraries\extensions\index.js   list of extensions including mirto
  scratch-gui\src\lib\libraries\extensions\mirto\     folder with mirto icons


Note that the following files will overwrite the default list of extensions:
  scratch-gui\src\lib\libraries\extensions\index.jsx
    The above file adds Mirto and removes third party extensions (Lego, Microbit etc).
    To include these extensions, copy index_all.jsx to index.jsx)
  scratch-vm\src\extension-support\extension-manager.js  

### Configuring Node ###
use Node version 16.18 (others versions may work but not tested)
Note that you do not need to explicitly build or link scratch-blocks and doing so could break the build. 
The build issues many warnings, these should be non breaking and can be ignored

    cd scratch-gui
        npm install
        npm start

    cd scratch-vm
        npm install
        npm link
    
    cd scratch-gui
        npm link scratch-vm  

### Testing ###
to test:
	from scratch-gui folder, run
		npm start
                open url http://localhost:8601  in browser 

to build the distrubution files:
	from scratch-gui folder, run
		npm run build
        
	the distribution code is in the folder : scratch-gui/build
    to run click:   scratch-gui\build\index.html


Arduino code for mirto robot is in the ASIP 1.2 repo [here][https://github.com/michaelmargolis/ASIP-V1.2/tree/main/asipRobot/examples/mirtoWifWebsocket]
Edit mirto_secrets with the SSID and PW for your access point.