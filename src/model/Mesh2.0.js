/**
 * @file
 * @author Ivan Popov
 */

function Mesh(pEngine, eOptions, sName, pDataFactory) {
    //A_CLASS;
    a.ReferenceCounter.call(this);

    Enum([
        VB_READABLE = a.RenderDataFactory.VB_READABLE,
        RD_ADVANCED_INDEX = a.RenderDataFactory.RD_ADVANCED_INDEX
        ], MESH_OPTIONS, a.Mesh);

    Enum([
        GEOMETRY_ONLY = 0x00,   //<! copy only geometry
        SHARED_GEOMETRY = 0x01  //<! use shared geometry
        ], MESH_CLONEOPTIONS, a.Mesh);
    /**
     * Mesh name.
     * @type {String}
     * @private
     */
    this._sName = sName || null;
    //default material
    this._pFlexMaterials = null;

    this._pFactory = null;
    this._pEngine = pEngine;
    this._eOptions = 0;

    this.setup(sName, eOptions, pDataFactory);
};

EXTENDS(Mesh, Array, a.ReferenceCounter);

PROPERTY(Mesh, 'flexMaterials',
    function () {
        return this._pFlexMaterials;
    });

PROPERTY(Mesh, 'name',
    function () {
        return this._sName;
    });

PROPERTY(Mesh, 'data',
    function () {
        return this._pFactory;
    });


Mesh.prototype.getOptions = function () {
    'use strict';
    
    return this._eOptions;
};

Mesh.prototype.getEngine = function () {
    'use strict';
    
    return this._pEngine;
};

Mesh.prototype.draw = function (iSubset) {
    'use strict';
    
    this._pFactory.draw(iSubset);
};

/**
 * @protected
 * Replace materials for this mesh.
 */
Mesh.prototype.replaceFlexMaterials = function (pFlexMaterials) {
    'use strict';
    
    this._pFlexMaterials = pFlexMaterials;
};

Mesh.prototype.setup = function(sName, eOptions, pDataFactory) {
    if (!pDataFactory) {
        this._pFactory = new a.RenderDataFactory(this._pEngine);
        this._pFactory.setup(eOptions);
    }
    else {
        this._pFactory = pDataFactory;
    }
    
    this._eOptions = eOptions || 0;
    this._sName = sName || 'unknown';
};


Mesh.prototype.createSubset = function(sName, ePrimType, eOptions) {
    var pSubset, pSubMesh;
    //TODO: modify options and create options for data dactory.
    pSubset = this._pFactory.getEmptyRenderData(ePrimType, eOptions);
    pSubset.addRef();

    if (!pSubset) {
        return null;
    }

    pSubMesh = new a.MeshSubset(this, pSubset, sName);
    this.push(pSubMesh);
    return pSubMesh;
};

/**
 * @property material(String sName)
 * @param sName Material name.
 * @treturn MaterialBase Material.
 * @memberof Mesh
 */
Mesh.prototype.getFlexMaterial = function () {
    
    if (!this._pFlexMaterials) {
        return null;
    }

    if (typeof arguments[0] === 'number') {
        return this._pFlexMaterials[arguments[0]] || null;
    }
    else {
        for (var i = 0, pMaterials = this._pFlexMaterials; i < pMaterials.length; ++ i) {
            if (pMaterials[i]._sName === arguments[0]) {
                return pMaterials[i];
            }
        }
    }

    return null;
};

Mesh.prototype.addFlexMaterial = function (sName, pMaterialData) {
    'use strict';
    var pMaterial;
    var pMaterialId;

    debug_assert(arguments.length < 7, "only base material supported now...");
    //debug_assert(this.getFlexMaterial(sName) === null, 'material with name <' + sName + '> already exists');

    sName = sName || 'unknown';

    pMaterial = this.getFlexMaterial(sName);
    if (pMaterial) {
        if (pMaterialData) {
           pMaterial.value = pMaterialData; 
        }
        return true;
    }

    if (!this._pFlexMaterials) {
        this._pFlexMaterials = [];
    }

    pMaterialId = this._pFlexMaterials.length;
    pMaterial = new a.MeshMaterial(
        sName, 
        this._pFactory._allocateData(a.MeshMaterial.vertexDeclaration(), null)
    );

    if (!pMaterialData) {
        pMaterialData = new a.Material;
        pMaterialData.toDefault();
    }

    pMaterial.value = pMaterialData;   
    pMaterial.id = pMaterialId;
    this._pFlexMaterials.push(pMaterial);
    return true;
};

Mesh.prototype.setFlexMaterial = function(iMaterial) {
    'use strict';

    var bResult = true;
    for (var i = 0; i < this.length; ++ i) {
        if (!this[i].setFlexMaterial(iMaterial)) {
            warning('cannot set material<' + iMaterial + '> for mesh<' + this.name + 
                '> subset<' + this[i].name + '>');
            bResult = false;
        }
    }

    return bResult;
};


/**
 * destroy resource.
 */
Mesh.prototype.destroy = function () {
    this._pFlexMaterials = null;
    this._pFactory.destroy(this);
};

Mesh.prototype.destructor = function () {
    'use strict';
    
    this.destroy();
};

Mesh.prototype.getSubset = function () {
    'use strict';
    
    if (typeof arguments[0] === 'number') {
        return this[arguments[0]];
    }
    else {
        for (var i = 0; i < this.length; ++ i) {
            if (this[i]._sName === arguments[0]) {
                return this[i];
            }
        }
    }
};

Mesh.prototype.clone = function (eCloneOptions) {
    'use strict';
    
    var pClone = null;
    var pRenderData;
    var pSubMesh;

    if (eCloneOptions & a.Mesh.SHARED_GEOMETRY) {
        pClone = new a.Mesh(this.getEngine(), this.getOptions(), this.name, this.data);
        
        for (var i = 0; i < this.length; ++ i) {
            pRenderData = this[i].data;
            pRenderData.addRef();
            pSubMesh = new a.MeshSubset(this, pRenderData, this[i].name);
            pClone.push(pSubMesh);
        }

        pClone.replaceFlexMaterials(this.flexMaterials);

        trace('created clone', pClone);
    }
    else {
        //TODO: clone mesh data.
    }

    if (eCloneOptions & a.Mesh.GEOMETRY_ONLY) {
        return pClone;
    }
    else {
        //TODO: clone mesh shading
    }

    return pClone;
};

A_NAMESPACE(Mesh);