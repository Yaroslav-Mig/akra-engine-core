// /**
//  *  @file
//  *  @author Ivan Popov
//  *  @email <vantuziast@gmail.com>
//  */

// function UserData () {
//     this.iMaterial = 0;
//     this.iSubset = 0;
// };

// a.UserData = UserData;

// /**
//  * Class describe 3D model on the scene.
//  * @ctor
//  * @tparam Engine pEngine
//  */
// function SceneModel (pEngine) {
//     SceneModel.superclass.constructor.apply(this, arguments);

//     /**
//      * @private
//      * @type ModelResource
//      * Resource of the model.
//      */
//     this._pModelResource = null;

//     /**
//      * @private
//      * @type Uint
//      * Frame index.
//      */
//     this._iModelFrameIndex = 0;

//     /**
//      * @private
//      * @type Uint
//      * Number of the bone matrices.
//      */
//     this._nTotalBoneMatrices = 0;


//     /**
//      * @private
//      * @type Matrix4[]
//      * Bone matrces.
//      */
//     this._pBoneMatrixList = 0;

//     /**
//      * @private
//      * @type int
//      * lavel of details
//      */
//     this._iLod = 0;

//    this._m3fWorldViewProj = new Matrix4;
// }

// a.extend(SceneModel, a.SceneObject);

// /**
//  * create resource.
//  */
// SceneModel.prototype.create = function () {
//     SceneModel.superclass.create.apply(this);
// };


// /**
//  * destroy resource.
//  */
// SceneModel.prototype.destroy = function () {
//     safe_release(this._pModelResource);
//     safe_delete_array(this._pBoneMatrixList);
//     this._nTotalBoneMatrices = 0;
//     this._iModelFrameIndex = 0;

//     SceneModel.superclass.destroy.apply(this);
// };

// SceneModel.prototype.prepareForRender = function () {
//     if (this._pModelResource && this._pModelResource.containsProgressiveMesh()) {
//         var pCamera = this._pEngine.getActiveCamera();

//         var v3fWorldPos = this.worldPosition();
//         var v3fCamPos = pCamera.worldPosition();

//         var fDist = Vec3.lengthSquare(v3fCamPos) / (pCamera.farPlane() * pCamera.farPlane());

//         this._iLod = Math.realToInt32((1.0 - fDist) * a.ModelResource.maxLOD);
//     }
// };

// SceneModel.prototype.render = function () {
//     SceneModel.superclass.render.apply(this);

//     var pMeshContainer = this.meshContainer();
//     var pDisplayManager = this._pEngine.pDisplayManager;

//     if (pMeshContainer != null && pMeshContainer.ppRenderMethodList) {
//         if (pMeshContainer.pSkinInfo != null) {
//             var pAnimationOwner = this.subNodeGroupOwner();
//             debug_assert(pAnimationOwner, "no animation owner found for skin");

//             var pAnimData = pAnimationOwner.subNodeGroupData();
//             debug_assert(pAnimData, "no animation data found for skin");

//             // compute all the bone matrices
//             for (var iBone = 0; iBone < this._nTotalBoneMatrices; ++iBone) {
//                 var iBoneIndex = pMeshContainer.pBoneIndexList[iBone];
//                 var pSceneNode = pAnimData.subNodePtr(iBoneIndex);
//                 var m4fBoneMatrix = pSceneNode.worldMatrix();

//                 Mat4.mult(pMeshContainer.pBoneOffsetMatrices[iBone], m4fBoneMatrix, this._pBoneMatrixList[iBone]);
//             }

//             //
//             // submit for rendering
//             //
//             var nBoneInfluences = pMeshContainer.nBoneInfluences - 1;
//             var pBoneComb = pMeshContainer.pBoneCombinationBuf; //TODO преобразовать к объекту с аттрибутами
//             for (var iAttrib = 0; iAttrib < pMeshContainer.nAttributeGroups; iAttrib++) {
//                 var iMaterial = pBoneComb[iAttrib].id;

//                 var pMethod = pMeshContainer.ppRenderMethodList[iMaterial];
//                 if (pMethod) {
//                     var pEffect = pMethod.getEffect(this._pEngine.getCurrentRenderStage());
//                     var pMaterial = pMethod.getMaterial(this._pEngine.getCurrentRenderStage());

