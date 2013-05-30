#ifndef CAMERA_TS
#define CAMERA_TS

#include "common.ts"
#include "IScene3d.ts"
#include "ICamera.ts"
#include "IViewport.ts"
#include "../SceneObject.ts"
#include "geometry/Frustum.ts"
#include "util/ObjectArray.ts"

module akra.scene.objects {
	export enum ECameraFlags {
		k_NewProjectionMatrix = 0,
		k_NewProjectionParams
	}

	export class DLTechnique {
		list: IDisplayList;
		camera: ICamera;

		private _pPrevResult: IObjectArray = null;

		constructor (pList: IDisplayList, pCamera: ICamera) {
			this.list = pList;
			this.camera = pCamera;
		}

		inline findObjects(pResultArray: IObjectArray, bQuickSearch: bool = false): IObjectArray {
			var pResult: IObjectArray = this.list._findObjects(this.camera, pResultArray,
					bQuickSearch && isDefAndNotNull(this._pPrevResult));

			if (isNull(this._pPrevResult)) {
				this._pPrevResult = pResult;
			}
			
			return this._pPrevResult;
		}
	}

	export class Camera extends SceneNode implements ICamera {
		/** camera type */
		protected _eCameraType: ECameraTypes = ECameraTypes.PERSPECTIVE;
		/** camera options */
		protected _iCameraOptions: int = 0;
		/** update projection bit flag */
		protected _iUpdateProjectionFlags: int = 0;
		
		/** 
		 * View matrix 
		 */
		protected _m4fView: IMat4 = new Mat4;
		/** internal, un-biased projection matrix */
		protected _m4fProj: IMat4 = new Mat4;
		/** internal, un-biased projection+view matrix */
		protected _m4fProjView: IMat4 = new Mat4;

		/** 
		 * Biased for use during current render stage 
		 * @deprecated
		 */
		//protected _m4fRenderStageProj: IMat4 = new Mat4;

		/**
		 * @deprecated
		 */
		//protected _m4fRenderStageProjView: IMat4 = new Mat4;

		/** Search rect for scene culling */
		protected _pSearchRect: IRect3d = new geometry.Rect3d();
		/** Position */
		protected _v3fTargetPos: IVec3 = new Vec3;

		/** Attributes for projection matrix */
		protected _fFOV: float = math.PI / 5.;
		protected _fAspect: float = 4. / 3.;
		protected _fNearPlane: float = 0.1;
		protected _fFarPlane: float = 500.;
		protected _fWidth: float = 0.;
		protected _fHeight: float = 0.;
		protected _fMinX: float = 0.;
		protected _fMaxX: float = 0.;
		protected _fMinY: float = 0.;
		protected _fMaxY: float = 0.;

		protected _pFrustum: IFrustum = new geometry.Frustum;

		protected _pLastViewport: IViewport = null;

		protected _pDLTechniques: DLTechnique[] = [];
		protected _pDLResultStorage: IObjectArray[] = [];

		// protected _pPrevObjects: ISceneNode[] = null;
		// protected _p

		inline get viewMatrix(): IMat4 { return this._m4fView; }
    	
    	inline get projectionMatrix(): IMat4 { return this._m4fProj; }
    	
    	inline get projViewMatrix(): IMat4 { return this._m4fProjView; }
    	
    	inline get targetPos(): IVec3 { return this._v3fTargetPos; }
    	
    	inline get fov(): float { return this._fFOV; }
    	inline set fov(fFOV: float) { 
    		this._fFOV = fFOV; 
    		TRUE_BIT(this._iUpdateProjectionFlags, ECameraFlags.k_NewProjectionParams);
    	}

    	inline get aspect(): float { return this._fAspect; }
    	inline set aspect(fAspect: float) { 
    		this._fAspect = fAspect; 
    		TRUE_BIT(this._iUpdateProjectionFlags, ECameraFlags.k_NewProjectionParams);
    	}

