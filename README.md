# scratch3-mirto
Files needed to add a mirto robot extension to the scratch 3 offline editor.

This version is a proof of concept and requires further development before being deployed.

### Installation ###
Set up the node.js environemnt as described in these links:
  https://github.com/scratchfoundation/scratch-vm/blob/develop/docs/extensions.md
  https://scratch.mit.edu/discuss/topic/289503/
Clone scratch-vm, scratch-gui and scratch-blocks from from https://github.com/scratchfoundation

copy the files from this repository into the respective folders
Note that the following files will overwrite the default list of extensions:
  scratch-gui\src\lib\libraries\extensions\index.js
  scratch-vm\src\extension-support\extension-manager.js  

### Testing ###
to test:
	from scratch-gui folder, run
		npm start
                open url http://localhost:8601  in browser 

to rebuild:
	from scratch-gui folder, run
		npm run build

to run click:   scratch-gui\build\index.html

Note the Node.js  version used was 16.18