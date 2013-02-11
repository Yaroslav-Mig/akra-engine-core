#ifndef COLLADA_TS
#define COLLADA_TS

#include "ICollada.ts"


#include "IMesh.ts"
#include "IRenderDataCollection.ts"

#include "animation/AnimationTrack.ts"
#include "animation/Animation.ts"

#include "../ResourcePoolItem.ts"

#include "math/math.ts"
#include "io/files.ts"
#include "util/util.ts"

module akra.core.pool.resources {

	 /* COMMON FUNCTIONS
     ------------------------------------------------------
     */
    
    function getSupportedFormat(sSemantic: string): IColladaUnknownFormat[];
    function calcFormatStride(pFormat: IColladaUnknownFormat[]): int;
    
    // polygon index convertion
    
    function polygonToTriangles(pXML: Element, iStride: int): uint[];
    function polylistToTriangles(pXML: Element, iStride: int): uint[];
    function trifanToTriangles(pXML: Element, iStride: int): uint[];
    function tristripToTriangles(pXML: Element, iStride: int): uint[];
    
    // data convertion

    function parseBool(sValue: string): bool;
    function parseString(sValue: string): string;
    function retrieve(pSrc: any[], pDst: any[], iStride?: int, iFrom?: int, iCount?: int, iOffset?: int, iLen?: int): uint;

    function string2Array(sData: string, ppData: any[], fnConv: (data: string) => any, iFrom?: uint): uint;
    function string2IntArray(sData: string, ppData: int[], iFrom?: uint): uint;
    function string2FloatArray(sData: string, ppData: float[], iFrom?: uint): uint;
    function string2BoolArray(sData: string, ppData: bool[], iFrom?: uint): uint;
    function string2StringArray(sData: string, ppData: string[], iFrom?: uint): uint;

    function string2Any(sData: string, n: uint, sType: string, isArray?: bool): any;

    // additional
    
    function printArray(pArr: any[], nRow: uint, nCol: uint): string;
    function sortArrayByProperty(pData: any[], sProperty: string): any[];

    //xml
    
    function eachNode(pXMLList: NodeList, fnCallback: IXMLExplorer, nMax?: uint): void;
    function eachChild(pXML: Element, fnCallback: IXMLExplorer): void;
    function eachByTag(pXML: Element, sTag: string, fnCallback: IXMLExplorer, nMax?: uint): void;
    function firstChild(pXML: Element, sTag?: string): Element;
    function stringData(pXML: Element): string;
    function attr(pXML: Element, sName: string): string;

    // Akra convertions functions
    // -------------------------------------------------------

    function findNode(pNodes: IColladaNode[], sNode?: string, fnNodeCallback?: (pNode: IColladaNode) => void): IColladaNode;

    



    // globals

    var pSupportedVertexFormat: IColladaUnknownFormat[];
    var pSupportedTextureFormat: IColladaUnknownFormat[];
    var pSupportedWeightFormat: IColladaUnknownFormat[];
    var pSupportedJointFormat: IColladaUnknownFormat[];
    var pSupportedInvBindMatrixFormat: IColladaUnknownFormat[];
    var pSupportedInterpolationFormat: IColladaUnknownFormat[];
    var pSupportedInputFormat: IColladaUnknownFormat[];
    var pSupportedOutputFormat: IColladaUnknownFormat[];
    var pSupportedTangentFormat: IColladaUnknownFormat[];

    var pFormatStrideTable: IColladaFormatStrideTable;

    var pConvFormats: IColladaConvertionTable;

    export class Collada extends ResourcePoolItem implements ICollada {

        constructor ();

        attachToScene(pNode: ISceneNode): bool;

        parse(sXMLData: string, pOptions?: IColladaLoadOptions): bool;
        // load(sFilename: string, fnCallback?: IColladaLoadCallback, pOptions?: IColladaLoadOptions): void;

        // helper functions
    
        private COLLADATranslateMatrix(pXML: Element): IMat4;
        private COLLADARotateMatrix(pXML: Element): IMat4;
        private COLLADAScaleMatrix(pXML: Element): IMat4;
        private COLLADAData(pXML: Element): any;
        private COLLADAGetSourceData(pSource: IColladaSource, pFormat: IColladaUnknownFormat[]): IColladaArray;

        // common
        // -----------------------------------------------------------
        
        private COLLADATransform(pXML: Element, id?: string): IColladaTransform;
        private COLLADANewParam(pXML: Element): IColladaNewParam;
        private COLLADAAsset(pXML: Element): IColladaAsset;
        private COLLADALibrary(pXML: Element, pTemplate: IColladaLibraryTemplate): IColladaLibrary;

        // geometry

        private COLLADAAccessor(pXML: Element): IColladaAccessor;
        private COLLADAInput(pXML: Element, iOffset?: int): IColladaInput;
        private COLLADATechniqueCommon(pXML: Element): IColladaTechniqueCommon;
        private COLLADASource(pXML: Element): IColladaSource;
        private COLLADAVertices(pXML: Element): IColladaVertices;
        private COLLADAJoints(pXML: Element): IColladaJoints;
        private COLLADAPolygons(pXML: Element, sType: string): IColladaPolygons;
        private COLLADAVertexWeights(pXML: Element): IColladaVertexWeights;
        private COLLADAMesh(pXML: Element): IColladaMesh;
        private COLLADAGeometrie(pXML: Element): IColladaGeometrie;
        private COLLADASkin(pXML: Element): IColladaSkin;
        private COLLADAController(pXML: Element): IColladaController;

        // images
        // 
        private COLLADAImage(pXML: Element): IColladaImage;

        // effects
        
        private COLLADASurface(pXML: Element): IColladaSurface;
        private COLLADATexture(pXML: Element): IColladaTexture;
        private COLLADASampler2D(pXML: Element): IColladaSampler2D;
        private COLLADAPhong(pXML: Element): IColladaPhong;
        private COLLADAEffectTechnique(pXML: Element): IColladaEffectTechnique;
        private COLLADAProfileCommon(pXML: Element): IColladaProfileCommon;
        private COLLADAEffect(pXML: Element): IColladaEffect;

        //materials
        
        private COLLADAMaterial(pXML: Element): IColladaMaterial;

        // scene

        private COLLADANode(pXML: Element, iDepth?: uint): IColladaNode;
        private COLLADAVisualScene(pXML: Element): IColladaVisualScene;
        private COLLADABindMaterial(pXML: Element): IColladaBindMaterial;
        private COLLADAInstanceEffect(pXML: Element): IColladaInstanceEffect;
        private COLLADAInstanceController(pXML: Element): IColladaInstanceController;
        private COLLADAInstanceGeometry(pXML: Element): IColladaInstanceGeometry;

        // directly load <visual_scene> from <instance_visual_scene> from <scene>.
        private COLLADAScene(pXML: Element): IColladaVisualScene;

        // animation
         
        private COLLADAAnimationSampler(pXML: Element): IColladaAnimationSampler;
        private COLLADAAnimationChannel(pXML: Element): IColladaAnimationChannel;
        private COLLADAAnimation(pXML: Element): IColladaAnimation;

        
         // collada mapping

        private source(sUrl: string): IColladaEntry;
        private link(sId: string, pTarget: IColladaEntry): void;
        private link(pEntry: IColladaEntry): void;
        private target(sPath: string): IColladaTarget;

        //animation 
    
        private buildAnimationTrack(pChannel: IColladaAnimationChannel): IAnimationTrack;
        private buildAnimationTrackList(pAnimationData: IColladaAnimation): IAnimationTrack[];
        private buildAnimation(pAnimationData: IColladaAnimation): IAnimation;
        private buildAnimations(pAnimations: IColladaAnimation[], pAnimationsList?: IAnimation[]): IAnimation[];

        // common
        
        private buildAssetTransform(pNode: ISceneNode, pAsset?: IColladaAsset): ISceneNode;

        // materials & meshes
        
        private buildMaterials(pMesh: IMesh, pGeometryInstance: IColladaInstanceGeometry): IMesh;
        private buildSkeleton(pSkeletonsList: string[]): ISkeleton;
        private buildMesh(pGeometryInstance: IColladaInstanceGeometry): IMesh;
        private buildSkinMesh(pControllerInstance: IColladaInstanceController): IMesh;

        private buildMeshInstance(pGeometries: IColladaInstanceGeometry[], pSceneNode?: ISceneNode): IMesh[];
        private buildSkinMeshInstance(pControllers: IColladaInstanceController[], pSceneNode?: ISceneNode): IMesh[];
        private buildMeshes(): IMesh[];

        // scene
        
        private buildSceneNode(pNode: IColladaNode, pParentNode: ISceneNode): ISceneNode;
        private buildJointNode(pNode: IColladaNode, pParentNode: ISceneNode): IJoint;
        private buildNodes(pNodes: IColladaNode[], pParentNode?: ISceneNode): ISceneNode;
        private buildScene(pRootNode: ISceneNode): ISceneNode[];

        private buildInititalPose(pNodes: IColladaNode[], pSkeleton: ISkeleton): IAnimation;
        private buildInitialPoses(pPoseSkeletons?: ISkeleton[]): IAnimation[];

        // additional

        private buildComplete(): void;

        //---------------------------

        private setOptions(pUserOptions: IColladaLoadOptions): void;
        private setXMLRoot(pXML: Element): void;
        private getXMLRoot(): Element;

        private findMesh(sName: string): IMesh;
        private addMesh(pMesh: IMesh): void;

        private sharedBuffer(pBuffer?: IRenderDataCollection): IRenderDataCollection;
        private prepareInput(pInput: IColladaInput): IColladaInput;

        private isJointsVisualizationNeeded(): bool;
        private isVisualSceneLoaded(): bool;
        private isSceneNeeded(): bool;
        private isAnimationNeeded(): bool;
        private isPoseExtractionNeeded(): bool;
        private isWireframeEnabled(): bool;
        private getSkeletonsOutput(): ISkeleton[];
        private getVisualScene(): IColladaVisualScene;
        private getAsset(): IColladaAsset;

        private isLibraryLoaded(sLib: string): bool;
        private isLibraryExists(sLib: string): bool;
        private getLibrary(sLib: string): IColladaLibrary;
        private getBasename(): string;
        private getFilename(): string;
        private setFilename(sName: string): void;

        private checkLibraries(pXML: Element, pTemplates: IColladaLibraryTemplate[]): void;
        private readLibraries(pXML: Element, pTemplates: IColladaLibraryTemplate[]): void;


        static DEFAULT_OPTIONS: IColladaLoadOptions = {
            drawJoints      : false,
            wireframe       : false,
            sharedBuffer    : false,
            animation       : { pose: true },
            scene           : true,
            extractPoses    : true,
            skeletons       : null
        };

        private static SCENE_TEMPLATE: IColladaLibraryTemplate[] = [
            {lib : 'library_images',        element : 'image',          loader : "COLLADAImage"         },
            {lib : 'library_effects',       element : 'effect',         loader : "COLLADAEffect"        },
            {lib : 'library_materials',     element : 'material',       loader : "COLLADAMaterial"      },
            {lib : 'library_geometries',    element : 'geometry',       loader : "COLLADAGeometrie"     },
            {lib : 'library_controllers',   element : 'controller',     loader : "COLLADAController"    },
            {lib : 'library_visual_scenes', element : 'visual_scene',   loader : "COLLADAVisualScene"   }
        ];

        private static ANIMATION_TEMPLATE: IColladaLibraryTemplate[] = [
            {lib : 'library_animations',    element : 'animation',      loader : "COLLADAAnimation"     }
        ];

        //=======================================================================================
        
        private _pModel: IModel = null;
        private _pOptions: IColladaLoadOptions = null;

        private _pLinks: IColladaLinkMap = {};
        private _pLib: IColladaLibraryMap = {};
        private _pCache: IColladaCache = { meshMap: {}, sharedBuffer: null };

        private _pAsset: IColladaAsset = null;
        private _pVisualScene: IColladaVisualScene = null;

        private _sFilename: string = null;

        private _pXMLRoot: Element = null;


    
        constructor () {
            super();

        }

        // helper functions
    
        private COLLADATranslateMatrix(pXML: Element): IMat4 {
            var pData: float[] = new Array(3);

            string2FloatArray(stringData(pXML), pData);

            return (vec3(pData)).toTranslationMatrix();
        }

        private COLLADARotateMatrix(pXML: Element): IMat4 {
            var pData: float[] = new Array(4);

            string2FloatArray(stringData(pXML), pData);
            
            return (new Mat4(1)).rotateLeft(pData[3] * Math.PI / 180.0, vec3(pData[0], pData[1], pData[2]));
        }