    	inline get nearPlane(): float { return this._fNearPlane; }
    	inline set nearPlane(fNearPlane: float) { 
    		this._fNearPlane = fNearPlane; 
    		TRUE_BIT(this._iUpdateProjectionFlags, ECameraFlags.k_NewProjectionParams);
    	}
    	
    	inline get farPlane(): float { return this._fFarPlane; }
    	inline set farPlane(fFarPlane: float) { 
    		this._fFarPlane = fFarPlane; 
    		TRUE_BIT(this._iUpdateProjectionFlags, ECameraFlags.k_NewProjectionParams);
    	}
    	
    	inline get viewDistance(): float { return this._fFarPlane - this._fNearPlane; }
    	inline get searchRect(): IRect3d { return this._pSearchRect; }
    	inline get frustum(): IFrustum { return this._pFrustum; }

		constructor (pScene: IScene3d, eType: EEntityTypes = EEntityTypes.CAMERA) {
			super(pScene, eType);
		};

		create(): bool {
			var isOK: bool = super.create();

			if (isOK) {
				this._v3fTargetPos.set(
					this._m4fLocalMatrix.data[__13], 
					this._m4fLocalMatrix.data[__23], 
					this._m4fLocalMatrix.data[__33]);
				this._v3fTargetPos.negate();

				this.recalcProjMatrix();
				this.recalcMatrices();

				var pScene: IScene3d = this._pScene;

				this.connect(pScene, SIGNAL(displayListAdded), SLOT(_addDisplayList));
				this.connect(pScene, SIGNAL(displayListRemoved), SLOT(_removeDisplayList));

				for (var i: uint = 0; i < pScene.totalDL; ++ i) {
					var pList: IDisplayList = pScene.getDisplayList(i);
					
					if (!isNull(pList)) {
						this._addDisplayList(pScene, pList, i);
					}
				}
			}

			return isOK;
		}

		inline isProjParamsNew(): bool {
			return TEST_BIT(this._iUpdateProjectionFlags, ECameraFlags.k_NewProjectionParams);
		}

		recalcProjMatrix(): void {
			//TODO: check proj matrix type --> this._eCameraType
			//now, temrary, supported on perspective proj
			this.setProjParams(this._fFOV, this._fAspect, this._fNearPlane, this._fFarPlane);
			CLEAR_BIT(this._iUpdateProjectionFlags, ECameraFlags.k_NewProjectionParams);
		}

		prepareForUpdate(): void {
			super.prepareForUpdate();

			//reset culling cache for all display lists
			// for (var i: int = 0; i < this._pDLTechniques.length; ++ i) {
			// 	if (this._pDLTechniques[i] != null) {
			// 		this._pDLTechniques.reset();
			// 	}
			// }
		}

		display(iList: uint = /*DL_DEFAULT*/0): IObjectArray {
			var pObjects: IObjectArray = this._pDLTechniques[iList].
								findObjects(this._pDLResultStorage[iList], !this.isUpdated());

			return pObjects;
		}

		inline _getLastResults(iList: uint = 0): IObjectArray {
			return this._pDLResultStorage[iList] || null;
		}

		setParameter(eParam: ECameraParameters, pValue: any): void {
			if (eParam === ECameraParameters.CONST_ASPECT && <bool>pValue) {
				SET_ALL(this._iCameraOptions, <int>eParam);
			}
		}

		isConstantAspect(): bool {
			return TEST_ANY(this._iCameraOptions, ECameraParameters.CONST_ASPECT);
		}
    	
    	setProjParams(fFOV: float, fAspect: float, fNearPlane: float, fFarPlane: float): void {
    		 // Set attributes for the projection matrix
		    this._fFOV = fFOV;
		    this._fAspect = fAspect;
		    this._fNearPlane = fNearPlane;
		    this._fFarPlane = fFarPlane;
		    this._eCameraType = ECameraTypes.PERSPECTIVE;

		    // create the regular projection matrix
		    Mat4.perspective(fFOV, fAspect, fNearPlane, fFarPlane, this._m4fProj);

		    // create a unit-space matrix 
		    // for sky box geometry.
		    // this ensures that the 
		    // near and far plane enclose 
		    // the unit space around the camera
		    // Mat4.perspective(fFOV, fAspect, 0.01, 2.0, this._m4fUnitProj);

		    TRUE_BIT(this._iUpdateProjectionFlags, ECameraFlags.k_NewProjectionMatrix);
    	}

