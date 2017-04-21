# Slapdash-Server

## Installing dependencies
run

	npm install


to only install production dependencies run

	npm install --only=production

## Running server
You can start the server on port 4000 using
	npm start

or

	node app.js

The default port is 4000 but if you want to run
it using another use PORT environment variable.
for instance run the following to start on port
3000

	PORT=3000 node app.js

## Debugging a module

If you want the debug of a file you can set the
DEBUG environment variable to the name of debug
module of that file. for instance if you want to
see all the debugs file relating to server setup
you can run the server as following

	DEBUG=server:* node app.js

If you want to see all the debugs for all the files
run:

	DEBUG=* node app.js

By default debug is off disabled for all files

## Test
To Test you have to install mocha globally first. after running
npm install run:

	npm install -g mocha

Then run mocha and mocha will pick up all the js files in the
'test' directory and run them.