        private COLLADAScaleMatrix(pXML: Element): IMat4 {
            var pData: float[] = new Array(3);

            string2FloatArray(stringData(pXML), pData);

            return new Mat4(pData[0], pData[1], pData[2], 1.0);
        }
        
        private COLLADAData(pXML: Element): any {
            var sName: string = pXML.nodeName;
            var sData: string = stringData(pXML);

            switch (sName) {
                case "bool":
                    return string2Any(sData, 1, "bool");

                case "int":
                    return string2Any(sData, 1, "int");

                case "float":
                    return string2Any(sData, 1, "float");

                case "float2":
                    return string2Any(sData, 2, "float");

                case "float3":
                    return string2Any(sData, 3, "float");

                case "float4":
                case "color":
                    return string2Any(sData, 4, "float");

                case "rotate":
                    return this.COLLADARotateMatrix(pXML);

                case "translate":
                    return this.COLLADATranslateMatrix(pXML);

                case "scale":
                    return this.COLLADAScaleMatrix(pXML);

                case "bind_shape_matrix":
                case "matrix":
                    return (new Mat4(string2Any(sData, 16, "float"), true)).transpose();

                case "float_array":
                    return string2Any(sData, parseInt(attr(pXML, "count")), "float", true);

                case "int_array":
                    return string2Any(sData, parseInt(attr(pXML, "count")), "int", true);

                case "bool_array":
                    return string2Any(sData, parseInt(attr(pXML, "count")), "bool", true);

                case "Name_array":
                case "name_array":
                case "IDREF_array":
                    return string2Any(sData, parseInt(attr(pXML, "count")), "string", true);

                case "sampler2D":
                    return this.COLLADASampler2D(pXML);

                case "surface":
                    return this.COLLADASurface(pXML);

                default:
                    debug_error("unsupported COLLADA data type <" + sName + " />");
            }

            return null;
        }
        
        private COLLADAGetSourceData(pSource: IColladaSource, pFormat: IColladaUnknownFormat[]): IColladaArray {
            
            ASSERT(isDefAndNotNull(pSource), "<source /> with expected format ", pFormat, " not founded");
            
            var nStride: uint = calcFormatStride(pFormat);
            var pTech: IColladaTechniqueCommon = pSource.techniqueCommon;

            ASSERT(isDefAndNotNull(pTech), "<source /> with id <" + pSource.id + "> has no <technique_common />");

            var pAccess: IColladaAccessor = pTech.accessor;
            var isFormatSupported: bool;

#ifdef DEBUG
            if (!(pAccess.stride <= nStride)) {
                LOG(pAccess.stride, "/", nStride);
            }
#endif

            ASSERT(pAccess.stride <= nStride,
                         "<source /> width id" + pSource.id + " has unsupported stride: " + pAccess.stride);

            var fnUnsupportedFormatError = function (): void {
                LOG("expected format: " , pFormat);
                LOG("given format: "    , pAccess.params);
                ERROR("accessor of <" + pSource.id + "> has unsupported format");
            }

            for (var i: int = 0; i < pAccess.params.length; ++ i) {
                
                isFormatSupported = false;

                //finding name in format names..
                for (var f: int = 0; f < pFormat[i].name.length; ++ f) {
                    if ((pAccess.params[i].name || "").toLowerCase() == (pFormat[i].name[f] || "").toLowerCase()) {
                        isFormatSupported = true;
                    }
                }

                if (!isFormatSupported) {
                    fnUnsupportedFormatError();
                }
                
                
                isFormatSupported = false;

                for (var f: int = 0; f < pFormat[i].type.length; ++f) {
                    if (pAccess.params[i].type.toLowerCase() == pFormat[i].type[f].toLowerCase()) {
                        isFormatSupported = true;
                    }
                }

                if (!isFormatSupported) {
                    fnUnsupportedFormatError();
                }
                
            }

            return pAccess.data;
        }


        // common
        // -----------------------------------------------------------
        
        private COLLADATransform(pXML: Element, id?: string): IColladaTransform {
            var pTransform: IColladaTransform = {
                sid   : attr(pXML, "sid"),
                transform  : String(pXML.nodeName),
                value : null
            };

            if (isString(id) && isDefAndNotNull(pTransform.sid)) {
                this.link(id + "/" + pTransform.sid, pTransform);
            }
            else {
                this.link(id + "/" + pTransform.name, pTransform);
            }

            var v4f: IVec4, 
                m4f: IMat4;
            var pData: float[];

            switch (pTransform.name) {
                case "rotate":
                    
                    pData = new Array(4);
                    string2FloatArray(stringData(pXML), pData);
                    v4f = new Vec4(pData);
                    v4f.w *= Math.PI / 180.0; /* to radians. */
                    pTransform.value = v4f;

                    break;

                case "translate":
                case "scale":
                    
                    pData = new Array(3);
                    string2FloatArray(stringData(pXML), pData);
                    pTransform.value = new Vec3(pData);
                    break;

                case "matrix":

                    m4f = new Mat4;
                    string2FloatArray(stringData(pXML), <float[]><any>m4f.data);
                    m4f.transpose();
                    pTransform.value = m4f;
                    
                    break;

                default:
                    ERROR("unsupported transform detected: " + pTransform.name);
            }


            return pTransform;
        }
        
        private COLLADANewParam(pXML: Element): IColladaNewParam {
            var pParam: IColladaNewParam = {
                sid         : attr(pXML, "sid"),
                annotate    : null,
                semantics   : null,
                modifier    : null,
                value       : null,
                type        : null
            };

            eachChild(pXML, function (pXMLData: Element, sName?: string) {
                switch (sName) {
                    case "semantic":
                        pParam.semantics = stringData(pXMLData);
                        break;

                    case "modifier":
                        pParam.modifier = stringData(pXMLData);
                    
                    case "annotate":
                        
                        pParam.annotate = {
                            name  : attr(pXMLData, "name"),
                            value : stringData(pXMLData)
                        };

                    case "float":
                    case "float2":
                    case "float3":
                    case "float4":
                    case "surface":
                    case "sampler2D":
                        pParam.type = sName;
                        pParam.value = this.COLLADAData(pXMLData);
                        break;
                    
                    default:
                        pParam.value = this.COLLADAData(pXMLData);
                }
            });

            this.link(pParam.sid, pParam);

            return pParam;
        }
        
        private COLLADAAsset(pXML: Element): IColladaAsset {
            var pAsset: IColladaAsset = {
                unit : {
                    meter : 1.0,
                    name  : "meter"
                },

                upAxis   : "Y_UP",
                title    : null,
                created  : null,
                modified : null,

                contributor : {
                    author          : null,
                    authoringTool   : null,
                    comments        : null,
                    copyright       : null,
                    sourceData      : null
                }
            };

            eachChild(pXML, function (pXMLNode: Element, sName?: string) {
                var sValue: string = stringData(pXMLNode);

                switch (sName) {
                    case "up_axis":
                        pAsset.upAxis = sValue;
                        break;

                    case "created":
                        pAsset.created = sValue;
                        break;

                    case "modified":
                        pAsset.modified = sValue;
                        break;

                    case "title":
                        pAsset.title = sValue;
                        break;

                    case "contributor":
                        //TODO contributor
                        break;

                    case "unit":
                        pAsset.unit.meter = parseFloat(attr(pXMLNode, "meter"));
                        pAsset.unit.name = attr(pXMLNode, "name");
                        break;
                }
            });

            return pAsset;
        }

        private COLLADALibrary(pXML: Element, pTemplate: IColladaLibraryTemplate): IColladaLibrary {
            if (isNull(pXML)) {
                return null;
            }

            var pLib: IColladaLibrary = <IColladaLibrary>{};
            var pData: IColladaEntry;
            var sTag: string = pTemplate.element;

            pLib[sTag] = {};

            eachChild(pXML, function (pXMLData: Element, sName?: string): void {
                if (sTag !== sName) {
                    return;
                }

                pData = (<IColladaEntryLoader>((<any>this)[pTemplate.loader]))(pXMLData);

                if (isNull(pData)) {
                    return;
                }

                pLib[sTag][attr(pXMLData, 'id')] = pData;
            });

            return pLib;
        }


        // geometry

        private COLLADAAccessor(pXML: Element): IColladaAccessor {
            var pAccessor: IColladaAccessor = {
                data   : <IColladaArray>this.source(attr(pXML, "source")),
                count  : parseInt(attr(pXML, "count")),
                stride : parseInt(attr(pXML, "stride") || 1),
                params : []
            };


            eachChild(pXML, function (pXMLData: Element, sName?: string) {
                pAccessor.params.push({
                                          name : attr(pXMLData, "name"),
                                          type : attr(pXMLData, "type")
                                      });
            });

            return pAccessor;
        }
        
        private COLLADAInput(pXML: Element, iOffset?: int): IColladaInput {
            var pInput: IColladaInput = {
                semantics : attr(pXML, "semantic"),
                source    : <IColladaSource>this.source(attr(pXML, "source")),
                offset    : -1,
                set       : attr(pXML, "set")
            };
            //pInput.set = (pInput.set ? parseInt(pInput.set) : 0);

            if (!isNull(attr(pXML, "offset"))) {
                pInput.offset = parseInt(attr(pXML, "offset"));
            }

            if (isInt(iOffset) && pInput.offset === -1) {
                pInput.offset = iOffset;
            }

            debug_assert(isInt(pInput.offset) && pInput.offset >= 0, "invalid offset detected");

            return pInput;
        }
        
        private COLLADATechniqueCommon(pXML: Element): IColladaTechniqueCommon {
            var pTechniqueCommon: IColladaTechniqueCommon = {
                accessor : null
            };

            eachChild(pXML, function (pXMLData: Element, sName?: string) {
                switch (sName) {
                    case "accessor":
                        pTechniqueCommon.accessor = this.COLLADAAccessor(pXMLData);
                        break;
                }
            });

            return pTechniqueCommon;
        }
        
        private COLLADASource(pXML: Element): IColladaSource {
            var pSource: IColladaSource = {
                id               : attr(pXML, "id"),
                name             : attr(pXML, "name"),
                array           : {},
                techniqueCommon : null
            };

            this.link(pSource);

            eachChild(pXML, function (pXMLData: Element, sName?: string) {
                var pColladaArray: IColladaArray;
                var id: string;

                switch (sName.toLowerCase()) {
                    case "int_array":
                    case "bool_array":
                    case "float_array":
                    case "idref_array":
                    case "name_array":
                        pColladaArray = <IColladaArray>this.COLLADAData(pXMLData);

                        id = attr(pXMLData, "id");
                        pSource.array[id] = pColladaArray;

                        this.link(id, pColladaArray);

                        break;
                    case "technique_common":
                        pSource.techniqueCommon = this.COLLADATechniqueCommon(pXMLData);
                        break;
                }
            });

            return pSource;
        }
        
        private COLLADAVertices(pXML: Element): IColladaVertices {
            var pVertices: IColladaVertices = {
                id      : attr(pXML, "id"), 
                inputs  : {}
            };

            eachByTag(pXML, "input", function (pXMLData) {
                var sSemantic: string = attr(pXMLData, "semantic");
                pVertices.inputs[sSemantic] = this.COLLADAInput(pXMLData);
            });


            debug_assert(isDefAndNotNull(pVertices.inputs["POSITION"]),
                         "semantics POSITION must be in the <vertices /> tag");

            return pVertices;
        }
        
        private COLLADAJoints(pXML: Element): IColladaJoints {
            var pJoints: IColladaJoints = {
                inputs : {}
            };
            
            var pMatrixArray: IMat4[];
            var iCount: int;
            var pInvMatrixArray: Float32Array;

            eachByTag(pXML, "input", function (pXMLData: Element) {
                switch (attr(pXMLData, "semantic")) {
                    case "JOINT":
                        pJoints.inputs["JOINT"] = this.COLLADAInput(pXMLData);
                        break;

                    case "INV_BIND_MATRIX":
                        pJoints.inputs["INV_BIND_MATRIX"] = this.COLLADAInput(pXMLData);
                        break;

                    default:
                        ERROR("semantics are different from JOINT/INV_BIND_MATRIX is not supported in the <joints /> tag");
                }
            });


            for (var sInput in pJoints.inputs) {
                this.prepareInput(pJoints.inputs[sInput]);

                if (sInput === "INV_BIND_MATRIX") {

                    pInvMatrixArray = new Float32Array(pJoints.inputs[sInput].array);
                    iCount = pInvMatrixArray.length / 16;
                    pMatrixArray = new Array(iCount);

                    for (var j: uint = 0, n: uint = 0; j < pInvMatrixArray.length; j += 16) {
                        pMatrixArray[n++] = 
                            (new Mat4(
                                new Float32Array(pInvMatrixArray.buffer, j * Float32Array.BYTES_PER_ELEMENT, 16), true)
                            ).transpose();
                    }

                    pJoints.inputs[sInput].array = pMatrixArray;
                }
            }

            return pJoints;
        }
        
