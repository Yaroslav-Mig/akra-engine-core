﻿/// <reference path="../idl/ILPPViewport.ts" />
/// <reference path="Viewport.ts" />
/// <reference path="../scene/Scene3d.ts" />
/// <reference path="DSUniforms.ts" />

module akra.render {
	import Vec2 = math.Vec2;
	import Vec3 = math.Vec3;
	import Vec4 = math.Vec4;
	import Mat4 = math.Mat4;

	import Color = color.Color;

	var pDepthPixel: IPixelBox = new pixelUtil.PixelBox(new geometry.Box(0, 0, 1, 1), EPixelFormats.FLOAT32_DEPTH, new Uint8Array(4 * 1));
	var pFloatColorPixel: IPixelBox = new pixelUtil.PixelBox(new geometry.Box(0, 0, 1, 1), EPixelFormats.FLOAT32_RGBA, new Uint8Array(4 * 4));
	var pColor: IColor = new Color(0);

	export class LPPViewport extends Viewport implements ILPPViewport {
		/** Buffer with normal, shininess and objectID */
		private _pNormalBufferTexture: ITexture = null;
		/** Depth buffer of scene */
		private _pDepthBufferTexture: ITexture = null;

		/** 
		* 0 - Diffuse and specular 
		* 1 - Ambient and shadow
		*/
		private _pLightBufferTextures: ITexture[] = null;
		/** Resyult of LPP with out posteffects */
		private _pResultLPPTexture: ITexture = null;

		private _pViewScreen: IRenderableObject = null;
		private _pLightPoints: IObjectArray<ILightPoint> = null;
		private _v2fTextureRatio: IVec2 = null;
		private _v2fScreenSize: IVec2 = null;
		private _pLightingUnifoms: UniformMap = {
			omni: [],
			project: [],
			sun: [],
			omniShadows: [],
			projectShadows: [],
			sunShadows: [],
			textures: [],
			samplersOmni: [],
			samplersProject: [],
			samplersSun: []
		};

		private _pHighlightedObject: IRIDPair = { object: null, renderable: null };
		
		constructor(pCamera: ICamera, fLeft: float = 0., fTop: float = 0., fWidth: float = 1., fHeight: float = 1., iZIndex: int = 0) {
			super(pCamera, null, fLeft, fTop, fWidth, fHeight, iZIndex);
		}
		
		getType(): EViewportTypes {
			return EViewportTypes.LPPVIEWPORT;
		} 

		getView(): IRenderableObject {
			return this._pViewScreen;
		}

		getDepthTexture(): ITexture {
			return this._pDepthBufferTexture;
		}
		
		getEffect(): IEffect {
			return this.getView().getRenderMethodDefault().getEffect();
		}

		_setTarget(pTarget: IRenderTarget): void {
			super._setTarget(pTarget);

			//common api access
			var pEngine: IEngine = pTarget.getRenderer().getEngine();
			var pResMgr: IResourcePoolManager = pEngine.getResourceManager();

			//renderable for displaying result from deferred textures
			this._pViewScreen = new Screen(pEngine.getRenderer());

			//unique idetifier for creation dependent resources
			var iGuid: int = this.guid;

			//Float point texture must be power of two.
			var iWidth: uint = math.ceilingPowerOfTwo(this.getActualWidth());
			var iHeight: uint = math.ceilingPowerOfTwo(this.getActualHeight());

			//detect max texture resolution correctly
			if (config.WEBGL) {
				iWidth = math.min(iWidth, webgl.maxTextureSize);
				iHeight = math.min(iHeight, webgl.maxTextureSize);
			}

			this.createNormalBufferRenderTarget(iWidth, iHeight);
			this.createLightBuffersRenderTargets(iWidth, iHeight);
			this.createResultLPPRenderTarget(iWidth, iHeight);

			this._v2fTextureRatio = new math.Vec2(this.getActualWidth() / this._pNormalBufferTexture.getWidth(), this.getActualHeight() / this._pNormalBufferTexture.getHeight());
			this._v2fScreenSize = new Vec2(this.getActualWidth(), this.getActualHeight());

			//creatin deferred effects
			this._pViewScreen.switchRenderMethod(null);
			this._pViewScreen.getEffect().addComponent("akra.system.texture_to_screen");

			//this._pViewScreen.getEffect().addComponent("akra.system.fxaa");

			if (this._pViewScreen.addRenderMethod(".prepare_diffuse_specular", "passA")) {
				var pLPPEffect: IEffect = this._pViewScreen.getRenderMethodByName("passA").getEffect();
				pLPPEffect.addComponent("akra.system.prepare_lpp_lights_base");
				pLPPEffect.addComponent("akra.system.prepare_lpp_lights_omni");

				this._pViewScreen.getRenderMethodByName("passA").setForeign("prepareOnlyPosition", false);
			}
			else {
				logger.critical("Cannot initialize LPPViewport(problem with 'prepare_diffuse_specular' pass)");
			}

			if (this._pViewScreen.addRenderMethod(".prepare_ambient_shadow", "passB")) {
				var pLPPEffect: IEffect = this._pViewScreen.getRenderMethodByName("passB").getEffect();
				pLPPEffect.addComponent("akra.system.prepare_lpp_lights_base");
				pLPPEffect.addComponent("akra.system.prepare_lpp_lights_omni_ambient");

				this._pViewScreen.getRenderMethodByName("passB").setForeign("prepareOnlyPosition", true);
			}
			else {
				logger.critical("Cannot initialize LPPViewport(problem with 'prepare_ambient_shadow' pass)");
			}

			this.setDepthParams(false, false, 0);

			this.setFXAA(true);
		}

