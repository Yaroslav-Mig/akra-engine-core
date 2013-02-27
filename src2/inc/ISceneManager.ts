#ifndef ISCENEMANAGER_TS
#define ISCENEMANAGER_TS

#include "IManager.ts"
#include "IScene.ts"
#include "IEngine.ts"

module akra {

    IFACE(IEngine);
    IFACE(IScene3d);
    IFACE(IScene2d);

    export interface ISceneManager extends IManager {
        createScene3D(): IScene3d;
        createScene2D(): IScene2d;

        getEngine(): IEngine;

        getScene3D(iScene?: uint): IScene3d;
        getScene2D(iScene?: uint): IScene2d;
        getScene(iScene?: uint, eType?: ESceneTypes): IScene;

        update(): void;
        notifyUpdateScene(): void;
        notifyPreUpdateScene(): void;
    }	
}

#endif