        private COLLADAPolygons(pXML: Element, sType: string): IColladaPolygons {
            var pPolygons: IColladaPolygons = {
                inputs    : [],                     /*потоки данных*/
                p         : null,                   /*индексы*/
                material  : attr(pXML, "material"), /*идентификатор материала*/
                name      : null                    /*имя (встречается редко, не используется)*/
            };

            var iOffset: int = 0, n: uint = 0;
            var iCount: int = parseInt(attr(pXML, "count"));
            var iStride: int;

            eachByTag(pXML, "input", function (pXMLData) {
                pPolygons.inputs.push(this.COLLADAInput(pXMLData, iOffset));
                iOffset ++;
            });

            sortArrayByProperty(pPolygons.inputs, "iOffset");

            iStride = (<IColladaInput>pPolygons.inputs.last).offset + 1;

            switch (sType) {
                case "polylist":
                    pPolygons.p = polylistToTriangles(pXML, iStride);
                    break;

                case "polygons":
                    pPolygons.p = polygonToTriangles(pXML, iStride);

                    eachByTag(pXML, "ph", function (pXMLData) {
                        debug_error("unsupported polygon[polygon] subtype founded: <ph>");
                    });

                    break;

                case "triangles":
                    pPolygons.p = new Array(3 * iCount * iStride);

                    eachByTag(pXML, "p", function (pXMLData) {
                        n += string2IntArray(stringData(pXMLData), pPolygons.p, n);
                    });

                    break;
                case "trifans":
                    pPolygons.p = trifanToTriangles(pXML, iStride);
                    break;

                case "tristrips":
                    pPolygons.p = tristripToTriangles(pXML, iStride);
                    break;

                default:
                    ERROR("unsupported polygon[" + sType + "] type founded");
            }

            if (!isDef(pPolygons.type)) {
                pPolygons.type = EPrimitiveTypes.TRIANGLELIST;
            }

            return pPolygons;
        }
        
        private COLLADAVertexWeights(pXML: Element): IColladaVertexWeights {
            var pVertexWeights: IColladaVertexWeights = {
                count       : parseInt(attr(pXML, "count")),
                inputs      : [],
                weightInput : null,
                vcount      : null,
                v           : null
            };

            var iOffset: int = 0;
            var pInput: IColladaInput;

            eachByTag(pXML, "input", function (pXMLData: Element) {
                pInput = this.COLLADAInput(pXMLData, iOffset);

                if (pInput.semantics === "WEIGHT") {
                    pVertexWeights.weightInput = pInput;
                }

                pVertexWeights.inputs.push(pInput);
                iOffset ++;
            });

            var pVcountData: uint[], 
                pVData: int[];

            pVcountData = new Array(pVertexWeights.count);
            string2IntArray(stringData(firstChild(pXML, "vcount")), pVcountData);
            pVertexWeights.vcount = pVcountData;


            var n: uint = 0;
            
            for (var i: int = 0; i < pVcountData.length; ++i) {
                n += pVcountData[i];
            }

            n *= pVertexWeights.inputs.length;

            ERROR(pVertexWeights.inputs.length === 2,
                         "more than 2 inputs in <vertex_weights/> not supported currently");

            pVData = new Array(n);
            string2IntArray(stringData(firstChild(pXML, "v")), pVData);
            pVertexWeights.v = pVData;

            return pVertexWeights;
        }
        
        private COLLADAMesh(pXML: Element): IColladaMesh {
            var pMesh: IColladaMesh = {
                sources   : [],
                polygons  : []
            };

            var id: string;
            var pPolygons: IColladaPolygons, 
                pVertices: IColladaVertices, 
                pPos: IColladaInput;

            eachChild(pXML, function (pXMLData: Element, sName?: string) {
                switch (sName) {
                    case "source":
                        pMesh.sources.push(this.COLLADASource(pXMLData));
                        break;
                    
                    case "vertices":
                        pVertices = this.COLLADAVertices(pXMLData);
                        break;

                    case "lines":
                    case "linestrips":
                    case "tristrips":
                    case "trifans":
                    case "triangles":
                    case "polygons":
                    case "polylist":
                        pPolygons = this.COLLADAPolygons(pXMLData, sName);
                        
                        for (var i: int = 0; i < pPolygons.inputs.length; ++i) {
                            pPos = null;

                            if (pPolygons.inputs[i].semantics == "VERTEX") {
                                if (pPolygons.inputs[i].source.id == pVertices.id) {
                                    pPos = pVertices.inputs["POSITION"];

                                    pPolygons.inputs[i].source = pPos.source;
                                    pPolygons.inputs[i].semantics = pPos.semantics;
                                }
                                else {
                                    ERROR("<input /> with semantic VERTEX must refer to <vertices /> tag in same mesh.");
                                }
                            }

                            this.prepareInput(pPolygons.inputs[i]);
                        }

                        pMesh.polygons.push(pPolygons);
                        break;
                }
            });

            return pMesh;
        }
        
        private COLLADAGeometrie(pXML: Element): IColladaGeometrie {
            var pGeometrie: IColladaGeometrie = {
                id         : attr(pXML, "id"),
                name       : attr(pXML, "name"),
                mesh       : null,
                convexMesh : null,
                spline     : null,
            };

            var pXMLData: Element = firstChild(pXML);
            var sName: string = pXMLData.nodeName;

            if (sName == "mesh") {
                pGeometrie.mesh = this.COLLADAMesh(pXMLData);
            }
            
            this.link(pGeometrie);
            
            return pGeometrie;
        }
        
        private COLLADASkin(pXML: Element): IColladaSkin {
            var pSkin: IColladaSkin = {
                shapeMatrix   : <IMat4>this.COLLADAData(firstChild(pXML, "bind_shape_matrix")),
                sources       : [],
                geometry      : <IColladaGeometrie>this.source(attr(pXML, "source")),
                joints        : null,
                vertexWeights : null

                //TODO:  add other parameters to skin section
            }

            var pVertexWeights: IColladaVertexWeights, 
                pInput: IColladaInput;

            eachChild(pXML, function (pXMLData: Element, sName?: string) {
                switch (sName) {
                    case "source":
                        pSkin.sources.push(this.COLLADASource(pXMLData));
                        break;

                    case "joints":
                        pSkin.joints = this.COLLADAJoints(pXMLData);
                        break;

                    case "vertex_weights":
                        pVertexWeights = this.COLLADAVertexWeights(pXMLData);

                        for (var i = 0; i < pVertexWeights.inputs.length; ++ i) {
                            pInput = this.prepareInput(pVertexWeights.inputs[i]);
                        }

                        pSkin.vertexWeights = pVertexWeights;
                        break;
                }
            });

            return pSkin;
        }
        
        private COLLADAController(pXML: Element): IColladaController {
            var pController: IColladaController = {
                name  : attr(pXML, "name"),
                id    : attr(pXML, "id"),
                skin  : null,
                morph : null
            };

            var pXMLData: Element = firstChild(pXML, "skin");

            if (isNull(pXMLData)) {
                pController.skin = this.COLLADASkin(pXMLData);
            }
            else {
                return null;
            }

            this.link(pController);

            return pController;
        }

        // images
        
        private COLLADAImage(pXML: Element): IColladaImage {
            var pImage: IColladaImage = {
                id        : attr(pXML, "id"),
                name      : attr(pXML, "name"),
                
                format    : attr(pXML, "format"),
                height    : parseInt(attr(pXML, "height") || -1), /*-1 == auto detection*/
                width     : parseInt(attr(pXML, "width") || -1),
                
                depth     : 1, /*only 2D images supported*/
                data      : null,
                path      : null
            };

            var sFilename: string = this.getFilename();
            var sPath: string = null;
            var pXMLInitData: Element = firstChild(pXML, "init_from"), 
                pXMLData: Element;
            
            if (isDefAndNotNull(pXMLInitData)) {
                sPath = stringData(pXMLInitData);

                //modify path to the textures relative to a given file
                if (!isNull(sFilename)) {
                    if (!util.pathinfo(sPath).isAbsolute()) {
                        sPath = util.pathinfo(sFilename).dirname + "/" + sPath;
                    }
                }

                pImage.path = sPath;
            }
            else if (isDefAndNotNull(pXMLData = firstChild(pXML, "data"))) {
                ERROR("image loading from <data /> tag unsupported yet.");
            }
            else {
                ERROR("image with id: " + pImage.id + " has no data.");
            }

            this.link(pImage);

            return pImage;
        }

        // effects
        
        private COLLADASurface(pXML: Element): IColladaSurface {
            var pSurface: IColladaSurface = {
                initFrom : stringData(firstChild(pXML, "init_from"))
                //, format: stringData(firstChild(pXML, "format"))
            }

            return pSurface;
        }
        
        private COLLADATexture(pXML: Element): IColladaTexture {
            var pTexture: IColladaTexture = {
                texcoord : attr(pXML, "texcoord"),
                sampler  : <IColladaNewParam>this.source(attr(pXML, "texture")),
                surface  : null,
                image    : null
            };

            if (!isNull(pTexture.sampler) && isDefAndNotNull(pTexture.sampler.value)) {
                pTexture.surface = <IColladaNewParam>this.source((<IColladaSampler2D>pTexture.sampler.value).source);
            }

            if (!isNull(pTexture.surface)) {
                pTexture.image = <IColladaImage>this.source((<IColladaSurface>pTexture.surface.value).initFrom);
            }

            return pTexture;
        }
        
        private COLLADASampler2D(pXML: Element): IColladaSampler2D {
            var pSampler: IColladaSampler2D = {
                source    : stringData(firstChild(pXML, "source")),
                wrapS     : stringData(firstChild(pXML, "wrap_s")),
                wrapT     : stringData(firstChild(pXML, "wrap_t")),
                minFilter : stringData(firstChild(pXML, "minfilter")),
                mipFilter : stringData(firstChild(pXML, "mipfilter")),
                magFilter : stringData(firstChild(pXML, "magfilter"))
            };

            return pSampler;
        }
        
        private COLLADAPhong(pXML: Element): IColladaPhong {
            var pMat: IColladaPhong = {
                diffuse             : new Color(0.),
                specular            : new Color(0.),
                ambient             : new Color(0.),
                emissive            : new Color(0.),
                shininess           : 0.0,
                
                reflective          : new Color(0.),
                reflectivity        : 0.0,
                transparent         : new Color(0.),
                transparency        : 0.0,

                indexOfRefraction   : 0.0,

                textures: {
                    diffuse     : null,
                    specular    : null,
                    ambient     : null,
                    emissive    : null
                }
            };

            var pXMLData: Element;
            var pList: string[] = [
                "emission",
                "ambient",
                "diffuse",
                "shininess",
                "reflective",
                "reflectivity",
                "transparent",
                "transparency",
                "specular"
            ];


            for (var i: int = 0; i < pList.length; i++) {
                pXMLData = firstChild(pXML, pList[i]);
                if (pXMLData) {
                    eachChild(pXMLData, function (pXMLData: Element, sName?: string) {
                        
                        switch (sName) {
                            case "float":
                                pMat[pList[i]] = <float>this.COLLADAData(pXMLData);
                                break;

                            case "color":
                                pMat[pList[i]].set(<IColorValue>this.COLLADAData(pXMLData));
                                break;

                            case "texture":
                                pMat.textures[pList[i]] = this.COLLADATexture(pXMLData);
                        }
                    });

                }
            }

            // correct shininess
            pMat.shininess *= 10.0;

            return pMat;
        }
        
        private COLLADAEffectTechnique(pXML: Element): IColladaEffectTechnique {
            var pTech: IColladaEffectTechnique = {
                sid   : attr(pXML, "sid"),
                type  : null,
                value : null
            };

            var pValue: Element = firstChild(pXML);

            pTech.type = pValue.nodeName;
            
            switch (pTech.type) {
                //FIXME: at now, all materials draws similar..
                case "blinn":
                case "lambert":
                    WARNING("<blinn /> or <lambert /> material interprated as phong");
                case "phong":
                    pTech.value = this.COLLADAPhong(pValue);
                    break;

                default:
                    ERROR("unsupported technique <" + pTech.type + " /> founded");
            }

            this.link(pTech.sid, pTech);

            return pTech;
        }
        