		setCamera(pCamera: ICamera): boolean {
			var isOk = super.setCamera(pCamera);
			this._pNormalBufferTexture.getBuffer().getRenderTarget().getViewport(0).setCamera(pCamera);
			return isOk;
		}

		getObject(x: uint, y: uint): ISceneObject {
			return this.getTarget().getRenderer().getEngine().getComposer()._getObjectByRid(this._getRenderId(x, y));
		}

		getRenderable(x: uint, y: uint): IRenderableObject {
			return this.getTarget().getRenderer().getEngine().getComposer()._getRenderableByRid(this._getRenderId(x, y));
		}

		pick(x: uint, y: uint): IRIDPair {
			var pComposer: IAFXComposer = this.getTarget().getRenderer().getEngine().getComposer();
			var iRid: int = this._getRenderId(x, y);
			var pObject: ISceneObject = pComposer._getObjectByRid(iRid);
			var pRenderable: IRenderableObject = null;

			if (isNull(pObject) || !pObject.isFrozen()) {
				pRenderable = pComposer._getRenderableByRid(iRid);
			}
			else {
				pObject = null;
			}

			return { renderable: pRenderable, object: pObject };
		}

		_getRenderId(x: int, y: int): int {
			logger.assert(x < this.getActualWidth() && y < this.getActualHeight(),
				"invalid pixel: {" + x + "(" + this.getActualWidth() + ")" + ", " + y + "(" + this.getActualHeight() + ")" + "}");

			var pColorTexture: ITexture = this._pNormalBufferTexture;

			//depth texture has POT sized, but viewport not;
			//depth texture attached to left bottom angle of viewport
			y = pColorTexture.getHeight() - y - 1;
			pFloatColorPixel.left = x;
			pFloatColorPixel.top = y;
			pFloatColorPixel.right = x + 1;
			pFloatColorPixel.bottom = y + 1;

			pColorTexture.getBuffer(0, 0).readPixels(pFloatColorPixel);

			return pFloatColorPixel.getColorAt(pColor, 0, 0).a;
		}

		_updateDimensions(bEmitEvent: boolean = true): void {
			super._updateDimensions(false);

			if (isDefAndNotNull(this._pNormalBufferTexture)) {
				this.updateRenderTextureDimensions(this._pNormalBufferTexture);
				this.updateRenderTextureDimensions(this._pLightBufferTextures[0]);
				this.updateRenderTextureDimensions(this._pLightBufferTextures[1]);
				this.updateRenderTextureDimensions(this._pResultLPPTexture);

				this._pDepthBufferTexture.reset(math.ceilingPowerOfTwo(this.getActualWidth()), math.ceilingPowerOfTwo(this.getActualHeight()));

				this._v2fTextureRatio.set(this.getActualWidth() / this._pNormalBufferTexture.getWidth(), this.getActualHeight() / this._pNormalBufferTexture.getHeight());
				this._v2fScreenSize.set(this.getActualWidth(), this.getActualHeight());
			}

			if (bEmitEvent) {
				this.viewportDimensionsChanged.emit();
			}
		}

