///////////////////////
// NodeJS Obj to WebGL array Parses
// By: Spencer Fricke
// 
// To run:
//      node objToWebglParser.js <inputFile.obj> <inputFile.mtl> <outputFile>
//////////////////////
var fs = require('fs');
var indexSpace1;
var indexSpace2;
var indexSpace3;
var indexSpace4;
var indexSpace5;
var indexSpace6;
var indexSpace7;


var currentVertexCount = 0;
var vertexPositions = [];
var vertexNormals = [];
var allNormals = [];
var normalCount = 0;
var triangleIndices = [];
var vertexDiffuseColor = [];

//material list is a directory of (key, value) -> (materalName, colorArray[3])
//EX) materialList = {lambertRed : [1,0,0], PhongWhite: [1,1,1]}
var currentDiffuseColor = [];
var materialList = {};
var currentBufferMaterial;


var debug = 0;
//main function to read file from mtl file
function readMtlLines(input, func) {
  var remaining = '';

  input.on('data', function(data) {
    remaining += data;
    var index = remaining.indexOf('\n');
    var last  = 0;
    while (index > -1) {
      var line = remaining.substring(last, index);
      last = index + 1;
      func(line);
      index = remaining.indexOf('\n', last);    }

    remaining = remaining.substring(last);
  });

  input.on('end', function() {
    if (remaining.length > 0) {
      func(remaining);
    } else {
        //after mtl file is parsed calls obj file
        readObjLines(objInput, objFunc);
    }
  });
    
}

function mtlFunc(data) {
    if (data.substr(0,7) == "newmtl ") {
        //adds key of the material name to material list and set it to nothing for temp
        currentBufferMaterial = data.slice(7);
        materialList[currentBufferMaterial] = "";
        
    } else if (data.substr(0,3) == "Kd ") {
        indexSpace1 = data.indexOf(" ",3);
        indexSpace2 = data.indexOf(" ",indexSpace1 + 1);
        
        currentDiffuseColor = []; //clears previous color
        
        currentDiffuseColor.push(parseFloat(data.substring(3, indexSpace1)));
        currentDiffuseColor.push(parseFloat(data.substring(indexSpace1 + 1, indexSpace2)));
        currentDiffuseColor.push(parseFloat(data.substring(indexSpace2 + 1)));
        
        //sets the color array as the value for the material read few lines before
        materialList[currentBufferMaterial] = currentDiffuseColor;
    }
}

//main function to read file from obj file
function readObjLines(input, func) {
  var remaining = '';

  input.on('data', function(data) {
    remaining += data;
    var index = remaining.indexOf('\n');
    var last  = 0;
    while (index > -1) {
      var line = remaining.substring(last, index);
      last = index + 1;
      func(line);
      index = remaining.indexOf('\n', last);
    }

    remaining = remaining.substring(last);
  });

  input.on('end', function() {
    if (remaining.length > 0) {
      func(remaining);
    } else {
        //need to add 0,0,0, since array isn't 0 based for indices
        fs.writeFile(process.argv[4], 
                     "var vertexPositions = new Float32Array( [0,0,0," + vertexPositions + "]);\n" 
                     +
                     "var vertexNormals = new Float32Array( [0,0,0," + allNormals + "]);\n" 
                     +
                     "var vertexDiffuseColor = new Float32Array( [0,0,0," + vertexDiffuseColor + "]);\n" 
                     +
                     "var triangleIndices = new Uint8Array( [" + triangleIndices + "]);" 
                     
                     , function(err) {
            if(err) {
                return console.log(err);
            }
            console.log("Vertexs: " + vertexPositions.length / 3);
            console.log("Triangles: " + triangleIndices.length / 3);
            console.log("The file was saved!");
        });
    
    }
  });
    
}

//function for each line of data
function objFunc(data) {

    //parse color set for list of vertex
    if (data.substr(0,7) == "usemtl ") {

       //sets current color array from material list object
        currentBufferMaterial = data.slice(7);
        currentDiffuseColor = materialList[currentBufferMaterial] 
        //takes the current color array and adds it to the vertex color array 
        //does it for each vertex that has been added
        //this is because obj files give off vertex -> color -> faces in that order
        //this matches the position and color together      
        for (var i = 0; i < currentVertexCount; i++){
            vertexDiffuseColor = vertexDiffuseColor.concat(currentDiffuseColor);
        }
        
        currentVertexCount = 0; //resets counter

        
    } //parses vertexs
    else if (data.substr(0,2) == "v ") {
        indexSpace1 = data.indexOf(" ",2);
        indexSpace2 = data.indexOf(" ",indexSpace1 + 1);

        vertexPositions.push(parseFloat(data.substring(2, indexSpace1)));
        vertexPositions.push(parseFloat(data.substring(indexSpace1 + 1, indexSpace2)));
        vertexPositions.push(parseFloat(data.substring(indexSpace2 + 1)));
        
        currentVertexCount++;
        
        
    } //parse normals
    else if (data.substr(0,3) == "vn ") {
        
        //vertex normals are given per vertx in face
        //this means either 3 or 4 will be given per set of vertx on a face
        //because we are using flat faces they are all the same
        
        indexSpace1 = data.indexOf(" ",3);
        indexSpace2 = data.indexOf(" ",indexSpace1 + 1);

        allNormals.push(parseFloat(data.substring(3, indexSpace1)));
        allNormals.push(parseFloat(data.substring(indexSpace1 + 1, indexSpace2)));
        allNormals.push(parseFloat(data.substring(indexSpace2 + 1)));
        
        
            
           

    } //parse indices
    else if (data.substr(0,2) == "f ") {
        indexSpace1 = data.indexOf(" ",2);
        indexSpace2 = data.indexOf(" ",indexSpace1 + 1);
        indexSpace3 = data.indexOf(" ",indexSpace2 + 1); // is -1 if only 3 items otherwise quad

        indexSpace4 = data.substring(2, data.indexOf("/",2));
        indexSpace5 = data.substring(indexSpace1 + 1, data.indexOf("/",indexSpace1));
        indexSpace6 = data.substring(indexSpace2 + 1, data.indexOf("/",indexSpace2));
        if (indexSpace3 != -1) indexSpace7 = data.substring(indexSpace3 + 1, data.indexOf("/",indexSpace3));


        triangleIndices.push(parseInt(indexSpace4));
        triangleIndices.push(parseInt(indexSpace5));
        triangleIndices.push(parseInt(indexSpace6));

        if (indexSpace3 != -1) {
            //takes quad and parses it second triagnle out
            //EX (1,2,3,4) --> (1,2,3) & (1,3,4)  
            triangleIndices.push(parseInt(indexSpace4));
            triangleIndices.push(parseInt(indexSpace6));
            triangleIndices.push(parseInt(indexSpace7));
        }
        
        //All faces are orderd by vertex normal index order
        //as why stated in the "vn" section need to check for 3 or 4 vn

    } 
    
}

//gets file to parse
var objInput = fs.createReadStream(process.argv[2]);
var mtlInput = fs.createReadStream(process.argv[3]);
readMtlLines(mtlInput, mtlFunc);