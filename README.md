# Obj_To_WebGL_Arrays
##For anyone trying to get raw WebGL array
The Idea is you can work in any 3D program you want (Maya, Blender, Max3D) and make your model and export as an OBJ file, but currently there is no good way to parse it if you want to put it into raw Webgl arrays for buffers

##HOW TO USE
1. Have NodeJS on your computer
2. open terminal

##Commands
`node objToWebglParser.js <obj_file> <mtl_file> <output_file>

##Example/Check for yourself
'node objToWebglParser.js birthdayBoy.obj birthdayBoy.mtl myWebGLarrays.js

#ISSUES
*Currently I have not got the normals to operate correctly
*It only regonizes the diffuse colors at the moment