		_updateImpl(): void {
			var pRenderer: IRenderer = this.getTarget().getRenderer();

			this.prepareForLPPShading();
			//prepare normal buffer texture
			this._pNormalBufferTexture.getBuffer().getRenderTarget().update();

			//camera last viewport changed, because camera used in normal buffer textures updating
			this._pCamera._keepLastViewport(this);

			//render light map
			var pLights: IObjectArray<ILightPoint> = <IObjectArray<any>>this.getCamera().display(scene.Scene3d.DL_LIGHTING);

			//for (var i: int = 0; i < pLights.getLength(); i++) {
			//	pLights.value(i)._calculateShadows();
			//}

			this._pLightPoints = pLights;

			//render deferred
			this._pViewScreen.render(this._pLightBufferTextures[0].getBuffer().getRenderTarget().getViewport(0), "passA");
			//pRenderer.executeQueue(false);

			this._pViewScreen.render(this._pLightBufferTextures[1].getBuffer().getRenderTarget().getViewport(0), "passB");
			pRenderer.executeQueue(false);

			this._pCamera._keepLastViewport(this);

			this._pResultLPPTexture.getBuffer().getRenderTarget().update();

			this._pViewScreen.render(this);
			this._pCamera._keepLastViewport(this);
			//this.renderAsNormal("apply_lpp_shading", this.getCamera());
		}

		setFXAA(bValue: boolean = true): void {
			var pEffect: IEffect = this.getEffect();

			if (bValue) {
				pEffect.addComponent("akra.system.fxaa", 2, 0);
			}
			else {
				pEffect.delComponent("akra.system.fxaa", 2, 0);
			}
		}

		isFXAA(): boolean {
			return this.getEffect().hasComponent("akra.system.fxaa");
		}

		highlight(iRid: int): void;
		highlight(pObject: ISceneObject, pRenderable?: IRenderableObject): void;
		highlight(pPair: IRIDPair): void;
		highlight(a): void {
			var pComposer: IAFXComposer = this.getTarget().getRenderer().getEngine().getComposer();
			var pEffect: IEffect = this.getEffect();
			var iRid: int = 0;
			var p: IRIDPair = this._pHighlightedObject;
			var pObjectPrev: ISceneObject = p.object;

			if (isNull(arguments[0])) {
				p.object = null;
				p.renderable = null;
			}
			else if (isInt(arguments[0])) {
				iRid = a;
				p.object = pComposer._getObjectByRid(iRid);
				p.renderable = pComposer._getRenderableByRid(iRid);
			}
			else if (arguments[0] instanceof akra.scene.SceneObject) {
				p.object = arguments[0];
				p.renderable = arguments[1];
			}
			else {
				p.object = arguments[0].object;
				p.renderable = arguments[0].renderable;
			}

			if (p.object && isNull(pObjectPrev)) {
				pEffect.addComponent("akra.system.outline", 1, 0);
			}
			else if (isNull(p.object) && pObjectPrev) {
				pEffect.delComponent("akra.system.outline", 1, 0);
			}
		}

		_onLightMapRender(pViewport: IViewport, pTechnique: IRenderTechnique, iPass: uint, pRenderable: IRenderableObject, pSceneObject: ISceneObject): void {
			var pPass: IRenderPass = pTechnique.getPass(iPass);

			pPass.setTexture("LPP_DEPTH_BUFFER_TEXTURE", this._pDepthBufferTexture);
			pPass.setTexture("LPP_NORMAL_BUFFER_TEXTURE", this._pNormalBufferTexture);
			pPass.setUniform("SCREEN_TEXTURE_RATIO", this._v2fTextureRatio);

			var pLightUniforms: UniformMap = this._pLightingUnifoms;
			var pLightPoints: IObjectArray<ILightPoint> = this._pLightPoints;
			var pCamera: ICamera = this.getCamera();

			this.createLightingUniforms(pCamera, pLightPoints, pLightUniforms);

			pPass.setForeign("nOmni", pLightUniforms.omni.length);
			pPass.setStruct("points_omni", pLightUniforms.omni);
		}