        private COLLADAProfileCommon(pXML: Element): IColladaProfileCommon {
            var pProfile: IColladaProfileCommon = {
                technique : null,
                newParam  : {}
            };

            eachByTag(pXML, "newparam", function (pXMLData: Element) {
                pProfile.newParam[attr(pXMLData, "sid")] = this.COLLADANewParam(pXMLData);
            })

            pProfile.technique = this.COLLADAEffectTechnique(firstChild(pXML, "technique"));

            return pProfile;
        }
        
        private COLLADAEffect(pXML: Element): IColladaEffect {
            var pEffect: IColladaEffect = {
                id             : attr(pXML, "id"), 
                profileCommon  : null
            };

            eachChild(pXML, function (pXMLData: Element, sName?: string) {
                switch (sName) {
                    case "profile_COMMON":
                        pEffect.profileCommon = this.COLLADAProfileCommon(pXMLData);
                        pEffect.profileCommon.technique.value.name = pEffect.id;
                        break;

                    case "extra":
                        break;

                    default:
                        ERROR("<" + sName + " /> unsupported in effect section");
                }
            });

            this.link(pEffect);
            
            return pEffect;
        }


        //materials
        
        private COLLADAMaterial(pXML: Element): IColladaMaterial {
            var pMaterial: IColladaMaterial = {
                id             : attr(pXML, "id"),
                name           : attr(pXML, "name"),
                instanceEffect : this.COLLADAInstanceEffect(firstChild(pXML, "instance_effect"))
            };

            this.link(pMaterial);

            return pMaterial;
        }

        // scene

        private COLLADANode(pXML: Element, iDepth: uint = 0): IColladaNode {
            var pNode: IColladaNode = {
                id              : attr(pXML, "id"),
                sid             : attr(pXML, "sid"),
                name            : attr(pXML, "name") || "unknown",
                type            : attr(pXML, "type"),
                layer           : attr(pXML, "layer"),
                transform       : new Mat4(1),
                geometry        : [],
                controller      : [],
                childNodes      : [],
                depth           : iDepth,
                transforms      : [],
                constructedNode : null /*<! узел, в котором будет хранится ссылка на реальный игровой нод, построенный по нему*/
            };

            var m4fMatrix: IMat4;
            var sType: string;
            var id: string, sid: string;

            this.link(pNode);

            eachChild(pXML, function (pXMLData: Element, sName?: string) {
                switch (sName) {
                    case "rotate":
                    case "matrix":
                    case "translate":
                    case "scale":
                        pNode.transforms.push(this.COLLADATransform(pXMLData, pNode.id));
                        pNode.transform.multiply(<IMat4>this.COLLADAData(pXMLData));
                        break;

                    case "instance_geometry":
                        pNode.geometry.push(this.COLLADAInstanceGeometry(pXMLData));
                        break;

                    case "instance_controller":
                        pNode.controller.push(this.COLLADAInstanceController(pXMLData));
                        break;

                    case "node":
                        pNode.childNodes.push(this.COLLADANode(pXMLData, iDepth + 1));
                        break;
                }
            });

            //TODO: do not load empty nodes..
            // if (!pNode.pGeometry.length && 
            //     !pNode.pController.length && 
            //     !pNode.pChildNodes.length) {
            //     return null;
            // }

            return pNode;
        }
        
        private COLLADAVisualScene(pXML: Element): IColladaVisualScene {
            var pNode: IColladaNode;
            var pScene: IColladaVisualScene = {
                id     : attr(pXML, "id"),
                name   : attr(pXML, "name"),
                nodes : []
            };

            this.link(pScene);

            eachChild(pXML, function (pXMLData: Element, sName?: string) {
                switch (sName) {
                    case "node":
                        pNode = this.COLLADANode(pXMLData);
                        
                        if (isDefAndNotNull(pNode)) {
                            pScene.nodes.push(pNode);
                        }
                        
                        break;
                }
            });

            return pScene;
        }
        
        private COLLADABindMaterial(pXML: Element): IColladaBindMaterial {
            if (isNull(pXML)) {
                return null;
            }


            var pMaterials: IColladaBindMaterial = {};
            var pMat: IColladaInstanceMaterial = null;
            var pSourceMat: IColladaMaterial = null;
            var pTech: Element = firstChild(pXML, "technique_common");

            eachByTag(pTech, "instance_material", function (pInstMat: Element) {

                pSourceMat = <IColladaMaterial>this.source(attr(pInstMat, "target"));
                pMat = {
                    // url         : pSourceMat.instanceEffect.url,
                    target      : attr(pInstMat, "target"), 
                    symbol      : attr(pInstMat, "symbol"),
                    material    : pSourceMat,
                    vertexInput : <IColladaBindVertexInputMap>{}
                };

                eachByTag(pInstMat, "bind_vertex_input", function (pXMLVertexInput: Element) {
                    var sInputSemantic: string = attr(pXMLVertexInput, "input_semantic");

                    if (sInputSemantic !== "TEXCOORD") {
                        ERROR("unsupported vertex input semantics founded: " + sSemantic);
                    }


                    var sSemantic: string = attr(pXMLVertexInput, "semantic");
                    var iInputSet: int = parseInt(attr(pXMLVertexInput, "input_set"));

                    pMat.vertexInput[sSemantic] = {
                        semantics       : sSemantic,
                        inputSet        : iInputSet,
                        inputSemantic   : sInputSemantic
                    };
                });

                pMaterials[pMat.symbol] = pMat;
            });

            return pMaterials;
        }

        private COLLADAInstanceEffect(pXML: Element): IColladaInstanceEffect {
            var pInstance: IColladaInstanceEffect = {
                parameters    : {},
                techniqueHint : <StringMap>{},
                effect        : null
            };

            /*
                Exmaple for <instance_effect /> :
            
                <instance_effect url="CarPaint">
                    <technique_hint profile="CG" platform="PS3" ref="precalc_texture"/>
                    <setparam ref="diffuse_color">
                        <float3> 0.3 0.25 0.85 </float3>
                    </setparam>
                </instance_effect>
            */

            pInstance.effect = <IColladaEffect>this.source(attr(pXML, "url"));

            eachByTag(pXML, "technique_hint", function (pXMLData) {
                pInstance.techniqueHint[attr(pXMLData, "platform")] = attr(pXMLData, "ref");
                WARNING("<technique_hint /> used, but will be ignored!");
            });

            eachByTag(pXML, "setparam", function (pXMLData) {
                //can be any type
                pInstance.parameters[attr(pXMLData, "ref")] = <any>this.COLLADAData(pXMLData);
                WARNING("<setparam /> used, but will be ignored!");
            });

            return pInstance;
        }
        
        private COLLADAInstanceController(pXML: Element): IColladaInstanceController {
            var pInst: IColladaInstanceController = {
                controller : <IColladaController>this.source(attr(pXML, "url")),
                material   : <IColladaBindMaterial>this.COLLADABindMaterial(firstChild(pXML, "bind_material")),
                skeletons  : []
            };

            eachByTag(pXML, "skeleton", function (pXMLData: Element) {
                //cut # symbol from skeleton name
                pInst.skeletons.push(stringData(pXMLData).substr(1));
            });

            return pInst;
        }
        
        private COLLADAInstanceGeometry(pXML: Element): IColladaInstanceGeometry {
            var pInst: IColladaInstanceGeometry = {
                geometry : <IColladaGeometrie>this.source(attr(pXML, "url")),
                material : <IColladaBindMaterial>this.COLLADABindMaterial(firstChild(pXML, "bind_material"))
            };

            return pInst;
        }

        // directly load <visual_scene> from <instance_visual_scene> from <scene>.
        private COLLADAScene(pXML: Element): IColladaVisualScene {
            var pXMLData: Element = firstChild(pXML, "instance_visual_scene");
            var pScene: IColladaVisualScene = <IColladaVisualScene>this.source(attr(pXMLData, "url"));

            if (isNull(pXMLData) || (pScene)) {
                debug_warning("collada model: <" + this.getBasename() + "> has no visual scenes.");
            }

            return pScene;
        }

        // animation
         
        private COLLADAAnimationSampler(pXML: Element): IColladaAnimationSampler {
            var pSampler: IColladaAnimationSampler = {
                inputs : {},
                id    : attr(pXML, "id")
            };


            var pInput: IColladaInput;
            var sSemantic: string;

            this.link(pSampler);

            eachByTag(pXML, "input", function (pXMLData) {
                sSemantic = attr(pXMLData, "semantic");

                switch (sSemantic) {
                    case "INPUT":
                    case "OUTPUT":
                    case "INTERPOLATION":
                    case "IN_TANGENT":
                    case "OUT_TANGENT":
                        pInput = this.prepareInput(this.COLLADAInput(pXMLData));
                        pSampler.inputs[sSemantic] = pInput;
                        break;

                    default:
                        debug_error("semantics are different from OUTPUT/INTERPOLATION/IN_TANGENT/OUT_TANGENT is not supported in the <sampler /> tag");
                }
            });

            return pSampler;
        }

        private COLLADAAnimationChannel(pXML: Element): IColladaAnimationChannel {
            var pChannel: IColladaAnimationChannel = {
                sampler : <IColladaAnimationSampler>this.source(attr(pXML, "source")),
                target  : this.target(attr(pXML, "target"))
            };


            if (isNull(pChannel.target) || isNull(pChannel.target.object)) {
                WARNING("cound not setup animation channel for <" + attr(pXML, "target") + ">");
                return null;
            }

            return pChannel;
        }


        private COLLADAAnimation(pXML: Element): IColladaAnimation {
            var pAnimation: IColladaAnimation = {
                id          : attr(pXML, "id"),
                name        : attr(pXML, "name"),
                sources     : [],
                samplers    : [],
                channels    : [],
                animations  : []
            };

            var pChannel: IColladaAnimationChannel;
            var pSubAnimation: IColladaAnimation;

            this.link(pAnimation);

            eachChild(pXML, function (pXMLData: Element, sName?: string) {
                switch (sName) {
                    case "source":
                        pAnimation.sources.push(this.COLLADASource(pXMLData));
                        break;

                    case "sampler":
                        pAnimation.samplers.push(this.COLLADAAnimationSampler(pXMLData));
                        break;
                    
                    case "channel":
                        pChannel = this.COLLADAAnimationChannel(pXMLData);

                        if (isDefAndNotNull(pChannel)) {
                            //this guard for skipping channels with unknown targets
                            pAnimation.channels.push(pChannel);
                        }

                        break;
                    case "animation":
                        pSubAnimation = this.COLLADAAnimation(pXMLData);

                        if (isDefAndNotNull(pSubAnimation)) {
                            pAnimation.animations.push(pSubAnimation);
                        }
                }
            });

            if (pAnimation.channels.length == 0 && pAnimation.animations.length == 0) {
                WARNING("animation with id \"" + pAnimation.id + "\" skipped, because channels/sub animation are empty");
                return null;
            }

            return pAnimation;
        }

        // collada mapping

        private source(sUrl: string): IColladaEntry {
             if (sUrl.charAt(0) !== "#") {
                sUrl = "#" + sUrl;
            }

            var pElement: IColladaEntry = this._pLinks[sUrl];

            if (!isDefAndNotNull(pElement)) {
                WARNING("cannot find element with id: " + sUrl);
            }

            return pElement || null;
        }


        private link(el: any, pTarget?: IColladaEntry): void {
            var sId: string;

            if (!isString(arguments[0])) {
                pTarget = <IColladaEntry>arguments[0];
                sId = pTarget.id;
            }
            else {
                sId = <string>arguments[0];
            }
            
            this._pLinks["#" + sId] = pTarget;
        }
        
