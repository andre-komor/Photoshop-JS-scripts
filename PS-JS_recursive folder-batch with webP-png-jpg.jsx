/* This script processes all configured image-types in a selected folder recursively. You can configure:
    *Image-types, which should be handled by the script -->Line ~ 187
    *Output-destination: in original-folder or a specific one
    *Risizing, calling PS-Actions etc L. ~140
    *Save as *.png, *.jpg *.webp...also all are possible
        To the date i did the script there was no native support of Webp, so i had to use the plugin from ( https://helpx.adobe.com/de/photoshop/kb/support-webp-image-format.html ) 
        and rewrite the output from script-listener (which is always a hickhack..so its not perfect) into an own function for saving as webP. Since PS ver.23.xx Webp is supportet, but till now without an integrated function.  Lets see what the future brings.
    *Save an extra/smaller Image for Web...whatever view

ToDos: 
*Optionize the types which should be processed + improve RegEx
*destinationFolder with hierarchy
*jpgsave -->2 function
*/

////////-----------------------OPTIONs-MAIN - Check these one before using the script!!!

//!! Select the Image-Types which should be proccessed in Line 99/100

var resizeImage = true;             //...recommented if using Filters (which results depends on the image-size) 
var maxDimension = 6000;            //in PX

var saveInOrgFolder = false;         //if true images will be saved in original folder....saveInDestFolder will be ignored
var saveInDestFolder = "F:\\TMP\\Scriptest_OUTPUT\\";     //CAUTION !!! Since the Script works recursive, all files will be saved in the specified destination without the original-hierachy

//Save AS (multiple possible)
var saveAsWebp = true;    
var saveAsjpg = true;         
var saveAspng = false; 

var saveOriginalWebpCompressed = true;  //Save originalFile as Webp compressed, --> so large, uncompressed formats can be deleted (TiF etc)
var OriginalWebpCompressedQuali = 100; //100 for lossless
var OriginalWebpCompress = 0;

var makeAnImageForWeb = true;           //Make a seperate smaller image (compatible, reduzed size for ex. Web/socialMedia)
var maxDimensionWeb = 2500;
////////-----------------------OPTIONs-MAIN_END


////////-----------------------OPTIONs-enhanced 

//Save as Webp (Webp- with Plugin)

var WebpQuality = 95;        // 0 to 100    
var WebpCompression = 0;      // 0 Fastest, 1 Default, 2 Slewest 
var WebpKeepExif = true;
var WebpKeepXmp = true;
var WebpKeepColorProfile = true;
var WebpWrtl = true;
var WebpLowercase = true;

////////OPTIONs: Save as jpg
var jpgOptions = new JPEGSaveOptions();
jpgOptions.quality = 12;                 //Quality  1 to 12   
jpgOptions.embedColorProfile = true;
jpgOptions.formatOptions = FormatOptions.PROGRESSIVE;
jpgOptions.scans = 5;                   // for progressive-mode: 1,3,5 -->higher takes min. longer, but better quality
jpgOptions.matte = MatteType.NONE;      // Background

////////OPTIONs: Save as jpg...for Web

var jpgOptionsWeb = new JPEGSaveOptions();
jpgOptionsWeb.quality = 10;                 //Quality  1 to 12   
jpgOptionsWeb.embedColorProfile = true;
jpgOptionsWeb.formatOptions = FormatOptions.PROGRESSIVE;
jpgOptionsWeb.scans = 5;                   // for progressive-mode: 1,3,5 -->higher takes min. longer, but better quality
jpgOptionsWeb.matte = MatteType.NONE;      // Background


////////OPTIONs: Save as png
pngOptions = new PNGSaveOptions()
pngOptions.compression = 0          //0..9
pngOptions.interlaced = false

////////-----------------------OPTIONs-enhanced_END