		_onObjectsRender(pViewport: IViewport, pTechnique: IRenderTechnique, iPass: uint, pRenderable: IRenderableObject, pSceneObject: ISceneObject): void {
			var pPass: IRenderPass = pTechnique.getPass(iPass);

			pPass.setUniform("SCREEN_TEXTURE_RATIO", this._v2fTextureRatio);
			pPass.setTexture("LPP_LIGHT_BUFFER_A", this._pLightBufferTextures[0]);
			pPass.setTexture("LPP_LIGHT_BUFFER_B", this._pLightBufferTextures[1]);
			pPass.setUniform("SCREEN_SIZE", this._v2fScreenSize);
		}

		_onRender(pTechnique: IRenderTechnique, iPass: uint, pRenderable: IRenderableObject, pSceneObject: ISceneObject): void {
			var pPass: IRenderPass = pTechnique.getPass(iPass);

			switch (iPass) {
				case 0:
					pPass.setUniform("VIEWPORT", math.Vec4.temp(0., 0., this._v2fTextureRatio.x, this._v2fTextureRatio.y));
					pPass.setTexture("TEXTURE_FOR_SCREEN", this._pResultLPPTexture);
					break;
				case 1:
					pPass.setTexture("OBJECT_ID_TEXTURE", this._pNormalBufferTexture);
					//outline
					var p: IRIDPair = this._pHighlightedObject;

					if (!isNull(p.object)) {
						var iRid: int = this.getTarget().getRenderer().getEngine().getComposer()._calcRenderID(p.object, p.renderable);

						pPass.setUniform("OUTLINE_TARGET", iRid);
						pPass.setUniform("OUTLINE_SOID", (iRid - 1) >>> 10);
						pPass.setUniform("OUTLINE_REID", (iRid - 1) & 1023);
					}

					pPass.setUniform("SCREEN_TEXTURE_RATIO", this._v2fTextureRatio);
					break;
			}

			super._onRender(pTechnique, iPass, pRenderable, pSceneObject);
		}

		endFrame(): void {
			this.getTarget().getRenderer().executeQueue(false);
		}


		getDepth(x: int, y: int): float {
			logger.assert(x < this.getActualWidth() && y < this.getActualHeight(), "invalid pixel: {" + x + ", " + y + "}");

			var pDepthTexture: ITexture = this._pDepthBufferTexture;

			y = pDepthTexture.getHeight() - y - 1;
			pDepthPixel.left = x;
			pDepthPixel.top = y;
			pDepthPixel.right = x + 1;
			pDepthPixel.bottom = y + 1;

			pDepthTexture.getBuffer(0, 0).readPixels(pDepthPixel);

			return pDepthPixel.getColorAt(pColor, 0, 0).r;
		}
		
		private createNormalBufferRenderTarget(iWidth: uint, iHeight: uint): void {
			var pEngine: IEngine = this._pTarget.getRenderer().getEngine();
			var pResMgr: IResourcePoolManager = pEngine.getResourceManager();

			var pNormalBufferTexture: ITexture = pResMgr.createTexture("lpp-normal-buffer-" + this.guid);
			var pRenderTarget: IRenderTarget = null;
			var pViewport: IViewport = null;

			pNormalBufferTexture.create(iWidth, iHeight, 1, null, ETextureFlags.RENDERTARGET, 0, 0,
				ETextureTypes.TEXTURE_2D, EPixelFormats.FLOAT32_RGBA);
			pRenderTarget = pNormalBufferTexture.getBuffer().getRenderTarget();
			pRenderTarget.setAutoUpdated(false);
			pViewport = pRenderTarget.addViewport(new Viewport(this.getCamera(), "lpp_normal_pass",
				0, 0, this.getActualWidth() / pNormalBufferTexture.getWidth(), this.getActualHeight() / pNormalBufferTexture.getHeight()));

			var pDepthTexture = pResMgr.createTexture(".lpp-depth-buffer-" + this.guid);
			pDepthTexture.create(iWidth, iHeight, 1, null, 0, 0, 0, ETextureTypes.TEXTURE_2D, EPixelFormats.DEPTH32);
			pDepthTexture.setFilter(ETextureParameters.MAG_FILTER, ETextureFilters.LINEAR);
			pDepthTexture.setFilter(ETextureParameters.MIN_FILTER, ETextureFilters.LINEAR);

			pRenderTarget.attachDepthTexture(pDepthTexture);

			this._pNormalBufferTexture = pNormalBufferTexture;
			this._pDepthBufferTexture = pDepthTexture;
		}