        //astroBoy_newSkeleton_root/rotateY.ANGLE
        //pObject.source: IColladaEntry = astroBoy_newSkeleton_root
        //pSource: IColladaTransform = source(astroBoy_newSkeleton_root/rotateY)
        //pSource: IColladaTransform = {
        //    sid: string;  //rotateY
        //    value: IVec4; //<0 1 0 -4.56752>
        //    name: string; //rotate
        //  }
        //
        //sValue: string = "ANGLE"
        //pObject.object: IColladaTransform = pSource;
        //
        private target(sPath: string): IColladaTarget {
            var pObject: IColladaTarget = {value : null};
            var pSource: IColladaTransform;
            
            var pMatches: string[];
            var sValue: string;

            var iPos: int;
            var jPos: int = 0;

            iPos = sPath.lastIndexOf("/");

            if (iPos >= 0) {
                pObject.source = this.source(sPath.substr(0, iPos));
            }

            iPos = sPath.lastIndexOf(".");

            if (iPos < 0) {
                iPos = sPath.indexOf("(");
                jPos = -1;
            }

            if (iPos < 0) {
                pObject.object = this.source(sPath);
                return pObject;
            }

            pSource = <IColladaTransform>this.source(sPath.substr(0, iPos));
            sValue = sPath.substr(iPos + jPos + 1);
            pObject.object = pSource;

            if (!pSource) {
                return null;
            }

            switch (sValue) {
                case "X":
                    pObject.value = (<IVec4>pSource.value).x;
                    break;
                case "Y":
                    pObject.value = (<IVec4>pSource.value).y;
                    break;
                case "Z":
                    pObject.value = (<IVec4>pSource.value).z;
                    break;
                case "W":
                    pObject.value = (<IVec4>pSource.value).w;
                    break;
                case "ANGLE":
                    pObject.value = (<IVec4>pSource.value).w; //<rotate sid="rotateY">0 1 0 -4.56752</rotate>
                    break;
            }

            if (isDefAndNotNull(pObject.value)) {
                return pObject;
            }

            pMatches = sValue.match(/^\((\d+)\)$/);

            if (pMatches) {
                pObject.value = Number(pMatches[1]);
            }

            pMatches = sValue.match(/^\((\d+)\)\((\d+)\)$/)

            if (pMatches) {
                //trace(pMatches, '--->',  Number(pMatches[2]) * 4 + Number(pMatches[1]));
                //pObject.value = Number(pMatches[2]) * 4 + Number(pMatches[1]);
                pObject.value = Number(pMatches[1]) * 4 + Number(pMatches[2]);
            }

            debug_assert(isDefAndNotNull(pObject.value), "unsupported target value founded: " + sValue);

            return pObject;
        }

        // //animation 
    
        private buildAnimationTrack(pChannel: IColladaAnimationChannel): IAnimationTrack {
            var sNodeId: string = pChannel.target.source.id;
            var sJoint: string = this.source(sNodeId).sid || null;
            var pTrack: IAnimationTrack = null;
            var pSampler: IColladaAnimationSampler = pChannel.sampler;

            debug_assert(isDefAndNotNull(pSampler), "could not find sampler for animation channel");

            var pInput: IColladaInput = pSampler.inputs["INPUT"];
            var pOutput: IColladaInput = pSampler.inputs["OUTPUT"];
            var pInterpolation: IColladaInput = pSampler.inputs["INTERPOLATION"];

            var pTimeMarks: float[] = pInput.array;
            var pOutputValues: float[] = pOutput.array;
            var pFloatArray: Float32Array;

            var pTransform: IColladaEntry = pChannel.target.object
            var sTransform: string = pTransform.name;
            var v4f: IVec4;
            var pValue: any;
            var nMatrices: uint;

            // if (sJoint == null) {
            //     warning('node\'s <' + pChannel.pTarget.pSource.id + '> "sid" attribute is null');
            // }

            switch (sTransform) {
                case "translate":
                    // pTrack = new a.AnimationTranslation(sJoint);

                    // for (var i = 0, v3f = new Array(3), n; i < pTimeMarks.length; ++ i) {
                    //     n = i * 3;
                    //     v3f.X = pOutputValues[i * 3];
                    //     v3f.Y = pOutputValues[i * 3 + 1];
                    //     v3f.Z = pOutputValues[i * 3 + 2];
                    //     pTrack.keyFrame(pTimeMarks[i], [v3f.X, v3f.Y, v3f.Z]);
                    // };
                    CRITICAL("TODO: implement animation translation");
                    //TODO: implement animation translation
                    break;
                case "rotate":
                    // v4f = pTransform.pValue;
                    // pTrack = new a.AnimationRotation(sJoint, [v4f[1], v4f[2], v4f[3]]);

                    // debug_assert(pOutput.pAccessor.iStride === 1, 
                    //     "matrix modification supported only for one parameter modification");

                    // for (var i = 0; i < pTimeMarks.length; ++ i) {
                    //     pTrack.keyFrame(pTimeMarks[i], pOutputValues[i] / 180.0 * Math.PI);
                    // };
                    CRITICAL("TODO: implement animation rotation");
                    //TODO: implement animation rotation
                    break;
                case "matrix":
                    pValue = pChannel.target.value;
                    if (isNull(pValue)) {
                        pTrack = animation.createTrack(sJoint);
                        nMatrices = pOutputValues.length / 16;
                        pFloatArray = new Float32Array(pOutputValues);

                        debug_assert(nMatrices % 1 === 0.0,
                                     "incorrect output length of transformation data (" + pFloatArray.length + ")");

                        for (var i: int = 0; i < nMatrices; i++) {
                            pTrack.keyFrame(pTimeMarks[i],
                                            (new Mat4(pFloatArray.subarray(i * 16, i * 16 + 16), true)).transpose());
                        }
       

                        // i=0;
                        // var m = (new Mat4(pFloatArray.subarray(i * 16, i * 16 + 16), true));
                        // trace(sFilename,sNodeId,m.toString());
                    }
                    else {
                        // pTrack = new a.AnimationMatrixModification(sJoint, pValue);

                        // for (var i = 0; i < pTimeMarks.length; ++i) {
                        //     pTrack.keyFrame(pTimeMarks[i], pOutputValues[i]);
                        // }
                        CRITICAL("TODO: implement animation matrix modification");
                    }
                    break;
                default:
                    debug_error("unsupported animation typed founeed: " + sTransform);
            }

            if (!isNull(pTrack)) {
                pTrack.targetName = sNodeId;
            }

            return pTrack;
        }
        
        private buildAnimationTrackList(pAnimationData: IColladaAnimation): IAnimationTrack[] {
            var pSubAnimations: IColladaAnimation[] = pAnimationData.animations;
            var pSubTracks: IAnimationTrack[];
            var pTrackList: IAnimationTrack[] = [];
            var pTrack: IAnimationTrack;
            var pChannels: IColladaAnimationChannel[] = pAnimationData.channels;

            for (var i: int = 0; i < pChannels.length; ++i) {
                pTrack = this.buildAnimationTrack(pChannels[i]);
                pTrackList.push(pTrack);
            }


            if (isDefAndNotNull(pSubAnimations)) {
                for (var i: int = 0; i < pSubAnimations.length; ++i) {
                    pSubTracks = this.buildAnimationTrackList(pSubAnimations[i]);
                    pTrackList = pTrackList.concat(pSubTracks);
                }
            }

            return pTrackList;
        }
        
        private buildAnimation(pAnimationData: IColladaAnimation): IAnimation {

            var pTracks: IAnimationTrack[] = this.buildAnimationTrackList(pAnimationData);
            var sAnimation: string = /*pAnimationData.length ? pAnimationData[0].name :*/ null;
            var pAnimation: IAnimation = animation.createAnimation(sAnimation || this.getBasename());

            for (var i: int = 0; i < pTracks.length; i++) {
                pAnimation.push(pTracks[i]);
            }
            
            return pAnimation;
        }

        private buildAnimations(pAnimations: IColladaAnimation[], pAnimationsList: IAnimation[] = []): IAnimation[] {
            if (isNull(pAnimations)) {
                return null;
            }

            for (var i: int = 0; i < pAnimations.length; ++ i) {
                var pAnimation: IAnimation = this.buildAnimation(pAnimations[i]);

                pAnimationsList.push(pAnimation);
            }

            return pAnimationsList;
        }

         // common
        
        private buildAssetTransform(pNode: ISceneNode, pAsset: IColladaAsset = null): ISceneNode {
            pAsset = pAsset || this.getAsset();

            if (isDefAndNotNull(pAsset)) {
                var fUnit: float = pAsset.unit.meter;
                var sUPaxis: string = pAsset.upAxis;

                pNode.localScale = vec3(fUnit);

                if (sUPaxis.toUpperCase() == "Z_UP") {
                    //pNode.addRelRotation([1, 0, 0], -.5 * Math.PI);
                    pNode.addRelRotationByEulerAngles(0, -.5 * math.PI, 0);
                }
            }

            return pNode;   
        }


        // materials & meshes
        
        private buildMaterials(pMesh: IMesh, pGeometryInstance: IColladaInstanceGeometry): IMesh {
            var pMaterials: IColladaBindMaterial = pGeometryInstance.material;
            var pEffects: IColladaEffectLibrary = <IColladaEffectLibrary>this.getLibrary("library_effects");

            if (isNull(pEffects)) {
                return pMesh;
            }

            for (var sMaterial in pMaterials) {
                var pMaterialInst: IColladaInstanceMaterial = pMaterials[sMaterial];
                var pInputMap: IColladaBindVertexInputMap = pMaterialInst.vertexInput;
                // URL --> ID (#somebody ==> somebody)
                var sEffectId: string = pMaterialInst.url.substr(1);
                var pEffect: IColladaEffect = pEffects.effects[sEffectId];
                var pPhongMaterial: IColladaPhong = <IColladaPhong>pEffect.profileCommon.technique.value;
                var pMaterial: IMaterial = material.create(sEffectId)

                pMaterial.set(<IMaterialBase>pPhongMaterial);

                for (var j: int = 0; j < pMesh.length; ++j) {
                    var pSubMesh: IMeshSubset = pMesh[j];

                    //if (pSubMesh.surfaceMaterial.findResourceName() === sMaterial) {
                    if (pSubMesh.material.name === sMaterial) {
                        //setup materials
                        pSubMesh.material.set(pMaterial);
                        //FIXME: remove flex material setup(needs only demo with flexmats..)
                        // pSubMesh.applyFlexMaterial(sMaterial, pMaterial);
                        if (!pSubMesh.renderMethod.effect.isResourceLoaded()) {
                            pSubMesh.renderMethod.effect.create();
                        }

                        pSubMesh.renderMethod.effect.addComponent("akra.system.mesh_texture");
                        pSubMesh.renderMethod.effect.addComponent("akra.system.prepareForDeferredShading");

                        //setup textures
                        for (var sTextureType in pPhongMaterial.textures) {
                            var pColladaTexture: IColladaTexture = pPhongMaterial.textures[sTextureType];
                            var pInput: IColladaBindVertexInput = pInputMap[pColladaTexture.texcoord];

                            if (!isDefAndNotNull(pInput)) {
                                continue;
                            }

                            var sInputSemantics: string = pInputMap[pColladaTexture.texcoord].inputSemantic;
                            var pColladaImage: IColladaImage = pColladaTexture.image;

                            var pSurfaceMaterial: ISurfaceMaterial = pSubMesh.surfaceMaterial;
                            var pTexture: ITexture = <ITexture>this.getManager().texturePool.loadResource(pColladaImage.path);

                            var pMatches: string[] = sInputSemantics.match(/^(.*?\w)(\d+)$/i);
                            var iTexCoord: int = (pMatches ? parseInt(pMatches[2]) : 0);


                            var iTexture = ESurfaceMaterialTextures[sTextureType.toUpperCase()];

                            if (!isDef(iTexture)) {
                                continue;
                            }

                            pSurfaceMaterial.setTexture(iTexture, pTexture, iTexCoord);
                        }
                    }
                }
                //trace('try to apply mat:', pMaterial);
            }

            return pMesh;
        }
        
        
        private buildSkeleton(pSkeletonsList: string[]): ISkeleton {
            var pSkeleton: ISkeleton = null;

            pSkeleton = model.createSkeleton(pSkeletonsList[0]);

            for (var i: int = 0; i < pSkeletonsList.length; ++i) {
                var pJoint: IJoint = <IJoint>(<IColladaNode>this.source(pSkeletonsList[i])).constructedNode;

                ERROR(scene.isJoint(pJoint), "skeleton node must be joint");

                pSkeleton.addRootJoint(pJoint);
            }

            return pSkeleton;
        }