    	setOrthoParams(fWidth: float, fHeight: float, fNearPlane: float, fFarPlane: float): void {
		    this._fWidth = fWidth;
		    this._fHeight = fHeight;
		    this._fNearPlane = fNearPlane;
		    this._fFarPlane = fFarPlane;
		    this._eCameraType = ECameraTypes.ORTHO;

		    // create the regular projection matrix
		    Mat4.orthogonalProjection(fWidth, fHeight, fNearPlane, fFarPlane, this._m4fProj);

		    // create a unit-space matrix 
		    // for sky box geometry.
		    // this ensures that the 
		    // near and far plane enclose 
		    // the unit space around the camera
		    // Mat4.matrixOrthoRH(fWidth, fHeight, 0.01, 2.0, this._m4fUnitProj);
		    
		    TRUE_BIT(this._iUpdateProjectionFlags, ECameraFlags.k_NewProjectionMatrix);
    	}

    	setOffsetOrthoParams(fMinX: float, fMaxX: float, fMinY: float, fMaxY: float, fNearPlane: float, fFarPlane: float): void {
    		this._fMinX = fMinX;
		    this._fMaxX = fMaxX;
		    this._fMinY = fMinY;
		    this._fMaxY = fMaxY;
		    this._fNearPlane = fNearPlane;
		    this._fFarPlane = fFarPlane;
		    this._eCameraType = ECameraTypes.OFFSET_ORTHO;

		    // create the regular projection matrix
		    Mat4.orthogonalProjectionAsymmetric(fMinX, fMaxX, fMinY, fMaxY,
		                                fNearPlane, fFarPlane, this._m4fProj);

		    // create a unit-space matrix 
		    // for sky box geometry.
		    // this ensures that the 
		    // near and far plane enclose 
		    // the unit space around the camera
		    // Mat4.orthogonalProjectionorthogonalProjectionAsymmetric(fMinX, fMaxX, fMinY, fMaxY,
		    //                             0.01, 2.0, this._m4fUnitProj);

		    TRUE_BIT(this._iUpdateProjectionFlags, ECameraFlags.k_NewProjectionMatrix);
    	}

    	private recalcMatrices(): void {
    		this._v3fTargetPos.set(
	        this._m4fLocalMatrix.data[__13], 
	        this._m4fLocalMatrix.data[__23],
	        this._m4fLocalMatrix.data[__33]);

		    this._v3fTargetPos.negate();

		    // the camera view matrix is the
		    // inverse of the world matrix
		    this._m4fView.set(this.inverseWorldMatrix);
		    // sky boxes use the inverse 
		    // world matrix of the camera (the
		    // camera view matrix) without 
		    // any translation information.

		    //this.m4fSkyBox.set(this.m4fView);
		    // this.m4fSkyBox.data[__14] = 0.0;
		    // this.m4fSkyBox.data[__24] = 0.0;
		    // this.m4fSkyBox.data[__34] = 0.0;

		    // this is combined with the unit
		    // space projection matrix to form
		    // the sky box viewing matrix
		    //this.m4fSkyBox.multiply(this.m4fUnitProj, this.m4fSkyBox);


		    // billboard objects use our world matrix
		    // without translation
		    // this.m4fBillboard.set(this.worldMatrix());
		    // this.m4fBillboard.data[__14] = 0.0;
		    // this.m4fBillboard.data[__24] = 0.0;
		    // this.m4fBillboard.data[__34] = 0.0;
    	}