		private createLightBuffersRenderTargets(iWidth: uint, iHeight: uint): void {
			var pEngine: IEngine = this._pTarget.getRenderer().getEngine();
			var pResMgr: IResourcePoolManager = pEngine.getResourceManager();

			var pRenderTarget: IRenderTarget = null;
			var pViewport: IViewport = null;
			var pLightMapTexture: ITexture = null;

			this._pLightBufferTextures = new Array(2);

			for (var i: uint = 0; i < 2; i++) {
				pLightMapTexture = pResMgr.createTexture("lpp-light-buffer-" + i + "-" + this.guid);
				pLightMapTexture.create(iWidth, iHeight, 1, null, ETextureFlags.RENDERTARGET, 0, 0,
					ETextureTypes.TEXTURE_2D, EPixelFormats.FLOAT32_RGBA);
				pRenderTarget = pLightMapTexture.getBuffer().getRenderTarget();
				pRenderTarget.setAutoUpdated(false);
				pViewport = pRenderTarget.addViewport(new Viewport(this.getCamera(), null,
					0, 0, this.getActualWidth() / pLightMapTexture.getWidth(), this.getActualHeight() / pLightMapTexture.getHeight()));

				pViewport.render.connect(this, this._onLightMapRender);
				this._pLightBufferTextures[i] = pLightMapTexture;
			}
		}

		private createResultLPPRenderTarget(iWidth: uint, iHeight: uint): void {
			var pEngine: IEngine = this._pTarget.getRenderer().getEngine();
			var pResMgr: IResourcePoolManager = pEngine.getResourceManager();

			var pRenderTarget: IRenderTarget = null;
			var pViewport: IViewport = null;

			this._pResultLPPTexture = pResMgr.createTexture("resultr-lpp-texture-" + this.guid);
			this._pResultLPPTexture.create(iWidth, iHeight, 1, null, ETextureFlags.RENDERTARGET, 0, 0,
				ETextureTypes.TEXTURE_2D, EPixelFormats.R8G8B8A8);
			pRenderTarget = this._pResultLPPTexture.getBuffer().getRenderTarget();
			pRenderTarget.setAutoUpdated(false);
			pRenderTarget.attachDepthTexture(this._pDepthBufferTexture);
			pViewport = pRenderTarget.addViewport(new Viewport(this.getCamera(), "apply_lpp_shading",
				0, 0, this.getActualWidth() / this._pResultLPPTexture.getWidth(), this.getActualHeight() / this._pResultLPPTexture.getHeight()));
			pViewport.setClearEveryFrame(true, EFrameBufferTypes.COLOR);
			pViewport.setDepthParams(true, false, ECompareFunction.EQUAL);

			pViewport.render.connect(this, this._onObjectsRender);
		}

		private updateRenderTextureDimensions(pTexture: ITexture) {
			pTexture.reset(math.ceilingPowerOfTwo(this.getActualWidth()), math.ceilingPowerOfTwo(this.getActualHeight()));
			pTexture.getBuffer().getRenderTarget().getViewport(0).setDimensions(0., 0., this.getActualWidth() / pTexture.getWidth(), this.getActualHeight() / pTexture.getHeight());
		}