//                     if (pEffect && pMaterial) {
//                         var nPasses = pEffect.totalPasses();
//                         for (var iPass = 0; iPass < nPasses; iPass++) {
//                             var pRenderEntry = pDisplayManager.openRenderQueue();

//                             pRenderEntry.hEffectFile = pEffect.resourceHandle();
//                             pRenderEntry.boneCount = nBoneInfluences;
//                             pRenderEntry.detailLevel = this._iLod;
//                             pRenderEntry.hSurfaceMaterial = pMaterial.resourceHandle();
//                             pRenderEntry.modelType = a.RenderEntry.modelEntry;
//                             pRenderEntry.hModel = this._pModelResource.resourceHandle();
//                             pRenderEntry.modelParamA = this._iModelFrameIndex;
//                             pRenderEntry.modelParamB = iAttrib;
//                             pRenderEntry.renderPass = iPass;
//                             pRenderEntry.object = this;
//                             pRenderEntry.userData = iMaterial;

//                             pDisplayManager.closeRenderQueue(pRenderEntry);
//                         }
//                     }
//                 }
//             }
//         }
//         else {
//             for (var iMaterial = 0; iMaterial < pMeshContainer.nMaterials; iMaterial++) {
//                 var pMethod = pMeshContainer.ppRenderMethodList[iMaterial];
//                 if (pMethod) {
//                     var pEffect = pMethod.getEffect(this._pEngine.getCurrentRenderStage());
//                     var pMaterial = pMethod.getMaterial(this._pEngine.getCurrentRenderStage());

//                     if (pEffect && pMaterial) {
//                         var nPasses = pEffect.totalPasses();

//                         for (var iPass = 0; iPass < nPasses; iPass++) {
//                             var pRenderEntry = pDisplayManager.openRenderQueue();

//                             pRenderEntry.hEffectFile = pEffect.resourceHandle();
//                             pRenderEntry.hSurfaceMaterial = pMaterial.resourceHandle();
//                             pRenderEntry.detailLevel = this._iLod;
//                             pRenderEntry.modelType = a.RenderEntry.modelEntry;
//                             pRenderEntry.hModel = this._pModelResource.resourceHandle();
//                             pRenderEntry.modelParamA = this._iModelFrameIndex;
//                             pRenderEntry.modelParamB = iMaterial;
//                             pRenderEntry.renderPass = iPass;
//                             pRenderEntry.pSceneNode = this;
//                             pRenderEntry.userData = iMaterial;

//                             pDisplayManager.closeRenderQueue(pRenderEntry);
//                         }
//                     }
//                 }
//             }
//         }
//     }
// };

// SceneModel.prototype.renderCallback = function (pEntry, iActivationFlags) {
//     // if we queued ourselved for rendering with the
//     // display manager, we will get this function
//     // called when it is our turn to render

//     // activationFlags contains a set of bit flags
//     // held in the eActivationFlagBits enum (render_queue.h)
//     // which tell us what resources we need to activate
//     // in order to render ourselves.
//     //profile_scope(cTerrainSystem_renderSection);
//     var pMeshContainer = this.meshContainer();
//     var hasSkinModel = pMeshContainer.pSkinInfo != null;

//     var iMaterial = pEntry.userData;
//     var pMethod = pMeshContainer.ppRenderMethodList[iMaterial];
//     var pEffect = pMethod.getEffect(this._pEngine.getCurrentRenderStage());
//     var pMaterial = pMethod.getMaterial(this._pEngine.getCurrentRenderStage());

//     var bDeactivatePass = false;

//     if (pEffect && pMaterial) {
//         // do we need to activate the render pass?
//         if (TEST_BIT(iActivationFlags, a.RenderQueue.activateRenderMethodPass)
//             || TEST_BIT(iActivationFlags, a.RenderQueue.activateRenderMethodParam)
//             || TEST_BIT(iActivationFlags, a.RenderQueue.activateRenderMethodLOD)) {
//             this._pModelResource.setLOD(this._iLod);
//             if (hasSkinModel) {
//                 nBoneInfluences = pMeshContainer.nBoneInfluences - 1;
//                 pEffect.setParameter(a.EffectResource.boneInfluenceCount, nBoneInfluences);
//             }
//             pEffect.activatePass(pEntry.renderPass);
//             bDeactivatePass = true;
//         }