        private buildMesh(pGeometryInstance: IColladaInstanceGeometry): IMesh {
            var pMesh: IMesh = null;
            var pGeometry: IColladaGeometrie = pGeometryInstance.geometry;
            var pNodeData: IColladaMesh = pGeometry.mesh;
            var sMeshName: string = pGeometry.id;

            if (isNull(pNodeData)) {
                return null;
            }

            if ((pMesh = this.findMesh(sMeshName))) {
                //mesh with same geometry data
                return this.buildMaterials(
                    pMesh.clone(EMeshCloneOptions.GEOMETRY_ONLY | EMeshCloneOptions.SHARED_GEOMETRY),
                    pGeometryInstance);
            }

            var iBegin: int = now();

            pMesh = this.getEngine().createMesh(
                sMeshName,
                <int>(EMeshOptions.HB_READABLE), /*|EMeshOptions.RD_ADVANCED_INDEX,  //0,//*/
                this.sharedBuffer());    /*shared buffer, if supported*/

            var pPolyGroup: IColladaPolygons[] = pNodeData.polygons;
            var pMeshData: IRenderDataCollection = pMesh.data;

            //creating subsets
            for (var i: int = 0; i < pPolyGroup.length; ++i) {
                pMesh.createSubset(
                    "submesh-" + i, 
                    this.isWireframeEnabled() ? EPrimitiveTypes.LINELIST : pPolyGroup[i].type);  /*EPrimitiveTypes.POINTLIST);*/
            }

            //filling data
            for (var i: int = 0, pUsedSemantics: BoolMap = <BoolMap>{}; i < pPolyGroup.length; ++i) {
                var pPolygons: IColladaPolygons = pPolyGroup[i];

                for (var j: int = 0; j < pPolygons.inputs.length; ++j) {
                    var pInput: IColladaInput = pPolygons.inputs[j];
                    var sSemantic: string = pInput.semantics;
                    var pData: ArrayBufferView = <ArrayBufferView><any>pInput.array;
                    var pDecl: IVertexElementInterface[];
                    var pDataExt: Float32Array;

                    //if (pMesh.buffer.getDataLocation(sSemantic) < 0) {
                    if (!pUsedSemantics[sSemantic]) {
                        pUsedSemantics[sSemantic] = true;

                        switch (sSemantic) {
                            case DeclUsages.POSITION:
                            case DeclUsages.NORMAL:
                                /*
                                 Extend POSITION and NORMAL from {x,y,z} --> {x,y,z,w};
                                 */

                                pDataExt = new Float32Array((<Float32Array>pData).length / 3 * 4);

                                for (var y = 0, n = 0,  m = 0, l = (<Float32Array>pData).length / 3; y < l; y++, n++) {
                                    pDataExt[n++] = pData[m++];
                                    pDataExt[n++] = pData[m++];
                                    pDataExt[n++] = pData[m++];
                                }

                                pData = pDataExt;
                                pDecl = [VE_FLOAT3(sSemantic), VE_END(16)];

                                break;
                            case DeclUsages.TEXCOORD:
                            case DeclUsages.TEXCOORD1:
                            case DeclUsages.TEXCOORD2:
                            case DeclUsages.TEXCOORD3:
                            case DeclUsages.TEXCOORD4:
                            case DeclUsages.TEXCOORD5:
                                //avoiding semantics collisions
                                if(sSemantic === "TEXCOORD"){
                                    sSemantic = "TEXCOORD0";
                                }

                                pDecl = [VE_CUSTOM(sSemantic, EDataTypes.FLOAT, pInput.accessor.stride)];
                                break;
                            default:
                                ERROR("unsupported semantics used: " + sSemantic);
                        }

                        pMeshData.allocateData(pDecl, pData);
                    }
                }
            }

            //add indices to data
            for (var i: int = 0; i < pPolyGroup.length; ++i) {
                var pPolygons: IColladaPolygons = pPolyGroup[i];
                var pSubMesh: IMeshSubset = pMesh.getSubset(i);
                var pSubMeshData: IRenderData = pSubMesh.data;
                var pDecl: IVertexElementInterface[] = new Array(pPolygons.inputs.length);
                var iIndex: int = 0;
                var pSurfaceMaterial: ISurfaceMaterial = null;
                var pSurfacePool: IResourcePool = null;

                for (var j: int = 0; j < pPolygons.inputs.length; ++j) {
                    pDecl[j] = VE_FLOAT(DeclUsages.INDEX + (iIndex++));
                }

                pSubMeshData.allocateIndex(pDecl, new Float32Array(pPolygons.p));

                for (var j: int = 0; j < pDecl.length; ++j) {
                    var sSemantic: string = pPolygons.inputs[j].semantics;

                    pSubMeshData.index(sSemantic, pDecl[j].usage);
                }

                // if (!pSubMesh.material) {
                //     pSurfacePool = pEngine.getResourceManager().surfaceMaterialPool;
                //     pSurfaceMaterial = pSurfacePool.findResource(pPolygons.material);

                //     if (!pSurfaceMaterial) {
                //         pSurfaceMaterial = pSurfacePool.createResource(pPolygons.material);
                //     }

                //     pSubMesh.surfaceMaterial = pSurfaceMaterial;
                // }
                
                pSubMesh.material.name = pPolygons.material;
            }

            pMesh.addFlexMaterial("default");
            pMesh.setFlexMaterial("default");

            //adding all data to cahce data
            this.addMesh(pMesh);

            return this.buildMaterials(pMesh, pGeometryInstance);
        }

        private buildSkinMesh(pControllerInstance: IColladaInstanceController): IMesh {
            var pController: IColladaController = pControllerInstance.controller;
            var pMaterials: IColladaBindMaterial = pControllerInstance.material;

            var pSkinData: IColladaSkin = pController.skin;

            //skin data
            var pBoneList: string[] = <string[]>pSkinData.joints.inputs["JOINT"].array;
            var pBoneOffsetMatrices: IMat4[] = <IMat4[]>pSkinData.joints.inputs["INV_BIND_MATRIX"].array;
            
            var m4fBindMatrix: IMat4 = pSkinData.shapeMatrix;
            var pVertexWeights: IColladaVertexWeights = pSkinData.vertexWeights;

            var pGeometry: IColladaGeometrie = pSkinData.geometry;

            var pMesh: IMesh;
            var pSkeleton: ISkeleton;
            var pSkin: ISkin;

            pSkeleton = this.buildSkeleton(pControllerInstance.skeletons);
            pMesh = this.buildMesh({geometry : pGeometry, material : pMaterials});

            pSkin = pMesh.createSkin();
            pSkin.setBindMatrix(m4fBindMatrix);
            pSkin.setBoneNames(pBoneList);
            pSkin.setBoneOffsetMatrices(pBoneOffsetMatrices);
            pSkin.setSkeleton(pSkeleton);

            if (!pSkin.setVertexWeights(
                <uint[]>pVertexWeights.vcount,
                new Float32Array(pVertexWeights.v),
                new Float32Array(pVertexWeights.weightInput.array))) {
                ERROR("cannot set vertex weight info to skin");
            }

            pMesh.setSkeleton(pSkeleton);
            pSkeleton.attachMesh(pMesh);

            return pMesh;            
        }


        private buildSkinMeshInstance(pControllers: IColladaInstanceController[], pSceneNode: ISceneModel = null): IMesh[] {
            var pMesh: IMesh = null;
            var pMeshList: IMesh[] = [];

            for (var m: int = 0; m < pControllers.length; ++m) {
                pMesh = this.buildSkinMesh(pControllers[m]);
                pMeshList.push(pMesh);

                debug_assert(isDefAndNotNull(pMesh), "cannot find instance <" + pControllers[m].url + ">\"s data");

                if (!isNull(pSceneNode)) {
                    pSceneNode.mesh = pMesh;
                }
            }

            return pMeshList;
        }

         private buildMeshInstance(pGeometries: IColladaInstanceGeometry[], pSceneNode: ISceneModel = null): IMesh[] {
            var pMesh: IMesh = null;
            var pMeshList: IMesh[] = [];

            for (var m: int = 0; m < pGeometries.length; ++m) {
                pMesh = this.buildMesh(pGeometries[m]);
                pMeshList.push(pMesh);

                debug_assert(isDefAndNotNull(pMesh), "cannot find instance <" + pGeometries[m].url + ">\"s data");

                if (!isNull(pSceneNode)) {
                    pSceneNode.mesh = pMesh;
                }
            }

            return pMeshList;
        }

        private buildMeshes(): IMesh[] {
            var pScene: IColladaVisualScene = this.getVisualScene();
            var pMeshes: IMesh[] = [];

            findNode(pScene.nodes, null, function (pNode: IColladaNode) {
                var pModelNode: ISceneNode = pNode.constructedNode;
                
                if (isNull(pModelNode)) {
                    debug_error("you must call buildScene() before call buildMeshes() or file corrupt");
                    return;
                }

                if (pNode.controller.length == 0 && pNode.geometry.length == 0) {
                    return;
                }

                if (scene.isModel(pModelNode)) {
                    pModelNode = pModelNode.scene.createModel(".joint-to-model-link-" + sid());
                    pModelNode.attachToParent(pNode.constructedNode);
                }

                pMeshes.insert(<IMesh[]>this.buildSkinMeshInstance(pNode.controller));
                pMeshes.insert(<IMesh[]>this.buildMeshInstance(pNode.geometry, pModelNode));
            });

            return pMeshes;
        }
        
        // scene

        private buildSceneNode(pNode: IColladaNode, pParentNode: ISceneNode): ISceneNode {
            var pSceneNode: ISceneNode = pNode.constructedNode;
            var pScene: IScene3d = pParentNode.scene;

            if (isDefAndNotNull(pSceneNode)) {
                return pSceneNode;
            }
            
            //FIXME: предпологаем, что мы никогда не аттачим контроллеры к узлам,
            // где они найдены, а аттачим  их к руту скелета, на который они ссылаются
            if (pNode.geometry.length > 0) {   /*pNode.pController.length ||*/
                pSceneNode = pScene.createModel();
            }
            else {
                pSceneNode = pScene.createNode();
            }

            pSceneNode.attachToParent(pParentNode);
        

            return pSceneNode;
        }
        
        private buildJointNode(pNode: IColladaNode, pParentNode: ISceneNode): IJoint {
            var pJointNode: IJoint = <IJoint>pNode.constructedNode;
            var sJointSid: string = pNode.sid;
            var sJointName: string = pNode.id;
            var pSkeleton: ISkeleton;

            debug_assert(isDefAndNotNull(pParentNode), "parent node is null");

            if (isDefAndNotNull(pJointNode)) {
                return pJointNode;
            }

            if (isNull(pParentNode)) {
                return null;
            }

            pJointNode = pParentNode.scene.createJoint();
            pJointNode.boneName = sJointSid;
            pJointNode.attachToParent(pParentNode);

#ifdef DEBUG
            if (this.isJointsVisualizationNeeded()) {
                //draw joints
                // var pSceneNode: ISceneModel = pEngine.appendMesh(
                //     pEngine.pCubeMesh.clone(a.Mesh.GEOMETRY_ONLY | a.Mesh.SHARED_GEOMETRY),
                //     pJointNode);
                // pSceneNode.name = sJointName + '[joint]';
                // pSceneNode.setScale(0.02);
                CRITICAL("TODO: visualize joints...");
            }
#endif

            return pJointNode;
        }
        
        private buildNodes(pNodes: IColladaNode[], pParentNode: ISceneNode = null): ISceneNode {
            if (isNull(pNodes)) {
                return null;
            }

            var pNode: IColladaNode = null;
            var pHierarchyNode: ISceneNode = null;
            var m4fLocalMatrix: IMat4 = null;

            for (var i: int = pNodes.length - 1; i >= 0; i--) {
                pNode = pNodes[i];

                if (!isDefAndNotNull(pNode)) {
                    continue;
                }

                if (pNode.type === "JOINT") {
                    pHierarchyNode = this.buildJointNode(pNode, pParentNode);
                }
                else {
                    pHierarchyNode = this.buildSceneNode(pNode, pParentNode);
                }

                pHierarchyNode.name = (pNode.id || pNode.name);
                pHierarchyNode.setInheritance(ENodeInheritance.ALL);

                //cache already constructed nodes
                pNode.constructedNode = pHierarchyNode;
                pHierarchyNode.localMatrix = pNode.transform;

                this.buildNodes(pNode.childNodes, pHierarchyNode);
            }

            return pHierarchyNode;
        }

