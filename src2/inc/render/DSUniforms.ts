#ifndef DSUNIFORMS_TS
#define DSUNIFORMS_TS

#include "ILightPoint.ts"
#include "IShaderInput.ts"
#include "fx/PassInputBlend.ts"


#define uniformOmni() UniformOmni.stackCeil
#define uniformProject() UniformProject.stackCeil
#define uniformSun() UniformSun.stackCeil
#define uniformProjectShadow() UniformProjectShadow.stackCeil
#define uniformOmniShadow() UniformOmniShadow.stackCeil
#define uniformSunShadow() UniformSunShadow.stackCeil

#define IShadowSampler IAFXSamplerState
#define ISampler2d IAFXSamplerState


module akra.render {
	export interface IUniform {

	}

	export struct LightData {
		DIFFUSE: IVec4 = new Vec4();
		AMBIENT: IVec4 = new Vec4();
		SPECULAR: IVec4 = new Vec4();
		POSITION: IVec3 = new Vec3();
		ATTENUATION: IVec3 = new Vec3();

		// set(pLightParam: IOmniParameters, v3fPosition: IVec3): LightData;
		// set(pLightParam: IProjectParameters, v3fPosition: IVec3): LightData;
		set(pLightParam: ILightParameters, v3fPosition: IVec3): LightData;
		set(pLightParam: any, v3fPosition: IVec3): LightData {
		    
		    this.DIFFUSE.set(pLightParam.diffuse);
		    this.AMBIENT.set(pLightParam.ambient);
		    this.SPECULAR.set(pLightParam.specular);
		    this.ATTENUATION.set(pLightParam.attenuation);
		    this.POSITION.set(v3fPosition);

		    return this;
		}
	};

	export struct UniformOmni implements IUniform {
		LIGHT_DATA: LightData = new LightData();

		setLightData(pLightParam: IOmniParameters, v3fPosition: IVec3): UniformOmni {
			this.LIGHT_DATA.set(pLightParam, v3fPosition);
			
			return this;
		}

		ALLOCATE_STORAGE(UniformOmni, 200);
	};

	export struct UniformProject implements IUniform {
		LIGHT_DATA: LightData = new LightData();
    	SHADOW_MATRIX: IMat4 = new Mat4();

    	setLightData(pLightParam: IProjectParameters, v3fPosition: IVec3): UniformProject {
			this.LIGHT_DATA.set(pLightParam, v3fPosition);
			
			return this;
		}

		setMatrix(m4fMatrix: IMat4): UniformProject {
			this.SHADOW_MATRIX.set(m4fMatrix);
			return this;
		}

    	ALLOCATE_STORAGE(UniformProject, 200);	
	};


	export struct UniformProjectShadow implements IUniform {
		LIGHT_DATA: LightData = new LightData();
	    TO_LIGHT_SPACE: IMat4 = new Mat4();
	    REAL_PROJECTION_MATRIX: IMat4 = new Mat4();
	    OPTIMIZED_PROJECTION_MATRIX: IMat4 = new Mat4();
	    SHADOW_SAMPLER: IAFXSamplerState = fx.createSamplerState();

	    setLightData(pLightParam: IProjectParameters, v3fPosition: IVec3): UniformProjectShadow {
	    	this.LIGHT_DATA.set(pLightParam, v3fPosition);
	    	return this;
	    }

	    setMatrix(m4fToLightSpace: IMat4, m4fRealProj: IMat4, m4fOptimizedProj: IMat4): UniformProjectShadow {
	    	this.TO_LIGHT_SPACE.set(m4fToLightSpace);
		    this.REAL_PROJECTION_MATRIX.set(m4fRealProj);
		    this.OPTIMIZED_PROJECTION_MATRIX.set(m4fOptimizedProj);

	    	return this;
	    }

	    setSampler(sTexture: string): UniformProjectShadow {
	    	this.SHADOW_SAMPLER.textureName = sTexture;
	    	return this;
	    }

	    ALLOCATE_STORAGE(UniformProjectShadow, 20);
	}

	export struct UniformOmniShadow implements IUniform {
		LIGHT_DATA: LightData = new LightData;
		TO_LIGHT_SPACE: IMat4[] = 
		[
			new Mat4, new Mat4, new Mat4, 
			new Mat4, new Mat4, new Mat4
		];