//         // do we need to activate the render method?
//         if (TEST_BIT(iActivationFlags, a.RenderQueue.activateRenderMethod)) {
//             pEffect.begin();
//         }

//         // do we need to activate the surface material
//         if (TEST_BIT(iActivationFlags, a.RenderQueue.activateSurfaceMaterial)) {
//             pEffect.applySurfaceMaterial(pMaterial);
//         }

//         // skin models need to load their bone matrices
//         if (hasSkinModel) {
//             var pBoneComb = pMeshContainer.pBoneCombinationBuf;
//             var iAttrib = pEntry.modelParamB;
//             var iMaterial = pEntry.userData;
//             var iMatrixIndex;
//             var iPaletteEntry;

//             // load the proper matrices
//             for (iPaletteEntry = 0; iPaletteEntry < pMeshContainer.NumBoneMatrices; ++iPaletteEntry) {
//                 iMatrixIndex = pBoneComb[iAttrib].BoneId[iPaletteEntry];

//                 if (iMatrixIndex != MAX_UINT32) {
//                     pEffect.setMatrixInArray(a.EffectResource.worldMatrixArray, iPaletteEntry,
//                                              this._boneMatrixList[iMatrixIndex]);
//                 }
//             }

//             // Set CurNumBones to select the correct vertex shader for the number of bones
//             //pEffect.SetInt( "CurNumBones", pMeshContainer.NumInfl -1);
//             var nBoneInfluences = pMeshContainer.nBoneInfluences - 1;
//             pEffect.setParameter(a.EffectResource.boneInfluenceCount, nBoneInfluences);
//         }
//         else {
//             var pCamera = this._pEngine.getActiveCamera();
//             var m3fWorldViewProj = this._m3fWorldViewProj;
//             Mat4.mult(pCamera.viewProjMatrix(), this.worldMatrix(), m3fWorldViewProj);
//             // set the view matrix
//             //console.log(this.worldMatrix());
//             pEffect.setMatrix(a.EffectResource.worldViewProjMatrix, m3fWorldViewProj);
//             pEffect.applyCameraMatrices(pCamera);
//         }
//         pEffect.setMatrix(a.EffectResource.worldMatrix, this.worldMatrix());
//         pEffect.setMatrix(a.EffectResource.normalMatrix, this.normalMatrix());

//         var pMesh = pMeshContainer.pMeshData.pMesh;
//         pEffect.applyVertexBuffer(pMesh.getVertexBuffer());
//         pMesh.getIndexBuffer().activate();

//         if (bDeactivatePass) {
//             pEffect.deactivatePass();
//         }

//         // draw the mesh subset
//         this._pModelResource.renderModelSubset(pEntry.modelParamA, pEntry.modelParamB);
//     }
// };


// /**
//  *
//  * @tparam ModelResource pModel
//  * @tparam Uint iFrameIndex
//  */
// SceneModel.prototype.setModelResource = function (pModel, iFrameIndex) {
//     safe_release(this._pModelResource);
//     safe_delete_array(this._pBoneMatrixList);
//     iFrameIndex = iFrameIndex || 0;

//     this._nTotalBoneMatrices = 0;
//     this._iModelFrameIndex = iFrameIndex;

//     this._pModelResource = pModel;

//     if (this._pModelResource) {
//         this._pModelResource.addRef();

//         var pContainer = this.meshContainer();

//         if (pContainer && pContainer.pSkinInfo) {
//             this._nTotalBoneMatrices = pContainer.pSkinInfo.getNumBones();
//             this._pBoneMatrixList = GEN_ARRAY(Matrix4, this._nTotalBoneMatrices);
//         }

//         this.accessLocalBounds().eq(pModel.boundingBox());
//     }
// };