        private buildScene(pRootNode: ISceneNode): ISceneNode[] {
            var pScene: IColladaVisualScene = this.getVisualScene();
            var pAsset: IColladaAsset = this.getAsset();

            var pNodes: ISceneNode[] = [];
            var pNode: IColladaNode = null;

            for (var i: int = 0; i < pScene.nodes.length; i++) {
                pNode = pScene.nodes[i];
                pNodes.push(this.buildNodes([pNode], pRootNode));
            }

            for (var i: int = 0; i < pNodes.length; i++) {
                pNodes[i] = this.buildAssetTransform(pNodes[i]);
            }

            return pNodes;
        }

        private buildInititalPose(pNodes: IColladaNode[], pSkeleton: ISkeleton): IAnimation {
            var sPose: string = "Pose-" + this.getBasename() + "-" + pSkeleton.name;
            var pPose: IAnimation = animation.createAnimation(sPose);
            var pNodeList: ISceneNode[] = pSkeleton.getNodeList();
            var pNodeMap: ISceneNodeMap = {};
            var pTrack: IAnimationTrack;

            for (var i: int = 0; i < pNodeList.length; ++i) {
                pNodeMap[pNodeList[i].name] = pNodeList[i];
            }

            findNode(pNodes, null, function (pNode: IColladaNode) {
                var sJoint: string = pNode.sid;
                var sNodeId: string = pNode.id;

                if (!isDefAndNotNull(pNodeMap[sNodeId])) {
                    return;
                }

                pTrack = animation.createTrack(sJoint);
                pTrack.targetName = sNodeId;
                pTrack.keyFrame(0.0, pNode.transform);

                pPose.push(pTrack);
            });

            return pPose;
        }

        private buildInitialPoses(pPoseSkeletons: ISkeleton[] = null): IAnimation[] {
            pPoseSkeletons = pPoseSkeletons || this.getSkeletonsOutput();
            var pScene: IColladaVisualScene = this.getVisualScene();

            var pSkeleton: ISkeleton;
            var pPoses: IAnimation[] = [];

            for (var i: int = 0; i < pPoseSkeletons.length; ++i) {
                pSkeleton = pPoseSkeletons[i];
                // if (pSkeleton.name === "node-Bip001_Pelvis" || pSkeleton.name === "node-Bip001") {
                //     trace('skipping <node-Bip001_Pelvis> skeleto, ...', '[' + sBasename + ']');

                //     trace(pSkeleton.getNodeList()[0].localMatrix().toQuat4().toYawPitchRoll(Vec3()).toString());

                //     continue;
                // }
                pPoses.push(this.buildInititalPose(pScene.nodes, pSkeleton));
            }

            return pPoses;
        }

        // additional
        

        private buildComplete(): void {
            var pScene: IColladaVisualScene = this.getVisualScene();
            
            //release all links to constructed nodes
            findNode(pScene.nodes, null, function (pNode: IColladaNode) {
                pNode.constructedNode = null;
            });
        }

        private setOptions(pOptions: IColladaLoadOptions): void {
            if (isNull(pOptions)) {
                pOptions = Collada.DEFAULT_OPTIONS;
            }

            for (var i in Collada.DEFAULT_OPTIONS) {
                if (isDef(pOptions[i])) {
                    continue;
                }

                pOptions[i] = Collada.DEFAULT_OPTIONS[i];
            }

            this._pOptions = pOptions;
        }

        private setXMLRoot(pXML: Element): void {
            this._pXMLRoot = pXML;
        }

        private getXMLRoot(): Element {
            return this._pXMLRoot;
        }

        private findMesh(sName: string): IMesh {
            return this._pCache.meshMap[sName] || null;
        }

        private addMesh(pMesh: IMesh): void {
            this._pCache.meshMap[pMesh.name] = pMesh;
            this.sharedBuffer(pMesh.data);
        }

        private sharedBuffer(pBuffer?: IRenderDataCollection): IRenderDataCollection {
            if (isDefAndNotNull(pBuffer)) {
                this._pCache.sharedBuffer = pBuffer;
            }

            return null;
            // return this._pOptions.sharedBuffer ? pCache.sharedBuffer : null;
        }

        private prepareInput(pInput: IColladaInput): IColladaInput {
            var pSupportedFormat: IColladaUnknownFormat[] = getSupportedFormat(pInput.semantics);
            
            debug_assert(isDefAndNotNull(pSupportedFormat), "unsupported semantic used <" + pInput.semantics + ">");

            pInput.array    = <any[]><any>this.COLLADAGetSourceData(pInput.source, pSupportedFormat);
            pInput.accessor = pInput.source.techniqueCommon.accessor;

            return pInput;
        }

        private inline isJointsVisualizationNeeded(): bool {
            return this._pOptions.drawJoints === true;
        }

        private inline isVisualSceneLoaded(): bool {
            return isDefAndNotNull(this._pVisualScene);
        }

        private inline isSceneNeeded(): bool {
            return this._pOptions.scene === true;
        }

         private inline isAnimationNeeded(): bool {
            return isDefAndNotNull(this._pOptions.animation);
        }

        private inline isPoseExtractionNeeded(): bool {
            return this._pOptions.extractPoses === true;
        }

        private inline isWireframeEnabled(): bool {
            return this._pOptions.wireframe === true;
        }

        private inline getSkeletonsOutput(): ISkeleton[] {
            return this._pOptions.skeletons || null;
        }

        private inline getVisualScene(): IColladaVisualScene {
            return this._pVisualScene;
        }

        private inline getAsset(): IColladaAsset {
            return this._pAsset;
        }        

        private inline isLibraryLoaded(sLib: string): bool {
            return isDefAndNotNull(this._pLib[sLib]);
        }

        private inline isLibraryExists(sLib: string): bool {
            return false;
        }

        private inline getLibrary(sLib: string): IColladaLibrary {
            return this._pLib[sLib] || null;
        }

        private inline getBasename(): string {
            return util.pathinfo(this._sFilename).basename || "unknown";
        }

        private inline getFilename(): string {
            return this._sFilename;
        }

        private inline setFilename(sName: string): void {
            this._sFilename = sName;
        }

        private readLibraries(pXML: Element, pTemplates: IColladaLibraryTemplate[]): void {
            var pLibraries: IColladaLibraryMap = this._pLib;
            
            for (var i: int = 0; i < pTemplates.length; i++) {
                var sLib: string = pTemplates[i].lib;

                pLibraries[sLib] = this.COLLADALibrary(firstChild(pXML, sLib), pTemplates[i]);
            }
        } 

        private checkLibraries(pXML: Element, pTemplates: IColladaLibraryTemplate[]): void {
            var pLibraries: IColladaLibraryMap = this._pLib;

            for (var i: int = 0; i < pTemplates.length; i++) {
                var sLib: string = pTemplates[i].lib;

                if (isDefAndNotNull(firstChild(pXML, sLib))) {
                    pLibraries[sLib] = null;
                }
            }
        }

        parse(sXMLData: string, pOptions: IColladaLoadOptions = null): bool {
            if (isNull(sXMLData)) {
                debug_error("must be specified collada content.");
                return false;
            }

            var pParser: DOMParser = new DOMParser();
            var pXMLDocument: Document = pParser.parseFromString(sXMLData, "application/xml");
            var pXMLRoot: Element = <Element>pXMLDocument.getElementsByTagName("COLLADA")[0];

            this.setOptions(pOptions);
            this.setXMLRoot(pXMLRoot);

            this.checkLibraries(pXMLRoot, Collada.SCENE_TEMPLATE);
            this.checkLibraries(pXMLRoot, Collada.ANIMATION_TEMPLATE);

            this.readLibraries(pXMLRoot, Collada.SCENE_TEMPLATE);

            this.COLLADAAsset(firstChild(pXMLRoot, "asset"));
            this.COLLADAScene(firstChild(pXMLRoot, "scene"));

            if (this.isAnimationNeeded()) {
                this.readLibraries(pXMLRoot, Collada.ANIMATION_TEMPLATE);
            }

            return true;
        }

        loadResource(sFilename: string = null, pOptions: IColladaLoadOptions = null): bool {
            if (isNull(sFilename)) {
                sFilename = this.findResourceName();
            }

            if (this.isResourceLoaded()) {
                WARNING("collada model already loaded");
                return false;
            }

            var pModel: Collada = this;

            this.setFilename(sFilename);
            this.notifyDisabled();

            io.fopen(sFilename).read(function (pErr: Error, sXML: string) {
                if (!isNull(pErr)) {
                    ERROR(pErr);
                }

                pModel.notifyRestored();
                
                if (pModel.parse(sXML, pOptions)) {
                    pModel.notifyLoaded();
                }
            });
        }

        attachToScene(pNode: ISceneNode): bool {
            var pSkeletons: ISkeleton[], 
                pSkeleton: ISkeleton;
            var pPoses: IAnimation[];
            var pRoot: ISceneNode;

            var pSceneOutput: ISceneNode[] = null;
            var pAnimationOutput: IAnimation[] = null;
            var pMeshOutput: IMesh[] = null;
            var pInitialPosesOutput: IAnimation[] = null;
            var pController: IAnimationController = null;


            if (isNull(pNode)) {
                return false;
            }

            if (this.isVisualSceneLoaded() && this.isSceneNeeded()) {
                pSceneOutput = this.buildScene(pNode);
                pMeshOutput = this.buildMeshes();
            }

            if (this.isPoseExtractionNeeded()) {
                pInitialPosesOutput = this.buildInitialPoses();
            }

            if (this.isAnimationNeeded() && this.isLibraryExists("library_animations")) {

                pAnimationOutput = 
                        this.buildAnimations((<IColladaAnimation>this.getLibrary("library_animations")).animations);

                //дополним анимации начальными позициями костей
                if (this.isPoseExtractionNeeded()) {
                    pSkeletons = this.getSkeletonsOutput() || [];

                    /*
     
                    // добавим к начальным позам, те, в которых находятся меши
                    // в момент выгрузки
                    if (!isNull(pMeshOutput)) {
                        for (var i = 0; i < pMeshOutput.length; ++ i) {
                            pSkeletons.push(pMeshOutput[i].skeleton);
                        }
                    }
                    else {
                        //необхоимо для посчета ссылочной информации
                        if (isNull(pSceneOutput)) {
                            this.buildScene();
                        }

                        eachByTag(pXMLRoot, "skeleton", function (pXML: Node) {
                            pSkeletons.push(this.buildSkeleton([stringData(pXML)]));
                        });
                    }

                    */

                    pPoses = this.buildInitialPoses(pSkeletons);

                    for (var i: int = 0; i < pAnimationOutput.length; ++ i) {
                        for (var j: int = 0; j < pPoses.length; ++ j) {
                            pAnimationOutput[i].extend(pPoses[j]);
                        }
                    }
                }
            }

            this.buildComplete();

            pRoot = pNode.scene.createNode();
            pRoot.setInheritance(ENodeInheritance.ALL);

            if (!pRoot.attachToParent(pNode)) {
                return false;
            }

            if (!isNull(pController)) {
                //TODO: bind controller
            }

            return true;
        }
    }

    pSupportedVertexFormat = [
        {name : ["X"], type : ["float"]},
        {name : ["Y"], type : ["float"]},
        {name : ["Z"], type : ["float"]}
    ];

    pSupportedTextureFormat = [
        {name : ["S"], type : ["float"]},
        {name : ["T"], type : ["float"]},
        {name : ["P"], type : ["float"]}
    ];

    pSupportedWeightFormat = [
        {name : ["WEIGHT"], type : ["float"]}
    ];

    pSupportedJointFormat = [
        {name : ["JOINT"], type : ["Name", "IDREF"]}
    ];

    pSupportedInvBindMatrixFormat = [
        {name : ["TRANSFORM"], type : ["float4x4"]}
    ];

    pSupportedInterpolationFormat = [
        {name : ["INTERPOLATION"], type : ["Name"]}
    ];

    pSupportedInputFormat = [
        {name : ["TIME"], type : ["float"]}
    ];

    pSupportedOutputFormat = [
        {name : ["TRANSFORM", "X", "ANGLE", null], type : ["float4x4", "float"]},
        {name : ["Y"], type : ["float"]},
        {name : ["Z"], type : ["float"]}
    ];

    pSupportedTangentFormat = [
        {name : ["X"], type : ["float"]},
        {name : ["Y"], type : ["float"]},
        {name : ["X"], type : ["float"]},
        {name : ["Y"], type : ["float"]},
        {name : ["X"], type : ["float"]},
        {name : ["Y"], type : ["float"]},
        {name : ["X"], type : ["float"]},
        {name : ["Y"], type : ["float"]},
        {name : ["X"], type : ["float"]},
        {name : ["Y"], type : ["float"]}
    ];