    	update(): bool {
    		var isUpdated: bool = super.update();

    		if (this.isProjParamsNew()) {
    			this.recalcProjMatrix();
    		}

		    if (this.isWorldMatrixNew() || TEST_BIT(this._iUpdateProjectionFlags, ECameraFlags.k_NewProjectionMatrix)) {
		    	this._pFrustum.extractFromMatrix(this._m4fProj, this._m4fWorldMatrix, this._pSearchRect);
		    	// this._m4fRenderStageProj.set(this._m4fProj);

		    	if (this.isWorldMatrixNew()){
    				this.recalcMatrices();
    			}

		        // our projView matrix is the projection 
		        //matrix multiplied by the inverse of our world matrix  
		        this._m4fProj.multiply(this._m4fView, this._m4fProjView);
		        isUpdated = true;
		    
		        CLEAR_BIT(this._iUpdateProjectionFlags, ECameraFlags.k_NewProjectionMatrix);
		    }

		    return isUpdated;
    	}

		// applyRenderStageBias(iStage: int): void {
	 //    	var fZ_bias = iStage > 1 ? 0.001 : 0.0;

		//     this._m4fRenderStageProj.set(this._m4fProj);
		//     this._m4fRenderStageProjView.set(this._m4fProjView);

		//     this._m4fRenderStageProj[__34] -= fZ_bias;
		//     this._m4fRenderStageProjView[__34] -= fZ_bias;
	 //    }


    	_renderScene(pViewport: IViewport): void {
    		//update the pixel display ratio
			// if (this._eCameraType == ECameraTypes.PERSPECTIVE) {
			// 	mPixelDisplayRatio = (2. * math.tan(this._fFOV * 0.5)) / pViewport.actualHeight;
			// }
			// else {
			// 	mPixelDisplayRatio = (mTop - mBottom) / vp->getActualHeight();
			// }

			//notify prerender scene
			this.preRenderScene();


			pViewport.update();

			//notify postrender scene
			this.postRenderScene();
    	};


    	_keepLastViewport(pViewport: IViewport): void { this._pLastViewport = pViewport; }
    	_getLastViewport(): IViewport { return this._pLastViewport; }
    	_getNumRenderedFaces(): int { return 0; }
    	_notifyRenderedFaces(nFaces: uint): void {}

    	inline isActive(): bool {
    		return this._pLastViewport && this._pLastViewport.getCamera() === this;
    	}

    	toString(isRecursive: bool = false, iDepth: int = 0): string {
		    if (!isRecursive) {
		        return "<camera" + (this._sName? " " + this._sName: "") + ">";
		    }

		    return super.toString(isRecursive, iDepth);
    	};

    	projectPoint(v3fPoint: IVec3, v3fDestination?: IVec3): IVec3 {
			if(!isDef(v3fDestination)){
				v3fDestination = v3fPoint;
			}

			var m4fView: IMat4 = this.viewMatrix;
			var m4fProj: IMat4 = this.projectionMatrix;

			var v4fTmp: IVec4 = vec4(v3fPoint, 1.);

			v4fTmp = m4fProj.multiplyVec4(m4fView.multiplyVec4(v4fTmp));

			if(v4fTmp.w <= 0.){
				return null;
			}

			v3fDestination.set((v4fTmp.scale(1./v4fTmp.w)).xyz);

			var fX: float = math.abs(v3fDestination.x);
			var fY: float = math.abs(v3fDestination.y);
			var fZ: float = math.abs(v3fDestination.z);

			if(fX > 1 || fY > 1 || fZ > 1){
				return null;
			}

			return v3fDestination;
		};

    	_addDisplayList(pScene: IScene3d, pList: IDisplayList, index: uint): void {
    		this._pDLTechniques[index] = new DLTechnique(pList, this);
    		this._pDLResultStorage[index] = new util.ObjectArray();
    	};

    	_removeDisplayList(pScene: IScene3d, pList: IDisplayList, index: uint): void {
    		this._pDLTechniques[index] = null;
    		this._pDLResultStorage[index] = null;
    	};

		BROADCAST(preRenderScene, VOID);
		BROADCAST(postRenderScene, VOID);
	}

	export inline function isCamera(pNode: IEntity): bool {
		return pNode.type >= EEntityTypes.CAMERA && pNode.type <= EEntityTypes.SHADOW_CASTER;
	}
}

#endif