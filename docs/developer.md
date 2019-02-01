# Sparser - Demo Tool

The application comes with a helpful file to execute in the browser, [demo/index.xhtml](demo/index.xthml).

## Direct Access (No Automation)
This file provides direct access to the application by simply navigating to the file in your local filesystem, for example: `/Users/austincheney/sparser/demo/`

## Automated Environment
Sometimes it is more convenient to have automation running in the background.  The provided service will perform these tasks in this order:

1. Watch the files in the project for changes.
1. If a TypeScript file is saved the TypeScript build process executes.
1. If the saved file is the XHTML, CSS, or any TypeScript file a Web Socket connection tells the browser tab running the demo/index.xhtml file refresh.  If a text file located in the test/samples_parsed directory tree is updated the validation build will execute on the command line.
1. Runs the application in the demo/index.xhtml immediately upon page reload
1. Scrolls to the bottom of the page if the parameter *scrolldown* is supplied.

### Running the Automation
Once this application is downloaded and TypeScript is installed execute these steps on the command line:

1. `npm install` - get the development dependencies
1. `tsc` - run the TypeScript compiler
1. `node js/services server` - turn on the local service
1. In the browser go to: *http://localhost:9999*

The default port for the application is *9999*.  The port can be specified in the command line instruction, for example: `node js/services server 8080`.  Please keep in mind this application uses two ports.  First port is for the HTTP service on the specified port or port 9999.  The Web Socket connection will run on the next higher port, which is 10000 by default.

### Parameters
The xhtml file accepts a few helpful address parameters:

* **scrolldown** - This parameter tells the page to automatically scroll to the bottom on reload.
* **nocomment** - There is some default message written to the browser console.  This parameter removes that default messaging.