// SceneModel.prototype.meshContainer = function () {
//     INLINE();
//     if (this._pModelResource) {
//         return this._pModelResource.frame(this._iModelFrameIndex).pMeshContainer;
//     }
//     else {
//         return null;
//     }
// };


// a.SceneModel = SceneModel;

function SceneModel(pEngine, pMesh) {
    A_CLASS;

    /**
     * @private
     * @type Uint
     * Frame index.
     */
    this._iModelFrameIndex = 0;
    this._hModelHandle = 0;
    this._pMeshes = new Array(1);

    if (pMesh) {
        this.addMesh(pMesh);
    }
}

EXTENDS(SceneModel, a.SceneObject);

/**
 * create resource.
 */
SceneModel.prototype.create = function () {
    parent.create(this);
};


/**
 * destroy resource.
 */
SceneModel.prototype.destroy = function () {
    this._iModelFrameIndex = 0;

    safe_delete(this._pMesh);
    parent.destroy(this);
};

SceneModel.prototype.destructor = function () {
    'use strict';   
    this.destroy();
};

SceneModel.prototype.prepareForRender = function () {
   
};

SceneModel.prototype.render = function () {
    parent.render(this);

    //------------------------------------------------
    //Temprary render..
    if (this.bNoRender) {
        return;
    }

    var pEngine = this._pEngine;
    var pCamera = pEngine._pDefaultCamera;
    var pMesh = this.findMesh();
    var pProgram = null;
    var pDevice = pEngine.pDevice;
    var pModel = this;

    if (!pMesh) {
        return;
    }

    if (pMesh[0].data.useAdvancedIndex()) {
        pProgram = pEngine.pDrawMeshI2IProg;
    }
    else {
        pProgram = pEngine.pDrawMeshProg;
    }

    pProgram.activate();
    pDevice.enableVertexAttribArray(0);
    pDevice.enableVertexAttribArray(1);
    pDevice.enableVertexAttribArray(2);

    if (pMesh[0].data.useAdvancedIndex()) {
        pProgram.applyFloat('INDEX_INDEX_POSITION_OFFSET', 0);
        pProgram.applyFloat('INDEX_INDEX_NORMAL_OFFSET', 1);
        pProgram.applyFloat('INDEX_INDEX_FLEXMAT_OFFSET', 2);
    }
    
    pProgram.applyMatrix4('model_mat', pModel.worldMatrix());
    pProgram.applyMatrix4('proj_mat', pCamera.projectionMatrix());
    pProgram.applyMatrix4('view_mat', pCamera.viewMatrix());
    pProgram.applyMatrix3('normal_mat', pModel.normalMatrix());
    pProgram.applyVector3('eye_pos', pCamera.worldPosition());
        
    pMesh.draw();

    //------------------------------------------------

    // var pDisplayManager = this._pEngine.pDisplayManager;
    // var pMeshSubset = null;

    // for (var i = 0, nSubsets = this._pMesh._pSubsets.length; i < nSubsets; i ++) {
    //     pMeshSubset = this._pMesh._pSubsets[i];

    //     if (!pMeshSubset.isRenderable()) {
    //         continue;
    //     }

    //     var pEffect = pMeshSubset.effect;
    //     var pMaterial = pMeshSubset.surfaceMaterial;
    //     var nPasses = pEffect.totalPasses();

    //     for (var iPass = 0; iPass < nPasses; iPass++) {
    //         var pRenderEntry = pDisplayManager.openRenderQueue();
    //         //TODO: использовать правильные параметры для занесения объекта в очередь.
    //         pRenderEntry.pRendarableObject = pMeshSubset;
    //         pRenderEntry.boneCount = 0;
    //         pRenderEntry.detailLevel = 0;
    //         pRenderEntry.modelType = a.RenderEntry.modelEntry;
    //         pRenderEntry.hModel = this._hModelHandle
    //         pRenderEntry.modelParamA = this._iModelFrameIndex;
    //         pRenderEntry.modelParamB = pMaterial.resourceHandle();
    //         pRenderEntry.renderPass = iPass;
    //         pRenderEntry.pSceneNode = this;
    //         pRenderEntry.userData = 0;

    //         pDisplayManager.closeRenderQueue(pRenderEntry);
    //     }
    // } 
};

