///////////////////////
// NodeJS Obj to WebGL array Parses
// By: Spencer Fricke
// 
// To run:
//      node objToWebglParser.js <inputFile.obj> <inputFile.mtl> <outputFile> <arrayName>
//////////////////////
var fs = require('fs');

//used to save spaces for parsing
var indexSpace1;
var indexSpace2;
var indexSpace3;
var indexSpace4;
var indexSpace5;
var indexSpace6;
var indexSpace7;

//holds data that gets out to array in file
var currentVertexCount = 0;
var vertexPositions = [];
var vertexNormals = [];
var vertexColors = [];
var vertexIndices = [];

//holds data for contruction of each face
var buffer_vertexPositions = [];
var buffer_vertexNormals = [];
var buffer_vertexColors = [];
var faceIndex = 0;


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
                     "var " + process.argv[5] + " = { \n"
                     +
                     "vPosition : { numComponents: 3, data: new Float32Array( [" + vertexPositions + "])},\n" 
                     +
                     "vNormal : { numComponents: 3, data: new Float32Array( [" + vertexNormals + "])},\n" 
                     +
                     "vTexcoords : { numComponents: 2, data: new Float32Array( [" + vertexColors + "])},\n" 
                     +
                     "vColor : { numComponents: 3, data: new Float32Array( [" + vertexDiffuseColor + "])},\n"
                     +
                     "vIndices : { numComponents: 3, data: new Uint16Array( [" + vertexIndices + "])}\n"
                     +
                     "};"
                     
                     , function(err) {
            if(err) {
                return console.log(err);
            }
            console.log("Vertexs: " + vertexPositions.length / 3);
            console.log("Triangles: " + vertexIndices.length / 3);
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
    
        
//        for (var i = 0; i < currentVertexCount; i++){
//            vertexDiffuseColor = vertexDiffuseColor.concat(currentDiffuseColor);
//        }
//        
//        currentVertexCount = 0; //resets counter    
   
        
    } //parses vertexs
    else if (data.substr(0,2) == "v ") {
        indexSpace1 = data.indexOf(" ",2);
        indexSpace2 = data.indexOf(" ",indexSpace1 + 1);

        buffer_vertexPositions.push(parseFloat(data.substring(2, indexSpace1)));
        buffer_vertexPositions.push(parseFloat(data.substring(indexSpace1 + 1, indexSpace2)));
        buffer_vertexPositions.push(parseFloat(data.substring(indexSpace2 + 1)));
        
       // currentVertexCount++;
        
        
    } //parse normals
    else if (data.substr(0,3) == "vn ") {
        
        //vertex normals are given per vertx in face
        //this means either 3 or 4 will be given per set of vertx on a face
        //because we are using flat faces they are all the same
        
        indexSpace1 = data.indexOf(" ",3);
        indexSpace2 = data.indexOf(" ",indexSpace1 + 1);

        buffer_vertexNormals.push(parseFloat(data.substring(3, indexSpace1)));
        buffer_vertexNormals.push(parseFloat(data.substring(indexSpace1 + 1, indexSpace2)));
        buffer_vertexNormals.push(parseFloat(data.substring(indexSpace2 + 1)));
        
        
               

    } //parse textures
    else if (data.substr(0,3) == "vt ") {
        
        indexSpace1 = data.indexOf(" ",3);
//        indexSpace2 = data.indexOf(" ",indexSpace1 + 1);

        buffer_vertexColors.push(parseFloat(data.substring(3, indexSpace1)));
        buffer_vertexColors.push(parseFloat(data.substring(indexSpace1 + 1)));
        
                    
           

    }//parse indices
    else if (data.substr(0,2) == "f ") {
            
        var triSet = data.substring(2).split(" ");
        for (var j = 0; j < 3; j++) {
            var triSubset = triSet[j].split("/");            
            vertexPositions.push(buffer_vertexPositions[ 3 * (parseInt(triSubset[0])-1) ]);
            vertexPositions.push(buffer_vertexPositions[ 3 * (parseInt(triSubset[0])-1) + 1 ]);
            vertexPositions.push(buffer_vertexPositions[ 3 * (parseInt(triSubset[0])-1) + 2 ]);
            vertexNormals.push(buffer_vertexNormals[ 3 * (parseInt(triSubset[2])-1) ]);
            vertexNormals.push(buffer_vertexNormals[ 3 * (parseInt(triSubset[2])-1) + 1 ]);
            vertexNormals.push(buffer_vertexNormals[ 3 * (parseInt(triSubset[2])-1) + 2 ]);
            vertexColors.push(buffer_vertexColors[ 2 * (parseInt(triSubset[1])-1) ]);
            vertexColors.push(buffer_vertexColors[ 2 * (parseInt(triSubset[1])-1) + 1 ]);
            
            vertexDiffuseColor.push(currentDiffuseColor[0]);
            vertexDiffuseColor.push(currentDiffuseColor[1]);
            vertexDiffuseColor.push(currentDiffuseColor[2]);
        }
        vertexIndices.push(3 * faceIndex);
        vertexIndices.push(3 * faceIndex + 1);
        vertexIndices.push(3 * faceIndex + 2);
        
        
        //for Quads we need to add extra face
        //if 
            // f 1 2 3 4
        // we need 1, 2, 3 and 1, 3, 4
        
        if (triSet.length == 4 ) {
            for (var j = 0; j < 4; j++) {
                if (j == 1) continue;
                var triSubset = triSet[j].split("/");            
                vertexPositions.push(buffer_vertexPositions[ 3 * (parseInt(triSubset[0])-1) ]);
                vertexPositions.push(buffer_vertexPositions[ 3 * (parseInt(triSubset[0])-1) + 1 ]);
                vertexPositions.push(buffer_vertexPositions[ 3 * (parseInt(triSubset[0])-1) + 2 ]);
                vertexNormals.push(buffer_vertexNormals[ 3 * (parseInt(triSubset[2])-1) ]);
                vertexNormals.push(buffer_vertexNormals[ 3 * (parseInt(triSubset[2])-1) + 1 ]);
                vertexNormals.push(buffer_vertexNormals[ 3 * (parseInt(triSubset[2])-1) + 2 ]);
                vertexColors.push(buffer_vertexColors[ 2 * (parseInt(triSubset[1])-1) ]);
                vertexColors.push(buffer_vertexColors[ 2 * (parseInt(triSubset[1])-1) + 1 ]);
                
                vertexDiffuseColor.push(currentDiffuseColor[0]);
                vertexDiffuseColor.push(currentDiffuseColor[1]);
                vertexDiffuseColor.push(currentDiffuseColor[2]);
            }
            vertexIndices.push(3 * faceIndex);
            vertexIndices.push(3 * faceIndex + 1);
            vertexIndices.push(3 * faceIndex + 2);
            vertexDiffuseColor.concat(currentDiffuseColor);
        }

            

        //All faces are orderd by vertex normal index order
        //as why stated in the "vn" section need to check for 3 or 4 vn

    } 
    
}

//gets file to parse
var objInput = fs.createReadStream(process.argv[2]);
var mtlInput = fs.createReadStream(process.argv[3]);
readMtlLines(mtlInput, mtlFunc);