		private prepareForLPPShading(): void {
			var pNodeList: IObjectArray<ISceneObject> = this.getCamera().display();

			for (var i: int = 0; i < pNodeList.getLength(); ++i) {
				var pSceneObject: ISceneObject = pNodeList.value(i);

				for (var k: int = 0; k < pSceneObject.getTotalRenderable(); k++) {
					var pRenderable: IRenderableObject = pSceneObject.getRenderable(k);
					var pTechCurr: IRenderTechnique = pRenderable.getTechniqueDefault();

					var sMethod: string = "lpp_normal_pass";
					var pTechnique: IRenderTechnique = null;

					if (isNull(pRenderable.getTechnique(sMethod))) {
						if (!pRenderable.addRenderMethod(pRenderable.getRenderMethodByName(), sMethod)) {
							logger.critical("cannot create render method for first pass of LPP");
						}

						pTechnique = pRenderable.getTechnique(sMethod);
						pTechnique.render._syncSignal(pTechCurr.render);
						pTechnique.addComponent("akra.system.prepare_lpp_geometry");

						var iTotalPasses = pTechnique.getTotalPasses();
						for (var i: uint = 0; i < iTotalPasses; i++) {
							pTechnique.getPass(i).setForeign("optimizeForLPPPrepare", true);
						}
					}

					sMethod = "apply_lpp_shading";

					if (isNull(pRenderable.getTechnique(sMethod))) {
						if (!pRenderable.addRenderMethod(pRenderable.getRenderMethodByName(), sMethod)) {
							logger.critical("cannot create render method for first pass of LPP");
						}

						pTechnique = pRenderable.getTechnique(sMethod);
						pTechnique.render._syncSignal(pTechCurr.render);
						pTechnique.addComponent("akra.system.apply_lpp_shading");
					}
				}
			}
		}



