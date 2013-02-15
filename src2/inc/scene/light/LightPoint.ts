#ifndef LIGHTPOINT_TS
#define LIGHTPOINT_TS

#include "ILightPoint.ts"
#include "scene/SceneObject.ts"
#include "math/math.ts"

module akra.scene.light {
	export struct LightParameters implements ILightParameters {
		ambient: IColor = new Color;
	    diffuse: IColor = new Color;
	    specular: IColor = new Color;
	    attenuation: IVec3 = new Vec3;
	}

	export class LightPoint extends SceneNode implements ILightPoint {
		protected _bCastShadows: bool = false;
		protected _isEnabled: bool = true;
		protected _iMaxShadowResolution: uint = 256;
		protected _pLightParameters: ILightParameters = new LightParameters;

		inline get enabled(): bool{
			return this._isEnabled;
		};

		inline set enabled(bValue: bool){
			this._isEnabled = bValue;
		}


		inline get params(): ILightParameters {
			return this._pLightParameters;
		}

		create(isShadowCaster: bool = true, iMaxShadowResolution: uint = 256): bool {
			var isOk: bool = super.create();

			//активен ли источник
			this._isEnabled = true;
			//есть тени от источника или нет
			this._bCastShadows = isShadowCaster;
			//мкасимальный размер shadow текстуры
			this._iMaxShadowResolution = math.ceilingPowerOfTwo(iMaxShadowResolution);

			return isOk;
		}

		inline isShadowCaster(): bool {
			return this._bCastShadows;
		}

		inline setShadowCasting(bValue: bool = true): void {
			this._bCastShadows = bValue;
		}

		_calculateShadows(): void {
			CRITICAL("NOT IMPLEMENTED!");
		}
	}
	export function isLightPoint(pNode: ISceneNode){
		var eType: EEntityTypes = pNode.type;
		return EEntityTypes.LIGHT_PROJECT <= eType && eType <= EEntityTypes.LIGHT_OMNI_DIRECTIONAL;
	}
}

#endif