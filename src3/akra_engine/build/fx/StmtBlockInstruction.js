var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", "fx/StmtInstruction"], function(require, exports, __StmtInstruction__) {
    var StmtInstruction = __StmtInstruction__;

    /**
    * Represent {stmts}
    * EMPTY_OPERATOR StmtInstruction ... StmtInstruction
    */
    var StmtBlockInstruction = (function (_super) {
        __extends(StmtBlockInstruction, _super);
        function StmtBlockInstruction() {
            _super.call(this);
            this._pInstructionList = [];
            this._eInstructionType = 49 /* k_StmtBlockInstruction */;
        }
        StmtBlockInstruction.prototype.toFinalCode = function () {
            var sCode = "{" + "\n";

            for (var i = 0; i < this._nInstructions; i++) {
                sCode += "\t" + this._pInstructionList[i].toFinalCode() + "\n";
            }

            sCode += "}";

            return sCode;
        };
        return StmtBlockInstruction;
    })(StmtInstruction);

    
    return StmtBlockInstruction;
});
//# sourceMappingURL=StmtBlockInstruction.js.map