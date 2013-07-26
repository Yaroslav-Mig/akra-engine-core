export enum EGameHeroStates {
        GUN_NOT_DRAWED,
        GUN_BEFORE_DRAW,
        GUN_DRAWING,
        GUN_DRAWED,
        GUN_BEFORE_IDLE,
        GUN_IDLE,
        GUN_BEFORE_UNDRAW,
        GUN_UNDRAWING,
        GUN_UNDRAWED,
        GUN_END
}

export interface IGameHeroParameters {
        movementRate          : float;
        movementRateThreshold : float;
        movementSpeedMax      : float;

        rotationSpeedMax : float;
        rotationRate     : float;

        runSpeed           		: float;
        walkToRunSpeed    		: float;
        walkSpeed          		: float;
        walWithWeaponSpeed 		: float;
        walWithoutWeaponSpeed 	: float;

        movementDerivativeMax   : float;
        movementDerivativeMin   : float;
        movementDerivativeConst : float;

        walkBackAngleRange : float;

        state : EGameHeroStates;

        anim: IAnimationMap;

        position: IVec3;
}