    pFormatStrideTable = <IColladaFormatStrideTable> {
        "float"    : 1,
        "float2"   : 2,
        "float3"   : 3,
        "float4"   : 4,
        "float3x3" : 9,
        "float4x4" : 16,
        "int"      : 1,
        "name"     : 1,
        "Name"     : 1,
        "IDREF"    : 1
    };

    pConvFormats = {
        "int"    : { type: Int32Array,      converter: string2IntArray      },
        "float"  : { type: Float32Array,    converter: string2FloatArray    },
        "bool"   : { type: Array,           converter: string2BoolArray     },
        "string" : { type: Array,           converter: string2StringArray   }
    };

     /* COMMON FUNCTIONS
     ------------------------------------------------------
     */
    
    function getSupportedFormat(sSemantics: string): IColladaUnknownFormat[] {
        switch (sSemantics) {
            case "TEXTANGENT":
            case "TEXBINORMAL":
            case "VERTEX":
            case "NORMAL":
            case "TANGENT":
            case "BINORMAL":
            case "POSITION":
                return pSupportedVertexFormat;

            case "TEXCOORD":
                return pSupportedTextureFormat;

            case "WEIGHT":
                return pSupportedWeightFormat;

            case "JOINT":
                return pSupportedJointFormat;

            case "INV_BIND_MATRIX":
                return pSupportedInvBindMatrixFormat;

            case "INTERPOLATION":
                return pSupportedInterpolationFormat;

            case "IN_TANGENT":
                return pSupportedTangentFormat;

            case "INPUT":
                return pSupportedInputFormat;

            case "OUT_TANGENT":
                return pSupportedTangentFormat;

            case "OUTPUT":
                return pSupportedOutputFormat;

            case "UV":
            case "MORPH_WEIGHT":
            case "MORPH_TARGET":
            case "LINEAR_STEPS":
            case "IMAGE":
            case "CONTINUITY":
            case "COLOR":
                return null;
        }
        
        ERROR("unknown semantics founded: " + sSemantics);
        
        return null;
    }

    function calcFormatStride(pFormat: IColladaUnknownFormat[]): int {
        var iStride: int = 0;
        var s: string = null;

        for (var i: int = 0; i < pFormat.length; ++i) {
            s = pFormat[i].type[0];
            iStride += pFormatStrideTable[s];
        }

        return iStride;
    }
    
    // polygon index convertion
    

    function trifanToTriangles(pXML: Element, iStride: int): uint[] {
        var pFans2Tri: uint[] = [0, 0, 0];
        var pData: uint[] = [];
        var tmp: uint[] = new Array(iStride), n;
        var pIndexes: uint[] = [];

        eachByTag(pXML, "p", function (pXMLData) {
            n = string2IntArray(stringData(pXMLData), pData);
            for (var i: int = 0; i < 3; i++) {
                retrieve(pData, tmp, iStride, i, 1);
                for (var j: int = 0; j < iStride; ++j) {
                    pIndexes.push(tmp[j]);
                }
            }

            for (var i: int = 3, m = n / iStride; i < m; i++) {
                pFans2Tri[1] = i - 1;
                pFans2Tri[2] = i;
                for (var j: int = 0; j < pFans2Tri.length; ++j) {
                    for (var k: int = 0; k < iStride; ++k) {
                        pIndexes.push(pData[pFans2Tri[j] * iStride + k]);
                    }
                }
            }
        });
        return pIndexes;
    }

    inline function polygonToTriangles(pXML: Element, iStride: int): uint[] {
        //TODO для невыпуклых многоугольников с самоперечечениями работать будет не верно
        return trifanToTriangles(pXML, iStride);
    }

    function tristripToTriangles(pXML: Element, iStride: int): uint[] {
        var pStrip2Tri: uint[] = [0, 0, 0];
        var pData: uint[] = [];
        var tmp: uint[] = new Array(iStride), n;
        var pIndexes: uint[] = [];

        eachByTag(pXML, "p", function (pXMLData) {
            n = string2IntArray(stringData(pXMLData), pData);

            for (var i: int = 0; i < 3; i++) {
                retrieve(pData, tmp, iStride, i, 1);
                for (var j: int = 0; j < iStride; ++j) {
                    pIndexes.push(tmp[j]);
                }
            }

            for (var i: int = 3, m = n / iStride; i < m; i++) {
                pStrip2Tri[0] = i - 1;
                pStrip2Tri[1] = i - 2;
                pStrip2Tri[2] = i;
                for (var j: int = 0; j < pStrip2Tri.length; ++j) {
                    for (var k: int = 0; k < iStride; ++k) {
                        pIndexes.push(pData[pStrip2Tri[j] * iStride + k]);
                    }
                }
            }
        });

        return pIndexes;
    }

    function polylistToTriangles(pXML: Element, iStride: int): uint[] {
        var pXMLvcount: Element = firstChild(pXML, "vcount");
        var pXMLp: Element = firstChild(pXML, "p");
        var pVcount: uint[] = new Array(parseInt(attr(pXML, "count")));
        var pData: uint[], 
            pIndexes: uint[];
        var n: uint, h: int = 0;
        var tmp = new Array(128);
        var buf = new Array(256);
        var pPoly2Tri = [0, 0, 0];

        string2IntArray(stringData(pXMLvcount), pVcount);

        var nElements: uint = 0, 
            nTotalElement: uint = 0;

        for (var i: int = 0; i < pVcount.length; i++) {
            nElements += pVcount[i];
            nTotalElement += (pVcount[i] - 2) * 3;
        }

        pIndexes = new Array(iStride * nTotalElement);
        pData = new Array(iStride * nElements);

        string2IntArray(stringData(pXMLp), pData);

        for (var i: int = 0, m = 0; i < pVcount.length; i++) {
            n = retrieve(pData, tmp, iStride, m, pVcount[i]);

            for (var j: int = 0; j < 3; j++) {
                retrieve(tmp, buf, iStride, j, 1);
                for (var k: int = 0; k < iStride; ++k) {
                    pIndexes[h++] = buf[k];
                }
            }

            for (var x: int = 3, t = n / iStride; x < t; x++) {
                pPoly2Tri[1] = x - 1;
                pPoly2Tri[2] = x;
                for (var j: int = 0; j < pPoly2Tri.length; ++j) {
                    for (var k: int = 0; k < iStride; ++k) {
                        pIndexes[h++] = pData[(m + pPoly2Tri[j]) * iStride + k];
                    }
                }
            }

            m += pVcount[i];
        }

        return pIndexes;
    } 
    

    // data convertion

    inline function parseBool(sValue: string): bool {
        return (sValue === "true");
    }

    inline function parseString(sValue: string): string {
        return String(sValue);
    }

    /**
     * Получить часть данных массива
     * @param pSrc
     * @param pDst
     * @param iStride шаг (количество элементов в шаге)
     * @param iFrom номер элемента с которого начинать
     * @param iCount сколько элементов надо получить
     * @param iOffset смещение внутри шага (в элементах)
     * @param iLen количество элементов в шаге.
     */
    
    function retrieve(pSrc: any[], pDst: any[], iStride: int = 1, iFrom: int = 0, iCount?: int, iOffset: int = 0, iLen: int = iStride - iOffset): uint {
        
        if (!isDef(iCount)) {
            iCount = (pSrc.length / iStride - iFrom);
        }

        if (iOffset + iLen > iStride) {
            iLen = iStride - iOffset;
        }

        var iBegin: int = iFrom * iStride;
        var n: int = 0;
        
        for (var i: int = 0; i < iCount; ++i) {
            for (var j = 0; j < iLen; ++j) {
                pDst[n++] = (pSrc[iBegin + i * iStride + iOffset + j]);
            }
        }

        return n;
    }

    function string2Array(sData: string, ppData: any[], fnConv: (data: string) => any = parseFloat, iFrom: uint = 0): uint {
        var pData: string[] = sData.split(/[\s]+/g);
        
        for (var i = 0, n = pData.length, j = 0; i < n; ++i) {
            if (pData[i] != "") {
                ppData[iFrom + j] = fnConv(pData[i]);
                j++;
            }
        }

        return n;
    }
    
    inline function string2IntArray(sData: string, ppData: int[], iFrom?: uint): uint {
        return string2Array(sData, ppData, parseInt, iFrom);
    }

    inline function string2FloatArray(sData: string, ppData: float[], iFrom?: uint): uint {
        return string2Array(sData, ppData, parseFloat, iFrom);
    }

    inline function string2BoolArray(sData: string, ppData: bool[], iFrom?: uint): uint {
        return string2Array(sData, ppData, parseBool, iFrom);
    }
    
    inline function string2StringArray(sData: string, ppData: string[], iFrom?: uint): uint {
        return string2Array(sData, ppData, parseString, iFrom);
    }

   
    function string2Any(sData: string, n: uint, sType: string, isArray = false): any {
        var ppData: any = new (pConvFormats[sType].type)(n);
        
        pConvFormats[sType].converter(sData, ppData);
        
        if (n == 1 && !isArray) {
            return ppData[0];
        }
        
        return ppData;
    };

    // additional
    
    function printArray(pArr: any[], nRow: uint, nCol: uint): string {
        var s: string = "\n";

        for (var i = 0; i < pArr.length; ++i) {
            if (i % nCol == 0) {
                s += "  ";
            }

            s += pArr[i] + ", ";

            if ((i + 1) % nRow == 0) {
                s += '\n';
            }
        }

        return s;
    }

    function sortArrayByProperty(pData: any[], sProperty: string): any[] {
        var tmp: any;

        for (var i: int = pData.length - 1; i > 0; i--) {
            for (var j: int = 0; j < i; j++) {
                if (pData[j][sProperty] > pData[j + 1][sProperty]) {
                    tmp = pData[j];
                    pData[j] = pData[j + 1];
                    pData[j + 1] = tmp;
                }
            }
        }

        return pData;
    }

    //xml
    
    function eachNode(pXMLList: NodeList, fnCallback: IXMLExplorer, nMax?: uint): void {
        var n: int = pXMLList.length, i: int;
        nMax = (isNumber(nMax) ? (nMax < n ? nMax : n) : n);

        n = 0;
        i = 0;

        while (n < pXMLList.length) {
            //skip text nodes
            if (pXMLList[n ++].nodeType === Node.TEXT_NODE) {
                continue;
            }

            var pXMLData: Element = <Element>pXMLList[n - 1];
            fnCallback(pXMLData, pXMLData.nodeName);

            i ++;

            if (nMax === i) {
                break;
            }
        }

//        for (var i = 0; i < nMax; i++) {
//            var pXMLData = pXMLList.item(i);
//            var sName = pXMLData.getNodeName();
//            fnCallback(pXMLData, sName);
//        }
    }

    function eachChild(pXML: Element, fnCallback: IXMLExplorer): void {
        eachNode(pXML.childNodes, fnCallback);
    }
    
    inline function eachByTag(pXML: Element, sTag: string, fnCallback: IXMLExplorer, nMax?: uint): void {
        eachNode(pXML.getElementsByTagName(sTag), fnCallback, nMax);
    }

    function firstChild(pXML: Element, sTag?: string): Element {
        if (isString(sTag)) {
            for (var i = 0; i < pXML.childNodes.length; i++) {
                if (pXML.childNodes[i].nodeType === Node.ELEMENT_NODE) {
                    return <Element>pXML.childNodes[i];
                }
            }
        }

        return <Element>pXML.getElementsByTagName(sTag)[0];
    }

    inline function stringData(pXML: Element): string {
        return (isDefAndNotNull(pXML) ? pXML.textContent : null);
    }

    inline function attr(pXML: Element, sName: string): string {
         return pXML.getAttribute(sName);

    }

    // Akra convertions functions
    // -------------------------------------------------------

    function findNode(pNodes: IColladaNode[], sNode: string = null, fnNodeCallback: (pNode: IColladaNode) => void = null): IColladaNode {
        var pNode: IColladaNode = null;
        var pRootJoint: IColladaNode = null;

        for (var i = pNodes.length - 1; i >= 0; i--) {
            pNode = pNodes[i];

            if (pNode === null) {
                continue;
            }

            if (sNode && "#" + pNode.id === sNode) {
                return pNode;
            }

            if (!isNull(fnNodeCallback)) {
                fnNodeCallback(pNode);
            }

            if (pNode.childNodes) {
                pRootJoint = findNode(pNode.childNodes, sNode, fnNodeCallback);

                if (!isNull(pRootJoint)) {
                    return pRootJoint;
                }
            }
        }

        return null;
    }



}

#endif