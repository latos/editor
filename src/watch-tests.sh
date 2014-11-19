#!/bin/bash

JASMIN=node_modules/jasmine-node/bin/jasmine-node 

$JASMIN --color *.js
$JASMIN --autotest --color *.js
                             

