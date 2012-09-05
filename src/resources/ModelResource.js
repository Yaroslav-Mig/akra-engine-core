/**
 * @file
 * @author Ivan Popov
 */

/**
 * Class for loading additional information from models.
 * @file
 */

function ModelResource (pEngine) {
    A_CLASS;

    
    this._pRootNodeList = [];
    this._pAnimController = new a.AnimationController(pEngine);
    this._pMeshList = [];
    this._pSkeletonList = [];

    this._nFilesToBeLoaded = 0;
    this._pNode = null;
}

EXTENDS(ModelResource, a.ResourcePoolItem);

PROPERTY(ModelResource, 'totalAnimations',
    function () {
        return this._pAnimController.totalAnimations;
    });

PROPERTY(ModelResource, 'node',
    function () {
        return this._pNode;
    });

ModelResource.prototype.createResource = function () {
    debug_assert(!this.isResourceCreated(),
        "The resource has already been created.");

    this.notifyCreated();
    this.notifyDisabled();

    return true;
};

ModelResource.prototype.destroyResource = function () {
    if (this._pFrameRoot) {
        this._pFrameRoot = 0;
    }

    safe_release(this._pAnimController);

    return true;
};

ModelResource.prototype.disableResource = function () {
    return true;
};
ModelResource.prototype.restoreResource = function () {
    return true;
};

ModelResource.prototype.getAnimation = function (iAnim) {
    'use strict';
    
    return this._pAnimList[iAnim] || null;
};


ModelResource.prototype.setAnimation = function (iAnim, pAnimation) {
    'use strict';
    
    this._pAnimController.setAnimation(iAnim, pAnimation);
};

ModelResource.prototype.addAnimation = function (pAnimation) {
    'use strict';
    //TODO: this method    
    this._pAnimController.addAnimation(pAnimation);
    this.setAlteredFlag(true);
};

ModelResource.prototype.getAnimationController = function () {
    'use strict';
    
    return this._pAnimController;
};

ModelResource.prototype.addMesh = function (pMesh) {
    'use strict';
    
    this._pMeshList.push(pMesh);
    this.setAlteredFlag(true);
};

ModelResource.prototype.addNode = function (pNode) {
    'use strict';

    //TODO: проверить, что  новый нод не является дочерним для уже существующих.
    this._pRootNodeList.push(pNode);
    this.setAlteredFlag(true);
};

ModelResource.prototype.addSkeleton = function (pSkeleton) {
    'use strict';
    
    this._pSkeletonList.push(pSkeleton);
    this.setAlteredFlag(true);
};

ModelResource.prototype.addToScene = function () {
    'use strict';

    var pNodes = this._pRootNodeList;
    var pRoot = new a.SceneNode(this._pEngine);
    pRoot.create();
    pRoot.setInheritance(a.Scene.k_inheritAll);
    pRoot.attachToParent(this._pEngine.getRootNode());

    for (var i = 0; i < pNodes.length; ++ i) {
        pNodes[i].attachToParent(pRoot);
    }

    this._pAnimController.bind(pRoot);
    this._pNode = pRoot;
};

ModelResource.prototype.getRootNodes = function () {
    'use strict';
    
    return this._pRootNodeList;
};


ModelResource.prototype.loadResource = function (sFilename, pOptions) {
    'use strict';

    var me = this;
    var fnSuccess = function () {
        me._nFilesToBeLoaded --;

        if (me._nFilesToBeLoaded == 0) {
            me.notifyLoaded();
            me.notifyRestored();
        }
    };

    me._nFilesToBeLoaded ++;
    me.notifyDisabled();
    //trace('>> load animation >> ', sFilename);
    if (a.pathinfo(sFilename).ext.toLowerCase() === 'dae') {
    
        pOptions = pOptions || {drawJoints: false, wireframe: false};
        pOptions.file = sFilename;
        pOptions.modelResource = this;

        pOptions.success = fnSuccess;
        
        a.COLLADA(this._pEngine, pOptions);

        return true;
    }

    if (a.pathinfo(sFilename).ext.toLowerCase() === 'aac') {

        a.fopen(sFilename, "rb").read(function(pData) {
            me._pAnimController = a.undump(pData, {engine: me.getEngine()});
            fnSuccess();
        });

        return true;
    }


    fnSuccess();
    return false;
}

ModelResource.prototype.loadAnimation = function (sFilename) {
    'use strict';
    
    return this.loadResource(sFilename, 
        {
            scene: false, 
            animation: true,
            extractPoses: false, 
            skeletons: this._pSkeletonList,
            animationWithPose: true
        });
};

ModelResource.prototype.update = function () {
    'use strict';
    
    this._pAnimController.apply(this._pEngine.fTime);
};

A_NAMESPACE(ModelResource);

Define(a.ModelManager(pEngine), function () {
    a.ResourcePool(pEngine, a.ModelResource);
});