		protected createLightingUniforms(pCamera: ICamera, pLightPoints: IObjectArray<ILightPoint>, pUniforms: UniformMap): void {
			var pLight: ILightPoint;
			var pOmniLight: IOmniLight;
			var pProjectLight: IProjectLight;
			var pSunLight: ISunLight;
			var i: int, j: int;
			var pUniformData: IUniform;
			var pCameraView: IMat4 = pCamera.getViewMatrix();

			var v4fLightPosition: IVec4 = Vec4.temp();
			var v3fLightTransformPosition: IVec3 = Vec3.temp();
			var v4fTemp: IVec4 = Vec4.temp();

			var pShadowCaster: IShadowCaster;
			var m4fShadow: IMat4, m4fToLightSpace: IMat4;

			var iLastTextureIndex: int = 0;
			var sTexture: string = "TEXTURE";
			var pEngine: IEngine = this.getTarget().getRenderer().getEngine();

			this.resetUniforms();

			for (i = 0; i < pLightPoints.getLength(); i++) {
				pLight = pLightPoints.value(i);

				//all cameras in list already enabled
				// if (!pLight.enabled) {
				//     continue;
				// }

				v4fLightPosition.set(pLight.getWorldPosition(), 1.);
				pCameraView.multiplyVec4(v4fLightPosition, v4fTemp);
				v3fLightTransformPosition.set(v4fTemp.x, v4fTemp.y, v4fTemp.z);

				if (pLight.getLightType() === ELightTypes.OMNI) {

					pOmniLight = <IOmniLight>pLight;

					if (pLight.isShadowCaster()) {
						pUniformData = UniformOmniShadow.temp();
						(<UniformOmniShadow>pUniformData).setLightData(<IOmniParameters>pLight.getParams(), v3fLightTransformPosition);

						var pDepthCube: ITexture[] = pOmniLight.getDepthTextureCube();
						var pShadowCasterCube: IShadowCaster[] = pOmniLight.getShadowCaster();

						for (j = 0; j < 6; ++j) {
							pShadowCaster = pShadowCasterCube[j];
							m4fToLightSpace = pShadowCaster.getViewMatrix().multiply(pCamera.getWorldMatrix(), Mat4.temp());
							pUniforms.textures.push(pDepthCube[j]);
							sTexture = "TEXTURE" + (pUniforms.textures.length - 1);

							(<UniformOmniShadow>pUniformData).setSampler(sTexture, j);
							pUniforms.samplersOmni.push((<UniformOmniShadow>pUniformData).SHADOW_SAMPLER[j]);
							(<UniformOmniShadow>pUniformData).setMatrix(m4fToLightSpace, pShadowCaster.getOptimizedProjection(), j);
						}

						pUniforms.omniShadows.push(<UniformOmniShadow>pUniformData);
					}
					else {
						pUniformData = UniformOmni.temp();
						(<UniformOmni>pUniformData).setLightData(<IOmniParameters>pLight.getParams(), v3fLightTransformPosition);
						pUniforms.omni.push(<UniformOmni>pUniformData);
					}
				}
				else if (pLight.getLightType() === ELightTypes.PROJECT) {
					pProjectLight = <IProjectLight>pLight;
					pShadowCaster = pProjectLight.getShadowCaster();

					if (pLight.isShadowCaster() && pShadowCaster.isShadowCasted()) {
						pUniformData = UniformProjectShadow.temp();
						(<UniformProjectShadow>pUniformData).setLightData(<IProjectParameters>pLight.getParams(), v3fLightTransformPosition);

						m4fToLightSpace = pShadowCaster.getViewMatrix().multiply(pCamera.getWorldMatrix(), Mat4.temp());
						pUniforms.textures.push(pProjectLight.getDepthTexture());
						sTexture = "TEXTURE" + (pUniforms.textures.length - 1);

						(<UniformProjectShadow>pUniformData).setSampler(sTexture);
						pUniforms.samplersProject.push((<UniformProjectShadow>pUniformData).SHADOW_SAMPLER);
						(<UniformProjectShadow>pUniformData).setMatrix(m4fToLightSpace, pShadowCaster.getProjectionMatrix(), pShadowCaster.getOptimizedProjection());
						pUniforms.projectShadows.push(<UniformProjectShadow>pUniformData);
					}
					else {
						pUniformData = UniformProject.temp();
						(<UniformProject>pUniformData).setLightData(<IProjectParameters>pLight.getParams(), v3fLightTransformPosition);
						m4fShadow = pShadowCaster.getProjViewMatrix().multiply(pCamera.getWorldMatrix(), Mat4.temp());
						(<UniformProject>pUniformData).setMatrix(m4fShadow);
						pUniforms.project.push(<UniformProject>pUniformData);
					}

				}
				else if (pLight.getLightType() === ELightTypes.SUN) {
					pSunLight = <ISunLight>pLight;
					pShadowCaster = pSunLight.getShadowCaster();

					if (pLight.isShadowCaster()) {
						pUniformData = UniformSunShadow.temp();
						var pSkyDome: ISceneModel = pSunLight.getSkyDome();
						var iSkyDomeId: int = pEngine.getComposer()._calcRenderID(pSkyDome, pSkyDome.getRenderable(0), false);
						(<UniformSunShadow>pUniformData).setLightData(<ISunParameters>pLight.getParams(), iSkyDomeId);
						pUniforms.sunShadows.push(<UniformSunShadow>pUniformData);

						pUniforms.textures.push(pSunLight.getDepthTexture());
						sTexture = "TEXTURE" + (pUniforms.textures.length - 1);

						(<UniformSunShadow>pUniformData).setSampler(sTexture);
						pUniforms.samplersSun.push((<UniformSunShadow>pUniformData).SHADOW_SAMPLER);

						m4fToLightSpace = pShadowCaster.getViewMatrix().multiply(pCamera.getWorldMatrix(), Mat4.temp());
						(<UniformSunShadow>pUniformData).setMatrix(m4fToLightSpace, pShadowCaster.getOptimizedProjection());

					}
					else {
						pUniformData = UniformSun.temp();
						var pSkyDome: ISceneModel = pSunLight.getSkyDome();
						var iSkyDomeId: int = pEngine.getComposer()._calcRenderID(pSkyDome, pSkyDome.getRenderable(0), false);
						(<UniformSun>pUniformData).setLightData(<ISunParameters>pLight.getParams(), iSkyDomeId);
						pUniforms.sun.push(<UniformSun>pUniformData);
					}
				}
				else {
					logger.critical("Invalid light point type detected.");
				}
			}
		}

		private resetUniforms(): void {
			var pUniforms = this._pLightingUnifoms;
			pUniforms.omni.clear();
			pUniforms.project.clear();
			pUniforms.sun.clear();
			pUniforms.omniShadows.clear();
			pUniforms.projectShadows.clear();
			pUniforms.sunShadows.clear();
			pUniforms.textures.clear();
			pUniforms.samplersProject.clear();
			pUniforms.samplersOmni.clear();
			pUniforms.samplersSun.clear();
		}
	}
}