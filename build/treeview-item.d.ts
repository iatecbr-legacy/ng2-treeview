export interface TreeviewSelection {
    checkedItems: TreeviewItem[];
    uncheckedItems: TreeviewItem[];
}
export interface TreeItem {
    text: string;
    color: string;
    value: any;
    disabled?: boolean;
    checked?: boolean;
    outChecked?: boolean;
    collapsed?: boolean;
    children?: TreeItem[];
    parentId?: string | number;
}
export declare class TreeviewItem {
    internalDisabled: boolean;
    internalChecked: boolean;
    internalOutChecked: boolean;
    internalCollapsed: boolean;
    internalChildren: TreeviewItem[];
    text: string;
    value: any;
    color: string;
    parentId: number | string;
    constructor(item: TreeItem, autoCorrectChecked?: boolean);
    checked: boolean;
    outChecked: boolean;
    readonly indeterminate: boolean;
    setCheckedRecursive(value: boolean): void;
    disabled: boolean;
    collapsed: boolean;
    setCollapsedRecursive(value: boolean): void;
    children: TreeviewItem[];
    getSelection(): TreeviewSelection;
    correctChecked(): void;
    private getCorrectChecked();
}
