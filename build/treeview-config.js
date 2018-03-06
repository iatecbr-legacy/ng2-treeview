import { Injectable } from '@angular/core';
var TreeviewConfig = (function () {
    function TreeviewConfig() {
        this.hasAllCheckBox = true;
        this.hasFilter = false;
        this.hasCollapseExpand = false;
        this.decoupleChildFromParent = false;
        this.decoupleChildFromParentForEntity = false;
        this.maxHeight = 550;
    }
    Object.defineProperty(TreeviewConfig.prototype, "hasDivider", {
        get: function () {
            return this.hasFilter || this.hasAllCheckBox || this.hasCollapseExpand;
        },
        enumerable: true,
        configurable: true
    });
    TreeviewConfig.create = function (fields) {
        var config = new TreeviewConfig();
        Object.assign(config, fields);
        return config;
    };
    TreeviewConfig.decorators = [
        { type: Injectable },
    ];
    /** @nocollapse */
    TreeviewConfig.ctorParameters = function () { return []; };
    return TreeviewConfig;
}());
export { TreeviewConfig };
//# sourceMappingURL=treeview-config.js.map