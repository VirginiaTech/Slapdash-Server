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

## Swagger Documenting

In order to keep the API update follow swagger 
formatting when writing apis.

You can add @swagger to your documentation and 
swagger will automatically pick it up. the 
comment should also be based on yaml file. Swagger 
currently only looks at api and lib folder. To
add a folder for swagger to look at add the path 
to options in the lib/server-swagger.js folder

	// options for the swagger docs
	var options = {
		// import swaggerDefinitions
		swaggerDefinition: swaggerDefinition,
		// path to the API docs
		apis: ['./api/*.js', './lib/*.yaml']
	};


It is recommended that all the api definition is 
done in the /lib/server-route.js

## Swagger UI 

You can view the Swagger UI in the path 'localhost:4000/swaggerui/'
when running it locally.

## Test
To Test you have to install mocha globally first. after running
npm install run:
	
	npm install -g mocha

Then run mocha and mocha will pick up all the js files in the 
'test' directory and run them.