SceneModel.prototype.renderCallback = function (pEntry, iActivationFlags) {
    return;
    // if we queued ourselved for rendering with the
    // display manager, we will get this function
    // called when it is our turn to render

    // activationFlags contains a set of bit flags
    // held in the eActivationFlagBits enum (render_queue.h)
    // which tell us what resources we need to activate
    // in order to render ourselves.
    //profile_scope(cTerrainSystem_renderSection);
    var pMeshContainer = this.meshContainer();
    var hasSkinModel = pMeshContainer.pSkinInfo != null;

    var iMaterial = pEntry.userData;
    var pMethod = pMeshContainer.ppRenderMethodList[iMaterial];
    var pEffect = pMethod.getEffect(this._pEngine.getCurrentRenderStage());
    var pMaterial = pMethod.getMaterial(this._pEngine.getCurrentRenderStage());

    var bDeactivatePass = false;

    if (pEffect && pMaterial) {
        // do we need to activate the render pass?
        if (TEST_BIT(iActivationFlags, a.RenderQueue.activateRenderMethodPass)
            || TEST_BIT(iActivationFlags, a.RenderQueue.activateRenderMethodParam)
            || TEST_BIT(iActivationFlags, a.RenderQueue.activateRenderMethodLOD)) {
            this._pModelResource.setLOD(this._iLod);
            if (hasSkinModel) {
                nBoneInfluences = pMeshContainer.nBoneInfluences - 1;
                pEffect.setParameter(a.EffectResource.boneInfluenceCount, nBoneInfluences);
            }
            pEffect.activatePass(pEntry.renderPass);
            bDeactivatePass = true;
        }

        // do we need to activate the render method?
        if (TEST_BIT(iActivationFlags, a.RenderQueue.activateRenderMethod)) {
            pEffect.begin();
        }

        // do we need to activate the surface material
        if (TEST_BIT(iActivationFlags, a.RenderQueue.activateSurfaceMaterial)) {
            pEffect.applySurfaceMaterial(pMaterial);
        }

        
        var pCamera = this._pEngine.getActiveCamera();
        var m3fWorldViewProj = this._m3fWorldViewProj;
        Mat4.mult(pCamera.viewProjMatrix(), this.worldMatrix(), m3fWorldViewProj);
        // set the view matrix
        //console.log(this.worldMatrix());
        pEffect.setMatrix(a.EffectResource.worldViewProjMatrix, m3fWorldViewProj);
        pEffect.applyCameraMatrices(pCamera);
        
        pEffect.setMatrix(a.EffectResource.worldMatrix, this.worldMatrix());
        pEffect.setMatrix(a.EffectResource.normalMatrix, this.normalMatrix());

        var pMesh = pMeshContainer.pMeshData.pMesh;
        pEffect.applyVertexBuffer(pMesh.getVertexBuffer());
        pMesh.getIndexBuffer().activate();

        if (bDeactivatePass) {
            pEffect.deactivatePass();
        }

        // draw the mesh subset
        this._pModelResource.renderModelSubset(pEntry.modelParamA, pEntry.modelParamB);
    }
};


// /**
//  *
//  * @tparam ModelResource pModel
//  * @tparam Uint iFrameIndex
//  */
// SceneModel.prototype.setModelResource = function (pModel, iFrameIndex) {
//     safe_release(this._pModelResource);
//     iFrameIndex = iFrameIndex || 0;

//     this._nTotalBoneMatrices = 0;
//     this._iModelFrameIndex = iFrameIndex;
//     this._pModelResource = pModel;

//     if (this._pModelResource) {
//         this._pModelResource.addRef();

//         this.accessLocalBounds().eq(this.boundingBox());
//     }
// };

SceneModel.prototype.addMesh = function (pMesh) {
    'use strict';
    if (!pMesh) {
        return false;
    }
    this._pMeshes[0] = pMesh;
    return true;
};

SceneModel.prototype.findMesh = function (iMesh) {
    'use strict';
    iMesh = iMesh || 0;
    return this._pMeshes[iMesh];
};

A_NAMESPACE(SceneModel);