		OPTIMIZED_PROJECTION_MATRIX: IMat4[] = 
		[
			new Mat4, new Mat4, new Mat4, 
			new Mat4, new Mat4, new Mat4
		];
		
		SHADOW_SAMPLER: IAFXSamplerState[] = 
		[
			fx.createSamplerState(), fx.createSamplerState(), fx.createSamplerState(),
	        fx.createSamplerState(), fx.createSamplerState(), fx.createSamplerState()
	    ];

	    setLightData(pLightParam: IOmniParameters, v3fPosition: IVec3): UniformOmniShadow {
		    this.LIGHT_DATA.set(pLightParam, v3fPosition);
		    return this;
		};

		setMatrix(m4fToLightSpace: IMat4, m4fOptimizedProj: IMat4, index: int): UniformOmniShadow {
		    this.TO_LIGHT_SPACE[index].set(m4fToLightSpace);
		    this.OPTIMIZED_PROJECTION_MATRIX[index].set(m4fOptimizedProj);
		    return this;
		};

		setSampler(sTexture: string, index: int): UniformOmniShadow {
		    this.SHADOW_SAMPLER[index].textureName = sTexture;
		    return this;
		};

	    ALLOCATE_STORAGE(UniformOmniShadow, 3);
	}

	export struct UniformSun implements IUniform {
		SUN_DIRECTION: IVec3 = new Vec3();
	    EYE_POSITION: IVec3 = new Vec3();
	    GROUNDC0: IVec3 = new Vec3();
	    GROUNDC1: IVec3 = new Vec3();
	    HG: IVec3 = new Vec3;
	    SKY_DOME_ID: int = 0;

	    setLightData(pSunParam: ISunParameters, iSunDomeId: int): UniformSun {
	    	this.SUN_DIRECTION.set(pSunParam.sunDir);
	    	this.EYE_POSITION.set(pSunParam.eyePosition);
	    	this.GROUNDC0.set(pSunParam.groundC0);
	    	this.GROUNDC1.set(pSunParam.groundC1);
	    	this.HG.set(pSunParam.hg);
	    	this.SKY_DOME_ID = iSunDomeId;

	    	return this;
	    }


	    ALLOCATE_STORAGE(UniformSun, 3);
	}

	export struct UniformSunShadow implements IUniform {
		SUN_DIRECTION: IVec3 = new Vec3();
	    EYE_POSITION: IVec3 = new Vec3();
	    GROUNDC0: IVec3 = new Vec3();
	    GROUNDC1: IVec3 = new Vec3();
	    HG: IVec3 = new Vec3;
	    SKY_DOME_ID: int = 0;
	    SHADOW_SAMPLER: IAFXSamplerState = fx.createSamplerState();
	    TO_LIGHT_SPACE: IMat4 = new Mat4();
	    OPTIMIZED_PROJECTION_MATRIX: IMat4 = new Mat4();

	    setLightData(pSunParam: ISunParameters, iSunDomeId: int): UniformSunShadow {
	    	this.SUN_DIRECTION.set(pSunParam.sunDir);
	    	this.EYE_POSITION.set(pSunParam.eyePosition);
	    	this.GROUNDC0.set(pSunParam.groundC0);
	    	this.GROUNDC1.set(pSunParam.groundC1);
	    	this.HG.set(pSunParam.hg);
	    	this.SKY_DOME_ID = iSunDomeId;

	    	return this;
	    }

	    setSampler(sTexture: string): UniformSunShadow {
	    	this.SHADOW_SAMPLER.textureName = sTexture;
	    	return this;
	    }

	    setMatrix(m4fToLightSpace: IMat4, m4fOptimizedProj: IMat4): UniformSunShadow {
	    	this.TO_LIGHT_SPACE.set(m4fToLightSpace);
		    this.OPTIMIZED_PROJECTION_MATRIX.set(m4fOptimizedProj);

	    	return this;
	    }

	    ALLOCATE_STORAGE(UniformSunShadow, 3);
	}


	export interface UniformMap {
		omni: UniformOmni[];
        project: UniformProject[];
        sun: UniformSun[];
        omniShadows: UniformOmniShadow[];
        projectShadows: UniformProjectShadow[];
        sunShadows: UniformSunShadow[];
        textures: ITexture[];
        samplersOmni: IAFXSamplerState[];
        samplersProject: IAFXSamplerState[];
        samplersSun: IAFXSamplerState[];
	}
}

#endif