function DoBatchActions(file) {

    // Open the file without dialogs like Adobe Camera Raw
    var opener = new ActionDescriptor();
    opener.putPath(charIDToTypeID("null"), file);
    executeAction(charIDToTypeID("Opn "), opener, DialogModes.NO);

    // Select the opened document
    var pic = app.activeDocument;

    //Get some File/Name/FS Info...not all needed, just for evtl. later usage
    var FfullNamePath = file.fsName;             //get activeFile Path+ Name +ext
    var Fname = activeDocument.name;            //get activeFile Name +ext
    var FnameBase = activeDocument.name.match(/(.*)\.[^\.]+$/)[1];  //get activeFile Name without extension & Path
    var Fpath   = activeDocument.path.fsName;   //get active Path (windowsFS)
    var FullPathName = Fpath+"\\"+FnameBase+".webp";

    ///create Pathes & Names
    if(saveInOrgFolder == true) {
        var saveFileToWebp = new File (FnameBase+"_q"+WebpQuality+"_C"+WebpCompression+".webp");
        var saveFileToWebpOrg = new File (FnameBase+"_q"+OriginalWebpCompressedQuali+"_C"+OriginalWebpCompress+"_ORG.webp");
        var saveFileTojpg = FnameBase+".jpg";
        var saveFileTopng = FnameBase+".png";
        var saveFileTojpgWeb = FnameBase+"._WEB.jpg";
        
    } else { 
        var saveFileToWebp =  new File (saveInDestFolder+FnameBase+"_q"+WebpQuality+"_C"+WebpCompression+".webp");
        var saveFileToWebpOrg =  new File (saveInDestFolder+FnameBase+"_q"+OriginalWebpCompressedQuali+"_C"+OriginalWebpCompress+"_ORG.webp");
        var saveFileTojpg = saveInDestFolder+FnameBase+".jpg";
        var saveFileTopng = saveInDestFolder+FnameBase+".png";
        var saveFileTojpgWeb = saveInDestFolder+FnameBase+"._WEB.jpg";
    }

        // Change to RGB
        if (pic.mode != DocumentMode.RGB) {
            pic.changeMode(ChangeMode.RGB);
        }
    
        // Switch to 8 bit RGB if the image is >8 Bit
        if (pic.bitsPerChannel > 8) {
            convertBitDepth(8);
        }
    
    ///saveOriginalWebpCompressed
    if (saveOriginalWebpCompressed == true) { 
       // alert(saveFileToWebpOrg);
        SaveAsWebpFunc(OriginalWebpCompressedQuali, OriginalWebpCompress, WebpKeepExif, WebpKeepXmp, WebpKeepColorProfile, WebpWrtl, saveFileToWebpOrg, WebpLowercase);
    }

    ///////////-------------Resize before doing more Stuff, check if image is portrait-mode --> only use longest side
    if (resizeImage = true) {
        if ((pic.width > pic.height) && (pic.width != maxDimension)) {
            pic.resizeImage(UnitValue(maxDimension, "PX"),null,null, ResampleMethod.BICUBICSMOOTHER);
            }
            else if (pic.height != maxDimension) {
                pic.resizeImage(null,UnitValue(maxDimension, "px"),null, ResampleMethod.BICUBICSMOOTHER);
        }   
    }

    ///////////-------------RUN PS-ACTIONS (Action, Action-Collection)
    app.doAction("All3_simple & Best","Foto-Collection-OPTI.ATN");


    ////////////////////-----------------------------------------------------Save File(s)
    if(saveAsWebp == true) { 
        SaveAsWebpFunc(WebpQuality, WebpCompression, WebpKeepExif, WebpKeepXmp, WebpKeepColorProfile, WebpWrtl, saveFileToWebp, WebpLowercase);
       // alert(saveFileToWebp);
    }


    if(saveAsjpg == true){ 
        pic.saveAs(new File(saveFileTojpg), jpgOptions, true, Extension.LOWERCASE);
        //alert(saveFileTojpg);
    }

    if(saveAspng == true){ 
       pic.saveAs(new File(saveFileTopng), PNGSaveOptions);
    }

    //make additional Websized image
    if (makeAnImageForWeb == true) {
        if ((pic.width > pic.height) && (pic.width != maxDimensionWeb)) {
            pic.resizeImage(UnitValue(maxDimensionWeb, "PX"),null,null, ResampleMethod.BICUBICSHARPER);
            }
        else if (pic.height != maxDimensionWeb) {
            pic.resizeImage(null,UnitValue(maxDimensionWeb, "px"),null, ResampleMethod.BICUBICSHARPER);
        }   

        pic.saveAs(new File(saveFileTojpgWeb), jpgOptionsWeb, true, Extension.LOWERCASE);
    }

    //////////////////-----------------------------------------------------Save File(s)_END

	pic.close(SaveOptions.DONOTSAVECHANGES);  //OPtions: DONOTSAVECHANGES PROMPTTOSAVECHANGES SAVECHANGES
}

function GoFoldersRecursive(folder) {
    // Recursively open files in the given folder
    var children = folder.getFiles();
    for (var i = 0; i < children.length; i++) {
        var child = children[i];
        if (child instanceof Folder) {
            GoFoldersRecursive(child);
         }  else {
            if  
                ((child.name.slice(-4).toLowerCase().match('\.jpg|\.png|\.tif|\.gif|\.bmp|\.jpe')) ||
                (child.name.slice(-5).toLowerCase().match('\.jpeg|\.png|\.tiff'))) {
                DoBatchActions(child);
            }
        }
    }
}

function SaveAsWebpFunc(quality, compression, metadataExif, metadataXmp, metadataColorProfile, wrtl, saveFileTo, lowerCase) {
	var descriptor = new ActionDescriptor();
	var descriptor2 = new ActionDescriptor();
	descriptor2.putInteger( charIDToTypeID( "wrtq" ), quality );
	descriptor2.putInteger( charIDToTypeID( "wrtc" ), compression );
	descriptor2.putBoolean( charIDToTypeID( "wrte" ), metadataExif );
	descriptor2.putBoolean( charIDToTypeID( "wrtx" ), metadataXmp );
	descriptor2.putBoolean( charIDToTypeID( "wrtp" ), metadataColorProfile );
	descriptor2.putBoolean( charIDToTypeID( "wrtl" ), wrtl );
	descriptor.putObject( stringIDToTypeID( "as" ), stringIDToTypeID( "Google WebPShop" ), descriptor2 );
	descriptor.putPath( charIDToTypeID( "In  " ), saveFileTo);
	descriptor.putInteger( stringIDToTypeID( "documentID" ), 1000 );
	descriptor.putBoolean( stringIDToTypeID( "lowerCase" ), lowerCase );
	descriptor.putEnumerated( stringIDToTypeID( "saveStage" ), stringIDToTypeID( "saveStageType" ), stringIDToTypeID( "saveBegin" ));
	executeAction( stringIDToTypeID( "save" ), descriptor, DialogModes.NO );
}

if (confirm("Start the process? This cannot be undone.\n\rAre you sure you want to continue?")) {
    try {
        // FolderSelection ASK
        GoFoldersRecursive(Folder.selectDialog("Choose the folder which contains the images to process"));
    } catch(error) {
        alert("Error: " + error);
    }
}
