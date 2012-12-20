#ifndef SCENE3D_TS
#define SCENE3D_TS

#include "IScene3d.ts"
#include "ISceneManager.ts"
#include "SceneNode.ts"
#include "events/events.ts"
#include "objects/Camera.ts"

module akra.scene {
	export class Scene3d implements IScene3d {
		protected _pRootNode: ISceneNode;
		protected _pSceneManager: ISceneManager;

		type: ESceneTypes = ESceneTypes.TYPE_3D;

		constructor (pSceneManager: ISceneManager) {
			this._pSceneManager = pSceneManager;
			this._pRootNode = this.createSceneNode("root-node");
			this._pRootNode.create();
		}

		inline getRootNode(): ISceneNode {
			return this._pRootNode;
		}

		recursivePreUpdate(): void {

		}

		recursiveUpdate(): void {

		}

		updateCamera(): bool {
			return false;
		}

		updateScene(): bool {
			return false;
		}


		createSceneNode(sName: string = null): ISceneNode {
			var pNode: ISceneNode = new SceneNode(this);
			pNode.create();
			return this.setupNode(pNode, sName);
		}

		createSceneModel(): IModel {
			return null;
		}

		createCamera(sName: string = null): ICamera {
			var pCamera: ICamera = new objects.Camera(this);
			
			if (!pCamera.create()) {
				ERROR("cannot create camera..");
				return null;
			}
			
			return <ICamera>this.setupNode(pCamera, sName);
		}

		createLightPoint(): ILightPoint {
			return null;
		}

		createSprite(): ISprite {
			return null;
		}

		createJoint(): IJoint {
			return null;
		}

		createText3d(): IText3d {
			return null;
		}

		_render(pCamera: ICamera, pViewport: IViewport): void {
			
		}

		private setupNode(pNode: ISceneNode, sName: string = null): ISceneNode {
			pNode.name = sName;

			this.connect(pNode, SIGNAL(attached), SLOT(nodeAttachment), EEventTypes.UNICAST);
			this.connect(pNode, SIGNAL(detached), SLOT(nodeDetachment), EEventTypes.UNICAST);

			return pNode;
		}

		BEGIN_EVENT_TABLE(Scene3d);
			BROADCAST(nodeAttachment, CALL(pNode));
			BROADCAST(nodeDetachment, CALL(pNode));
		END_EVENT_TABLE();
	}
}

#endif
