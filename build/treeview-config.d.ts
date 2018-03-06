export declare class TreeviewConfig {
    hasAllCheckBox: boolean;
    hasFilter: boolean;
    hasCollapseExpand: boolean;
    decoupleChildFromParent: boolean;
    decoupleChildFromParentForEntity: boolean;
    maxHeight: number;
    readonly hasDivider: boolean;
    static create(fields?: {
        hasAllCheckBox?: boolean;
        hasFilter?: boolean;
        hasCollapseExpand?: boolean;
        decoupleChildFromParent?: boolean;
        decoupleChildFromParentForEntity?: boolean;
        maxHeight?: number;
    }): TreeviewConfig;
}
